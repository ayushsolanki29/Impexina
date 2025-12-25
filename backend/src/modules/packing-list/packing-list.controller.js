const packingListService = require("./packing-list.service");

const packingListController = {
  // Initialize packing list from bifurcation
  initializeFromBifurcation: async (req, res) => {
    try {
      const { containerCode } = req.params;
      const { companyMasterId } = req.body;
      const userId = req.user.id;

      const result = await packingListService.initializeFromBifurcation(
        containerCode,
        companyMasterId,
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

  // Get packing list
  getPackingList: async (req, res) => {
    try {
      const { containerCode } = req.params;

      const result = await packingListService.getPackingList(containerCode);

      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Update packing list
  updatePackingList: async (req, res) => {
    try {
      const { containerCode } = req.params;
      const data = req.body;
      const userId = req.user.id;

      const result = await packingListService.updatePackingList(
        containerCode,
        data,
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

  // Update items
  updateItems: async (req, res) => {
    try {
      const { containerCode } = req.params;
      const { items } = req.body;
      const userId = req.user.id;

      const result = await packingListService.updateItems(
        containerCode,
        items,
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

  // Get company masters
  getCompanyMasters: async (req, res) => {
    try {
      const result = await packingListService.getCompanyMasters();

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Update company master
  updateCompanyMaster: async (req, res) => {
    try {
      const { companyId } = req.params;
      const data = req.body;
      const userId = req.user.id;

      const result = await packingListService.updateCompanyMaster(
        companyId,
        data,
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

  // Mark as printed
  markAsPrinted: async (req, res) => {
    try {
      const { containerCode } = req.params;
      const userId = req.user.id;

      const result = await packingListService.markAsPrinted(
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

  // Log activity
  logActivity: async (req, res) => {
    try {
      const { containerCode } = req.params;
      const { type, field, oldValue, newValue, note } = req.body;
      const userId = req.user.id;

      const packingList = await packingListService.getPackingList(containerCode);
      
      if (!packingList.data) {
        return res.status(404).json({
          success: false,
          message: "Packing list not found",
        });
      }

      const activity = await packingListService.logActivity(
        packingList.data.id,
        userId,
        type,
        field,
        oldValue,
        newValue,
        note
      );

      res.status(200).json({
        success: true,
        message: "Activity logged successfully",
        data: activity,
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
      const { limit = 50 } = req.query;

      const activities = await packingListService.getActivities(
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

  // Get all packing lists
  getAllPackingLists: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "", status = "" } = req.query;

      const result = await packingListService.getAllPackingLists({
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

module.exports = packingListController;