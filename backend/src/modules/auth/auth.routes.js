const express = require("express");
const authController = require("./auth.controller");
const authValidation = require("./auth.validation");
const { authenticate } = require("../../middleware/auth");
const { validateRequest } = require("../../middleware/validateRequest");

const router = express.Router();

// Public
router.post(
  "/login",
  validateRequest(authValidation.login),
  authController.login
);

// Protected
router.get("/me", authenticate, authController.me);

module.exports = router;
