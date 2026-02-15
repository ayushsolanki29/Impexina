const express = require('express');
const router = express.Router();
const warehouseController = require('./warehouse.controller');
const { authenticate } = require('../../middleware/auth');

// All warehouse routes require authentication
router.use(authenticate);

router.get('/', warehouseController.getReport);
router.get('/export/excel', warehouseController.exportToExcel);
router.get('/transporters', warehouseController.getTransportersList);
router.post('/:loadingSheetId', warehouseController.updateDetails);
router.get('/activities', warehouseController.getActivities);

module.exports = router;
