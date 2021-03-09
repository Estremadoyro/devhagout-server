const express = require("express");
const app = express();

const PORT = process.env.PORT || 5000;
const connectDB = require("./db");

//DB Connection
connectDB();

//Middleware
app.use(express.json({ extended: false }));
//Routes
app.use("/api/users", require("./routes/api/users"));
app.use("/api/posts", require("./routes/api/posts"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/profile", require("./routes/api/profile"));

app.listen(PORT, () => {
  console.log(`Server running @ ${PORT}`);
});
