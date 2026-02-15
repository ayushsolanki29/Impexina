const bifurcationService = require('./bifurcation.service');
const exportService = require('./export.service');

const bifurcationController = {
  getReport: async (req, res) => {
    try {
      const filters = req.query;
      const result = await bifurcationService.getBifurcationReport(filters);
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        settings: result.settings
      });
    } catch (error) {
      console.error('Bifurcation Report Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  exportExcel: async (req, res) => {
    try {
      const filters = req.query;
      const buffer = await exportService.generateExcel(filters);

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=bifurcation-report-${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      res.send(buffer);
    } catch (error) {
      console.error('Bifurcation Export Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updateDetails: async (req, res) => {
    try {
      const { loadingSheetId } = req.params;
      const data = req.body;
      const userId = req.user.id;

      const result = await bifurcationService.upsertBifurcation(loadingSheetId, data, userId);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Bifurcation Update Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getActivities: async (req, res) => {
    try {
      const filters = req.query;
      const result = await bifurcationService.getBifurcationActivities(filters);
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Bifurcation Activities Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getActivityContainers: async (req, res) => {
    try {
      const result = await bifurcationService.getUniqueContainersForActivities();
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Bifurcation Activity Containers Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updateSetting: async (req, res) => {
    try {
      const { key, value } = req.body;
      const result = await bifurcationService.updateSetting(key, value);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getContainerSuggestions: async (req, res) => {
    try {
      const { search } = req.query;
      const result = await bifurcationService.searchContainers(search);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Container Suggestions Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getLocations: async (req, res) => {
    try {
      const result = await bifurcationService.getUniqueLocations();
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Bifurcation Locations Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = bifurcationController;
