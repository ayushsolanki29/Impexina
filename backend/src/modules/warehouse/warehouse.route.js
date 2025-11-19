const express = require("express");
const router = express.Router();
const warehouseController = require("./warehouse.controller");
const { authenticate, authorize } = require("../../middleware/auth");
const {
  validateStockUpdate,
  validateArrivalConfirmation,
  validateStockQuery,
} = require("./warehouse.validation");

// Validation middleware
const validate = (schema) => (req, res, next) => {
  const { error } = schema(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

const validateQuery = (schema) => (req, res, next) => {
  const { error } = schema(req.query);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

// All routes require authentication
router.use(authenticate);

// Get stock items (Warehouse team, Management, Admin)
router.get(
  "/stock",
  authorize("admin", "manager", "warehouse", "management"),
  validateQuery(validateStockQuery),
  warehouseController.getStock
);

// Get specific item
router.get(
  "/stock/:id",
  authorize("admin", "manager", "warehouse", "management"),
  warehouseController.getItemById
);

// Update stock (Warehouse team only)
router.post(
  "/stock/update",
  authorize("admin", "warehouse"),
  validate(validateStockUpdate),
  warehouseController.updateStock
);

// Get movement history (Warehouse team, Management, Admin)
router.get(
  "/movements",
  authorize("admin", "manager", "warehouse", "management"),
  warehouseController.getMovementHistory
);

// Get low stock alerts (Warehouse team, Management, Admin)
router.get(
  "/alerts/low-stock",
  authorize("admin", "manager", "warehouse", "management"),
  warehouseController.getLowStockAlerts
);

// Confirm arrival (Warehouse team only)
router.post(
  "/confirm-arrival",
  authorize("admin", "warehouse"),
  validate(validateArrivalConfirmation),
  warehouseController.confirmArrival
);

module.exports = router;
