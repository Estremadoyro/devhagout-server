const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/User");

const { check, validationResult } = require("express-validator");

//@route GET api/profile/me
//@desc Get current users profile
//@access Private
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate("user", ["name, avatar, username"]);
    if (!profile)
      return res.status(400).json({ message: "This user has no profile" });
    res.json(profile);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

//@route  POST api/profile
//@desc   Create or update user profile
//@access Private
router.post(
  "/",
  [
    auth,
    [
      check("status", "Status is required").not().isEmpty(),
      check("skills", "At least one skill owo").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills.split(",").map((skill) => skill.trim());
    }
    //Build social obj
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      //Update profile if found existing one
      let profile = await Profile.findOne({ user: req.user.id });
      if (profile) {
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(profile);
      }

      //Create new profile instead
      profile = new Profile(profileFields);
      const newProfile = await profile.save();
      res.json(newProfile);
    } catch (err) {
      console.log(err);
    }
  }
);

//@route  GET api/profile/
//@desc   Get all profiles
//@access Public
router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    res.json(profiles);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Server error :(" });
  }
});

//@route  GET api/profile/user/:user_id
//@desc   Get all profiles
//@access Public
router.get("/user/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    const profile = await Profile.findOne({ user: user_id }).populate("user", [
      "name",
      "avatar",
    ]);
    if (!profile) {
      return res.status(400).json({ message: "Profile not found" });
    }
    res.json(profile);
  } catch (err) {
    if (err.kind == "ObjectId") {
      return res.status(400).json({ message: "Profile not found" });
    }
    console.log(err.message);
    res.status(500).json({ message: "Server error :(" });
  }
});

//@route  DELETE api/profile
//@desc   Delete profile, user & posts
//@access Private
router.delete("/", auth, async (req, res) => {
  try {
    //@todo - remove users posts
    await Profile.findOneAndRemove({ user: req.user.id });
    await User.findOneAndRemove({ _id: req.user.id });
    res.json({ message: `User ${req.user.id} deleted :(` });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Server error :(" });
  }
});

//@route  PUT api/profile/experience
//@desc   Add profile experience
//@access Private
router.put(
  "/experience",
  [
    auth,
    [
      check("title", "Title is required").not().isEmpty(),
      check("company", "Company is required").not().isEmpty(),
      check("from", "From date is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;
    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(newExp);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.log(err.message);
      res.status(500).json({ message: "Server error" });
    }
  }
);

//@route  DELETE api/profile/experience/:exp_id
//@desc   Delete experience
//@access Private
router.delete("/experience/:exp_id", auth, async (req, res) => {
  //BUG DOESNT DELETE THE ID GIVEN
  const expId = req.params.exp_id;
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(expId);
    profile.experience.splice(removeIndex, 1);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Server error." });
  }
});

//@route  PUT api/profile/education
//@desc   Add profile education
//@access Private
router.put(
  "/education",
  [
    auth,
    [
      check("school", "School is required").not().isEmpty(),
      check("degree", "Degree is required").not().isEmpty(),
      check("fieldofstudy", "Field of study is required").not().isEmpty(),
      check("from", "From date is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    } = req.body;
    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(newEdu);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.log(err.message);
      res.status(500).json({ message: "Server error" });
    }
  }
);

//@route  DELETE api/profile/education/:edu_id
//@desc   Delete education
//@access Private
router.delete("/education/:edu_id", auth, async (req, res) => {
  //BUG DOESNT DELETE THE ID GIVEN
  const eduId = req.params.edu_id;
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    // const removeIndex = profile.education.map((item) => item.id).indexOf(eduId);
    console.log(profile.education.map((item) => item.id));
    console.log(eduId);
    const removeIndex = profile.education
      .map((item) => item.id)
      .find((element) => element == eduId);
    console.log(removeIndex);
    profile.education.splice(removeIndex, 1);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;
