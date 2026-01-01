const express = require("express");
const router = express.Router();
const userController = require("./users.controller");
const authMiddleware = require("../../middleware/auth");
const userValidation = require("./users.validation");

// Custom validation function
const validateRequestBody = (schema) => {
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

// All routes require authentication
router.use(authMiddleware.authenticate);

// User management routes
router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.post(
  "/",
  validateRequestBody(userValidation.createUser), // Use custom function
  userController.createUser
);
router.put(
  "/:id",
  validateRequestBody(userValidation.updateUser),
  userController.updateUser
);
router.delete("/:id", userController.deleteUser);
router.post("/:id/status", userController.updateStatus);
router.post("/:id/password", userController.updatePassword);

// Role management routes
router.get("/roles/modules", userController.getModules);
router.get("/roles/permissions", userController.getUserPermissions);
router.post("/roles/permissions", userController.updatePermissions);

module.exports = router;