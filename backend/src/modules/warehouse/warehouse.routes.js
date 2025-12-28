const express = require("express");
const multer = require("multer");
const warehouseController = require("./warehouse.controller");
const warehouseValidation = require("./warehouse.validation");
const { authenticate } = require("../../middleware/auth");
const { validateRequest } = require("../../middleware/validateRequest");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ===============================
// AUTH (ALL ROUTES PROTECTED)
// ===============================
router.use(authenticate);

// ===============================
// WAREHOUSE PLAN ROUTES
// ===============================

// Initialize warehouse plan from container
router.post(
  "/initialize/:containerCode",
  warehouseController.initializeFromContainer
);

// Get warehouse plan
router.get("/:containerCode", warehouseController.getWarehousePlan);

// Search warehouse plan
router.get(
  "/:containerCode/search",
  validateRequest(warehouseValidation.searchSchema, "query"),
  warehouseController.searchWarehousePlan
);

// Add new mark
router.post(
  "/:containerCode/marks",
  validateRequest(warehouseValidation.markSchema),
  warehouseController.addMark
);

// Update mark
router.patch(
  "/:containerCode/marks/:markId",
  validateRequest(warehouseValidation.updateMarkSchema),
  warehouseController.updateMark
);

// Delete mark
router.delete(
  "/:containerCode/marks/:markId",
  warehouseController.deleteMark
);

// Export to Excel
router.get(
  "/:containerCode/export/excel",
  warehouseController.exportToExcel
);

// Get unique transporters
router.get(
  "/:containerCode/transporters",
  warehouseController.getUniqueTransporters
);

// Get activities
router.get(
  "/:containerCode/activities",
  warehouseController.getActivities
);

// Update warehouse plan status
router.patch(
  "/:containerCode/status",
  validateRequest(warehouseValidation.statusSchema),
  warehouseController.updateWarehousePlanStatus
);

// Import from Excel
router.post(
  "/:containerCode/import",
  upload.single("file"),
  warehouseController.importFromExcel
);

// Recalculate totals
router.post(
  "/:containerCode/recalculate",
  warehouseController.recalculateTotals
);

// Get all warehouse plans
router.get(
  "/",
  validateRequest(warehouseValidation.paginationSchema, "query"),
  warehouseController.getAllWarehousePlans
);

module.exports = router;