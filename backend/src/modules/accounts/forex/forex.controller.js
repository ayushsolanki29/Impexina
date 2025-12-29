const forexService = require("./forex.service");
const XLSX = require("xlsx");

const forexController = {
  // Get all sheets
  getAllSheets: async (req, res) => {
    try {
      const { page = 1, limit = 20, search = "", currency, status } = req.query;
      
      const result = await forexService.getAllSheets({
        page,
        limit,
        search,
        currency,
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
      
      const sheet = await forexService.getSheetById(sheetId);
      
      res.status(200).json({
        success: true,
        data: sheet,
      });
    } catch (error) {
      if (error.message === "Forex sheet not found") {
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
      const sheetData = req.body;
      const userId = req.user.id;
      
      const sheet = await forexService.createSheet(sheetData, userId);
      
      res.status(201).json({
        success: true,
        message: "Forex sheet created successfully",
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
      const sheetData = req.body;
      const userId = req.user.id;
      
      const sheet = await forexService.updateSheet(sheetId, sheetData, userId);
      
      res.status(200).json({
        success: true,
        message: "Forex sheet updated successfully",
        data: sheet,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Delete sheet (archive)
  deleteSheet: async (req, res) => {
    try {
      const { sheetId } = req.params;
      const userId = req.user.id;
      
      const result = await forexService.deleteSheet(sheetId, userId);
      
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.sheet,
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
      const { page = 1, limit = 50, search = "", startDate, endDate, category } = req.query;
      
      const entries = await forexService.getSheetEntries(sheetId, {
        page,
        limit,
        search,
        startDate,
        endDate,
        category,
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
      
      const entry = await forexService.addEntry(sheetId, entryData, userId);
      
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
      
      const entry = await forexService.updateEntry(entryId, entryData, userId);
      
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
      
      const result = await forexService.deleteEntry(entryId, userId);
      
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
  
  // Get sheet statistics
  getSheetStats: async (req, res) => {
    try {
      const { sheetId } = req.params;
      
      const stats = await forexService.getSheetStats(sheetId);
      
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
  
  // Search sheet names for auto-suggest
  searchSheetNames: async (req, res) => {
    try {
      const { search = "", limit = 10 } = req.query;
      
      const sheets = await forexService.searchSheetNames(search, limit);
      
      res.status(200).json({
        success: true,
        data: sheets,
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
      
      const exportData = await forexService.exportSheetToExcel(sheetId);
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Main entries sheet
      const entriesSheet = XLSX.utils.json_to_sheet(exportData.entries);
      XLSX.utils.book_append_sheet(workbook, entriesSheet, "Entries");
      
      // Summary sheet
      const summaryData = [
        {
          "Sheet Name": exportData.sheet.name,
          "Description": exportData.sheet.description || "",
          "Base Currency": exportData.sheet.baseCurrency,
          "Status": exportData.sheet.status,
          "Tags": exportData.sheet.tags.join(", "),
          "Total Entries": exportData.entries.length,
          "Created": new Date(exportData.sheet.createdAt).toLocaleDateString(),
          "Last Updated": new Date(exportData.sheet.updatedAt).toLocaleDateString(),
        },
      ];
      
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
      
      // Write to buffer
      const excelBuffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
      });
      
      // Set response headers
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${exportData.sheet.name.replace(/\s+/g, "_")}_forex_${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`
      );
      
      res.send(excelBuffer);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Get dashboard overview
  getDashboardOverview: async (req, res) => {
    try {
      const overview = await forexService.getDashboardOverview();
      
      res.status(200).json({
        success: true,
        data: overview,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = forexController;