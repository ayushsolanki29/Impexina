const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const authMiddleware = require('../../middleware/auth');

// All routes require authentication
router.use(authMiddleware.authenticate);

// Dashboard routes
router.get('/overview', dashboardController.getDashboardOverview);
router.get('/monthly-stats', dashboardController.getMonthlyStats);
router.get('/shipping-code-stats', dashboardController.getShippingCodeStats);
router.get('/supplier-stats', dashboardController.getSupplierStats);
router.get('/user-performance', dashboardController.getUserPerformance);
router.get('/upcoming-deadlines', dashboardController.getUpcomingDeadlines);
router.get('/system-health', dashboardController.getSystemHealth);
router.get('/quick-stats', dashboardController.getQuickStats);

// Custom dashboard data
router.get('/custom', dashboardController.getCustomDashboard);
router.get('/widgets', dashboardController.getDashboardWidgets);

// Activities
router.get('/activities', dashboardController.getAllActivities);

module.exports = router;