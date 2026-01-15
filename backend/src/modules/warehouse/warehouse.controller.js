const warehouseService = require('./warehouse.service');

const warehouseController = {
  getReport: async (req, res) => {
    try {
      const filters = req.query;
      const result = await warehouseService.getWarehouseReport(filters);
      res.json({ 
        success: true, 
        data: result.data, 
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Warehouse Report Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updateDetails: async (req, res) => {
    try {
      const { loadingSheetId } = req.params;
      const data = req.body;
      const userId = req.user.id;
      
      const result = await warehouseService.upsertWarehouse(loadingSheetId, data, userId);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Warehouse Update Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getActivities: async (req, res) => {
    try {
      const filters = req.query;
      const result = await warehouseService.getWarehouseActivities(filters);
      res.json({ 
        success: true, 
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Warehouse Activities Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getTransportersList: async (req, res) => {
    try {
      const result = await warehouseService.getTransporters();
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Warehouse Transporters Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = warehouseController;
