const express = require("express");
const { register, login } = require("../controllers/authController");
const { protect, authorize } = require("../middlewares/authMiddleware");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many requests from this IP, please try again after 15 minutes" }
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);

router.get("/me", protect, (req, res) => {
  res.json({ success: true, data: req.user });
});

router.get("/admin-only", protect, authorize("admin"), (req, res) => {
  res.json({ success: true, message: "Welcome admin" });
});

module.exports = router;