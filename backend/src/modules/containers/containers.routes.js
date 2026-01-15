const express = require("express");
const router = express.Router();
const containerController = require("./containers.controller");
const { authenticate } = require("../../middleware/auth");

// All routes require authentication
router.use(authenticate);

// Container CRUD
router.post("/", containerController.create);
router.get("/", containerController.getAll);
router.get("/activities", containerController.getActivities);
router.get("/origins", containerController.getUniqueOrigins);
router.get("/:id", containerController.getById);
router.patch("/:id", containerController.update);
router.delete("/:id", containerController.delete);

module.exports = router;
