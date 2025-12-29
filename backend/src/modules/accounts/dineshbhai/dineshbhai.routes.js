const express = require("express");
const dineshbhaiController = require("./dineshbhai.controller");
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
});

const updateSheetSchema = Joi.object({
  title: Joi.string().max(200).optional(),
  description: Joi.string().max(500).optional().allow("", null),
  status: Joi.string().valid("ACTIVE", "ARCHIVED", "LOCKED").optional(),
  isLocked: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string().max(50)).optional(),
});

const entrySchema = Joi.object({
  supplier: Joi.string().required().max(200),
  paymentDate: Joi.date().required(),
  amount: Joi.number().positive().optional().allow(null),
  booking: Joi.number().positive().optional().allow(null),
  rate: Joi.number().positive().optional().allow(null),
  total: Joi.number().positive().optional().allow(null),
  paid: Joi.number().positive().optional().allow(null),
  clientRef: Joi.string().max(100).optional().allow("", null),
  notes: Joi.string().max(1000).optional().allow("", null),
  priority: Joi.string().valid("HIGH", "MEDIUM", "LOW").optional(),
});

const importEntriesSchema = Joi.array().items(entrySchema).min(1).max(1000);

// ===============================
// AUTHENTICATION MIDDLEWARE
// ===============================
router.use(authenticate);

// ===============================
// DASHBOARD & OVERVIEW ROUTES
// ===============================
router.get("/dashboard/overview", dineshbhaiController.getDashboardOverview);
router.get("/generate-title", dineshbhaiController.generateDefaultTitle);

// ===============================
// SHEETS ROUTES
// ===============================
router.get("/", dineshbhaiController.getAllSheets);
router.post(
  "/",
  validateRequest(createSheetSchema),
  dineshbhaiController.createSheet
);
router.get("/:sheetId", dineshbhaiController.getSheetById);
router.put(
  "/:sheetId",
  validateRequest(updateSheetSchema),
  dineshbhaiController.updateSheet
);
router.delete("/:sheetId", dineshbhaiController.deleteSheet);

// ===============================
// ENTRIES ROUTES
// ===============================
router.get("/:sheetId/entries", dineshbhaiController.getSheetEntries);
router.post(
  "/:sheetId/entries",
  validateRequest(entrySchema),
  dineshbhaiController.addEntry
);
router.put(
  "/entries/:entryId",
  validateRequest(entrySchema),
  dineshbhaiController.updateEntry
);
router.delete("/entries/:entryId", dineshbhaiController.deleteEntry);
router.post(
  "/:sheetId/import",
  validateRequest(importEntriesSchema),
  dineshbhaiController.importEntries
);

// ===============================
// STATISTICS & EXPORT ROUTES
// ===============================
router.get("/:sheetId/stats", dineshbhaiController.getSheetStats);
router.get("/:sheetId/export", dineshbhaiController.exportSheet);

module.exports = router;
