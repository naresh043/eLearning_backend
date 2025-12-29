const Enrollment = require("../models/Enrollment");
const PaymentReceipt = require("../models/PaymentReceipt");
// routes/payment.js
const auth = require("../middleware/verifyToken");
const express = require("express");
const razorpay = require("../config/razorpay");
const router = express.Router();
const crypto = require("node:crypto");

router.post("/create-order", auth, async (req, res) => {
  const { amount, courseId } = req.body; // amount in rupees

  const options = {
    amount: amount * 100,
    currency: "INR",
    receipt: `rcpt_${Date.now()}`,
    notes: {
      userId: req.user.id,
      courseId,
      amount,
    },
  };

  const order = await razorpay.orders.create(options);
  res.json(order);
});

router.post("/verify-payment", auth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      courseId,
    } = req.body;

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false });
    }

    const order = await razorpay.orders.fetch(razorpay_order_id);
    const amount = order.amount / 100;

    // ✅ idempotency check
    const alreadyEnrolled = await Enrollment.findOne({
      user: req.user.id,
      course: courseId,
    });

    if (alreadyEnrolled) {
      return res.json({ success: true, alreadyEnrolled: true });
    }

    // ✅ enroll user
    const enrollment = await Enrollment.create({
      user: req.user.id,
      course: courseId,
      payment: {
        provider: "razorpay",
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        amount,
        paidAt: new Date(),
        status: "paid",
      },
    });

    const receipt = await PaymentReceipt.create({
      user: req.user.id,
      course: courseId,
      enrollment: enrollment._id,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount,
      status: "SUCCESS",
    });

    const populatedEnrollment = await Enrollment.findById(
      enrollment._id
    ).populate("course", "courseName");

    res.json({
      success: true,
      receipt: {
        receiptId: receipt._id,
        paymentId: receipt.paymentId,
        orderId: receipt.orderId,
        amount: receipt.amount,
        currency: receipt.currency,
        courseName: populatedEnrollment.course.courseName,
        date: receipt.createdAt,
      },
    });
  } catch(err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Payment verification failed" });
  }
});

module.exports = router;
