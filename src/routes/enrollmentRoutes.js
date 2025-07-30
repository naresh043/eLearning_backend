const express = require("express");
const router = express.Router();
const auth = require("../middleware/verifyToken"); // attaches req.user
const enrollmentCtrl = require("../Controllers/enrollmentController");

// POST /api/courses/:courseId/enroll
router.post("/courses/:courseId/enroll", auth, enrollmentCtrl.enrollInCourse);

// GET /api/me/enrolled-courses
router.get("/me/enrolled-courses", auth, enrollmentCtrl.getMyEnrolledCourses);

// GET /api/me/completed-courses
router.get("/me/completed-courses", auth, enrollmentCtrl.getCompletedCourses);


// PATCH /api/courses/:courseId/progress
router.patch("/courses/:courseId/progress", auth, enrollmentCtrl.updateProgress);

module.exports = router;
