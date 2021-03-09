const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { JWT_SECRET } = require("../../keys");
const { check, validationResult } = require("express-validator");

const User = require("../../models/User");
//@route POST api/users
//@desc Register user
//@access Public
router.post(
  "/",
  [
    check("name", "Name is required").not().isEmpty(),
    check("username", "Username is required").not().isEmpty(),
    check("email", "Please include a valid email owo").isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, username, email, password } = req.body;

    try {
      //Check if user exists
      const user = await User.findOne({
        $or: [{ email }, { username }],
      });
      if (user) {
        if (user.email == email) {
          res.status(400).json({ errors: [{ msg: "Email already exist :(" }] });
        } else {
          res
            .status(400)
            .json({ errors: [{ msg: "Username already exist :(" }] });
        }
        return;
      }

      //Get users gravatar
      const avatar = gravatar.url(email, {
        s: "200",
        r: "pg",
        d: "mm",
      });

      //Encrypt password
      const salt = await bcrypt.genSalt(10);
      const passHashed = await bcrypt.hash(password, salt);

      const newUser = new User({
        name,
        username,
        email,
        avatar,
        password: passHashed,
      });
      await newUser.save();

      //Return jwt
      const payload = {
        //shouldnt use the db id as payload tho
        user: {
          id: newUser.id,
        },
      };
      jwt.sign(payload, JWT_SECRET, { expiresIn: "200h" }, (err, token) => {
        if (err) throw err;
        res.json({ token });
      });
      // res.send(`User ${username} registered owo`);
    } catch (err) {
      console.log(err);
      res.status(500).send("Server error");
    }
  }
);

module.exports = router;
