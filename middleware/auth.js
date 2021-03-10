const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../keys");
const mongoose = require("mongoose");

module.exports = (req, res, next) => {
  //Get token from the header
  const token = req.header("x-auth-token");
  //Check if no token
  if (!token)
    return res.status(401).json({ message: "No token, authorization denied" });
  try {
    // Decode the token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user;
    //Need to check if decoded id exists?? so we know the jwt havent been manipulated
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token :(" });
    console.log(err);
  }
};
