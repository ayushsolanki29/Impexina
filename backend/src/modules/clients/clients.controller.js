const clientsService = require("./clients.service");
const xlsx = require('xlsx');

const clientsController = {
  getAllClients: async (req, res) => {
    try {
      const result = await clientsService.getAllClients(req.query);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getClientById: async (req, res) => {
    try {
      const client = await clientsService.getClientById(req.params.id);
      if (!client) {
        return res.status(404).json({ success: false, message: "Client not found" });
      }
      res.json({ success: true, data: client });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  createClient: async (req, res) => {
    try {
      const client = await clientsService.createClient(req.body);
      res.status(201).json({ success: true, data: client });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  updateClient: async (req, res) => {
    try {
      const client = await clientsService.updateClient(req.params.id, req.body);
      res.json({ success: true, data: client });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  deleteClient: async (req, res) => {
    try {
      await clientsService.deleteClient(req.params.id);
      res.json({ success: true, message: "Client deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Export to Excel
  exportClients: async (req, res) => {
    try {
        const { clients } = await clientsService.getAllClients({ ...req.query, limit: 10000 });
        
        const data = clients.map(client => ({
            "Name": client.name,
            "Company": client.companyName || '-',
            "Type": client.type,
            "Status": client.status,
            "Email": client.email || '-',
            "Phone": client.phone || '-',
            "City": client.city || '-',
            "GST No": client.gstNumber || '-',
            "Created At": new Date(client.createdAt).toLocaleDateString()
        }));

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(wb, ws, "Clients");

        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Clients.xlsx');
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
  },

  getSuggestions: async (req, res) => {
    try {
      const suggestions = await clientsService.getSuggestions(req.query.search);
      res.json({ success: true, data: suggestions });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = clientsController;
