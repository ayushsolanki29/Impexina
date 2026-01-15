const invoiceService = require("./invoice.service");

const invoiceController = {
  // --- Invoice Endpoints ---

  getAll: async (req, res) => {
    try {
      const result = await invoiceService.getAllContainers(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getByContainerId: async (req, res) => {
    try {
      const { containerId } = req.params;
      const result = await invoiceService.getInvoiceByContainer(containerId);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  },

  createOrUpdate: async (req, res) => {
    try {
      const { containerId } = req.params;
      const userId = req.user.id;
      const result = await invoiceService.createOrUpdate(containerId, req.body, userId);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  importLoadingItems: async (req, res) => {
    try {
      const { containerId } = req.params;
      const items = await invoiceService.importFromLoadingSheets(containerId);
      res.json({ success: true, data: items });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      await invoiceService.delete(id);
      res.json({ success: true, message: "Invoice deleted" });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
};

module.exports = invoiceController;
