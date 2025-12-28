const express = require("express");
const containerSummaryController = require("./containerSummary.controller");
const containerSummaryValidation = require("./containerSummary.validation");
const { authenticate } = require("../../middleware/auth");
const { validateRequest } = require("../../middleware/validateRequest");

const router = express.Router();

// ===============================
// AUTH (ALL ROUTES PROTECTED)
// ===============================
router.use(authenticate);

// ===============================
// CONTAINER SUMMARY ROUTES
// ===============================

// Create new summary
router.post(
  "/",
  validateRequest(containerSummaryValidation.createSummary),
  containerSummaryController.createSummary
);

// Get all summaries (with pagination)
router.get(
  "/",
  validateRequest(containerSummaryValidation.paginationQuery, "query"),
  containerSummaryController.getAllSummaries
);

// Get summary statistics
router.get("/statistics", containerSummaryController.getStatistics);

// Search summaries
router.get(
  "/search",
  validateRequest(containerSummaryValidation.searchQuery, "query"),
  containerSummaryController.searchSummaries
);

// Get single summary
router.get("/:id", containerSummaryController.getSummaryById);

// Update summary
router.patch(
  "/:id",
  validateRequest(containerSummaryValidation.updateSummary),
  containerSummaryController.updateSummary
);

// Delete summary
router.delete("/:id", containerSummaryController.deleteSummary);

// Export summary to CSV
router.get("/:id/export/csv", containerSummaryController.exportToCSV);

// Export summary to Excel
router.get("/:id/export/excel", containerSummaryController.exportToExcel);

// Export all summaries to CSV
router.get("/export/all/csv", containerSummaryController.exportAllToCSV);

// Get summary activities
router.get("/:id/activities", containerSummaryController.getSummaryActivities);

module.exports = router;