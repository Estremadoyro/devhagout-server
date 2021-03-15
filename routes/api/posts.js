const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");

const Profile = require("../../models/Profile");
const User = require("../../models/User");
const Post = require("../../models/Post");

const { check, validationResult } = require("express-validator");

/*
 * @route POST api/posts
 * @desc Create a post
 * @access Public
 */
router.post(
  "/",
  [auth, check("text", "Post cant be empty").not().isEmpty()],
  async (req, res) => {
    const { text } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id).select("-password");
      const newPost = new Post({
        text: text,
        username: user.username,
        avatar: user.avatar,
        user: req.user.id,
      });
      const post = await newPost.save();
      res.json(post);
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);
/*
 * @route GET api/posts
 * @desc View all posts
 * @access Private
 */
router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Server error" });
  }
});
/*
 * @route GET api/posts/:postId
 * @desc View specific post
 * @access Private
 */
router.get("/:postId", auth, async (req, res) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(post);
  } catch (err) {
    console.log(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(500).json({ message: "Server error" });
  }
});
/*
 * @route DELETE api/posts/:postId
 * @desc Delete specific post
 * @access Private
 */
router.delete("/:postId", auth, async (req, res) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "User not authorized" });
    }
    await post.remove();
    res.json({ messsage: `Post ${postId} removed` });
  } catch (err) {
    console.log(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(500).json({ message: "Server error" });
  }
});
/*
 * @route PUT api/posts/like/:postId
 * @desc Like a specific post
 * @access Private
 */
router.put("/like/:postId", auth, async (req, res) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    //Check if user already liked a post
    if (
      post.likes.filter((like) => like.user.toString() == req.user.id).length >
      0
    ) {
      return res.status(400).json({ message: "Post already liked" });
    }
    post.likes.unshift({ user: req.user.id });
    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.log(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(500).json({ message: "Server error" });
  }
});
/*
 * @route PUT api/posts/unlike/:postId
 * @desc Remove like of a specific post
 * @access Private
 */
router.put("/unlike/:postId", auth, async (req, res) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    //Check if user already liked a post
    if (
      post.likes.filter((like) => like.user.toString() == req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ message: "Post has not yet been liked" });
    }
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);
    post.likes.splice(removeIndex, 1);
    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.log(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(500).json({ message: "Server error" });
  }
});
/*
 * @route POST api/posts/comment/:postId
 * @desc Comment a post
 * @access Private
 */
router.post(
  "/comment/:postId",
  [auth, check("comment", "Comment cant be empty").not().isEmpty()],
  async (req, res) => {
    const { comment } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id).select("-password");
      const post = await Post.findById(req.params.postId);

      const newComment = {
        comment: comment,
        username: user.username,
        avatar: user.avatar,
        user: req.user.id,
      };
      post.comments.unshift(newComment);
      await post.save();
      res.json(post.comments);
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);
/*
 * @route DELETE api/posts/comment/:postId/:commentId
 * @desc Delete a comment from a specific post
 * @access Private
 */
router.delete("/comment/:postId/:commentId", auth, async (req, res) => {
  const postId = req.params.postId;
  const commentId = req.params.commentId;
  try {
    const post = await Post.findById(postId);
    const comment = post.comments.find((comment) => comment.id === commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment does not exist" });
    }
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "User not authorized" });
    }
    const removeIndex = post.comments
      .map((comment) => comment.user.toString())
      .indexOf(req.user.id);
    post.comments.splice(removeIndex, 1);
    await post.save();
    res.json(post.comments);
  } catch (err) {
    console.log(err);
  }
});
module.exports = router;
