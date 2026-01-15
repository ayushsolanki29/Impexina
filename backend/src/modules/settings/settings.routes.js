const express = require("express");
const router = express.Router();
const settingsController = require("./settings.controller");
const { authenticate } = require("../../middleware/auth");

router.use(authenticate);

// Get all settings
router.get("/", settingsController.getAllSettings);

// Get setting by key
router.get("/:key", settingsController.getSetting);

// Update setting
router.post("/", settingsController.updateSetting);

// Bifurcation settings
router.get("/bifurcation/get", settingsController.getBifurcationSettings);
router.post("/bifurcation/update", settingsController.updateBifurcationSettings);

// Accounts settings
router.get("/accounts/get", settingsController.getAccountsSettings);
router.post("/accounts/keyphrase", settingsController.setAccountsKeyphrase);
router.post("/accounts/verify", settingsController.verifyAccountsAccess);

module.exports = router;
