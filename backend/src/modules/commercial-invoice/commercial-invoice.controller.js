const commercialInvoiceService = require("./commercial-invoice.service");

const commercialInvoiceController = {
  // Initialize commercial invoice from bifurcation
  initializeFromBifurcation: async (req, res) => {
    try {
      const { containerCode } = req.params;
      const companyData = req.body;
      const userId = req.user.id;

      const result = await commercialInvoiceService.initializeFromBifurcation(
        containerCode,
        companyData,
        userId
      );

      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get commercial invoice
  getCommercialInvoice: async (req, res) => {
    try {
      const { containerCode } = req.params;

      const result = await commercialInvoiceService.getCommercialInvoice(containerCode);

      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Update commercial invoice
  updateCommercialInvoice: async (req, res) => {
    try {
      const { containerCode } = req.params;
      const data = req.body;
      const userId = req.user.id;

      const result = await commercialInvoiceService.updateCommercialInvoice(
        containerCode,
        data,
        userId
      );

      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Update items
  updateItems: async (req, res) => {
    try {
      const { containerCode } = req.params;
      const { items } = req.body;
      const userId = req.user.id;

      const result = await commercialInvoiceService.updateItems(
        containerCode,
        items,
        userId
      );

      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Mark as printed
  markAsPrinted: async (req, res) => {
    try {
      const { containerCode } = req.params;
      const userId = req.user.id;

      const result = await commercialInvoiceService.markAsPrinted(
        containerCode,
        userId
      );

      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Log activity
  logActivity: async (req, res) => {
    try {
      const { containerCode } = req.params;
      const { type, field, oldValue, newValue, note } = req.body;
      const userId = req.user.id;

      const invoice = await commercialInvoiceService.getCommercialInvoice(containerCode);
      
      if (!invoice.data) {
        return res.status(404).json({
          success: false,
          message: "Commercial invoice not found",
        });
      }

      const activity = await commercialInvoiceService.logActivity(
        invoice.data.id,
        userId,
        type,
        field,
        oldValue,
        newValue,
        note
      );

      res.status(200).json({
        success: true,
        message: "Activity logged successfully",
        data: activity,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get activities
  getActivities: async (req, res) => {
    try {
      const { containerCode } = req.params;
      const { limit = 50 } = req.query;

      const activities = await commercialInvoiceService.getActivities(
        containerCode,
        parseInt(limit)
      );

      res.status(200).json({
        success: true,
        data: activities,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get all commercial invoices
  getAllCommercialInvoices: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "", status = "" } = req.query;

      const result = await commercialInvoiceService.getAllCommercialInvoices({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status: status || undefined,
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
};

module.exports = commercialInvoiceController;