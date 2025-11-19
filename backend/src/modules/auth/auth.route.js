const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");
const { authenticate } = require("../../middleware/auth");

router.post("/login", authController.login);
router.post("/register", authenticate, authController.register); // Only authenticated users can register
router.get("/profile", authenticate, authController.getProfile);

module.exports = router;
