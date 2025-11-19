const authController = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  register: async (req, res) => {
    try {
      const userData = req.body;
      const result = await authService.register(userData);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getProfile: async (req, res) => {
    try {
      const user = await authService.getProfile(req.user.id);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};

module.exports = authController;
