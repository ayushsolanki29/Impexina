const packingListService = require("./packing-list.service");
const companyMasterService = require("./company-master.service");
const exportService = require("./export.service");

const packingListController = {
  // --- Packing List Endpoints ---

  getAll: async (req, res) => {
    try {
      const result = await packingListService.getAllContainers(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getByContainerId: async (req, res) => {
    try {
      const { containerId } = req.params;
      const result = await packingListService.getPackingListByContainer(containerId);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  },

  createOrUpdate: async (req, res) => {
    try {
      const { containerId } = req.params;
      const userId = req.user.id;
      const result = await packingListService.createOrUpdate(containerId, req.body, userId);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  importLoadingItems: async (req, res) => {
    try {
      const { containerId } = req.params;
      const items = await packingListService.importFromLoadingSheets(containerId);
      res.json({ success: true, data: items });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      await packingListService.delete(id);
      res.json({ success: true, message: "Packing list deleted" });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

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
        `attachment; filename=packing-list-${id}.xlsx`
      );
      res.send(buffer);
    } catch (error) {
      console.error("Packing List Export Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  exportAll: async (req, res) => {
    try {
      const buffer = await exportService.generateAllContainersExcel();

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=all-packing-lists-${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      res.send(buffer);
    } catch (error) {
      console.error("All Packing Lists Export Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // --- Company Master (Templates) Endpoints ---

  getTemplates: async (req, res) => {
    try {
      const templates = await companyMasterService.getAll();
      res.json({ success: true, data: templates });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getTemplateSuggestions: async (req, res) => {
    try {
      const { search = "" } = req.query;
      const templates = await companyMasterService.getSuggestions(search);
      res.json({ success: true, data: templates });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  upsertTemplate: async (req, res) => {
    try {
      const template = await companyMasterService.upsert(req.body);
      res.json({ success: true, data: template });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  deleteTemplate: async (req, res) => {
    try {
      const { id } = req.params;
      await companyMasterService.delete(id);
      res.json({ success: true, message: "Template deleted" });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
};

module.exports = packingListController;