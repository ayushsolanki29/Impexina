const containerService = require("./containers.service");

const containerController = {
  // Create container
  create: async (req, res) => {
    try {
      const container = await containerService.createContainer(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: "Container created successfully",
        data: container,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to create container",
      });
    }
  },

  // Get all containers
  getAll: async (req, res) => {
    try {
      const { page, limit, search, origin, status } = req.query;
      const result = await containerService.getAllContainers({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        search,
        origin,
        status,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch containers",
      });
    }
  },

  // Get single container
  getById: async (req, res) => {
    try {
      const container = await containerService.getContainerById(req.params.id);
      res.json({
        success: true,
        data: container,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message || "Container not found",
      });
    }
  },

  // Update container
  update: async (req, res) => {
    try {
      const container = await containerService.updateContainer(
        req.params.id,
        req.body,
        req.user.id
      );
      res.json({
        success: true,
        message: "Container updated successfully",
        data: container,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to update container",
      });
    }
  },

  // Delete container
  delete: async (req, res) => {
    try {
      const result = await containerService.deleteContainer(req.params.id, req.user.id);
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to delete container",
      });
    }

  },

  getActivities: async (req, res) => {
    try {
      const result = await containerService.getActivities(req.query);
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

  getUniqueOrigins: async (req, res) => {
    try {
      const origins = await containerService.getUniqueOrigins();
      res.json({
        success: true,
        data: origins,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch origins",
      });
    }
  },
};


module.exports = containerController;
