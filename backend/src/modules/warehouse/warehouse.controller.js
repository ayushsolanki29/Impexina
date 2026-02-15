const warehouseService = require('./warehouse.service');
const XLSX = require('xlsx');

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
  },

  exportToExcel: async (req, res) => {
    try {
      const filters = req.query;
      const { headers, rows } = await warehouseService.exportToExcel(filters);

      // Create workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Warehouse Plan");

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
        `attachment; filename="warehouse_plan_${new Date().toISOString().slice(0, 10)}.xlsx"`
      );

      res.send(excelBuffer);
    } catch (error) {
      console.error('Warehouse Export Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = warehouseController;
