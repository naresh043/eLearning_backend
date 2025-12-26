// controllers/enrollmentController.js
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const User = require("../models/User");

exports.enrollInCourse = async (req, res, next) => {
  try {
    const userId = req.user.id; // from auth middleware
    const { courseId } = req.params;

    // Ensure course exists
    const course = await Course.findById(courseId).select("_id");
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    if (course.price > 0) {
      return res.status(403).json({
        success: false,
        message: "Payment required to enroll in this course",
      });
    }

    // // Create (or get existing) enrollment
    // const enrollment = await Enrollment.findOneAndUpdate(
    //   { user: userId, course: courseId },
    //   { $setOnInsert: { startedAt: new Date() } },
    //   { upsert: true, new: true, setDefaultsOnInsert: true }
    // );

    // Check if user already enrolled
    let enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId,
    });

    if (!enrollment) {
      // Create new enrollment
      enrollment = await Enrollment.create({
        user: userId,
        course: courseId,
        startedAt: new Date(),
      });

      // 🔥 Increment the user's coursesEnrolled count
      await User.findByIdAndUpdate(userId, {
        $inc: { "stats.coursesEnrolled": 1 },
      });
    }

    res.json({ success: true, data: enrollment });
  } catch (err) {
    // Handle duplicate key (already enrolled)
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "User already enrolled in this course",
      });
    }
    next(err);
  }
};

exports.getMyEnrolledCourses = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const enrollments = await Enrollment.find({
      user: userId,
      status: { $ne: "completed" },
    })
      .populate({
        path: "course",
        select:
          "courseName courseLogo category duration instructor rating price courseLink",
      })
      .lean();

    res.json({ success: true, data: enrollments });
  } catch (err) {
    next(err);
  }
};

exports.getCompletedCourses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const completed = await Enrollment.find({
      user: userId,
      status: "completed",
    })
      .populate({
        path: "course",
        select: "courseName courseLogo category courseLink",
      })
      .lean();

    if (!completed || completed.length === 0) {
      return res.status(200).json({
        success: true,
        message: "You haven't completed any courses yet.",
        data: [],
      });
    }

    // Filter out enrollments where course was deleted
    const validCourses = completed.filter((e) => e.course !== null);

    if (validCourses.length === 0) {
      return res.status(200).json({
        success: true,
        message: "All completed courses have been deleted.",
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      data: validCourses.map((e) => e.course),
    });
  } catch (err) {
    console.error("Error in getMyCompletedCourses:", err);
    next(err);
  }
};

// exports.updateProgress = async (req, res, next) => {
//   try {
//     const userId = req.user.id;
//     const { courseId } = req.params;
//     const { progress } = req.body; // 0–100

//     if (progress >= 100) {
//       update.status = "completed";
//       update.completedAt = new Date();

//       // ✅ Only increment if it was not already marked as completed
//       const existing = await Enrollment.findOne({
//         user: userId,
//         course: courseId,
//       });
//       if (existing && existing.status !== "completed") {
//         await User.findByIdAndUpdate(userId, {
//           $inc: { "stats.coursesCompleted": 1 },
//         });
//       }
//     }

//     const enrollment = await Enrollment.findOneAndUpdate(
//       { user: userId, course: courseId },
//       update,
//       { new: true }
//     ).populate("course");

//     if (!enrollment) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Enrollment not found" });
//     }

//     const updatedUser = await User.findById(userId).select("stats");
//     res.json({ success: true, data: enrollment, stats: updatedUser.stats });
//   } catch (err) {
//     next(err);
//   }
// };

exports.updateProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;
    const { progress } = req.body; // Expected value: 0 - 100

    // Validate progress
    if (typeof progress !== "number" || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        message: "Progress must be a number between 0 and 100",
      });
    }

    const update = { progress };

    // Fetch existing enrollment to determine old status
    const existing = await Enrollment.findOne({
      user: userId,
      course: courseId,
    });

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Enrollment not found" });
    }

    // Status logic
    if (progress >= 100) {
      if (existing.status !== "completed") {
        update.status = "completed";
        update.completedAt = new Date();

        const user = await User.findById(userId);
        const enrolled = user.stats.coursesEnrolled;
        // Increment user.completed count
        await User.findByIdAndUpdate(userId, {
          $inc: {
            "stats.coursesCompleted": 1,
            "stats.coursesEnrolled": enrolled > 0 ? -1 : 0,
          },
        });
      }
    } else if (progress > 0 && existing.status !== "in-progress") {
      update.status = "in-progress";
    }

    // Update enrollment
    const enrollment = await Enrollment.findOneAndUpdate(
      { user: userId, course: courseId },
      update,
      { new: true }
    ).populate("course");

    // Send response
    const updatedUser = await User.findById(userId).select("stats");
    res.json({ success: true, data: enrollment, stats: updatedUser.stats });
  } catch (err) {
    next(err);
  }
};
