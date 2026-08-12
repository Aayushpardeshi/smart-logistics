const express = require("express");
const { protect, authorize } = require("../middlewares/authMiddleware");
const {
  getStats,
  getUsers,
  getPendingDocuments,
  verifyDocument,
} = require("../controllers/adminController");

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/stats", getStats);
router.get("/users", getUsers);
router.get("/documents/pending", getPendingDocuments);
router.put("/documents/verify/:id", verifyDocument);

module.exports = router;
