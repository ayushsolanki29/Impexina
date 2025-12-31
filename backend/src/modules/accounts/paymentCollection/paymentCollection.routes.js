const express = require("express");
const paymentCollectionController = require("./paymentCollection.controller");
const { authenticate } = require("../../../middleware/auth");
const Joi = require("joi");
const { validateRequest } = require("../../../middleware/validateRequest");

const router = express.Router();

// Validation schemas
const createSheetSchema = Joi.object({
  name: Joi.string().max(200).optional(),
  description: Joi.string().max(500).optional().allow("", null),
  fiscalYear: Joi.string().pattern(/^\d{4}-\d{4}$/).optional(),
  tags: Joi.array().items(Joi.string().max(50)).optional(),
  dueDate: Joi.date().optional(),
});

const updateSheetSchema = Joi.object({
  name: Joi.string().max(200).optional(),
  description: Joi.string().max(500).optional().allow("", null),
  status: Joi.string().valid("ACTIVE", "PAID", "OVERDUE", "CANCELLED").optional(),
  isLocked: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string().max(50)).optional(),
  fiscalYear: Joi.string().pattern(/^\d{4}-\d{4}$/).optional(),
  dueDate: Joi.date().optional(),
});

const entrySchema = Joi.object({
  clientName: Joi.string().required().max(200),
  expectedDate: Joi.date().optional(),
  amount24_25: Joi.number().min(0).optional().allow(null),
  addCompany: Joi.number().min(0).optional().allow(null),
  amount25_26: Joi.number().optional().allow(null),
  advance: Joi.number().min(0).optional().allow(null),
  isHighlighted: Joi.boolean().optional(),
  notes: Joi.string().max(1000).optional().allow("", null),
  paymentMode: Joi.string().max(50).optional().allow("", null),
  paymentRef: Joi.string().max(100).optional().allow("", null),
});

const importEntriesSchema = Joi.array().items(entrySchema).min(1).max(1000);

// ===============================
// AUTHENTICATION MIDDLEWARE
// ===============================
router.use(authenticate);

// ===============================
// DASHBOARD & OVERVIEW ROUTES
// ===============================
router.get("/dashboard/overview", paymentCollectionController.getDashboardOverview);
router.get("/generate-name", paymentCollectionController.generateDefaultName);

// ===============================
// SHEETS ROUTES
// ===============================
router.get("/", paymentCollectionController.getAllSheets);
router.post(
  "/",
  validateRequest(createSheetSchema),
  paymentCollectionController.createSheet
);
router.get("/:sheetId", paymentCollectionController.getSheetById);
router.put(
  "/:sheetId",
  validateRequest(updateSheetSchema),
  paymentCollectionController.updateSheet
);
router.delete("/:sheetId", paymentCollectionController.deleteSheet);

// ===============================
// ENTRIES ROUTES
// ===============================
router.get("/:sheetId/entries", paymentCollectionController.getSheetEntries);
router.post(
  "/:sheetId/entries",
  validateRequest(entrySchema),
  paymentCollectionController.addEntry
);
router.put(
  "/entries/:entryId",
  validateRequest(entrySchema),
  paymentCollectionController.updateEntry
);
router.delete("/entries/:entryId", paymentCollectionController.deleteEntry);
router.put(
  "/:sheetId/bulk-entries",
  paymentCollectionController.bulkUpdateEntries
);

// ===============================
// STATISTICS & EXPORT ROUTES
// ===============================
router.get("/:sheetId/stats", paymentCollectionController.getSheetStats);
router.get("/:sheetId/export", paymentCollectionController.exportSheet);

module.exports = router;