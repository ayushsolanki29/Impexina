const mumbaiLedgerService = require("./mumbai-ledger.service");

const mumbaiLedgerController = {
  // Get all ledgers
  getAllLedgers: async (req, res) => {
    try {
      const { page = 1, limit = 20, search = "", status = "" } = req.query;
      
      const result = await mumbaiLedgerService.getAllLedgers({
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
  
  // Get ledger by ID
  getLedgerById: async (req, res) => {
    try {
      const { ledgerId } = req.params;
      
      const ledger = await mumbaiLedgerService.getLedgerById(ledgerId);
      
      res.status(200).json({
        success: true,
        data: ledger,
      });
    } catch (error) {
      if (error.message === "Ledger not found") {
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
  
  // Create new ledger
  createLedger: async (req, res) => {
    try {
      const { name, description, month, year } = req.body;
      const userId = req.user.id;
      
      const ledger = await mumbaiLedgerService.createLedger({
        name,
        description,
        month,
        year,
      }, userId);
      
      res.status(201).json({
        success: true,
        message: "Ledger created successfully",
        data: ledger,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Update ledger
  updateLedger: async (req, res) => {
    try {
      const { ledgerId } = req.params;
      const { name, description, status, isLocked } = req.body;
      const userId = req.user.id;
      
      const ledger = await mumbaiLedgerService.updateLedger(ledgerId, {
        name,
        description,
        status,
        isLocked,
      }, userId);
      
      res.status(200).json({
        success: true,
        message: "Ledger updated successfully",
        data: ledger,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Delete ledger
  deleteLedger: async (req, res) => {
    try {
      const { ledgerId } = req.params;
      const userId = req.user.id;
      
      const result = await mumbaiLedgerService.deleteLedger(ledgerId, userId);
      
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
  
  // Get ledger entries
  getLedgerEntries: async (req, res) => {
    try {
      const { ledgerId } = req.params;
      const { type, containerCode, startDate, endDate, page = 1, limit = 50 } = req.query;
      
      const entries = await mumbaiLedgerService.getLedgerEntries(ledgerId, {
        type,
        containerCode,
        startDate,
        endDate,
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
  
  // Add entry to ledger
  addEntry: async (req, res) => {
    try {
      const { ledgerId } = req.params;
      const entryData = req.body;
      const userId = req.user.id;
      
      const entry = await mumbaiLedgerService.addEntry(ledgerId, entryData, userId);
      
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
      
      const entry = await mumbaiLedgerService.updateEntry(entryId, entryData, userId);
      
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
      
      const result = await mumbaiLedgerService.deleteEntry(entryId, userId);
      
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
      const stats = await mumbaiLedgerService.getDashboardStats();
      
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
  
  // Export ledger to Excel
  exportLedger: async (req, res) => {
    try {
      const { ledgerId } = req.params;
      
      const result = await mumbaiLedgerService.exportLedger(ledgerId);
      
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=mumbai_ledger_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      
      res.send(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Duplicate ledger
  duplicateLedger: async (req, res) => {
    try {
      const { ledgerId } = req.params;
      const { name } = req.body;
      const userId = req.user.id;
      
      const newLedger = await mumbaiLedgerService.duplicateLedger(ledgerId, name, userId);
      
      res.status(201).json({
        success: true,
        message: "Ledger duplicated successfully",
        data: newLedger,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Get container suggestions
  getContainerSuggestions: async (req, res) => {
    try {
      const { search = "" } = req.query;
      
      const suggestions = await mumbaiLedgerService.getContainerSuggestions(search);
      
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
  bulkAddEntries: async (req, res) => {
    try {
      const { ledgerId } = req.params;
      const entries = req.body.entries;
      const userId = req.user.id;
        const result = await mumbaiLedgerService.bulkAddEntries(ledgerId, entries, userId);
        res.status(201).json({
            success: true,
            message: `${result.addedCount} entries added successfully`,
            data: result.entries,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }   
    },
};

module.exports = mumbaiLedgerController;