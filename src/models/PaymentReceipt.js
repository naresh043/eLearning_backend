// models/PaymentReceipt.js
const mongoose = require("mongoose");

const PaymentReceiptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },

  orderId: String,
  paymentId: String,

  amount: Number,
  currency: { type: String, default: "INR" },
  provider: { type: String, default: "razorpay" },

  status: { type: String, enum: ["SUCCESS", "FAILED"] },
  createdAt: { type: Date, default: Date.now },
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Enrollment",
  },
});

module.exports = mongoose.model("PaymentReceipt", PaymentReceiptSchema);
