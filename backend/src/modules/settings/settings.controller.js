const settingsService = require("./settings.service");

const settingsController = {
  // Get all settings
  getAllSettings: async (req, res) => {
    try {
      const settings = await settingsService.getAllSettings();
      // Don't expose sensitive settings to non-admin users
      const filteredSettings = settings.map(s => ({
        key: s.key,
        value: s.key.includes("KEYPHRASE") || s.key.includes("PASSWORD") ? "***" : s.value,
        description: s.description,
        updatedAt: s.updatedAt,
      }));
      res.json({ success: true, data: filteredSettings });
    } catch (error) {
      console.error("Get Settings Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get setting by key
  getSetting: async (req, res) => {
    try {
      const { key } = req.params;
      const setting = await settingsService.getSetting(key);
      
      if (!setting) {
        return res.status(404).json({ success: false, message: "Setting not found" });
      }

      // Don't expose sensitive settings
      if (setting.key.includes("KEYPHRASE") || setting.key.includes("PASSWORD")) {
        setting.value = "***";
      }

      res.json({ success: true, data: setting });
    } catch (error) {
      console.error("Get Setting Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Update setting
  updateSetting: async (req, res) => {
    try {
      const { key, value, description } = req.body;
      
      if (!key) {
        return res.status(400).json({ success: false, message: "Setting key is required" });
      }

      const setting = await settingsService.updateSetting(key, value, description);
      
      // Don't expose sensitive settings
      if (setting.key.includes("KEYPHRASE") || setting.key.includes("PASSWORD")) {
        setting.value = "***";
      }

      res.json({ success: true, data: setting });
    } catch (error) {
      console.error("Update Setting Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get bifurcation settings
  getBifurcationSettings: async (req, res) => {
    try {
      const settings = await settingsService.getBifurcationSettings();
      res.json({ success: true, data: settings });
    } catch (error) {
      console.error("Get Bifurcation Settings Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Update bifurcation settings
  updateBifurcationSettings: async (req, res) => {
    try {
      const { mixLimit } = req.body;
      
      if (!mixLimit || mixLimit < 1) {
        return res.status(400).json({ success: false, message: "Mix limit must be at least 1" });
      }

      const settings = await settingsService.updateBifurcationSettings(mixLimit);
      res.json({ success: true, data: settings });
    } catch (error) {
      console.error("Update Bifurcation Settings Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Set accounts keyphrase
  setAccountsKeyphrase: async (req, res) => {
    try {
      const { keyphrase } = req.body;
      
      if (!keyphrase) {
        return res.status(400).json({ success: false, message: "Keyphrase is required" });
      }

      const result = await settingsService.setAccountsKeyphrase(keyphrase);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error("Set Accounts Keyphrase Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Verify accounts access
  verifyAccountsAccess: async (req, res) => {
    try {
      const { input } = req.body;
      
      if (!input) {
        return res.status(400).json({ success: false, message: "Password or keyphrase is required" });
      }

      const result = await settingsService.verifyAccountsAccess(input);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error("Verify Accounts Access Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get accounts settings
  getAccountsSettings: async (req, res) => {
    try {
      const settings = await settingsService.getAccountsSettings();
      res.json({ success: true, data: settings });
    } catch (error) {
      console.error("Get Accounts Settings Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = settingsController;
