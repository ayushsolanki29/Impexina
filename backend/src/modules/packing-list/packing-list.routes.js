const express = require("express");
const packingListController = require("./packing-list.controller");
const { authenticate } = require("../../middleware/auth");

const router = express.Router();

// ===============================
// AUTH (ALL ROUTES PROTECTED)
// ===============================
router.use(authenticate);

// ===============================
// PACKING LIST ROUTES
// ===============================

// Initialize packing list from bifurcation
router.post(
  "/initialize/:containerCode",
  packingListController.initializeFromBifurcation
);

// Get packing list
router.get("/:containerCode", packingListController.getPackingList);

// Update packing list details
router.patch("/:containerCode", packingListController.updatePackingList);

// Update packing list items
router.patch("/:containerCode/items", packingListController.updateItems);

// Mark as printed
router.post("/:containerCode/print", packingListController.markAsPrinted);

// Log activity
router.post("/:containerCode/activity", packingListController.logActivity);

// Get activities
router.get("/:containerCode/activities", packingListController.getActivities);

// ===============================
// COMPANY MASTER ROUTES
// ===============================

// Get all company masters
router.get("/company-masters/all", packingListController.getCompanyMasters);

// Update company master
router.patch(
  "/company-masters/:companyId",
  packingListController.updateCompanyMaster
);

// ===============================
// LISTING ROUTES
// ===============================

// Get all packing lists
router.get("/", packingListController.getAllPackingLists);

module.exports = router;