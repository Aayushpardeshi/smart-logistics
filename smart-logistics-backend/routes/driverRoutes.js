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
  searchLoads,
  placeBid,
  listMyBids,
  verifyTruckRC,
  verifyTruckPUC,
  listMyTrips,
  getTripDetails,
} = require("../controllers/driverController");

const router = express.Router();

router.use(protect, authorize("driver"));

router.get("/profile", getProfile);
router.put("/profile", updateProfile);

router.post("/trucks", addTruck);
router.get("/trucks", listTrucks);
router.put("/trucks/:id", updateTruck);
router.delete("/trucks/:id", deleteTruck);

router.post("/trucks/:id/verify-rc", upload.single("file"), verifyTruckRC);
router.post("/trucks/:id/verify-puc", upload.single("file"), verifyTruckPUC);

router.post(
  "/verify-aadhaar",
  upload.fields([{ name: "front", maxCount: 1 }, { name: "back", maxCount: 1 }]),
  verifyAadhaar
);

router.get("/loads/open", searchLoads);
router.post("/loads/:loadId/bids", placeBid);
router.get("/bids", listMyBids);

router.get("/trips", listMyTrips);
router.get("/trips/:id", getTripDetails);

module.exports = router;