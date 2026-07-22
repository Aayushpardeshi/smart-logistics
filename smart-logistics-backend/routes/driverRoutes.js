const express = require("express");
const { protect, authorize } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");
const {
  getProfile,
  updateProfile,
  addTruck,
  listTrucks,
  updateTruck,
  deleteTruck,
  verifyLicense,
  verifyAadhaar,
} = require("../controllers/driverController");

const router = express.Router();

router.use(protect, authorize("driver"));

router.get("/profile", getProfile);
router.put("/profile", updateProfile);

router.post("/trucks", addTruck);
router.get("/trucks", listTrucks);
router.put("/trucks/:id", updateTruck);
router.delete("/trucks/:id", deleteTruck);

router.post(
  "/verify-aadhaar",
  upload.fields([{ name: "front", maxCount: 1 }, { name: "back", maxCount: 1 }]),
  verifyAadhaar
);

module.exports = router;