const taskTemplateService = require("./taskTemplate.service");

const taskTemplateController = {
  // =====================================================
  // TASK TEMPLATES
  // =====================================================

  // Get all templates
  getAllTemplates: async (req, res) => {
    try {
      const filters = req.query;
      const result = await taskTemplateService.getAllTemplates(filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch templates",
      });
    }
  },

  // Get single template
  getTemplateById: async (req, res) => {
    try {
      const { id } = req.params;
      const template = await taskTemplateService.getTemplateById(id);

      res.json({
        success: true,
        data: template,
      });
    } catch (error) {
      console.error("Error fetching template:", error);
      if (error.message === "Template not found") {
        return res.status(404).json({
          success: false,
          message: "Template not found",
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch template",
      });
    }
  },

  // Create template
  createTemplate: async (req, res) => {
    try {
      const createdById = req.user.id;
      const templateData = req.body;

      const template = await taskTemplateService.createTemplate(templateData, createdById);

      res.status(201).json({
        success: true,
        message: "Template created successfully",
        data: template,
      });
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create template",
      });
    }
  },

  // Update template
  updateTemplate: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updatedTemplate = await taskTemplateService.updateTemplate(id, updates);

      res.json({
        success: true,
        message: "Template updated successfully",
        data: updatedTemplate,
      });
    } catch (error) {
      console.error("Error updating template:", error);
      if (error.message === "Template not found") {
        return res.status(404).json({
          success: false,
          message: "Template not found",
        });
      }
      if (error.message.includes("System templates")) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update template",
      });
    }
  },

  // Delete template
  deleteTemplate: async (req, res) => {
    try {
      const { id } = req.params;

      await taskTemplateService.deleteTemplate(id);

      res.json({
        success: true,
        message: "Template deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting template:", error);
      if (error.message === "Template not found") {
        return res.status(404).json({
          success: false,
          message: "Template not found",
        });
      }
      if (error.message.includes("System templates")) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete template",
      });
    }
  },

  // Get template categories
  getCategories: async (req, res) => {
    try {
      const categories = await taskTemplateService.getCategories();

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch categories",
      });
    }
  },

  // =====================================================
  // TASK ASSIGNMENTS
  // =====================================================

  // Get all assignments (admin view)
  getAllAssignments: async (req, res) => {
    try {
      const filters = req.query;
      const result = await taskTemplateService.getAllAssignments(filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch assignments",
      });
    }
  },

  // Get user's assigned tasks (My Tasks)
  getMyTasks: async (req, res) => {
    try {
      const userId = req.user.id;
      const filters = req.query;
      const tasks = await taskTemplateService.getMyTasks(userId, filters);

      res.json({
        success: true,
        data: tasks,
      });
    } catch (error) {
      console.error("Error fetching my tasks:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch your tasks",
      });
    }
  },

  // Get single assignment
  getAssignmentById: async (req, res) => {
    try {
      const { id } = req.params;
      const assignment = await taskTemplateService.getAssignmentById(id);

      res.json({
        success: true,
        data: assignment,
      });
    } catch (error) {
      console.error("Error fetching assignment:", error);
      if (error.message === "Task assignment not found") {
        return res.status(404).json({
          success: false,
          message: "Task assignment not found",
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch assignment",
      });
    }
  },

  // Create assignment (admin assigns task to user)
  createAssignment: async (req, res) => {
    try {
      const assignedById = req.user.id;
      const assignmentData = req.body;

      const assignment = await taskTemplateService.createAssignment(
        assignmentData,
        assignedById
      );

      res.status(201).json({
        success: true,
        message: "Task assigned successfully",
        data: assignment,
      });
    } catch (error) {
      console.error("Error creating assignment:", error);
      if (error.message === "Template not found") {
        return res.status(404).json({
          success: false,
          message: "Template not found",
        });
      }
      if (error.message === "Assignee not found") {
        return res.status(404).json({
          success: false,
          message: "Assignee not found",
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || "Failed to assign task",
      });
    }
  },

  // Create self task (user creates their own task)
  createSelfTask: async (req, res) => {
    try {
      const userId = req.user.id;
      const taskData = req.body;

      const task = await taskTemplateService.createSelfTask(taskData, userId);

      res.status(201).json({
        success: true,
        message: "Task created successfully",
        data: task,
      });
    } catch (error) {
      console.error("Error creating self task:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create task",
      });
    }
  },

  // Update assignment
  updateAssignment: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      const updatedAssignment = await taskTemplateService.updateAssignment(
        id,
        updates,
        userId,
        userRole
      );

      res.json({
        success: true,
        message: "Task updated successfully",
        data: updatedAssignment,
      });
    } catch (error) {
      console.error("Error updating assignment:", error);
      if (error.message === "Task assignment not found") {
        return res.status(404).json({
          success: false,
          message: "Task assignment not found",
        });
      }
      if (error.message.includes("permission")) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update task",
      });
    }
  },

  // Delete assignment
  deleteAssignment: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      await taskTemplateService.deleteAssignment(id, userId, userRole);

      res.json({
        success: true,
        message: "Task deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting assignment:", error);
      if (error.message === "Task assignment not found") {
        return res.status(404).json({
          success: false,
          message: "Task assignment not found",
        });
      }
      if (error.message.includes("permission")) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete task",
      });
    }
  },

  // =====================================================
  // TASK COMPLETIONS
  // =====================================================

  // Complete a task
  completeTask: async (req, res) => {
    try {
      const { id } = req.params;
      const { completionNote } = req.body;
      const userId = req.user.id;

      const completion = await taskTemplateService.completeTask(
        id,
        userId,
        completionNote
      );

      res.json({
        success: true,
        message: "Task completed successfully",
        data: completion,
      });
    } catch (error) {
      console.error("Error completing task:", error);
      if (error.message === "Task assignment not found") {
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }
      if (error.message.includes("already been completed")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message.includes("at least")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message.includes("assigned to you")) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || "Failed to complete task",
      });
    }
  },

  // Get completions for an assignment
  getCompletions: async (req, res) => {
    try {
      const { id } = req.params;
      const filters = req.query;
      const result = await taskTemplateService.getCompletions(id, filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error fetching completions:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch completions",
      });
    }
  },

  // Get user's completion history
  getMyCompletions: async (req, res) => {
    try {
      const userId = req.user.id;
      const filters = req.query;
      const result = await taskTemplateService.getMyCompletions(userId, filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error fetching my completions:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch your completions",
      });
    }
  },

  // =====================================================
  // STATISTICS
  // =====================================================

  getStats: async (req, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const stats = await taskTemplateService.getStats(userId, userRole);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch statistics",
      });
    }
  },

  // Get users for assignment
  getUsersForAssignment: async (req, res) => {
    try {
      const users = await taskTemplateService.getUsersForAssignment();

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch users",
      });
    }
  },

  // Get min completion characters
  getMinCompletionChars: async (req, res) => {
    try {
      const minChars = await taskTemplateService.getMinCompletionChars();

      res.json({
        success: true,
        data: { minChars },
      });
    } catch (error) {
      console.error("Error fetching min chars:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch minimum characters",
      });
    }
  },

  // =====================================================
  // ADMIN PERFORMANCE REPORTS
  // =====================================================

  // Get all completions (admin view)
  getAllCompletions: async (req, res) => {
    try {
      const filters = req.query;
      const result = await taskTemplateService.getAllCompletions(filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error fetching completions:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch completions",
      });
    }
  },

  // Get user performance report
  getUserPerformanceReport: async (req, res) => {
    try {
      const filters = req.query;
      const result = await taskTemplateService.getUserPerformanceReport(filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error fetching performance report:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch performance report",
      });
    }
  },

  // Get performance summary by period
  getPerformanceSummary: async (req, res) => {
    try {
      const filters = req.query;
      const result = await taskTemplateService.getPerformanceSummary(filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error fetching performance summary:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch performance summary",
      });
    }
  },
};

module.exports = taskTemplateController;
