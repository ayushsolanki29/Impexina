const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { authenticate, authorize } = require('../../middleware/auth');
const { validateUserCreate, validateUserUpdate, validateUserQuery } = require('./user.validation');

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

// Get my profile
router.get('/profile', userController.getMyProfile);

// Update my profile
router.put('/profile', userController.updateMyProfile);

// Get all users (Admin and Manager only)
router.get('/', 
  authorize('ADMIN', 'MANAGER', 'MANAGEMENT'), 
  validateQuery(validateUserQuery),
  userController.getAllUsers
);

// Get user by ID (Admin, Manager, and self)
router.get('/:id', 
  authorize('ADMIN', 'MANAGER', 'MANAGEMENT'), 
  userController.getUserById
);

// Create new user (Admin and Manager only)
router.post('/', 
  authorize('ADMIN', 'MANAGER'), 
  validate(validateUserCreate),
  userController.createUser
);

// Update user (Admin, Manager, or self)
router.put('/:id', 
  authorize('ADMIN', 'MANAGER'), 
  validate(validateUserUpdate),
  userController.updateUser
);

// Delete user (Admin only)
router.delete('/:id', 
  authorize('ADMIN'), 
  userController.deleteUser
);

// Get user performance (Admin, Manager, and self)
router.get('/:id/performance', 
  authorize('ADMIN', 'MANAGER', 'MANAGEMENT'), 
  userController.getUserPerformance
);

module.exports = router;