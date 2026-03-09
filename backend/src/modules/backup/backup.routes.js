const express = require("express");
const router = express.Router();
const backupController = require("./backup.controller");
const { authenticate } = require("../../middleware/auth");

// All routes require authentication
// In production, you might restrict this to ADMIN only
router.use(authenticate);

router.get("/", backupController.listBackups);
router.post("/", backupController.createBackup);
router.post("/restore", backupController.restoreBackup);
router.get("/download/:type/:filename", backupController.downloadBackup);
router.get("/settings", backupController.getSettings);
router.post("/settings", backupController.updateSettings);

module.exports = router;
