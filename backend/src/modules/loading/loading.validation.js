const Joi = require('joi');

const validateLoadingSheet = (data) => {
  const schema = Joi.object({
    shippingCode: Joi.string().required().messages({
      'string.empty': 'Shipping code is required'
    }),
    shippingMark: Joi.string().optional().allow(''),
    supplier: Joi.string().optional().allow(''),
    shippingMode: Joi.string().optional().allow(''),
    deposit: Joi.number().precision(2).optional(),
    balanceAmount: Joi.number().precision(2).optional(),
    totalAmount: Joi.number().precision(2).optional(),
    paymentDate: Joi.date().optional(),
    deliveryDate: Joi.date().optional(),
    loadingDate: Joi.date().required(),
    arrivalDate: Joi.date().optional(),
    lrNo: Joi.string().optional().allow(''),
    transporter: Joi.string().optional().allow(''),
    totalCBM: Joi.number().precision(3).optional(),
    totalWeight: Joi.number().precision(2).optional(),
    items: Joi.array().items(
      Joi.object({
        itemName: Joi.string().required(),
        itemNo: Joi.string().optional().allow(''),
        mark: Joi.string().optional().allow(''),
        ctn: Joi.number().integer().min(1).required(),
        pcs: Joi.number().integer().min(1).required(),
        cbm: Joi.number().precision(3).optional(),
        weight: Joi.number().precision(2).optional(),
        unitPrice: Joi.number().precision(2).optional(),
        totalPrice: Joi.number().precision(2).optional(),
        hsnCode: Joi.string().optional().allow('')
      })
    ).min(1).required()
  });

  return schema.validate(data);
};

const validateLoadingSheetUpdate = (data) => {
  const schema = Joi.object({
    shippingMark: Joi.string().optional().allow(''),
    supplier: Joi.string().optional().allow(''),
    shippingMode: Joi.string().optional().allow(''),
    deposit: Joi.number().precision(2).optional(),
    balanceAmount: Joi.number().precision(2).optional(),
    totalAmount: Joi.number().precision(2).optional(),
    paymentDate: Joi.date().optional(),
    deliveryDate: Joi.date().optional(),
    loadingDate: Joi.date().optional(),
    arrivalDate: Joi.date().optional(),
    lrNo: Joi.string().optional().allow(''),
    transporter: Joi.string().optional().allow(''),
    totalCBM: Joi.number().precision(3).optional(),
    totalWeight: Joi.number().precision(2).optional()
  }).min(1);

  return schema.validate(data);
};

const validateItems = (data) => {
  const schema = Joi.array().items(
    Joi.object({
      itemName: Joi.string().required(),
      itemNo: Joi.string().optional().allow(''),
      mark: Joi.string().optional().allow(''),
      ctn: Joi.number().integer().min(1).required(),
      pcs: Joi.number().integer().min(1).required(),
      cbm: Joi.number().precision(3).optional(),
      weight: Joi.number().precision(2).optional(),
      unitPrice: Joi.number().precision(2).optional(),
      totalPrice: Joi.number().precision(2).optional(),
      hsnCode: Joi.string().optional().allow('')
    })
  ).min(1).required();

  return schema.validate(data);
};

const validateStatusUpdate = (data) => {
  const schema = Joi.object({
    status: Joi.string().valid('IN_TRANSIT', 'ARRIVED', 'WAREHOUSE', 'AVAILABLE', 'COMPLETED').required()
  });

  return schema.validate(data);
};

const validateQuery = (data) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid('IN_TRANSIT', 'ARRIVED', 'WAREHOUSE', 'AVAILABLE', 'COMPLETED').optional(),
    search: Joi.string().max(100).optional().allow(''),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional()
  });

  return schema.validate(data);
};

module.exports = {
  validateLoadingSheet,
  validateLoadingSheetUpdate,
  validateItems,
  validateStatusUpdate,
  validateQuery
};