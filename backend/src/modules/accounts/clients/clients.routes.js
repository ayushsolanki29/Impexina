const express = require("express");
const router = express.Router();
const clientsController = require("./clients.controller");
const { authenticate } = require("../../../middleware/auth");

router.use(authenticate);

// Auto-suggestions
router.get("/suggestions/containers", clientsController.getContainerSuggestions);

// Client List (Proxies to CRM or fetches Client model)
router.get("/", clientsController.getClients);

// Client Containers
router.get("/:id/containers", clientsController.getClientContainers);

// Client Ledger (Details + Transactions)
router.get("/:id", clientsController.getClientLedger);

// Transaction Management (Expense - Blue Sheet)
router.post("/:id/transactions", clientsController.addTransaction);
router.put("/:id/transactions/:txnId", clientsController.updateTransaction);
router.delete("/:id/transactions/:txnId", clientsController.deleteTransaction);

// TRF Transaction Management (Transfer - Yellow Sheet)
router.post("/:id/trf-transactions", clientsController.addTrfTransaction);
router.put("/:id/trf-transactions/:txnId", clientsController.updateTrfTransaction);
router.delete("/:id/trf-transactions/:txnId", clientsController.deleteTrfTransaction);

// Rename Sheet
router.post("/:id/rename-sheet", clientsController.renameSheet);

module.exports = router;
