const express = require("express");
const verifyToken = require("../middleware/verifyToken");
const router = express.Router();

// GET /api/auth  -> check authentication
router.get("/", verifyToken, (req, res) => {
  // If we got here, verifyToken called next() => token valid
  return res.json({
    authenticated: true,
    user: req.user, // remove if you don't want to expose user data
  });
});
module.exports = router;
