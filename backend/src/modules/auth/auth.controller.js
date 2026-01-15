const authService = require("./auth.service");

const authController = {
  login: async (req, res) => {
    try {
      const { token, user } = await authService.login(req.body);

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          token,
          user,
        },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message,
      });
    }
  },

  me: async (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        id: req.user.publicId,
        name: req.user.name,
        username: req.user.username,
        role: req.user.role,
        isSuper: req.user.isSuper || false,
        permissions: req.user.permissions.map(
          (p) => p.module.key
        ),
      },
    });
  },
};

module.exports = authController;
