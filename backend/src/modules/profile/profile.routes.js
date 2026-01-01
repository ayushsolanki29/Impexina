const express = require("express");
const router = express.Router();
const profileController = require("./profile.controller");
const { authenticate } = require("../../middleware/auth");

// All routes require authentication
router.use(authenticate);

router.get("/", profileController.getProfile);
router.put("/", profileController.updateProfile);
router.put("/password", profileController.changePassword);

module.exports = router;
