const express = require('express');
const router = express.Router();
const orderTrackerController = require('./order-tracker.controller');
const authMiddleware = require('../../middleware/auth');
const orderTrackerValidation = require('./order-tracker.validation');

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    
    next();
  };
};

// All routes require authentication
router.use(authMiddleware.authenticate);

// ========== ORDER TRACKER ROUTES ==========

// Get all orders
router.get('/',
  validateQuery(orderTrackerValidation.getOrders),
  orderTrackerController.getAllOrders
);

// Get stats
router.get('/stats', orderTrackerController.getStats);

// Search orders
router.get('/search', orderTrackerController.searchOrders);

// Export orders
router.get('/export', orderTrackerController.exportOrders);

// Create order
router.post('/',
  validate(orderTrackerValidation.createOrder),
  orderTrackerController.createOrder
);

// Create multiple orders
router.post('/bulk',
  orderTrackerController.createMultipleOrders
);

// Get orders by shipping code
router.get('/shipping-code/:shippingCode',
  orderTrackerController.getOrdersByShippingCode
);

// Bulk update by shipping code
router.put('/shipping-code/:shippingCode/bulk',
  orderTrackerController.bulkUpdateByShippingCode
);

// ========== SINGLE ORDER ROUTES ==========
router.get('/:id',
  orderTrackerController.getOrderById
);

router.put('/:id',
  validate(orderTrackerValidation.updateOrder),
  orderTrackerController.updateOrder
);

router.delete('/:id',
  orderTrackerController.deleteOrder
);

// Update status
router.post('/:id/status',
  orderTrackerController.updateStatus
);

module.exports = router;