const express = require('express');
const router = express.Router();
const bifurcationController = require('./bifurcation.controller');
const { authenticate } = require("../../middleware/auth");

router.use(authenticate);

router.get('/', bifurcationController.getReport);
router.get('/activities', bifurcationController.getActivities);
router.get('/activities/containers', bifurcationController.getActivityContainers);
router.get('/containers/suggestions', bifurcationController.getContainerSuggestions);
router.post('/settings', bifurcationController.updateSetting);
router.post('/:loadingSheetId', bifurcationController.updateDetails);

module.exports = router;
