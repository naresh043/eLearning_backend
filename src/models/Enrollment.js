const mongoose = require("mongoose");
const { Schema } = mongoose;

const enrollmentSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    // 🔐 PAYMENT INFO
    payment: {
      provider: {
        type: String,
        enum: ["razorpay"],
      },
      orderId: String,
      paymentId: String,
      signature: String,
      amount: Number,
      currency: {
        type: String,
        default: "INR",
      },
      status: {
        type: String,
        enum: ["paid", "failed", "refunded"],
        default: "paid",
      },
      paidAt: Date,
    },

    status: {
      type: String,
      enum: ["enrolled", "in-progress", "completed", "cancelled"],
      default: "enrolled",
    },

    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: Date,

    certificateUrl: String,
  },
  { timestamps: true }
);

// Prevent duplicate enrollments for the same user+course
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", enrollmentSchema);
