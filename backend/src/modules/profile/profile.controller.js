const profileService = require("./profile.service");

class ProfileController {
  // Get Profile
  async getProfile(req, res, next) {
    try {
      const user = await profileService.getProfile(req.user.id);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update Profile
  async updateProfile(req, res, next) {
    try {
      const { name, username } = req.body;
      const updatedUser = await profileService.updateProfile(req.user.id, {
        name,
        username,
      });
      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  // Change Password
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Current and new password are required",
        });
      }

      await profileService.changePassword(
        req.user.id,
        currentPassword,
        newPassword
      );

      res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProfileController();
