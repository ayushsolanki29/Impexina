const express = require("express");
const ahmedabadPettyCashController = require("./ahmedabad-petty-cash.controller");
const { authenticate } = require("../../../middleware/auth");
const Joi = require("joi");
const { validateRequest } = require("../../../middleware/validateRequest");

const router = express.Router();

// Validation schemas
const createSheetSchema = Joi.object({
  name: Joi.string().required().max(200),
  description: Joi.string().max(500).optional().allow("", null),
  openingBalance: Joi.number().default(0),
  month: Joi.number().min(1).max(12).optional().allow(null),
  year: Joi.number().min(2000).max(2100).optional().allow(null),
});

const updateSheetSchema = Joi.object({
  name: Joi.string().max(200).optional(),
  description: Joi.string().max(500).optional().allow("", null),
  openingBalance: Joi.number().optional(),
  status: Joi.string().valid("ACTIVE", "ARCHIVED").optional(),
  isLocked: Joi.boolean().optional(),
});

const entrySchema = Joi.object({
  type: Joi.string().valid("CREDIT", "DEBIT").required(),
  entryDate: Joi.date().optional(),
  particular: Joi.string().required().max(200),
  contCode: Joi.string().max(50).optional().allow("", null),
  mode: Joi.string().max(20).default("Cash"),
  credit: Joi.number().when('type', {
    is: 'CREDIT',
    then: Joi.number().required().positive(),
    otherwise: Joi.number().default(0).allow(0),
  }),
  debit: Joi.number().when('type', {
    is: 'DEBIT',
    then: Joi.number().required().positive(),
    otherwise: Joi.number().default(0).allow(0),
  }),
  notes: Joi.string().max(500).optional().allow("", null),
});

// ===============================
// AUTHENTICATION MIDDLEWARE
// ===============================
router.use(authenticate);

// ===============================
// SHEETS ROUTES
// ===============================
router.get("/", ahmedabadPettyCashController.getAllSheets);
router.post("/", validateRequest(createSheetSchema), ahmedabadPettyCashController.createSheet);
router.get("/:sheetId", ahmedabadPettyCashController.getSheetById);
router.put("/:sheetId", validateRequest(updateSheetSchema), ahmedabadPettyCashController.updateSheet);
router.delete("/:sheetId", ahmedabadPettyCashController.deleteSheet);

// ===============================
// ENTRIES ROUTES
// ===============================
router.get("/:sheetId/entries", ahmedabadPettyCashController.getSheetEntries);
router.post("/:sheetId/entries", validateRequest(entrySchema), ahmedabadPettyCashController.addEntry);
router.put("/entries/:entryId", validateRequest(entrySchema), ahmedabadPettyCashController.updateEntry);
router.delete("/entries/:entryId", ahmedabadPettyCashController.deleteEntry);

// ===============================
// SPECIAL OPERATIONS
// ===============================
router.get("/dashboard/stats", ahmedabadPettyCashController.getDashboardStats);
router.get("/:sheetId/export", ahmedabadPettyCashController.exportSheet);
router.post("/:sheetId/duplicate", ahmedabadPettyCashController.duplicateSheet);
router.get("/containers/suggestions", ahmedabadPettyCashController.getContainerCodeSuggestions);

module.exports = router;