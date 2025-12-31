const express = require("express");
const shippingController = require("./shipping.controller");
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
});

const updateSheetSchema = Joi.object({
  name: Joi.string().max(200).optional(),
  description: Joi.string().max(500).optional().allow("", null),
  status: Joi.string().valid("PLANNED", "LOADING", "IN_TRANSIT", "ARRIVED", "DELIVERED", "CANCELLED").optional(),
  isLocked: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string().max(50)).optional(),
  fiscalYear: Joi.string().pattern(/^\d{4}-\d{4}$/).optional(),
});

const entrySchema = Joi.object({
  containerCode: Joi.string().required().max(50),
  loadingFrom: Joi.string().max(100).optional(),
  ctn: Joi.number().integer().min(0).optional(),
  loadingDate: Joi.date().required(),
  deliveryDate: Joi.date().optional(),
  freightUSD: Joi.number().min(0).optional(),
  freightINR: Joi.number().min(0).optional(),
  cha: Joi.number().min(0).optional(),
  fobTerms: Joi.number().min(0).optional(),
  cfsDoYard: Joi.number().min(0).optional(),
  scanning: Joi.number().min(0).optional(),
  simsPims: Joi.number().min(0).optional(),
  duty: Joi.number().min(0).optional(),
  penalty: Joi.number().min(0).optional(),
  trucking: Joi.number().min(0).optional(),
  loadingUnloading: Joi.number().min(0).optional(),
  notes: Joi.string().max(1000).optional().allow("", null),
  shippingLine: Joi.string().max(100).optional().allow("", null),
  blNumber: Joi.string().max(100).optional().allow("", null),
  deliveryStatus: Joi.string().valid("PENDING", "IN_TRANSIT", "ARRIVED", "DELIVERED").optional(),
});

const importEntriesSchema = Joi.array().items(entrySchema).min(1).max(1000);

// ===============================
// AUTHENTICATION MIDDLEWARE
// ===============================
router.use(authenticate);

// ===============================
// DASHBOARD & OVERVIEW ROUTES
// ===============================
router.get("/dashboard/overview", shippingController.getDashboardOverview);
router.get("/generate-name", shippingController.generateDefaultName);

// ===============================
// SHEETS ROUTES
// ===============================
router.get("/", shippingController.getAllSheets);
router.post(
  "/",
  validateRequest(createSheetSchema),
  shippingController.createSheet
);
router.get("/:sheetId", shippingController.getSheetById);
router.put(
  "/:sheetId",
  validateRequest(updateSheetSchema),
  shippingController.updateSheet
);
router.delete("/:sheetId", shippingController.deleteSheet);

// ===============================
// ENTRIES ROUTES
// ===============================
router.get("/:sheetId/entries", shippingController.getSheetEntries);
router.post(
  "/:sheetId/entries",
  validateRequest(entrySchema),
  shippingController.addEntry
);
router.put(
  "/entries/:entryId",
  validateRequest(entrySchema),
  shippingController.updateEntry
);
router.delete("/entries/:entryId", shippingController.deleteEntry);
router.put(
  "/:sheetId/bulk-entries",
  shippingController.bulkUpdateEntries
);

// ===============================
// STATISTICS & EXPORT ROUTES
// ===============================
router.get("/:sheetId/stats", shippingController.getSheetStats);
router.get("/:sheetId/export", shippingController.exportSheet);

module.exports = router;