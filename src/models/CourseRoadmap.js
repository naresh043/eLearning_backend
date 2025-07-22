// models/Course.js
const mongoose = require("mongoose");
const validator = require("validator"); // npm i validator if not installed

const CourseRoadmapSchema = new mongoose.Schema(
  {
    courseRoadmapLogo: {
      type: String,
      trim: true,
      validate: {
        validator: (v) => !v || validator.isURL(v, { require_protocol: true }),
        message: "courseRoadmapLogo must be a valid URL (include http/https).",
      },
    },
    coursename: {
      type: String,
      required: [true, "coursename is required."],
      trim: true,
      minlength: [2, "coursename must be at least 2 characters."],
    },
    category: {
      type: String,
      trim: true,
      default: "General",
      // Uncomment to enforce known categories:
      // enum: ["Frontend", "Backend", "Fullstack", "DevOps", "Data", "Mobile", "General"],
    },
    level: {
      type: String,
      trim: true,
      default: "Beginner",
      enum: ["Beginner", "Intermediate", "Advanced", "All"],
    },
    description: {
      type: String,
      trim: true,
    },
    estimatedTime: {
      // Free‑form display string ("6 weeks", "10 hrs", etc.)
      type: String,
      trim: true,
    },
    // Optional normalized numeric duration in hours if you want (not required)
    estimatedHours: {
      type: Number,
      min: [0, "estimatedHours cannot be negative."],
    },
    prerequisites: {
      type: String,
      trim: true,
    },
    targetAudience: {
      type: String,
      trim: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    courseRoadmapLink: {
      type: String,
      trim: true,
      validate: {
        validator: (v) => !v || validator.isURL(v, { require_protocol: true }),
        message: "courseRoadmapLink must be a valid URL (include http/https).",
      },
    },
  },
  { timestamps: true }
);



/**
 * Helpful compound index if you’ll frequently filter by category + level.
 */
// CourseRoadmapSchema.index({ category: 1, level: 1 });

module.exports = mongoose.model("CourseRoadmap", CourseRoadmapSchema);
