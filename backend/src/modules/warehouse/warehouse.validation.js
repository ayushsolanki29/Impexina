const Joi = require('joi');

const validateStockUpdate = (data) => {
  const schema = Joi.object({
    itemId: Joi.string().required(),
    quantity: Joi.number().integer().min(1).required(),
    movementType: Joi.string().valid('INWARD', 'OUTWARD').required(),
    notes: Joi.string().max(500).optional()
  });
  return schema.validate(data);
};

const validateArrivalConfirmation = (data) => {
  const schema = Joi.object({
    loadingSheetId: Joi.string().required()
  });
  return schema.validate(data);
};

const validateStockQuery = (data) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    search: Joi.string().max(100).optional()
  });
  return schema.validate(data);
};

module.exports = {
  validateStockUpdate,
  validateArrivalConfirmation,
  validateStockQuery
};