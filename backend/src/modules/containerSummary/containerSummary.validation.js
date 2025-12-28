const Joi = require("joi");

const containerSummaryValidation = {
  // Create summary validation
  createSummary: Joi.object({
    month: Joi.string().min(3).max(50).required().messages({
      "string.empty": "Month name is required",
      "string.min": "Month name must be at least 3 characters",
      "string.max": "Month name must be at most 50 characters",
    }),
    status: Joi.string()
      .valid("DRAFT", "ACTIVE", "ARCHIVED")
      .default("DRAFT"),
    containers: Joi.array()
      .items(
        Joi.object({
          containerCode: Joi.string().max(50).allow("").optional(),
          ctn: Joi.number().min(0).default(0),
          loadingDate: Joi.date().allow("", null).optional(),
          eta: Joi.string().max(50).allow("").optional(),
          status: Joi.string()
            .valid("Loaded", "Insea", "Delivered", "Pending")
            .default("Loaded"),
          dollar: Joi.number().min(0).default(0),
          dollarRate: Joi.number().min(1).default(89.7),
          doCharge: Joi.number().min(0).default(58000),
          cfs: Joi.number().min(0).default(21830),
          shippingLine: Joi.string().max(100).allow("").optional(),
          bl: Joi.string().max(100).allow("").optional(),
          containerNo: Joi.string().max(50).allow("").optional(),
          sims: Joi.string().max(100).allow("").optional(),
        })
      )
      .min(1)
      .required()
      .messages({
        "array.min": "At least one container is required",
      }),
  }),

  // Update summary validation
  updateSummary: Joi.object({
    month: Joi.string().min(3).max(50).optional(),
    status: Joi.string().valid("DRAFT", "ACTIVE", "ARCHIVED").optional(),
    containers: Joi.array()
      .items(
        Joi.object({
          containerCode: Joi.string().max(50).allow("").optional(),
          ctn: Joi.number().min(0).default(0),
          loadingDate: Joi.date().allow("", null).optional(),
          eta: Joi.string().max(50).allow("").optional(),
          status: Joi.string()
            .valid("Loaded", "Insea", "Delivered", "Pending")
            .default("Loaded"),
          dollar: Joi.number().min(0).default(0),
          dollarRate: Joi.number().min(1).default(89.7),
          doCharge: Joi.number().min(0).default(58000),
          cfs: Joi.number().min(0).default(21830),
          shippingLine: Joi.string().max(100).allow("").optional(),
          bl: Joi.string().max(100).allow("").optional(),
          containerNo: Joi.string().max(50).allow("").optional(),
          sims: Joi.string().max(100).allow("").optional(),
        })
      )
      .min(1)
      .optional(),
  }),

  // Pagination query validation
  paginationQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow("").default(""),
    status: Joi.string()
      .valid("DRAFT", "ACTIVE", "ARCHIVED")
      .optional(),
  }),

  // Search query validation
  searchQuery: Joi.object({
    q: Joi.string().allow("").default(""),
  }),
};

module.exports = containerSummaryValidation;