const express = require("express");
const dbConnect = require("./src/config/db"); // No destructuring since you did `module.exports = dbConnect`
const cors=require("cors")
const userRoutes = require("./src/routes/userRoutes");
const courseRoutes = require("./src/routes/courseRoutes");
const courseRoadmapRoutes = require("./src/routes/courseRoadmapRoutes");

const errorMiddleware = require("./src/middleware/errorMiddleware");
const cookieParser = require("cookie-parser");
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors())

app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/courseroadmap", courseRoadmapRoutes);

app.use(errorMiddleware);

dbConnect() // Call the function
  .then(() => {
    console.log("Database connected successfully!");

    app.listen(3000, () => {
      console.log("Server is running on port 3000");
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });
