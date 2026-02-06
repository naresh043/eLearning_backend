const Enrollment = require("../models/Enrollment");
const PaymentReceipt = require("../models/PaymentReceipt");
// routes/payment.js
const auth = require("../middleware/verifyToken");
const express = require("express");
const razorpay = require("../config/razorpay");
const router = express.Router();
const crypto = require("node:crypto");

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  // Force IPv4 to avoid ENETUNREACH on some networks/deployments that lack IPv6
  family: 4, 
});

async function sendPaymentSuccessEmail(userEmail) {
  try {
    await transporter.sendMail({
      from: `"E-Leranfy Team" <${process.env.GMAIL_USER}>`,
      to: userEmail,
      subject: "Thanks for visiting E-Leranfy 🚀",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <style>
              body {
                font-family: Arial, Helvetica, sans-serif;
                background-color: #f4f6f8;
                padding: 20px;
              }
              .container {
                max-width: 600px;
                margin: auto;
                background: #ffffff;
                padding: 30px;
                border-radius: 8px;
              }
              .header {
                text-align: center;
                color: #2c3e50;
              }
              .content {
                color: #555;
                line-height: 1.6;
                margin-top: 20px;
              }
              .footer {
                margin-top: 30px;
                font-size: 12px;
                color: #999;
                text-align: center;
              }
              .btn {
                display: inline-block;
                margin-top: 20px;
                padding: 12px 20px;
                background-color: #4f46e5;
                color: #ffffff;
                text-decoration: none;
                border-radius: 6px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2 class="header">Welcome to E-Leranfy 🎓</h2>

              <div class="content">
                <p>Hi there,</p>

                <p>
                  Thank you for visiting the <strong>E-Leranfy</strong> application.
                  We’re excited to have you explore our learning platform designed
                  to help you grow your skills and achieve your goals.
                </p>

                <p>
                  Whether you’re here to learn, practice, or level up your career,
                  E-Leranfy is built to support you every step of the way.
                </p>

                <a href="https://e-learnify-nine.vercel.app/courses" class="btn">
                  Explore Courses
                </a>

                <p style="margin-top: 25px;">
                  If you have any questions or need support, feel free to reply to this email.
                </p>

                <p>
                  Happy Learning! 🚀<br />
                  <strong>E-Leranfy Team</strong>
                </p>
              </div>

              <div class="footer">
                <p>
                  © 2026 E-Leranfy. All rights reserved.<br />
                  This is an automated message, please do not share sensitive information.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Message sent successfully");
  } catch (error) {
    console.log(error, "Mail sending failed");
  }
}

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

    // Send success email
    await sendPaymentSuccessEmail(req.user.email);

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
