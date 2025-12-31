const express = require("express");
const davidSheetController = require("./davidSheet.controller");
const { authenticate } = require("../../../middleware/auth");
const Joi = require("joi");
const { validateRequest } = require("../../../middleware/validateRequest");

const router = express.Router();

// Validation schemas
const createSheetSchema = Joi.object({
  name: Joi.string().max(200).optional(),
  description: Joi.string().max(500).optional().allow("", null),
  tags: Joi.array().items(Joi.string().max(50)).optional(),
  currencyTypes: Joi.array().items(Joi.string()).optional(),
});

const updateSheetSchema = Joi.object({
  name: Joi.string().max(200).optional(),
  description: Joi.string().max(500).optional().allow("", null),
  status: Joi.string().valid("ACTIVE", "ARCHIVED", "LOCKED").optional(),
  isLocked: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string().max(50)).optional(),
  currencyTypes: Joi.array().items(Joi.string()).optional(),
});

const entrySchema = Joi.object({
  date: Joi.date().optional(),
  particulars: Joi.string().required().max(1000),
  debitRMB: Joi.number().min(0).optional().allow(null),
  creditRMB: Joi.number().min(0).optional().allow(null),
  debitUSD: Joi.number().min(0).optional().allow(null),
  creditUSD: Joi.number().min(0).optional().allow(null),
});

const importEntriesSchema = Joi.array().items(entrySchema).min(1).max(1000);

// ===============================
// AUTHENTICATION MIDDLEWARE
// ===============================
router.use(authenticate);

// ===============================
// DASHBOARD & OVERVIEW ROUTES
// ===============================
router.get("/dashboard/overview", davidSheetController.getDashboardOverview);
router.get("/generate-name", davidSheetController.generateDefaultName);

// ===============================
// SHEETS ROUTES
// ===============================
router.get("/", davidSheetController.getAllSheets);
router.post(
  "/",
  validateRequest(createSheetSchema),
  davidSheetController.createSheet
);
router.get("/:sheetId", davidSheetController.getSheetById);
router.put(
  "/:sheetId",
  validateRequest(updateSheetSchema),
  davidSheetController.updateSheet
);
router.delete("/:sheetId", davidSheetController.deleteSheet);

// ===============================
// ENTRIES ROUTES
// ===============================
router.get("/:sheetId/entries", davidSheetController.getSheetEntries);
router.post(
  "/:sheetId/entries",
  validateRequest(entrySchema),
  davidSheetController.addEntry
);
router.put(
  "/entries/:entryId",
  validateRequest(entrySchema),
  davidSheetController.updateEntry
);
router.delete("/entries/:entryId", davidSheetController.deleteEntry);
router.post(
  "/:sheetId/import",
  validateRequest(importEntriesSchema),
  davidSheetController.importEntries
);
router.put(
  "/:sheetId/bulk-entries",
  davidSheetController.bulkUpdateEntries
);

// ===============================
// STATISTICS & EXPORT ROUTES
// ===============================
router.get("/:sheetId/stats", davidSheetController.getSheetStats);
router.get("/:sheetId/export", davidSheetController.exportSheet);

module.exports = router;