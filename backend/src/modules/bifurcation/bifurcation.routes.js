const express = require("express");
const bifurcationController = require("./bifurcation.controller");
const bifurcationValidation = require("./bifurcation.validation");
const { authenticate } = require("../../middleware/auth");
const { validateRequest } = require("../../middleware/validateRequest");

const router = express.Router();

// ===============================
// AUTH (ALL ROUTES PROTECTED)
// ===============================
router.use(authenticate);

// ===============================
// BIFURCATION ROUTES
// ===============================

// Initialize bifurcation from container
router.post(
  "/initialize/:containerCode",
  bifurcationController.initializeFromContainer
);

// Get bifurcation details
router.get("/:containerCode", bifurcationController.getBifurcation);

// Update container details
router.patch(
  "/:containerCode",
  validateRequest(bifurcationValidation.updateContainerDetails),
  bifurcationController.updateContainerDetails
);

// Update client details
router.patch(
  "/:containerCode/clients/:clientName",
  validateRequest(bifurcationValidation.updateClientDetails),
  bifurcationController.updateClientDetails
);

// Add new client
router.post(
  "/:containerCode/clients",
  validateRequest(bifurcationValidation.addNewClient),
  bifurcationController.addNewClient
);

// Delete client
router.delete(
  "/:containerCode/clients/:clientId",
  bifurcationController.deleteClient
);

// Mark as complete
router.post("/:containerCode/complete", bifurcationController.markAsComplete);

// Search bifurcation
router.get("/:containerCode/search", bifurcationController.searchBifurcation);

// Export to Excel
router.get("/:containerCode/export/excel", bifurcationController.exportToExcel);

// Get activities
router.get("/:containerCode/activities", bifurcationController.getActivities);

// Get all bifurcations
router.get(
  "/",
  validateRequest(bifurcationValidation.paginationQuery, "query"),
  bifurcationController.getAllBifurcations
);

module.exports = router;
