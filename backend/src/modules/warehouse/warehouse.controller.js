const warehouseService = require("./warehouse.service");

const warehouseController = {
  // Get all stock items
  getStock: async (req, res) => {
    try {
      const { page = 1, limit = 50, search } = req.query;
      const stock = await warehouseService.getStock({ 
        page: parseInt(page), 
        limit: parseInt(limit), 
        search 
      });
      res.json(stock);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Update stock levels (inward/outward movement)
  updateStock: async (req, res) => {
    try {
      const { itemId, quantity, movementType, notes } = req.body;
      const result = await warehouseService.updateStock(
        itemId, 
        parseInt(quantity), 
        movementType, 
        notes,
        req.user.id
      );
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get stock movement history
  getMovementHistory: async (req, res) => {
    try {
      const { page = 1, limit = 20, startDate, endDate } = req.query;
      const history = await warehouseService.getMovementHistory({
        page: parseInt(page),
        limit: parseInt(limit),
        startDate,
        endDate
      });
      res.json(history);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get low stock alerts
  getLowStockAlerts: async (req, res) => {
    try {
      const alerts = await warehouseService.getLowStockAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Confirm item arrival
  confirmArrival: async (req, res) => {
    try {
      const { loadingSheetId } = req.body;
      const result = await warehouseService.confirmArrival(loadingSheetId, req.user.id);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get item by ID
  getItemById: async (req, res) => {
    try {
      const item = await warehouseService.getItemById(req.params.id);
      res.json(item);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }
};

module.exports = warehouseController;