const Joi = require('joi');

const validateUserCreate = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 100 characters'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.empty': 'Password is required'
    }),
    role: Joi.string().valid('ADMIN', 'MANAGER', 'WAREHOUSE', 'ACCOUNTS', 'SALES', 'MANAGEMENT').required().messages({
      'any.only': 'Role must be one of: ADMIN, MANAGER, WAREHOUSE, ACCOUNTS, SALES, MANAGEMENT'
    }),
    isActive: Joi.boolean().default(true),
    createdBy: Joi.string().optional() // For audit
  });

  return schema.validate(data);
};

const validateUserUpdate = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    email: Joi.string().email().optional(),
    password: Joi.string().min(6).optional(),
    role: Joi.string().valid('ADMIN', 'MANAGER', 'WAREHOUSE', 'ACCOUNTS', 'SALES', 'MANAGEMENT').optional(),
    isActive: Joi.boolean().optional(),
    updatedBy: Joi.string().optional() // For audit
  }).min(1); // At least one field to update

  return schema.validate(data);
};

const validateUserQuery = (data) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().max(100).optional().allow(''),
    role: Joi.string().valid('ADMIN', 'MANAGER', 'WAREHOUSE', 'ACCOUNTS', 'SALES', 'MANAGEMENT').optional()
  });

  return schema.validate(data);
};

module.exports = {
  validateUserCreate,
  validateUserUpdate,
  validateUserQuery
};