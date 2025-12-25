const Joi = require("joi");

const bifurcationValidation = {
  // Update client details validation
  updateClientDetails: Joi.object({
    deliveryDate: Joi.date().allow("", null).optional(),
    invNo: Joi.string().allow("", null).max(50).optional(),
    gst: Joi.string().allow("", null).max(50).optional(),
    from: Joi.string().allow("", null).max(100).optional(),
    to: Joi.string().allow("", null).max(100).optional(),
    lr: Joi.string().allow("", null).max(50).optional(),
    status: Joi.string().valid("draft", "completed").optional(),
  }),

  // Update container details validation
  updateContainerDetails: Joi.object({
    deliveryDate: Joi.date().allow("", null).optional(),
    invNo: Joi.string().allow("", null).max(50).optional(),
    gst: Joi.string().allow("", null).max(50).optional(),
    from: Joi.string().allow("", null).max(100).optional(),
    to: Joi.string().allow("", null).max(100).optional(),
    lr: Joi.string().allow("", null).max(50).optional(),
    note: Joi.string().allow("", null).max(500).optional(),
    status: Joi.string().valid("DRAFT", "COMPLETED").optional(),
  }),

  // Add new client validation
  addNewClient: Joi.object({
    clientName: Joi.string().max(100).required(),
    mark: Joi.string().max(100).required(),
    ctn: Joi.number().min(0).required(),
    product: Joi.string().max(200).optional(),
    totalCBM: Joi.number().min(0).required(),
    totalWeight: Joi.number().min(0).required(),
    loadingDate: Joi.date().optional(),
    deliveryDate: Joi.date().allow("", null).optional(),
    invNo: Joi.string().allow("", null).max(50).optional(),
    gst: Joi.string().allow("", null).max(50).optional(),
    from: Joi.string().allow("", null).max(100).optional(),
    to: Joi.string().allow("", null).max(100).optional(),
    lr: Joi.string().allow("", null).max(50).optional(),
  }),

  // Pagination query validation
  paginationQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow("").default(""),
    status: Joi.string().valid("DRAFT", "COMPLETED", "CANCELLED").optional(),
  }),
};

module.exports = bifurcationValidation;