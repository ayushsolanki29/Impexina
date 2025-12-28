
const warehouseService = require("./warehouse.service");
const warehouseValidation = require("./warehouse.validation");
const XLSX = require("xlsx");

const warehouseController = {
  // Initialize warehouse plan from container
  initializeFromContainer: async (req, res) => {
    try {
      const { containerCode } = req.params;
      const userId = req.user.id;

      const result = await warehouseService.initializeFromContainer(
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

  // Get warehouse plan
  getWarehousePlan: async (req, res) => {
    try {
      const { containerCode } = req.params;

      const result = await warehouseService.getWarehousePlan(containerCode);

      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Add new mark
  addMark: async (req, res) => {
    try {
      const { containerCode } = req.params;
      const markData = req.body;
      const userId = req.user.id;

      const result = await warehouseService.addMark(
        containerCode,
        markData,
        userId
      );

      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Update mark
  updateMark: async (req, res) => {
    try {
      const { containerCode, markId } = req.params;
      const markData = req.body;
      const userId = req.user.id;

      const result = await warehouseService.updateMark(
        containerCode,
        markId,
        markData,
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

  // Delete mark
  deleteMark: async (req, res) => {
    try {
      const { containerCode, markId } = req.params;
      const userId = req.user.id;

      const result = await warehouseService.deleteMark(
        containerCode,
        markId,
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

  // Search warehouse plan
  searchWarehousePlan: async (req, res) => {
    try {
      const { containerCode } = req.params;
      const { q, status, transporter } = req.query;

      const result = await warehouseService.searchWarehousePlan(
        containerCode,
        q || "",
        { status, transporter }
      );

      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Export to Excel
  exportToExcel: async (req, res) => {
    try {
      const { containerCode } = req.params;

      const excelData = await warehouseService.exportToExcel(containerCode);

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Add main data sheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Warehouse Plan");

      // Get warehouse plan for summary
      const warehousePlan = await warehouseService.getWarehousePlan(containerCode);

      // Add summary sheet
      const summaryData = [
        {
          CONTAINER: warehousePlan.data.containerCode,
          ORIGIN: warehousePlan.data.origin || "",
          STATUS: warehousePlan.data.status,
          "TOTAL CTN": warehousePlan.data.totalCTN,
          "TOTAL CBM": warehousePlan.data.totalCBM.toFixed(3),
          "TOTAL WEIGHT": warehousePlan.data.totalWeight,
          "TOTAL MARKS": warehousePlan.data.totalMarks,
          "PENDING": warehousePlan.data.pendingCount,
          "DISPATCHED": warehousePlan.data.dispatchedCount,
          "HOLD": warehousePlan.data.holdCount,
          "DRAFT": warehousePlan.data.draftCount,
          "WITH DELIVERY": warehousePlan.data.withDeliveryDate,
          "WITH INVOICE": warehousePlan.data.withInvoice,
          "WITH GST": warehousePlan.data.withGST,
          "WITH TRANSPORTER": warehousePlan.data.withTransporter,
          "GENERATED DATE": new Date().toLocaleDateString(),
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
        `attachment; filename=${containerCode}_warehouse_plan_${new Date()
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

  // Get unique transporters
  getUniqueTransporters: async (req, res) => {
    try {
      const { containerCode } = req.params;

      const transporters = await warehouseService.getUniqueTransporters(
        containerCode
      );

      res.status(200).json({
        success: true,
        data: transporters,
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
      const { limit = 20 } = req.query;

      const activities = await warehouseService.getActivities(
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

  // Get all warehouse plans
  getAllWarehousePlans: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "", status = "" } = req.query;

      const result = await warehouseService.getAllWarehousePlans({
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

  // Update warehouse plan status
  updateWarehousePlanStatus: async (req, res) => {
    try {
      const { containerCode } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      const result = await warehouseService.updateWarehousePlanStatus(
        containerCode,
        status,
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

  // Import from Excel
  importFromExcel: async (req, res) => {
    try {
      const { containerCode } = req.params;
      const userId = req.user.id;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Excel file is required",
        });
      }

      // Read Excel file
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const result = await warehouseService.importFromExcel(
        containerCode,
        jsonData,
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

  // Recalculate totals
  recalculateTotals: async (req, res) => {
    try {
      const { containerCode } = req.params;

      const totals = await warehouseService.recalculateTotals(containerCode);

      res.status(200).json({
        success: true,
        message: "Totals recalculated",
        data: totals,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = warehouseController;