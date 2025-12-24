const {OAuth2Client }=require("google-auth-library")
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const express = require("express");
const User = require("../models/User");
const Enrollment=require("../models/Enrollment")
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const verifyToken = require("../middleware/verifyToken"); // Import middleware



// Register a new user
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: "Email already registered" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    let token = await newUser.getJWT();

    // Secure Cookie
    // res.cookie("token", token);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      path: "/",
    });
    const userResponse = newUser.toObject();
    delete userResponse.password;
    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: userResponse,
    });
  } catch (err) {
    next(err);
  }
});

// LOGIN API
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    console.log(email)

    // Check if user exists
    const user = await User.findOne({ email });
    console.log(user)
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Compare password
    const isMatch = await user.validatePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    let token = await user.getJWT();
    // Secure Cookie
    // res.cookie("token", token, {
    //   httpOnly: false, // Prevents client-side JS access
    //   secure: false, // Only send cookie over HTTPS in production
    //   sameSite: "lax",
    //   maxAge: 24 * 60 * 60 * 1000, // 1 day (cookie persists)
    //   path: "/", // Accessible for all routes
    // });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      path: "/",
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: "Login successful",
    });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (req, res, next) => {
  try {
    const hadToken = Boolean(req.cookies?.token);
    // Clear cookie (must match options used at login)
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });
    return res.status(200).json({
      success: true,
      message: "Logout successful.",
      hadToken, // helpful for debugging; remove in prod if you want
    });
  } catch (err) {
    return next(err); // forward to errorMiddleware
  }
});

router.patch("/forgot-password", verifyToken, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const userId = req.user._id; // From verifyToken
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);
    user.password = passwordHash;

    // Save updated user
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ message: "Error resetting password" });
  }
});

//get profile
router.get("/profile", verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password").lean();
  res.status(200).json({
    success: true,
    data: user,
  });
});

// GET all users
router.get("/", async (req, res, next) => {
  try {
    const users = await User.find();
    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No users found" });
    }
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

// PATCH - Update a user by ID
router.patch("/:id", verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedUser = await User.findByIdAndUpdate(id, updates, {
      new: true, // return updated document
      runValidators: true, // run schema validators
    });

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const userResponse = updatedUser.toObject();
    delete userResponse.password;
    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: userResponse,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE - Delete a user by ID
router.delete("/me", verifyToken, async (req, res, next) => {
  try {
    const userId = req.user._id;

    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    await Enrollment.deleteMany({ user: userId });

    res.status(200).json({
      success: true,
      message: "User and related data deleted successfully",
    });
  } catch (err) {
    next(err);
  }
});


router.post("/google-login", async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Google token is required",
      });
    }

    // 1️⃣ Verify token with Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub } = payload;

    // 2️⃣ Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        googleId: sub,
        avatar: picture,
        provider: "google",
      });
    }

    // 3️⃣ Issue YOUR JWT
    const jwtToken = await user.getJWT();

    // 4️⃣ Store JWT in HttpOnly cookie
    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    // 5️⃣ Send user object to frontend
    res.status(200).json({
      success: true,
      message: "Google login successful",
      data: userResponse,
    });
  } catch (err) {
    next(err);
  }
});


module.exports = router;
