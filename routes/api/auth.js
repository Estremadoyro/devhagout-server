const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../../keys");
const { check, validationResult } = require("express-validator");

const User = require("../../models/User");
//@route GET api/auth
//@desc Test
//@access Public
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
    // res.status(500).send("server error");
    console.log(err);
  }
});

//@route POST api/auth
//@desc Login
//@access Public
router.post(
  "/",
  [
    check("email", "Email is required").not().isEmpty(),
    check("password", "Password is required").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    console.log(`email ${email} password ${password}`);

    try {
      const user = await User.findOne({ email });

      if (!user) {
        res
          .status(400)
          .json({ errors: [{ msg: "Invalid email or password" }] });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res
          .status(400)
          .json({ errors: [{ msg: "Invalid email or password" }] });
        return;
      }
      const payload = {
        user: {
          id: user.id,
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
