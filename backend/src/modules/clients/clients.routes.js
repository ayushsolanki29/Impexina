const express = require("express");
const router = express.Router();
const clientsController = require("./clients.controller");
const { authenticate } = require("../../middleware/auth");

router.use(authenticate);

// Export
router.get("/export", clientsController.exportClients);

// CRUD
router.get("/", clientsController.getAllClients);
router.post("/", clientsController.createClient);
router.get("/search/suggestions", clientsController.getSuggestions);
router.get("/:id", clientsController.getClientById);
router.put("/:id", clientsController.updateClient);
router.delete("/:id", clientsController.deleteClient);

module.exports = router;
