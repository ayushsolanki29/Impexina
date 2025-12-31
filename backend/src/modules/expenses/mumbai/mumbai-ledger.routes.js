const express = require("express");
const mumbaiLedgerController = require("./mumbai-ledger.controller");
const { authenticate } = require("../../../middleware/auth");
const Joi = require("joi");
const { validateRequest } = require("../../../middleware/validateRequest");

const router = express.Router();

// Validation schemas
const createLedgerSchema = Joi.object({
  name: Joi.string().required().max(200),
  description: Joi.string().max(500).optional().allow("", null),
  month: Joi.number().min(1).max(12).optional().allow(null),
  year: Joi.number().min(2000).max(2100).optional().allow(null),
});

const updateLedgerSchema = Joi.object({
  name: Joi.string().max(200).optional(),
  description: Joi.string().max(500).optional().allow("", null),
  status: Joi.string().valid("ACTIVE", "ARCHIVED").optional(),
  isLocked: Joi.boolean().optional(),
});

const entrySchema = Joi.object({
  type: Joi.string().valid("EXPENSE", "ADVANCE").required(),
  entryDate: Joi.date().optional(),
  containerCode: Joi.string().max(50).when('type', {
    is: 'EXPENSE',
    then: Joi.required(),
    otherwise: Joi.optional().allow("", null),
  }),
  expenseNote: Joi.string().max(200).optional().allow("", null),
  advanceNote: Joi.string().max(200).when('type', {
    is: 'ADVANCE',
    then: Joi.required(),
    otherwise: Joi.optional().allow("", null),
  }),
  items: Joi.array().items(
    Joi.object({
      label: Joi.string().required(),
      amount: Joi.number().required(),
    })
  ).optional(),
  amount: Joi.number().required().positive(),
});

const bulkEntriesSchema = Joi.object({
  entries: Joi.array().items(entrySchema).required().min(1),
});

// ===============================
// AUTHENTICATION MIDDLEWARE
// ===============================
router.use(authenticate);

// ===============================
// LEDGERS ROUTES
// ===============================
router.get("/", mumbaiLedgerController.getAllLedgers);
router.post("/", validateRequest(createLedgerSchema), mumbaiLedgerController.createLedger);
router.get("/:ledgerId", mumbaiLedgerController.getLedgerById);
router.put("/:ledgerId", validateRequest(updateLedgerSchema), mumbaiLedgerController.updateLedger);
router.delete("/:ledgerId", mumbaiLedgerController.deleteLedger);

// ===============================
// ENTRIES ROUTES
// ===============================
router.get("/:ledgerId/entries", mumbaiLedgerController.getLedgerEntries);
router.post("/:ledgerId/entries", validateRequest(entrySchema), mumbaiLedgerController.addEntry);
router.post("/:ledgerId/entries/bulk", validateRequest(bulkEntriesSchema), mumbaiLedgerController.bulkAddEntries);
router.put("/entries/:entryId", validateRequest(entrySchema), mumbaiLedgerController.updateEntry);
router.delete("/entries/:entryId", mumbaiLedgerController.deleteEntry);

// ===============================
// SPECIAL OPERATIONS
// ===============================
router.get("/dashboard/stats", mumbaiLedgerController.getDashboardStats);
router.get("/:ledgerId/export", mumbaiLedgerController.exportLedger);
router.post("/:ledgerId/duplicate", mumbaiLedgerController.duplicateLedger);
router.get("/containers/suggestions", mumbaiLedgerController.getContainerSuggestions);

module.exports = router;