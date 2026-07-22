const express = require("express");
const { register, login } = require("../controllers/authController");
const { protect, authorize } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/me", protect, (req, res) => {
  res.json({ success: true, data: req.user });
});

router.get("/admin-only", protect, authorize("admin"), (req, res) => {
  res.json({ success: true, message: "Welcome admin" });
});

module.exports = router;