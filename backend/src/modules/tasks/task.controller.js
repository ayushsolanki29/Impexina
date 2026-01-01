const taskService = require('./task.service');

const taskController = {
  // Get all tasks (admin view)
  getAllTasks: async (req, res) => {
    try {
      const filters = req.query;
      const result = await taskService.getAllTasks(filters);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch tasks'
      });
    }
  },

  // Get single task
  getTaskById: async (req, res) => {
    try {
      const { id } = req.params;
      const task = await taskService.getTaskById(id);
      
      res.json({
        success: true,
        data: task
      });
    } catch (error) {
      console.error('Error fetching task:', error);
      if (error.message === 'Task not found') {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to fetch task'
      });
    }
  },

  // Get user's own tasks
  getMyTasks: async (req, res) => {
    try {
      const userId = req.user.id;
      const filters = req.query;
      const tasks = await taskService.getMyTasks(userId, filters);
      
      res.json({
        success: true,
        data: tasks
      });
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch your tasks'
      });
    }
  },

  // Create task (admin only)
  createTask: async (req, res) => {
    try {
      const assignedById = req.user.id;
      const taskData = req.body;
      
      const task = await taskService.createTask(taskData, assignedById);
      
      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: task
      });
    } catch (error) {
      console.error('Error creating task:', error);
      if (error.message === 'Assignee not found') {
        return res.status(404).json({
          success: false,
          message: 'Assignee not found'
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create task'
      });
    }
  },

  // Update task
  updateTask: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const updatedTask = await taskService.updateTask(id, updates, userId, userRole);
      
      res.json({
        success: true,
        message: 'Task updated successfully',
        data: updatedTask
      });
    } catch (error) {
      console.error('Error updating task:', error);
      if (error.message === 'Task not found') {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }
      if (error.message === 'New assignee not found') {
        return res.status(404).json({
          success: false,
          message: 'New assignee not found'
        });
      }
      if (error.message.includes('permission')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to update task'
      });
    }
  },

  // Delete task (admin only)
  deleteTask: async (req, res) => {
    try {
      const { id } = req.params;
      
      await taskService.deleteTask(id);
      
      res.json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      if (error.message === 'Task not found') {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to delete task'
      });
    }
  },

  // Mark task as complete
  markComplete: async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const userId = req.user.id;
      
      const updatedTask = await taskService.markTaskComplete(id, userId, notes);
      
      res.json({
        success: true,
        message: 'Task marked as complete',
        data: updatedTask
      });
    } catch (error) {
      console.error('Error marking task complete:', error);
      if (error.message === 'Task not found') {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }
      if (error.message.includes('only mark your own tasks')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to mark task as complete'
      });
    }
  },

  // Get users for task assignment
  getUsersForAssignment: async (req, res) => {
    try {
      const users = await taskService.getUsersForAssignment();
      
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users'
      });
    }
  },

  // Get dashboard stats
  getTaskStats: async (req, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const stats = await taskService.getTaskStats(userId, userRole);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching task stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch task statistics'
      });
    }
  },

  // Get tasks by frequency
  getTasksByFrequency: async (req, res) => {
    try {
      const userId = req.user.id;
      const { frequency } = req.params;
      
      const validFrequencies = ['DAILY', 'WEEKLY', 'MONTHLY', 'AS_PER_REQUIREMENT'];
      
      if (!validFrequencies.includes(frequency.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid frequency type'
        });
      }
      
      const tasks = await taskService.getTasksByFrequency(userId, frequency.toUpperCase());
      
      res.json({
        success: true,
        data: tasks
      });
    } catch (error) {
      console.error('Error fetching tasks by frequency:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tasks'
      });
    }
  }
};

module.exports = taskController;