module.exports = (err, req, res, next) => {
  console.error(err);

  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res
      .status(400)
      .json({ success: false, message: "Validation failed", errors });
  }

  if (err.code === 11000) {
    return res
      .status(409)
      .json({ success: false, message: "Duplicate field value entered" });
  }

  res
    .status(500)
    .json({ success: false, message: "Server error", error: err.message });
};
