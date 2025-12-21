const Joi = require("joi");

const authValidation = {
  // Login validation (Username + Password)
  login: Joi.object({
    username: Joi.string()
      .min(3)
      .max(50)
      .required()
      .messages({
        "string.empty": "Username is required",
        "string.min": "Username must be at least 3 characters",
        "any.required": "Username is required",
      }),

    password: Joi.string()
      .min(4)
      .max(100)
      .required()
      .messages({
        "string.empty": "Password is required",
        "string.min": "Password must be at least 4 characters",
        "any.required": "Password is required",
      }),
  }),
};

module.exports = authValidation;
