const express = require("express");
const clientsController = require("./clients.controller");
const { authenticate } = require("../../middleware/auth");
const Joi = require("joi");
const { validateRequest } = require("../../middleware/validateRequest");

const router = express.Router();

// Validation schemas
const createClientSchema = Joi.object({
  name: Joi.string().required().max(200),
  contactPerson: Joi.string().max(100).optional().allow("", null),
  email: Joi.string().email().max(100).optional().allow("", null),
  phone: Joi.string().max(20).optional().allow("", null),
  mobile: Joi.string().max(20).optional().allow("", null),
  address: Joi.string().max(500).optional().allow("", null),
  city: Joi.string().max(100).optional().allow("", null),
  state: Joi.string().max(100).optional().allow("", null),
  country: Joi.string().max(100).optional().allow("", null).default("India"),
  
  // Type and status
  type: Joi.string().valid("LEAD", "CLIENT").default("LEAD"),
  status: Joi.string().valid(
    "NEW",
    "CONTACTED",
    "QUALIFIED",
    "PROPOSAL",
    "NEGOTIATION",
    "ACTIVE",
    "INACTIVE",
    "LOST"
  ).default("NEW"),
  
  // Business details
  companyName: Joi.string().max(200).optional().allow("", null),
  gstNumber: Joi.string().max(50).optional().allow("", null),
  industry: Joi.string().max(100).optional().allow("", null),
  
  // Financial
  creditLimit: Joi.number().min(0).optional().allow(null),
  paymentTerms: Joi.string().max(50).optional().allow("", null).default("NET30"),
  currency: Joi.string().max(10).optional().allow("", null).default("INR"),
  
  // Metadata
  notes: Joi.string().max(2000).optional().allow("", null),
  tags: Joi.array().items(Joi.string()).optional().default([]),
  source: Joi.string().max(100).optional().allow("", null),
  rating: Joi.number().min(0).max(5).optional().allow(null),
  
  // Timestamps
  lastContactedAt: Joi.date().optional().allow(null),
  nextFollowUpAt: Joi.date().optional().allow(null),
});

const updateClientSchema = Joi.object({
  name: Joi.string().max(200).optional(),
  contactPerson: Joi.string().max(100).optional().allow("", null),
  email: Joi.string().email().max(100).optional().allow("", null),
  phone: Joi.string().max(20).optional().allow("", null),
  mobile: Joi.string().max(20).optional().allow("", null),
  address: Joi.string().max(500).optional().allow("", null),
  city: Joi.string().max(100).optional().allow("", null),
  state: Joi.string().max(100).optional().allow("", null),
  country: Joi.string().max(100).optional().allow("", null),
  
  // Type and status
  type: Joi.string().valid("LEAD", "CLIENT").optional(),
  status: Joi.string().valid(
    "NEW",
    "CONTACTED",
    "QUALIFIED",
    "PROPOSAL",
    "NEGOTIATION",
    "ACTIVE",
    "INACTIVE",
    "LOST"
  ).optional(),
  
  // Business details
  companyName: Joi.string().max(200).optional().allow("", null),
  gstNumber: Joi.string().max(50).optional().allow("", null),
  industry: Joi.string().max(100).optional().allow("", null),
  
  // Financial
  creditLimit: Joi.number().min(0).optional().allow(null),
  paymentTerms: Joi.string().max(50).optional().allow("", null),
  currency: Joi.string().max(10).optional().allow("", null),
  
  // Metadata
  notes: Joi.string().max(2000).optional().allow("", null),
  tags: Joi.array().items(Joi.string()).optional(),
  source: Joi.string().max(100).optional().allow("", null),
  rating: Joi.number().min(0).max(5).optional().allow(null),
  
  // Timestamps
  lastContactedAt: Joi.date().optional().allow(null),
  nextFollowUpAt: Joi.date().optional().allow(null),
});

const activitySchema = Joi.object({
  type: Joi.string().valid(
    "CREATE",
    "UPDATE",
    "STATUS_CHANGE",
    "CALL",
    "EMAIL",
    "MEETING",
    "FILE_UPLOAD"
  ).required(),
  description: Joi.string().required().max(1000),
  metadata: Joi.object().optional(),
});

const bulkUpdateSchema = Joi.object({
  ids: Joi.array().items(Joi.string()).required().min(1),
  updates: Joi.object({
    status: Joi.string().valid(
      "NEW",
      "CONTACTED",
      "QUALIFIED",
      "PROPOSAL",
      "NEGOTIATION",
      "ACTIVE",
      "INACTIVE",
      "LOST"
    ).optional(),
    type: Joi.string().valid("LEAD", "CLIENT").optional(),
    city: Joi.string().max(100).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
  }).required(),
});

// ===============================
// AUTHENTICATION MIDDLEWARE
// ===============================
router.use(authenticate);

// ===============================
// DASHBOARD & STATS ROUTES
// ===============================
router.get("/dashboard/stats", clientsController.getDashboardStats);
router.get("/search/suggestions", clientsController.searchSuggestions);
router.get("/cities", clientsController.getCities);

// ===============================
// CLIENTS/LEADS ROUTES
// ===============================
router.get("/", clientsController.getAllClients);
router.post("/", validateRequest(createClientSchema), clientsController.createClient);
router.get("/:id", clientsController.getClientById);
router.put("/:id", validateRequest(updateClientSchema), clientsController.updateClient);
router.delete("/:id", clientsController.deleteClient);

// ===============================
// SPECIAL OPERATIONS
// ===============================
router.post("/:id/convert", clientsController.convertLeadToClient);
router.patch("/:id/status", clientsController.updateClientStatus);
router.post("/bulk-update", validateRequest(bulkUpdateSchema), clientsController.bulkUpdateClients);

// ===============================
// ACTIVITIES ROUTES
// ===============================
router.get("/:id/activities", clientsController.getClientActivities);
router.post("/:id/activities", validateRequest(activitySchema), clientsController.addClientActivity);

// ===============================
// EXPORT ROUTES
// ===============================
router.get("/export/excel", clientsController.exportClients);

module.exports = router;