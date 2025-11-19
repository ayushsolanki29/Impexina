const invoiceController = {
  createInvoice: async (req, res) => {
    try {
      const invoice = await invoiceService.createInvoice(req.body);
      res.status(201).json(invoice);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getAllInvoices: async (req, res) => {
    try {
      const { clientId, status, page = 1, limit = 10 } = req.query;
      const invoices = await invoiceService.getAllInvoices({ clientId, status, page, limit });
      res.json(invoices);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getInvoiceById: async (req, res) => {
    try {
      const invoice = await invoiceService.getInvoiceById(req.params.id);
      res.json(invoice);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  updateInvoice: async (req, res) => {
    try {
      const invoice = await invoiceService.updateInvoice(req.params.id, req.body);
      res.json(invoice);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  sendInvoice: async (req, res) => {
    try {
      const result = await invoiceService.sendInvoice(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = invoiceController;