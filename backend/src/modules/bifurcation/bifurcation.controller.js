const bifurcationService = require("./bifurcation.service");
const XLSX = require("xlsx");

const bifurcationController = {
  // Initialize bifurcation from container
  initializeFromContainer: async (req, res) => {
    try {
      const { containerCode } = req.params;
      const userId = req.user.id;

      const result = await bifurcationService.initializeFromContainer(
        containerCode,
        userId
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get bifurcation details
  getBifurcation: async (req, res) => {
    try {
      const { containerCode } = req.params;

      const bifurcation = await bifurcationService.getBifurcation(
        containerCode
      );

      res.status(200).json({
        success: true,
        data: bifurcation,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Update client details
  updateClientDetails: async (req, res) => {
    try {
      const { containerCode, clientName } = req.params;
      const data = req.body;
      const userId = req.user.id;

      const result = await bifurcationService.updateClientDetails(
        containerCode,
        clientName,
        data,
        userId
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Update container details
  updateContainerDetails: async (req, res) => {
    try {
      const { containerCode } = req.params;
      const data = req.body;
      const userId = req.user.id;

      const result = await bifurcationService.updateContainerDetails(
        containerCode,
        data,
        userId
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Add new client
  addNewClient: async (req, res) => {
    try {
      const { containerCode } = req.params;
      const clientData = req.body;
      const userId = req.user.id;

      const result = await bifurcationService.addNewClient(
        containerCode,
        clientData,
        userId
      );

      res.status(201).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Delete client
  deleteClient: async (req, res) => {
    try {
      const { containerCode, clientId } = req.params;
      const userId = req.user.id;

      const result = await bifurcationService.deleteClient(
        containerCode,
        clientId,
        userId
      );

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

  // Mark as complete
  markAsComplete: async (req, res) => {
    try {
      const { containerCode } = req.params;
      const userId = req.user.id;

      const result = await bifurcationService.markAsComplete(
        containerCode,
        userId
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Search bifurcation
  searchBifurcation: async (req, res) => {
    try {
      const { containerCode } = req.params;
      const { q } = req.query;

      const bifurcation = await bifurcationService.searchBifurcation(
        containerCode,
        q || ""
      );

      res.status(200).json({
        success: true,
        data: bifurcation,
      });
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

      const excelData = await bifurcationService.exportToExcel(containerCode);

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Add main data sheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Bifurcation");

      // Get bifurcation for summary
      const bifurcation = await bifurcationService.getBifurcation(
        containerCode
      );

      // Add summary sheet
      const summaryData = [
        {
          CONTAINER: bifurcation.containerCode,
          ORIGIN: bifurcation.origin || "",
          STATUS: bifurcation.status,
          "TOTAL CTN": bifurcation.totalCTN,
          "TOTAL CBM": bifurcation.totalCBM.toFixed(3),
          "TOTAL WEIGHT": bifurcation.totalWeight,
          "CLIENT COUNT": bifurcation.clientCount,
          "DELIVERY DATE": bifurcation.deliveryDate
            ? new Date(bifurcation.deliveryDate).toLocaleDateString()
            : "",
          "INV NO.": bifurcation.invNo || "",
          GST: bifurcation.gst || "",
          FROM: bifurcation.from || "",
          TO: bifurcation.to || "",
          LR: bifurcation.lr || "",
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
        `attachment; filename=${containerCode}_bifurcation_${new Date()
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

  // Get activities
  getActivities: async (req, res) => {
    try {
      const { containerCode } = req.params;
      const { limit = 20 } = req.query;

      const activities = await bifurcationService.getActivities(
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

  // Get all bifurcations
  getAllBifurcations: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "", status = "" } = req.query;

      const result = await bifurcationService.getAllBifurcations({
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

module.exports = bifurcationController;
