const Joi = require('joi');

const userValidation = {
  createUser: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    username: Joi.string().min(3).max(50).required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('ADMIN', 'EMPLOYEE', 'NEW_JOINNER').required(),
    isActive: Joi.boolean().default(true),
    permissions: Joi.array().items(Joi.string()).optional()
  }),

  updateUser: Joi.object({
    name: Joi.string().min(2).max(100),
    role: Joi.string().valid('ADMIN', 'EMPLOYEE', 'NEW_JOINNER'),
    isActive: Joi.boolean(),
    permissions: Joi.array().items(Joi.string())
  }).min(1)
};

module.exports = userValidation;