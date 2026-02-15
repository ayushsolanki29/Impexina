const express = require("express");
const router = express.Router();
const invoiceController = require("./invoice.controller");
const { authenticate } = require("../../middleware/auth");

router.use(authenticate);

// Invoice Routes
router.get("/", invoiceController.getAll);
router.get("/container/:containerId", invoiceController.getByContainerId);
router.post("/container/:containerId", invoiceController.createOrUpdate);
router.get("/container/:containerId/import", invoiceController.importLoadingItems);
router.get("/export/all", invoiceController.exportAll);
router.get("/:id/export/excel", invoiceController.exportExcel);
router.delete("/:id", invoiceController.delete);

module.exports = router;
