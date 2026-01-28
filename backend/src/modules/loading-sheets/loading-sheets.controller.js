const loadingSheetService = require("./loading-sheets.service");
const exportService = require("./export.service");

const loadingSheetController = {
  // Create or update loading sheet
  createOrUpdate: async (req, res) => {
    try {
      const { containerId } = req.params;
      const userId = req.user.id;

      const sheet = await loadingSheetService.createOrUpdateLoadingSheet(
        containerId,
        req.body,
        userId
      );

      res.status(200).json({
        success: true,
        message: "Loading sheet saved successfully",
        data: sheet,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to save loading sheet",
      });
    }
  },

  // Get all loading sheets for a container
  getByContainer: async (req, res) => {
    try {
      const { containerId } = req.params;
      const result = await loadingSheetService.getLoadingSheetsByContainer(containerId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message || "Container not found",
      });
    }
  },

  // Get single loading sheet
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const sheet = await loadingSheetService.getLoadingSheetById(id);

      res.json({
        success: true,
        data: sheet,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message || "Loading sheet not found",
      });
    }
  },

  // Delete loading sheet
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const result = await loadingSheetService.deleteLoadingSheet(id, userId);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to delete loading sheet",
      });
    }
  },

  // Upload photo
  uploadPhoto: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const { containerCode, shippingMark } = req.query;
      if (!containerCode) {
        return res.status(400).json({
          success: false,
          message: "Container code is required",
        });
      }

      // Decode shippingMark if it was URL-encoded (handles spaces, special chars)
      const decodedShippingMark = shippingMark ? decodeURIComponent(shippingMark) : "general";

      const photoPath = await loadingSheetService.uploadPhoto(
        req.file,
        containerCode,
        decodedShippingMark
      );

      res.json({
        success: true,
        message: "Photo uploaded successfully",
        data: { photo: photoPath },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to upload photo",
      });
    }
  },

  // Get shipping mark suggestions
  getShippingMarkSuggestions: async (req, res) => {
    try {
      const { search = "" } = req.query;
      const suggestions = await loadingSheetService.getShippingMarkSuggestions(search);

      res.json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch suggestions",
      });
    }
  },

  // Export Excel
  exportExcel: async (req, res) => {
    try {
      const { id } = req.params;
      const buffer = await exportService.generateExcel(id);

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=loading-sheet-${id}.xlsx`
      );
      res.send(buffer);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate Excel",
      });
    }
  },

  // Export PDF
  exportPDF: async (req, res) => {
    try {
      const { id } = req.params;
      const buffer = await exportService.generatePDF(id);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=loading-sheet-${id}.pdf`
      );
      res.send(buffer);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate PDF",
      });
    }
  },

  // Get WhatsApp Summary
  getWhatsAppSummary: async (req, res) => {
    try {
      const { id } = req.params;
      const summary = await exportService.generateWhatsAppSummary(id);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate summary",
      });
    }
  },

  // Update Status
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      const result = await loadingSheetService.updateStatus(id, status, userId);

      res.json({
        success: true,
        message: "Status updated successfully",
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to update status",
      });
    }
  },
  // Get activities
  getActivities: async (req, res) => {
    try {
      const result = await loadingSheetService.getActivities(req.query);
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch activities",
      });
    }
  },
};

module.exports = loadingSheetController;
