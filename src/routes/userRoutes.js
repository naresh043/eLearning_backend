const express = require("express");
const User = require("../models/User");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const verifyToken = require("../middleware/verifyToken"); // Import middleware

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

    // Check if user exists
    const user = await User.findOne({ email });
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
      data: userResponse,
    });
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
router.delete("/:id", verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    next(err);
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
module.exports = router;
