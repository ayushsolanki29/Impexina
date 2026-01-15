const express = require("express");
const tukaramController = require("./tukaram.controller");
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
  containerCode: Joi.string().required().max(50),
  totalCtn: Joi.number().integer().min(0).optional(),
  loadingDate: Joi.date().optional().allow(null),
  deliveryDate: Joi.date().optional().allow(null),
  particular: Joi.string().max(50).optional().allow("", null),
  charges: Joi.number().min(0).optional(),
  scanning: Joi.number().min(0).optional(),
  dc: Joi.number().min(0).optional(),
  total: Joi.number().min(0).optional(),
  paid: Joi.number().min(0).optional(),
  paymentDate: Joi.date().optional().allow(null),
  note: Joi.string().max(1000).optional().allow("", null),
});

const importEntriesSchema = Joi.array().items(entrySchema).min(1).max(1000);

// ===============================
// AUTHENTICATION MIDDLEWARE
// ===============================
router.use(authenticate);

// ===============================
// DASHBOARD & OVERVIEW ROUTES
// ===============================
router.get("/dashboard/overview", tukaramController.getDashboardOverview);
router.get("/generate-title", tukaramController.generateDefaultTitle);

// ===============================
// SHEETS ROUTES
// ===============================
router.get("/", tukaramController.getAllSheets);
router.post(
  "/",
  validateRequest(createSheetSchema),
  tukaramController.createSheet
);
router.get("/:sheetId", tukaramController.getSheetById);
router.put(
  "/:sheetId",
  validateRequest(updateSheetSchema),
  tukaramController.updateSheet
);
router.delete("/:sheetId", tukaramController.deleteSheet);

// ===============================
// ENTRIES ROUTES
// ===============================
router.get("/:sheetId/entries", tukaramController.getSheetEntries);
router.post(
  "/:sheetId/entries",
  validateRequest(entrySchema),
  tukaramController.addEntry
);
router.put(
  "/entries/:entryId",
  validateRequest(entrySchema),
  tukaramController.updateEntry
);
router.delete("/entries/:entryId", tukaramController.deleteEntry);

// ===============================
// BULK IMPORT
// ===============================
router.post(
  "/:sheetId/import",
  validateRequest(importEntriesSchema),
  tukaramController.importEntries
);

// ===============================
// STATS & EXPORT
// ===============================
router.get("/:sheetId/stats", tukaramController.getSheetStats);
router.get("/:sheetId/export", tukaramController.exportSheet);

module.exports = router;
