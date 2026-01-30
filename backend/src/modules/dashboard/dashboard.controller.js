const dashboardService = require('./dashboard.service');

const dashboardController = {
  // Get complete dashboard overview
  getDashboardOverview: async (req, res) => {
    try {
      const userId = req.user?.id;
      const overview = await dashboardService.getDashboardOverview(userId);
      
      res.json({
        success: true,
        data: overview
      });
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch dashboard overview'
      });
    }
  },

  // Get monthly statistics
  getMonthlyStats: async (req, res) => {
    try {
      const [orderStats, taskStats] = await Promise.all([
        dashboardService.getMonthlyOrderStats(),
        dashboardService.getMonthlyTaskStats()
      ]);
      
      res.json({
        success: true,
        data: {
          orders: orderStats,
          tasks: taskStats
        }
      });
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch monthly statistics'
      });
    }
  },

  // Get shipping code statistics
  getShippingCodeStats: async (req, res) => {
    try {
      const stats = await dashboardService.getShippingCodeStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching shipping code stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch shipping code statistics'
      });
    }
  },

  // Get supplier statistics
  getSupplierStats: async (req, res) => {
    try {
      const stats = await dashboardService.getSupplierStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching supplier stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch supplier statistics'
      });
    }
  },

  // Get user performance
  getUserPerformance: async (req, res) => {
    try {
      const performance = await dashboardService.getUserPerformance();
      
      res.json({
        success: true,
        data: performance
      });
    } catch (error) {
      console.error('Error fetching user performance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user performance'
      });
    }
  },

  // Get upcoming deadlines
  getUpcomingDeadlines: async (req, res) => {
    try {
      const deadlines = await dashboardService.getUpcomingDeadlines();
      
      res.json({
        success: true,
        data: deadlines
      });
    } catch (error) {
      console.error('Error fetching upcoming deadlines:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch upcoming deadlines'
      });
    }
  },

  // Get system health
  getSystemHealth: async (req, res) => {
    try {
      const health = await dashboardService.getSystemHealth();
      
      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      console.error('Error fetching system health:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch system health'
      });
    }
  },

  // Get quick statistics
  getQuickStats: async (req, res) => {
    try {
      const stats = await dashboardService.getQuickStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching quick stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch quick statistics'
      });
    }
  },

  // Get custom dashboard data
  getCustomDashboard: async (req, res) => {
    try {
      const { modules = 'all' } = req.query;
      const modulesArray = modules === 'all' 
        ? ['overview', 'stats', 'performance', 'deadlines', 'health', 'quick']
        : modules.split(',');
      
      const results = {};
      
      if (modulesArray.includes('overview')) {
        results.overview = await dashboardService.getDashboardOverview();
      }
      
      if (modulesArray.includes('stats')) {
        const [monthlyStats, shippingStats, supplierStats] = await Promise.all([
          dashboardService.getMonthlyOrderStats(),
          dashboardService.getShippingCodeStats(),
          dashboardService.getSupplierStats()
        ]);
        results.stats = { monthlyStats, shippingStats, supplierStats };
      }
      
      if (modulesArray.includes('performance')) {
        results.performance = await dashboardService.getUserPerformance();
      }
      
      if (modulesArray.includes('deadlines')) {
        results.deadlines = await dashboardService.getUpcomingDeadlines();
      }
      
      if (modulesArray.includes('health')) {
        results.health = await dashboardService.getSystemHealth();
      }
      
      if (modulesArray.includes('quick')) {
        results.quick = await dashboardService.getQuickStats();
      }
      
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Error fetching custom dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch custom dashboard data'
      });
    }
  },

  // Get dashboard widgets data
  getDashboardWidgets: async (req, res) => {
    try {
      const { widgets = 'summary,recent,stats,performance' } = req.query;
      const widgetsArray = widgets.split(',');
      
      const results = {};
      
      // Always get summary for all widgets
      const overview = await dashboardService.getDashboardOverview();
      
      if (widgetsArray.includes('summary')) {
        results.summary = overview.summary;
      }
      
      if (widgetsArray.includes('recent')) {
        results.recent = overview.recentData;
      }
      
      if (widgetsArray.includes('stats')) {
        const [monthlyStats, shippingStats] = await Promise.all([
          dashboardService.getMonthlyOrderStats(),
          dashboardService.getShippingCodeStats()
        ]);
        results.stats = { monthlyStats, shippingStats };
      }
      
      if (widgetsArray.includes('performance')) {
        results.performance = await dashboardService.getUserPerformance();
      }
      
      if (widgetsArray.includes('orders')) {
        results.orders = {
          status: overview.orderStatus,
          timeStats: overview.timeStats
        };
      }
      
      if (widgetsArray.includes('tasks')) {
        results.tasks = overview.taskStatus;
      }
      
      if (widgetsArray.includes('deadlines')) {
        results.deadlines = await dashboardService.getUpcomingDeadlines();
      }
      
      if (widgetsArray.includes('quick')) {
        results.quick = await dashboardService.getQuickStats();
      }
      
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Error fetching dashboard widgets:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard widgets'
      });
    }
  },

  // Get all activities from all modules
  getAllActivities: async (req, res) => {
    try {
      const result = await dashboardService.getAllActivities(req.query);
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error fetching all activities:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch activities'
      });
    }
  }
};

module.exports = dashboardController;