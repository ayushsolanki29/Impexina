const express = require("express");
const router = express.Router();
const commercialInvoiceController = require("./commercial-invoice.controller");
const { authenticate } = require("../../middleware/auth");

router.use(authenticate);

router.get("/", commercialInvoiceController.getAll);
router.get("/:containerCode", commercialInvoiceController.getByContainerCode);

module.exports = router;