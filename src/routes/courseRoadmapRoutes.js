const express=require("express");
const router=express.Router()
const CourseRoadmap=require("../models/CourseRoadmap")

// GET /api/CourseRoadmaps -> Get all CourseRoadmaps
router.get("/", async (req, res, next) => {
  try {
    const CourseRoadmaps= await CourseRoadmap.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: CourseRoadmaps.length,
      data: CourseRoadmaps,
    });
  } catch (err) {
    next(err);
  }
});


// GET /api/CourseRoadmaps/:id -> Get CourseRoadmap by ID
router.get("/:id", async (req, res, next) => {
  try {
    const CourseRoadmap = await CourseRoadmap.findById(req.params.id);

    if (!CourseRoadmap) {
      return res.status(404).json({
        success: false,
        message: "CourseRoadmap not found",
      });
    }

    res.json({
      success: true,
      data: CourseRoadmap,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/CourseRoadmap-> Create a new CourseRoadmap
router.post("/", async (req, res, next) => {
  try {
    const CourseRoadmaps = await CourseRoadmap.create(req.body);
    res.status(201).json({
      success: true,
      data: CourseRoadmaps,
    });
  } catch (err) {
    next(err);
  }
});


// PATCH /api/CourseRoadmap/:id -> Update part of a CourseRoadmap
router.patch("/:id", async (req, res, next) => {
  try {
    const CourseRoadmaps = await CourseRoadmap.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!CourseRoadmaps) {
      return res.status(404).json({ success: false, message: "CourseRoadmap not found" });
    }

    res.json({
      success: true,
      data: CourseRoadmaps,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/CourseRoadmap/:id -> Delete a CourseRoadmap
router.delete("/:id", async (req, res, next) => {
  try {
    const CourseRoadmap= await CourseRoadmap.findByIdAndDelete(req.params.id);

    if (!CourseRoadmap) {
      return res.status(404).json({ success: false, message: "CourseRoadmap not found" });
    }

    res.json({
      success: true,
      message: "CourseRoadmap deleted successfully",
    });
  } catch (err) {
    next(err);
  }
});

module.exports=router;