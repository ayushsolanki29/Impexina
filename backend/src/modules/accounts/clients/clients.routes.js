const express = require("express");
const accountsController = require("./clients.controller");
const { authenticate } = require("../../../middleware/auth");
const Joi = require("joi");
const { validateRequest } = require("../../../middleware/validateRequest");

const router = express.Router();

// Validation schemas
const createClientSchema = Joi.object({
  name: Joi.string().required().max(200),
  location: Joi.string().max(100).optional().allow("", null),
  phone: Joi.string().max(20).optional().allow("", null),
  email: Joi.string().email().max(100).optional().allow("", null),
  gst: Joi.string().max(50).optional().allow("", null),
  pan: Joi.string().max(20).optional().allow("", null),
});

const updateClientSchema = Joi.object({
  name: Joi.string().max(200).optional(),
  location: Joi.string().max(100).optional().allow("", null),
  phone: Joi.string().max(20).optional().allow("", null),
  email: Joi.string().email().max(100).optional().allow("", null),
  gst: Joi.string().max(50).optional().allow("", null),
  pan: Joi.string().max(20).optional().allow("", null),
  isActive: Joi.boolean().optional(),
});

const transactionSchema = Joi.object({
  transactionDate: Joi.date().required(),
  containerCode: Joi.string().max(50).optional().allow("", null),
  containerMark: Joi.string().max(100).optional().allow("", null),
  particulars: Joi.string().required().max(500),
  billingType: Joi.string().valid("cbm", "weight", "flat").default("flat"),
  quantity: Joi.number().positive().optional().allow(null),
  rate: Joi.number().positive().optional().allow(null),
  amount: Joi.number().required().positive(),
  paid: Joi.number().default(0).min(0),
  paymentMode: Joi.string().valid("CASH", "CHEQUE", "BANK_TRANSFER", "UPI", "CARD").optional(),
  paymentDate: Joi.date().optional().allow(null),
  paymentRef: Joi.string().max(100).optional().allow("", null),
  fromAccount: Joi.string().default("Main"),
  toAccount: Joi.string().default("Client"),
  type: Joi.string().valid("EXPENSE", "PAYMENT", "ADJUSTMENT").default("EXPENSE"),
  notes: Joi.string().max(1000).optional().allow("", null),
});

const linkContainerSchema = Joi.object({
  containerCode: Joi.string().required().max(50),
  mark: Joi.string().required().max(100),
  totalCBM: Joi.number().default(0).min(0),
  totalWeight: Joi.number().default(0).min(0),
  ctn: Joi.number().default(0).min(0),
  product: Joi.string().max(200).optional().allow("", null),
  deliveryDate: Joi.date().optional().allow(null),
  invNo: Joi.string().max(50).optional().allow("", null),
  gstInv: Joi.string().max(50).optional().allow("", null),
});

// ===============================
// AUTHENTICATION MIDDLEWARE
// ===============================
router.use(authenticate);

// ===============================
// DASHBOARD & STATS ROUTES
// ===============================
router.get("/dashboard/stats", accountsController.getDashboardStats);
router.get("/search/suggestions", accountsController.searchSuggestions);

// ===============================
// CLIENTS ROUTES
// ===============================
router.get("/clients", accountsController.getAllClients);
router.post("/clients", validateRequest(createClientSchema), accountsController.createClient);
router.get("/clients/:clientId", accountsController.getClientById);
router.put("/clients/:clientId", validateRequest(updateClientSchema), accountsController.updateClient);
router.delete("/clients/:clientId", accountsController.deleteClient);

// ===============================
// LEDGER ROUTES
// ===============================
router.get("/clients/:clientId/ledger", accountsController.getClientLedger);
router.post("/clients/:clientId/transactions", validateRequest(transactionSchema), accountsController.addTransaction);
router.put("/transactions/:transactionId", validateRequest(transactionSchema), accountsController.updateTransaction);
router.delete("/transactions/:transactionId", accountsController.deleteTransaction);
router.get("/clients/:clientId/ledger/export", accountsController.exportClientLedger);

// ===============================
// CONTAINER ROUTES
// ===============================
router.get("/containers/suggestions", accountsController.getContainerSuggestions);
router.get("/clients/:clientId/containers", accountsController.getClientContainers);
router.post("/clients/:clientId/containers", validateRequest(linkContainerSchema), accountsController.linkContainerToClient);
router.delete("/containers/links/:linkId", accountsController.unlinkContainerFromClient);

module.exports = router;