const ahmedabadPettyCashService = require("./ahmedabad-petty-cash.service");

const ahmedabadPettyCashController = {
  // Get all petty cash sheets
  getAllSheets: async (req, res) => {
    try {
      const { page = 1, limit = 20, search = "", status = "" } = req.query;
      
      const result = await ahmedabadPettyCashService.getAllSheets({
        page,
        limit,
        search,
        status,
      });
      
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Get sheet by ID
  getSheetById: async (req, res) => {
    try {
      const { sheetId } = req.params;
      
      const sheet = await ahmedabadPettyCashService.getSheetById(sheetId);
      
      res.status(200).json({
        success: true,
        data: sheet,
      });
    } catch (error) {
      if (error.message === "Sheet not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Create new sheet
  createSheet: async (req, res) => {
    try {
      const { name, description, openingBalance, month, year } = req.body;
      const userId = req.user.id;
      
      const sheet = await ahmedabadPettyCashService.createSheet({
        name,
        description,
        openingBalance: parseFloat(openingBalance) || 0,
        month,
        year,
      }, userId);
      
      res.status(201).json({
        success: true,
        message: "Petty cash sheet created successfully",
        data: sheet,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Update sheet
  updateSheet: async (req, res) => {
    try {
      const { sheetId } = req.params;
      const { name, description, openingBalance, status, isLocked } = req.body;
      const userId = req.user.id;
      
      const sheet = await ahmedabadPettyCashService.updateSheet(sheetId, {
        name,
        description,
        openingBalance: openingBalance ? parseFloat(openingBalance) : undefined,
        status,
        isLocked,
      }, userId);
      
      res.status(200).json({
        success: true,
        message: "Sheet updated successfully",
        data: sheet,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Delete sheet
  deleteSheet: async (req, res) => {
    try {
      const { sheetId } = req.params;
      const userId = req.user.id;
      
      const result = await ahmedabadPettyCashService.deleteSheet(sheetId, userId);
      
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Get sheet entries
  getSheetEntries: async (req, res) => {
    try {
      const { sheetId } = req.params;
      const { type, startDate, endDate, search, page = 1, limit = 50 } = req.query;
      
      const entries = await ahmedabadPettyCashService.getSheetEntries(sheetId, {
        type,
        startDate,
        endDate,
        search,
        page,
        limit,
      });
      
      res.status(200).json({
        success: true,
        data: entries,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Add entry to sheet
  addEntry: async (req, res) => {
    try {
      const { sheetId } = req.params;
      const entryData = req.body;
      const userId = req.user.id;
      
      const entry = await ahmedabadPettyCashService.addEntry(sheetId, entryData, userId);
      
      res.status(201).json({
        success: true,
        message: "Entry added successfully",
        data: entry,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Update entry
  updateEntry: async (req, res) => {
    try {
      const { entryId } = req.params;
      const entryData = req.body;
      const userId = req.user.id;
      
      const entry = await ahmedabadPettyCashService.updateEntry(entryId, entryData, userId);
      
      res.status(200).json({
        success: true,
        message: "Entry updated successfully",
        data: entry,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Delete entry
  deleteEntry: async (req, res) => {
    try {
      const { entryId } = req.params;
      const userId = req.user.id;
      
      const result = await ahmedabadPettyCashService.deleteEntry(entryId, userId);
      
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Get dashboard stats
  getDashboardStats: async (req, res) => {
    try {
      const stats = await ahmedabadPettyCashService.getDashboardStats();
      
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Export sheet to Excel
  exportSheet: async (req, res) => {
    try {
      const { sheetId } = req.params;
      
      const result = await ahmedabadPettyCashService.exportSheet(sheetId);
      
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=ahmedabad_petty_cash_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      
      res.send(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Duplicate sheet
  duplicateSheet: async (req, res) => {
    try {
      const { sheetId } = req.params;
      const { name } = req.body;
      const userId = req.user.id;
      
      const newSheet = await ahmedabadPettyCashService.duplicateSheet(sheetId, name, userId);
      
      res.status(201).json({
        success: true,
        message: "Sheet duplicated successfully",
        data: newSheet,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Get container code suggestions
  getContainerCodeSuggestions: async (req, res) => {
    try {
      const { search = "" } = req.query;
      
      const suggestions = await ahmedabadPettyCashService.getContainerCodeSuggestions(search);
      
      res.status(200).json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = ahmedabadPettyCashController;