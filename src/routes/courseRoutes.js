const express = require("express");
const Course = require("../models/Course");
const router = express.Router();

// GET /api/courses  -> Get all courses
router.get("/", async (req, res, next) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/courses/:id  -> Get one course by Mongo _id
router.get("/:id", async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }
    res.json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
});

// POST /api/courses  -> Create new course
router.post("/", async (req, res, next) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: course,
    });
  } catch (err) {
    // Duplicate key (unique courseName) handling example
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Course name already exists" });
    }
    next(err);
  }
});

// PUT /api/courses/:id  -> Update existing course
router.put("/:id", async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }
    res.json({
      success: true,
      message: "Course updated successfully",
      data: course,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/courses/:id  -> Delete a course
router.delete("/:id", async (req, res, next) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }
    res.json({
      success: true,
      message: "Course deleted successfully",
      data: course, // send deleted doc if you want to show what was removed
    });
  } catch (err) {
    next(err);
  }
});

//review routes
router.post("/:id/reviews", async (req, res, next) => {
  try {
    const id = req.params.id;
    const course = await Course.findById(id);
    if (!course)
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });

    course.reviews.push(req.body); // Add review
    await course.save();

    res.status(201).json({ success: true, data: course.reviews });
  } catch (err) {
    next(err);
  }
});

// POST /api/courses/review/by-name/:courseName
router.post("/review/by-name/:courseName", async (req, res, next) => {
  try {
    const courseName=req.params.courseName;
    console.log(courseName)
    const course = await Course.findOne({ courseName:courseName });
    if (!course)
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });

    course.reviews.push(req.body);
    await course.save();

    res.status(201).json({ success: true, data: course.reviews });
  } catch (err) {
    next(err);
  }
});

// Get all reviews for a course
// GET /api/courses/:id/reviews
router.get("/:id/reviews", async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course)
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });

    res.json({
      success: true,
      count: course.reviews.length,
      data: course.reviews,
    });
  } catch (err) {
    next(err);
  }
});

// Get all reviews from all courses
// GET /api/courses/reviews/all
router.get("/reviews/all", async (req, res, next) => {
  try {
    const courses = await Course.find();

    const allReviews = courses.flatMap((course) =>
      (course.reviews || []).map((review) => {
        const reviewObj = review.toObject();
        reviewObj.courseName =
          course.coursename || course.courseName || "Unknown";
        return reviewObj;
      })
    );

    res.json({ success: true, count: allReviews.length, data: allReviews });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
