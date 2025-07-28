const express = require("express");
require("dotenv").config();
const dbConnect = require("./src/config/db");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const userRoutes = require("./src/routes/userRoutes");
const courseRoutes = require("./src/routes/courseRoutes");
const authRoutes = require("./src/routes/authRoutes");
const courseRoadmapRoutes = require("./src/routes/courseRoadmapRoutes");
const enrollmentRoutes = require("./src/routes/enrollmentRoutes");
const errorMiddleware = require("./src/middleware/errorMiddleware");

const PORT = process.env.PORT || 3000;
const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "https://e-learnify-nine.vercel.app",
    // origin: "http://localhost:5173",
     // developed version 

    credentials: true,
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/courseroadmap", courseRoadmapRoutes);
app.use("/api/enrollments", enrollmentRoutes);

// 404 for unmatched routes
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Error Handler
app.use(errorMiddleware);
dbConnect() // Call the function
  .then(() => {
    console.log("Database connected successfully!");

    app.listen(PORT, () => {
      console.log("Server is running on port" + PORT);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });
