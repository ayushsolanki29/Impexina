const orderTrackerService = require('./order-tracker.service');

const orderTrackerController = {
  // Get all orders
  getAllOrders: async (req, res) => {
    try {
      const filters = req.query;
      const result = await orderTrackerService.getAllOrders(filters);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch orders'
      });
    }
  },

  // Get single order
  getOrderById: async (req, res) => {
    try {
      const { id } = req.params;
      const order = await orderTrackerService.getOrderById(id);
      
      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('Error fetching order:', error);
      if (error.message === 'Order not found') {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to fetch order'
      });
    }
  },

  // Create order
  createOrder: async (req, res) => {
    try {
      const userId = req.user.id;
      const orderData = req.body;
      
      const order = await orderTrackerService.createOrder(orderData, userId);
      
      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: order
      });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create order'
      });
    }
  },

  // Create multiple orders
  createMultipleOrders: async (req, res) => {
    try {
      const userId = req.user.id;
      const { orders } = req.body;
      
      if (!Array.isArray(orders) || orders.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please provide an array of orders'
        });
      }
      
      const result = await orderTrackerService.createMultipleOrders(orders, userId);
      
      res.status(201).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      console.error('Error creating multiple orders:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create orders'
      });
    }
  },

  // Update order
  updateOrder: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const userId = req.user.id;
      
      const updatedOrder = await orderTrackerService.updateOrder(id, updates, userId);
      
      res.json({
        success: true,
        message: 'Order updated successfully',
        data: updatedOrder
      });
    } catch (error) {
      console.error('Error updating order:', error);
      if (error.message === 'Order not found') {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to update order'
      });
    }
  },

  // Delete order
  deleteOrder: async (req, res) => {
    try {
      const { id } = req.params;
      
      await orderTrackerService.deleteOrder(id);
      
      res.json({
        success: true,
        message: 'Order deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting order:', error);
      if (error.message === 'Order not found') {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to delete order'
      });
    }
  },

  // Update status
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;
      
      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }
      
      const updatedOrder = await orderTrackerService.updateStatus(id, status, userId);
      
      res.json({
        success: true,
        message: 'Order status updated successfully',
        data: updatedOrder
      });
    } catch (error) {
      console.error('Error updating status:', error);
      if (error.message === 'Order not found') {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to update status'
      });
    }
  },

  // Get stats
  getStats: async (req, res) => {
    try {
      const stats = await orderTrackerService.getStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stats'
      });
    }
  },

  // Get orders by shipping code
  getOrdersByShippingCode: async (req, res) => {
    try {
      const { shippingCode } = req.params;
      
      if (!shippingCode) {
        return res.status(400).json({
          success: false,
          message: 'Shipping code is required'
        });
      }
      
      const orders = await orderTrackerService.getOrdersByShippingCode(shippingCode);
      
      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      console.error('Error fetching orders by shipping code:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch orders'
      });
    }
  },

  // Search orders
  searchOrders: async (req, res) => {
    try {
      const { query } = req.query;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }
      
      const orders = await orderTrackerService.searchOrders(query);
      
      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      console.error('Error searching orders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search orders'
      });
    }
  },

  // Export orders
  exportOrders: async (req, res) => {
    try {
      const { format = 'json' } = req.query;
      
      const exportData = await orderTrackerService.exportOrders(format);
      
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
        return res.send(exportData);
      }
      
      res.json({
        success: true,
        data: exportData
      });
    } catch (error) {
      console.error('Error exporting orders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export orders'
      });
    }
  },

  // Bulk update by shipping code
  bulkUpdateByShippingCode: async (req, res) => {
    try {
      const { shippingCode } = req.params;
      const updates = req.body;
      const userId = req.user.id;
      
      if (!shippingCode) {
        return res.status(400).json({
          success: false,
          message: 'Shipping code is required'
        });
      }
      
      const result = await orderTrackerService.bulkUpdateByShippingCode(shippingCode, updates, userId);
      
      res.json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      console.error('Error bulk updating orders:', error);
      if (error.message === 'No orders found with this shipping code') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to bulk update orders'
      });
    }
  },

  // Create Sheet
  createSheet: async (req, res) => {
     try {
        const result = await orderTrackerService.createSheet(req.body, req.user.id);
        res.status(201).json({ success: true, data: result });
     } catch (error) {
        res.status(500).json({ success: false, message: error.message });
     }
  },

  // Get All Sheets
  getAllSheets: async (req, res) => {
     try {
        const result = await orderTrackerService.getAllSheets();
        res.json({ success: true, data: result });
     } catch (error) {
        res.status(500).json({ success: false, message: error.message });
     }
  },

  // Get Single Sheet
  getSheetById: async (req, res) => {
     try {
        const result = await orderTrackerService.getSheetById(req.params.id);
        res.json({ success: true, data: result });
     } catch (error) {
        res.status(404).json({ success: false, message: error.message });
     }
  },

  // Update Sheet Orders
  updateSheetOrders: async (req, res) => {
     try {
        const result = await orderTrackerService.updateSheetOrders(req.params.id, req.body.orders, req.user.id);
        res.json({ success: true, data: result, message: "Sheet saved successfully" });
     } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to save sheet" });
     }
  },

  // Delete Sheet
  deleteSheet: async (req, res) => {
     try {
        await orderTrackerService.deleteSheet(req.params.id);
        res.json({ success: true, message: "Sheet deleted" });
     } catch (error) {
        res.status(500).json({ success: false, message: error.message });
     }
  },

  // Get clients for suggestions
  getClientSuggestions: async (req, res) => {
    try {
      const { search = '' } = req.query;
      const clients = await orderTrackerService.getClientsForSuggestions(search);
      res.json({ success: true, data: clients });
    } catch (error) {
      console.error('Error fetching client suggestions:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch clients' });
    }
  },

  // Quick create client
  createQuickClient: async (req, res) => {
    try {
      const { name, companyName } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, message: 'Client name is required' });
      }
      const client = await orderTrackerService.createQuickClient({ name, companyName }, req.user.id);
      res.status(201).json({ success: true, data: client, message: 'Client created successfully' });
    } catch (error) {
      console.error('Error creating client:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create client' });
    }
  },

  // Get supplier suggestions
  getSupplierSuggestions: async (req, res) => {
    try {
      const { search = '' } = req.query;
      const suppliers = await orderTrackerService.getSupplierSuggestions(search);
      res.json({ success: true, data: suppliers });
    } catch (error) {
      console.error('Error fetching supplier suggestions:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch suppliers' });
    }
  }
};

module.exports = orderTrackerController;