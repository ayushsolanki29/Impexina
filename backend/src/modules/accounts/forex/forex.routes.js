const express = require("express");
const forexController = require("./forex.controller");
const { authenticate } = require("../../../middleware/auth");
const Joi = require("joi");
const { validateRequest } = require("../../../middleware/validateRequest");

const router = express.Router();

// Validation schemas
const createSheetSchema = Joi.object({
  name: Joi.string().required().max(200),
  description: Joi.string().max(500).optional().allow("", null),
  baseCurrency: Joi.string().valid("RMB", "USD", "EUR", "GBP", "JPY", "OTHER").default("RMB"),
  tags: Joi.array().items(Joi.string().max(50)).optional(),
});

const updateSheetSchema = Joi.object({
  name: Joi.string().max(200).optional(),
  description: Joi.string().max(500).optional().allow("", null),
  baseCurrency: Joi.string().valid("RMB", "USD", "EUR", "GBP", "JPY", "OTHER").optional(),
  status: Joi.string().valid("ACTIVE", "ARCHIVED", "LOCKED").optional(),
  isLocked: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string().max(50)).optional(),
});

const entrySchema = Joi.object({
  date: Joi.date().required(),
  particulars: Joi.string().required().max(500),
  reference: Joi.string().max(100).optional().allow("", null),
  debitRMB: Joi.number().positive().optional().allow(null),
  creditRMB: Joi.number().positive().optional().allow(null),
  debitUSD: Joi.number().positive().optional().allow(null),
  creditUSD: Joi.number().positive().optional().allow(null),
  debitEUR: Joi.number().positive().optional().allow(null),
  creditEUR: Joi.number().positive().optional().allow(null),
  debitGBP: Joi.number().positive().optional().allow(null),
  creditGBP: Joi.number().positive().optional().allow(null),
  debitJPY: Joi.number().positive().optional().allow(null),
  creditJPY: Joi.number().positive().optional().allow(null),
  debitOther: Joi.number().positive().optional().allow(null),
  creditOther: Joi.number().positive().optional().allow(null),
  otherCurrencyCode: Joi.string().max(10).optional().allow("", null),
  category: Joi.string().max(100).optional().allow("", null),
  notes: Joi.string().max(1000).optional().allow("", null),
});

// ===============================
// AUTHENTICATION MIDDLEWARE
// ===============================
router.use(authenticate);

// ===============================
// DASHBOARD & OVERVIEW ROUTES
// ===============================
router.get("/dashboard/overview", forexController.getDashboardOverview);
router.get("/search/sheets", forexController.searchSheetNames);

// ===============================
// SHEETS ROUTES
// ===============================
router.get("/", forexController.getAllSheets);
router.post("/", validateRequest(createSheetSchema), forexController.createSheet);
router.get("/:sheetId", forexController.getSheetById);
router.put("/:sheetId", validateRequest(updateSheetSchema), forexController.updateSheet);
router.delete("/:sheetId", forexController.deleteSheet);

// ===============================
// ENTRIES ROUTES
// ===============================
router.get("/:sheetId/entries", forexController.getSheetEntries);
router.post("/:sheetId/entries", validateRequest(entrySchema), forexController.addEntry);
router.put("/entries/:entryId", validateRequest(entrySchema), forexController.updateEntry);
router.delete("/entries/:entryId", forexController.deleteEntry);

// ===============================
// STATISTICS & EXPORT ROUTES
// ===============================
router.get("/:sheetId/stats", forexController.getSheetStats);
router.get("/:sheetId/export", forexController.exportSheet);

module.exports = router;