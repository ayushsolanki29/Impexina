const Joi = require('joi');

const orderTrackerValidation = {
  createOrder: Joi.object({
    shippingMark: Joi.string().required(),
    supplier: Joi.string().optional().allow(''),
    product: Joi.string().required(),
    quantity: Joi.number().integer().min(1).required(),
    ctn: Joi.number().integer().min(1).required(),
    deposit: Joi.number().min(0).optional().allow(null),
    balanceAmount: Joi.number().min(0).optional().allow(null),
    totalAmount: Joi.number().min(0).optional().allow(null),
    shippingMode: Joi.string().optional().allow(''),
    shippingCode: Joi.string().optional().allow(''),
    status: Joi.string().valid('PENDING', 'LOADED', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'CANCELLED').default('PENDING'),
    lrNo: Joi.string().optional().allow(''),
    orderDate: Joi.date().optional().allow(null),
    paymentDate: Joi.string().optional().allow(''),
    deliveryDate: Joi.string().optional().allow(''),
    loadingDate: Joi.string().optional().allow(''),
    arrivalDate: Joi.string().optional().allow(''),
    notes: Joi.string().optional().allow('')
  }),

  updateOrder: Joi.object({
    shippingMark: Joi.string(),
    supplier: Joi.string().allow(''),
    product: Joi.string(),
    quantity: Joi.number().integer().min(1),
    ctn: Joi.number().integer().min(1),
    deposit: Joi.number().min(0).allow(null),
    balanceAmount: Joi.number().min(0).allow(null),
    totalAmount: Joi.number().min(0).allow(null),
    shippingMode: Joi.string().allow(''),
    shippingCode: Joi.string().allow(''),
    status: Joi.string().valid('PENDING', 'LOADED', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'CANCELLED'),
    lrNo: Joi.string().allow(''),
    orderDate: Joi.date().allow(null),
    paymentDate: Joi.string().allow(''),
    deliveryDate: Joi.string().allow(''),
    loadingDate: Joi.string().allow(''),
    arrivalDate: Joi.string().allow(''),
    notes: Joi.string().allow('')
  }).min(1),

  getOrders: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(50),
    search: Joi.string().optional().allow(''),
    status: Joi.string().valid('PENDING', 'LOADED', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'CANCELLED', '').optional(),
    shippingCode: Joi.string().optional().allow(''),
    supplier: Joi.string().optional().allow('')
  })
};

module.exports = orderTrackerValidation;