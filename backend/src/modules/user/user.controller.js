const userController = {
  // Get all users with pagination
  getAllUsers: async (req, res) => {
    try {
      const { page = 1, limit = 10, search, role } = req.query;
      const users = await userService.getAllUsers({ 
        page: parseInt(page), 
        limit: parseInt(limit), 
        search,
        role 
      });
      res.json(users);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get user by ID
  getUserById: async (req, res) => {
    try {
      const user = await userService.getUserById(req.params.id);
      res.json(user);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  // Create new user
  createUser: async (req, res) => {
    try {
      const user = await userService.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Update user
  updateUser: async (req, res) => {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Delete user (soft delete)
  deleteUser: async (req, res) => {
    try {
      await userService.deleteUser(req.params.id);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get user performance metrics
  getUserPerformance: async (req, res) => {
    try {
      const performance = await userService.getUserPerformance(req.params.id);
      res.json(performance);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get current user profile
  getMyProfile: async (req, res) => {
    try {
      const user = await userService.getUserById(req.user.id);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Update current user profile
  updateMyProfile: async (req, res) => {
    try {
      const user = await userService.updateUser(req.user.id, req.body);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = userController;