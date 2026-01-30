const express = require("express");
const kavyaController = require("./kavya.controller");
const { authenticate } = require("../../../middleware/auth");
const Joi = require("joi");
const { validateRequest } = require("../../../middleware/validateRequest");

const router = express.Router();

// Validation schemas
const createSheetSchema = Joi.object({
  title: Joi.string().max(200).optional(),
  description: Joi.string().max(500).optional().allow("", null),
  month: Joi.number().integer().min(1).max(12).optional(),
  year: Joi.number().integer().min(2020).max(2100).optional(),
  tags: Joi.array().items(Joi.string().max(50)).optional(),
  openingBalance: Joi.number().optional(),
});

const updateSheetSchema = Joi.object({
  title: Joi.string().max(200).optional(),
  description: Joi.string().max(500).optional().allow("", null),
  status: Joi.string().valid("ACTIVE", "ARCHIVED", "LOCKED").optional(),
  isLocked: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string().max(50)).optional(),
  openingBalance: Joi.number().optional(),
});

const entrySchema = Joi.object({
  containerCode: Joi.string().max(50).optional().allow("", null),
  loadingDate: Joi.date().optional().allow(null),
  deliveryDate: Joi.date().optional().allow(null),
  shippingMark: Joi.string().max(100).optional().allow("", null),
  particular: Joi.string().max(500).optional().allow("", null),
  rateCbmWeight: Joi.number().min(0).optional(),
  cbmKg: Joi.number().min(0).optional(),
  dutyFvb: Joi.number().min(0).optional(),
  total: Joi.number().min(0).optional(),
  paid: Joi.number().min(0).optional(),
  paymentDate: Joi.date().optional().allow(null),
});

const importEntriesSchema = Joi.array().items(entrySchema).min(1).max(1000);

// ===============================
// AUTHENTICATION MIDDLEWARE
// ===============================
router.use(authenticate);

// ===============================
// DASHBOARD & OVERVIEW ROUTES
// ===============================
router.get("/dashboard/overview", kavyaController.getDashboardOverview);
router.get("/generate-title", kavyaController.generateDefaultTitle);

// ===============================
// SHEETS ROUTES
// ===============================
router.get("/", kavyaController.getAllSheets);
router.post(
  "/",
  validateRequest(createSheetSchema),
  kavyaController.createSheet
);
router.get("/:sheetId", kavyaController.getSheetById);
router.put(
  "/:sheetId",
  validateRequest(updateSheetSchema),
  kavyaController.updateSheet
);
router.delete("/:sheetId", kavyaController.deleteSheet);

// ===============================
// ENTRIES ROUTES
// ===============================
router.get("/:sheetId/entries", kavyaController.getSheetEntries);
router.post(
  "/:sheetId/entries",
  validateRequest(entrySchema),
  kavyaController.addEntry
);
router.put(
  "/entries/:entryId",
  validateRequest(entrySchema),
  kavyaController.updateEntry
);
router.delete("/entries/:entryId", kavyaController.deleteEntry);

// ===============================
// BULK IMPORT
// ===============================
router.post(
  "/:sheetId/import",
  validateRequest(importEntriesSchema),
  kavyaController.importEntries
);

// ===============================
// STATS & EXPORT
// ===============================
router.get("/:sheetId/stats", kavyaController.getSheetStats);
router.get("/:sheetId/export", kavyaController.exportSheet);

module.exports = router;
