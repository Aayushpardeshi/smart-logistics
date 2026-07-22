const express = require("express");
const { protect, authorize } = require("../middlewares/authMiddleware");
const {
  getProfile,
  updateProfile,
  createShipment,
  listShipments,
  updateShipment,
  cancelShipment,
} = require("../controllers/businessController");

const router = express.Router();

router.use(protect, authorize("business"));

router.get("/profile", getProfile);
router.put("/profile", updateProfile);

router.post("/shipments", createShipment);
router.get("/shipments", listShipments);
router.put("/shipments/:id", updateShipment);
router.put("/shipments/:id/cancel", cancelShipment);

module.exports = router;