const express = require("express");
const { protect, authorize } = require("../middlewares/authMiddleware");
const {
  getProfile,
  updateProfile,
  createLoad,
  listLoads,
  updateLoad,
  cancelLoad,
  listLoadBids,
  acceptBid,
  rejectBid,
  listMyTrips,
  getTripDetails,
  getTripLocationHistory
} = require("../controllers/businessController");

const router = express.Router();

router.use(protect, authorize("business"));

router.get("/profile", getProfile);
router.put("/profile", updateProfile);

router.post("/loads", createLoad);
router.get("/loads", listLoads);
router.put("/loads/:id", updateLoad);
router.put("/loads/:id/cancel", cancelLoad);

router.get("/loads/:loadId/bids", listLoadBids);
router.put("/bids/:bidId/accept", acceptBid);
router.put("/bids/:bidId/reject", rejectBid);

router.get("/trips", listMyTrips);
router.get("/trips/:id", getTripDetails);
router.get("/trips/:id/history", getTripLocationHistory);

module.exports = router;