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
    name: Joi.string().min(2).max(100).optional(),
    username: Joi.string().min(3).max(50).optional(),
    role: Joi.string().valid('ADMIN', 'EMPLOYEE', 'NEW_JOINNER').optional(),
    isActive: Joi.boolean().optional(),
    permissions: Joi.array().items(Joi.string()).optional()
  })
};

module.exports = userValidation;
