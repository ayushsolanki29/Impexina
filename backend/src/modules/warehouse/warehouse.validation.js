const Joi = require("joi");

const warehouseValidation = {
  // Add/update mark validation
  markSchema: Joi.object({
    mark: Joi.string().max(100).required(),
    ctn: Joi.number().integer().min(0).required(),
    product: Joi.string().max(200).optional(),
    totalCBM: Joi.number().min(0).required(),
    totalWeight: Joi.number().min(0).required(),
    loadingDate: Joi.date().optional(),
    deliveryDate: Joi.date().allow(null, "").optional(),
    invNo: Joi.string().max(50).allow(null, "").optional(),
    gst: Joi.string().max(50).allow(null, "").optional(),
    transporter: Joi.string().max(100).allow(null, "").optional(),
    status: Joi.string()
      .valid("PENDING", "DISPATCHED", "HOLD", "DRAFT", "COMPLETED", "CANCELLED")
      .default("PENDING"),
  }),

  // Update mark validation
  updateMarkSchema: Joi.object({
    ctn: Joi.number().integer().min(0).optional(),
    product: Joi.string().max(200).optional(),
    totalCBM: Joi.number().min(0).optional(),
    totalWeight: Joi.number().min(0).optional(),
    loadingDate: Joi.date().optional(),
    deliveryDate: Joi.date().allow(null, "").optional(),
    invNo: Joi.string().max(50).allow(null, "").optional(),
    gst: Joi.string().max(50).allow(null, "").optional(),
    transporter: Joi.string().max(100).allow(null, "").optional(),
    status: Joi.string()
      .valid("PENDING", "DISPATCHED", "HOLD", "DRAFT", "COMPLETED", "CANCELLED")
      .optional(),
  }),

  // Search validation
  searchSchema: Joi.object({
    q: Joi.string().allow("").default(""),
    status: Joi.string()
      .valid("all", "PENDING", "DISPATCHED", "HOLD", "DRAFT", "COMPLETED", "CANCELLED")
      .default("all"),
    transporter: Joi.string().allow("").default("all"),
  }),

  // Pagination validation
  paginationSchema: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow("").default(""),
    status: Joi.string()
      .valid("PENDING", "DISPATCHED", "HOLD", "DRAFT", "COMPLETED", "CANCELLED")
      .optional(),
  }),

  // Status update validation
  statusSchema: Joi.object({
    status: Joi.string()
      .valid("PENDING", "DISPATCHED", "HOLD", "DRAFT", "COMPLETED", "CANCELLED")
      .required(),
  }),

  // Import validation
  importSchema: Joi.array().items(
    Joi.object({
      "CONTAINER CODE": Joi.string().optional(),
      MARK: Joi.string().required(),
      CTN: Joi.number().integer().min(0).default(0),
      PRODUCT: Joi.string().default("MIX ITEM"),
      "TOTAL CBM": Joi.number().min(0).default(0),
      "TOTAL WEIGHT": Joi.number().min(0).default(0),
      "LOADING DATE": Joi.date().optional(),
      "DELIVERY DATE": Joi.date().optional(),
      "INV NO.": Joi.string().allow("").optional(),
      GST: Joi.string().allow("").optional(),
      TRANSPORTER: Joi.string().allow("").optional(),
      STATUS: Joi.string()
        .valid("PENDING", "DISPATCHED", "HOLD", "DRAFT", "COMPLETED", "CANCELLED")
        .default("PENDING"),
    })
  ),
};

module.exports = warehouseValidation;