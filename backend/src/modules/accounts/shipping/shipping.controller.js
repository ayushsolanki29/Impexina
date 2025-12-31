const shippingService = require("./shipping.service");
const XLSX = require("xlsx");

const shippingController = {
  // Get all sheets
  getAllSheets: async (req, res) => {
    try {
      const { page = 1, limit = 20, search = "", status, fiscalYear } = req.query;
      
      const result = await shippingService.getAllSheets({
        page,
        limit,
        search,
        status,
        fiscalYear,
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
      
      const sheet = await shippingService.getSheetById(sheetId);
      
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
      const sheetData = req.body;
      const userId = req.user.id;
      
      const sheet = await shippingService.createSheet(sheetData, userId);
      
      res.status(201).json({
        success: true,
        message: "Shipping sheet created successfully",
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
      
      const sheet = await shippingService.updateSheet(sheetId, sheetData, userId);
      
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
  
  // Delete sheet (archive)
  deleteSheet: async (req, res) => {
    try {
      const { sheetId } = req.params;
      const userId = req.user.id;
      
      const result = await shippingService.deleteSheet(sheetId, userId);
      
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
      const { page = 1, limit = 50, search = "", status } = req.query;
      
      const entries = await shippingService.getSheetEntries(sheetId, {
        page,
        limit,
        search,
        status,
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
      
      const entry = await shippingService.addEntry(sheetId, entryData, userId);
      
      res.status(201).json({
        success: true,
        message: "Shipping entry added successfully",
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
      
      const entry = await shippingService.updateEntry(entryId, entryData, userId);
      
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
      
      const result = await shippingService.deleteEntry(entryId, userId);
      
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
  
  // Bulk update entries
  bulkUpdateEntries: async (req, res) => {
    try {
      const { sheetId } = req.params;
      const entriesData = req.body;
      const userId = req.user.id;
      
      if (!Array.isArray(entriesData)) {
        return res.status(400).json({
          success: false,
          message: "Entries data must be an array",
        });
      }
      
      const result = await shippingService.bulkUpdateEntries(sheetId, entriesData, userId);
      
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.entries,
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
      
      const stats = await shippingService.getSheetStats(sheetId);
      
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
      
      const exportData = await shippingService.exportSheetToExcel(sheetId);
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Main entries sheet
      const entriesSheet = XLSX.utils.json_to_sheet(exportData.entries);
      XLSX.utils.book_append_sheet(workbook, entriesSheet, "Shipping Entries");
      
      // Summary sheet
      const summaryData = [
        {
          "Sheet Name": exportData.sheet.name,
          "Description": exportData.sheet.description || "",
          "Fiscal Year": exportData.sheet.fiscalYear,
          "Status": exportData.sheet.status,
          "Total Freight (INR)": exportData.sheet.totalFreightINR,
          "Total Local Charges": exportData.sheet.totalLocalCharges,
          "Grand Total": exportData.sheet.grandTotal,
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
        `attachment; filename=${exportData.sheet.name.replace(/\s+/g, "_")}_${new Date()
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
      const overview = await shippingService.getDashboardOverview();
      
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
  
  // Generate default name
  generateDefaultName: async (req, res) => {
    try {
      const name = shippingService.generateDefaultName();
      
      res.status(200).json({
        success: true,
        data: { name },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = shippingController;