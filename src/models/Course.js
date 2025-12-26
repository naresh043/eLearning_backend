const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String },
  feedback: { type: String, required: true },
  rating: { type: String, required: true },
  date: { type: Date, default: Date.now },
  difficultyLevel: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced"],
  },
  suggestions: { type: String },
  reviewType: {
    type: String,
    enum: ["Positive", "Negative", "Neutral"],
    default: "Positive",
  },
});

const courseSchema = new mongoose.Schema(
  {
    courseName: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
      unique: true,
    },
    courseLogo: {
      type: String,
      required: [true, "Course logo URL is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    duration: {
      type: String,
      required: [true, "Duration is required"],
      trim: true,
    },
    keyTakeaways: {
      type: [String],
      required: true,
      default: [],
    },
    preRequirements: {
      type: [String],
      required: true,
      default: [],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    courseLevel: {
      type: String,
      required: [true, "Course level is required"],
      trim: true,
      enum: [
        "Beginner",
        "Intermediate",
        "Advanced",
        "Beginner to Intermediate",
      ], // Add levels as needed
    },
    instructor: {
      type: String,
      required: [true, "Instructor name is required"],
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: [0, "Rating cannot be less than 0"],
      max: [5, "Rating cannot be more than 5"],
      default: 0,
    },
    reviewsCount: {
      type: Number,
      required: true,
      min: [0, "Reviews count cannot be negative"],
      default: 0,
    },
    price: {
      type: Number, 
      required: true,
    },
    completionCertificate: {
      type: Boolean,
      required: true,
      default: false,
    },
    courseLink: {
      type: String,
      required: [true, "Course link is required"],
      trim: true,
    },
    reviews: [reviewSchema],
    enrolledCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
