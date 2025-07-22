const express = require("express");
require("dotenv").config();
const dbConnect = require("./src/config/db");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const userRoutes = require("./src/routes/userRoutes");
const courseRoutes = require("./src/routes/courseRoutes");
const courseRoadmapRoutes = require("./src/routes/courseRoadmapRoutes");
const errorMiddleware = require("./src/middleware/errorMiddleware");

const PORT = process.env.PORT || 3000;
const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173", // React frontend URL or your domain
    credentials: true, // Allow cookies
  })
);

// Routes
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/courseroadmap", courseRoadmapRoutes);

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
