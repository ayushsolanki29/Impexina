const Joi = require("joi");

const loadingValidation = {
  // Create/Update loading sheet validation
  createOrUpdate: Joi.object({
    containerCode: Joi.string().min(3).max(50).required().messages({
      "string.empty": "Container code is required",
      "any.required": "Container code is required",
    }),

    origin: Joi.string().min(2).max(100).required().messages({
      "string.empty": "Origin is required",
      "any.required": "Origin is required",
    }),

    loadingDate: Joi.date().required().messages({
      "date.base": "Valid loading date is required",
      "any.required": "Loading date is required",
    }),

    shippingMark: Joi.string().min(2).max(100).required().messages({
      "string.empty": "Shipping mark is required",
      "any.required": "Shipping mark is required",
    }),

    rows: Joi.array()
      .min(1)
      .required()
      .items(
        Joi.object({
          particular: Joi.string().min(1).max(500).required().messages({
            "string.empty": "Particular is required",
            "any.required": "Particular is required",
          }),

          shippingMark: Joi.string().min(1).max(100).optional(),

          ctnMark: Joi.string().min(1).max(100).required().messages({
            "string.empty": "CTN mark is required",
            "any.required": "CTN mark is required",
          }),

          itemNo: Joi.string().min(1).max(100).optional(),

          ctn: Joi.number().min(0).required().messages({
            "number.base": "CTN must be a number",
            "number.min": "CTN must be at least 0",
            "any.required": "CTN is required",
          }),

          pcs: Joi.number().min(0).required().messages({
            "number.base": "PCS must be a number",
            "number.min": "PCS must be at least 0",
            "any.required": "PCS is required",
          }),

          unit: Joi.string()
            .valid("PCS", "SET", "BOX", "PAIR", "ROLL", "METER")
            .default("PCS"),

          cbm: Joi.number().min(0).required().messages({
            "number.base": "CBM must be a number",
            "number.min": "CBM must be at least 0",
            "any.required": "CBM is required",
          }),

          wt: Joi.number().min(0).required().messages({
            "number.base": "Weight must be a number",
            "number.min": "Weight must be at least 0",
            "any.required": "Weight is required",
          }),

          photo: Joi.string().allow("", null).optional(),
        })
      )
      .messages({
        "array.min": "At least one item is required",
        "any.required": "Items are required",
      }),
  }),
  // Update status validation
  updateStatus: Joi.object({
    status: Joi.string()
      .valid(
        "DRAFT",
        "CONFIRMED",
        "IN_TRANSIT",
        "IN_PORT",
        "IN_SEA",
        "ARRIVED",
        "DELIVERED",
        "CANCELLED"
      )
      .required()
      .messages({
        "any.only": "Invalid status value",
        "any.required": "Status is required",
      }),
  }),

  // Pagination query validation
  paginationQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),

    limit: Joi.number().integer().min(1).max(100).default(10),

    search: Joi.string().allow("").default(""),

    status: Joi.string()
      .valid(
        "DRAFT",
        "CONFIRMED",
        "IN_TRANSIT",
        "IN_PORT",
        "IN_SEA",
        "ARRIVED",
        "DELIVERED",
        "CANCELLED"
      )
      .optional(),
  }),

  // Search query validation
  searchQuery: Joi.object({
    search: Joi.string().allow("").default(""),
  }),
  // Containers query validation
  containersQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),

    limit: Joi.number().integer().min(1).max(100).default(12),

    search: Joi.string().allow("").default(""),

    origin: Joi.string().allow("").default(""),

    status: Joi.string()
      .valid(
        "DRAFT",
        "CONFIRMED",
        "IN_TRANSIT",
        "IN_PORT",
        "IN_SEA",
        "ARRIVED",
        "DELIVERED",
        "CANCELLED"
      )
      .optional(),

    dateFrom: Joi.date().optional(),

    dateTo: Joi.date()
      .optional()
      .when("dateFrom", {
        is: Joi.exist(),
        then: Joi.date().min(Joi.ref("dateFrom")).optional(),
      }),
  }),

  // Update container status validation
  updateContainerStatus: Joi.object({
    status: Joi.string().valid("DRAFT", "CONFIRMED").required().messages({
      "any.only": "Status must be either DRAFT or CONFIRMED",
      "any.required": "Status is required",
    }),
  }),
};

module.exports = loadingValidation;
