// controllers/enrollmentController.js
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");

exports.enrollInCourse = async (req, res, next) => {
  try {
    const userId = req.user.id;          // from auth middleware
    const { courseId } = req.params;

    // Ensure course exists
    const course = await Course.findById(courseId).select("_id");
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // Create (or get existing) enrollment
    const enrollment = await Enrollment.findOneAndUpdate(
      { user: userId, course: courseId },
      { $setOnInsert: { startedAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, data: enrollment });
  } catch (err) {
    // Handle duplicate key (already enrolled)
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "User already enrolled in this course" });
    }
    next(err);
  }
};




exports.getMyEnrolledCourses = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const enrollments = await Enrollment.find({ user: userId })
      .populate({
        path: "course",
        select: "courseName courseLogo category duration instructor rating price",
      })
      .lean();

    res.json({ success: true, data: enrollments });
  } catch (err) {
    next(err);
  }
};




exports.updateProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;
    const { progress } = req.body; // 0–100

    const update = { progress };
    if (progress >= 100) {
      update.status = "completed";
      update.completedAt = new Date();
    } else if (progress > 0) {
      update.status = "in-progress";
    }

    const enrollment = await Enrollment.findOneAndUpdate(
      { user: userId, course: courseId },
      update,
      { new: true }
    );

    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment not found" });
    }

    res.json({ success: true, data: enrollment });
  } catch (err) {
    next(err);
  }
};
