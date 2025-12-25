const express = require("express");
const commercialInvoiceController = require("./commercial-invoice.controller");
const { authenticate } = require("../../middleware/auth");

const router = express.Router();

// ===============================
// AUTH (ALL ROUTES PROTECTED)
// ===============================
router.use(authenticate);

// ===============================
// COMMERCIAL INVOICE ROUTES
// ===============================

// Initialize commercial invoice from bifurcation
router.post(
  "/initialize/:containerCode",
  commercialInvoiceController.initializeFromBifurcation
);

// Get commercial invoice
router.get("/:containerCode", commercialInvoiceController.getCommercialInvoice);

// Update commercial invoice details
router.patch("/:containerCode", commercialInvoiceController.updateCommercialInvoice);

// Update commercial invoice items
router.patch("/:containerCode/items", commercialInvoiceController.updateItems);

// Mark as printed
router.post("/:containerCode/print", commercialInvoiceController.markAsPrinted);

// Log activity
router.post("/:containerCode/activity", commercialInvoiceController.logActivity);

// Get activities
router.get("/:containerCode/activities", commercialInvoiceController.getActivities);

// ===============================
// LISTING ROUTES
// ===============================

// Get all commercial invoices
router.get("/", commercialInvoiceController.getAllCommercialInvoices);

module.exports = router;