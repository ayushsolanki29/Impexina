const loadingSheetService = require("./loading.service");

const loadingSheetController = {
  // Create new loading sheet
  createLoadingSheet: async (req, res) => {
    try {
      const loadingSheet = await loadingSheetService.createLoadingSheet(req.body, req.user.id);
      res.status(201).json(loadingSheet);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get all loading sheets with pagination and filters
  getAllLoadingSheets: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        search,
        startDate,
        endDate 
      } = req.query;
      
      const loadingSheets = await loadingSheetService.getAllLoadingSheets({ 
        page: parseInt(page), 
        limit: parseInt(limit), 
        status,
        search,
        startDate,
        endDate
      });
      res.json(loadingSheets);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get loading sheet by ID
  getLoadingSheetById: async (req, res) => {
    try {
      const loadingSheet = await loadingSheetService.getLoadingSheetById(req.params.id);
      res.json(loadingSheet);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  // Update loading sheet
  updateLoadingSheet: async (req, res) => {
    try {
      const loadingSheet = await loadingSheetService.updateLoadingSheet(req.params.id, req.body, req.user.id);
      res.json(loadingSheet);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Update loading sheet status
  updateLoadingSheetStatus: async (req, res) => {
    try {
      const { status } = req.body;
      const loadingSheet = await loadingSheetService.updateLoadingSheetStatus(req.params.id, status, req.user.id);
      res.json(loadingSheet);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Add items to loading sheet
  addItemsToLoadingSheet: async (req, res) => {
    try {
      const { items } = req.body;
      const result = await loadingSheetService.addItemsToLoadingSheet(req.params.id, items, req.user.id);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Upload CSV and process
  uploadCSV: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'CSV file is required' });
      }
      const result = await loadingSheetService.processCSV(req.file, req.user.id);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Delete loading sheet
  deleteLoadingSheet: async (req, res) => {
    try {
      await loadingSheetService.deleteLoadingSheet(req.params.id, req.user.id);
      res.json({ message: 'Loading sheet deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get loading sheet statistics
  getStatistics: async (req, res) => {
    try {
      const stats = await loadingSheetService.getStatistics();
      res.json(stats);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = loadingSheetController;