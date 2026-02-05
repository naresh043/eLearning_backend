const express = require("express");
require("dotenv").config();
const dbConnect = require("./src/config/db");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const nodemailer = require("nodemailer");

const userRoutes = require("./src/routes/userRoutes");
const courseRoutes = require("./src/routes/courseRoutes");
const authRoutes = require("./src/routes/authRoutes");
const courseRoadmapRoutes = require("./src/routes/courseRoadmapRoutes");
const enrollmentRoutes = require("./src/routes/enrollmentRoutes");
const paymentRoutes =require('./src/routes/payment')
const errorMiddleware = require("./src/middleware/errorMiddleware");

const PORT = process.env.PORT || 3000;
const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());
const allowedOrigins = [
  "http://localhost:5173",
  "https://e-learnify-nine.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/courseroadmap", courseRoadmapRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/payment", paymentRoutes);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, 
  },
});

async function mailSend() {
  try {
    await transporter.sendMail({
      from: `"E-Leranfy Team" <${process.env.GMAIL_USER}>`,
      to: "naresh732003@gmail.com",
      subject: "Thanks for visiting E-Leranfy 🚀",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <style>
              body {
                font-family: Arial, Helvetica, sans-serif;
                background-color: #f4f6f8;
                padding: 20px;
              }
              .container {
                max-width: 600px;
                margin: auto;
                background: #ffffff;
                padding: 30px;
                border-radius: 8px;
              }
              .header {
                text-align: center;
                color: #2c3e50;
              }
              .content {
                color: #555;
                line-height: 1.6;
                margin-top: 20px;
              }
              .footer {
                margin-top: 30px;
                font-size: 12px;
                color: #999;
                text-align: center;
              }
              .btn {
                display: inline-block;
                margin-top: 20px;
                padding: 12px 20px;
                background-color: #4f46e5;
                color: #ffffff;
                text-decoration: none;
                border-radius: 6px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2 class="header">Welcome to E-Leranfy 🎓</h2>

              <div class="content">
                <p>Hi there,</p>

                <p>
                  Thank you for visiting the <strong>E-Leranfy</strong> application.
                  We’re excited to have you explore our learning platform designed
                  to help you grow your skills and achieve your goals.
                </p>

                <p>
                  Whether you’re here to learn, practice, or level up your career,
                  E-Leranfy is built to support you every step of the way.
                </p>

                <a href="https://eleranfy.com" class="btn">
                  Explore Courses
                </a>

                <p style="margin-top: 25px;">
                  If you have any questions or need support, feel free to reply to this email.
                </p>

                <p>
                  Happy Learning! 🚀<br />
                  <strong>E-Leranfy Team</strong>
                </p>
              </div>

              <div class="footer">
                <p>
                  © 2026 E-Leranfy. All rights reserved.<br />
                  This is an automated message, please do not share sensitive information.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Message sent successfully");
  } catch (error) {
    console.log(error, "Mail sending failed");
  }
}


mailSend();

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
