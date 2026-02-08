const { prisma } = require("../../database/prisma");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const settingsService = {
  // Get all settings
  getAllSettings: async () => {
    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: "asc" },
    });
    return settings;
  },

  // Get setting by key
  getSetting: async (key) => {
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });
    return setting;
  },

  // Update setting
  updateSetting: async (key, value, description = null) => {
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: {
        value: value.toString(),
        ...(description && { description })
      },
      create: {
        key,
        value: value.toString(),
        ...(description && { description })
      },
    });
    return setting;
  },

  // Get bifurcation settings
  getBifurcationSettings: async () => {
    const mixLimit = await prisma.systemSetting.findUnique({
      where: { key: "BIFURCATION_ITEM_LIMIT" },
    });
    const weightVeryHigh = await prisma.systemSetting.findUnique({
      where: { key: "BIFURCATION_WT_VERY_HIGH" },
    });
    const weightHigh = await prisma.systemSetting.findUnique({
      where: { key: "BIFURCATION_WT_HIGH" },
    });
    return {
      mixLimit: mixLimit ? parseInt(mixLimit.value) : 5,
      weightVeryHighThreshold: weightVeryHigh ? parseFloat(weightVeryHigh.value) : 69,
      weightHighThreshold: weightHigh ? parseFloat(weightHigh.value) : 75,
    };
  },

  // Update bifurcation settings
  updateBifurcationSettings: async ({ mixLimit, weightVeryHighThreshold, weightHighThreshold }) => {
    if (mixLimit) {
      await prisma.systemSetting.upsert({
        where: { key: "BIFURCATION_ITEM_LIMIT" },
        update: { value: mixLimit.toString() },
        create: {
          key: "BIFURCATION_ITEM_LIMIT",
          value: mixLimit.toString(),
          description: "Product layout limit for bifurcation reports."
        },
      });
    }

    if (weightVeryHighThreshold) {
      await prisma.systemSetting.upsert({
        where: { key: "BIFURCATION_WT_VERY_HIGH" },
        update: { value: weightVeryHighThreshold.toString() },
        create: {
          key: "BIFURCATION_WT_VERY_HIGH",
          value: weightVeryHighThreshold.toString(),
          description: "Weight threshold for Red highlighting (Very High Risk)."
        },
      });
    }

    if (weightHighThreshold) {
      await prisma.systemSetting.upsert({
        where: { key: "BIFURCATION_WT_HIGH" },
        update: { value: weightHighThreshold.toString() },
        create: {
          key: "BIFURCATION_WT_HIGH",
          value: weightHighThreshold.toString(),
          description: "Weight threshold for Yellow highlighting (High Risk)."
        },
      });
    }

    return {
      mixLimit: mixLimit ? parseInt(mixLimit) : undefined,
      weightVeryHighThreshold: weightVeryHighThreshold ? parseFloat(weightVeryHighThreshold) : undefined,
      weightHighThreshold: weightHighThreshold ? parseFloat(weightHighThreshold) : undefined,
    };
  },

  // Set accounts keyphrase
  setAccountsKeyphrase: async (keyphrase) => {
    if (!keyphrase || keyphrase.length < 4) {
      throw new Error("Keyphrase must be at least 4 characters");
    }

    // Hash the keyphrase
    const hashedKeyphrase = await bcrypt.hash(keyphrase, 10);

    await prisma.systemSetting.upsert({
      where: { key: "ACCOUNTS_KEYPHRASE_HASH" },
      update: { value: hashedKeyphrase },
      create: {
        key: "ACCOUNTS_KEYPHRASE_HASH",
        value: hashedKeyphrase,
        description: "Hashed keyphrase for accounts module access"
      },
    });

    // Generate a deterministic password from keyphrase
    const password = crypto
      .createHash("sha256")
      .update(keyphrase + "IMPEXINA_SALT")
      .digest("hex")
      .substring(0, 8)
      .toUpperCase();

    await prisma.systemSetting.upsert({
      where: { key: "ACCOUNTS_PASSWORD" },
      update: { value: password },
      create: {
        key: "ACCOUNTS_PASSWORD",
        value: password,
        description: "Generated password for accounts module (derived from keyphrase)"
      },
    });

    return {
      success: true,
      password, // Return the generated password
      message: "Keyphrase set successfully. Use the generated password to access accounts."
    };
  },

  // Verify accounts password/keyphrase
  verifyAccountsAccess: async (input) => {
    // Check if keyphrase hash exists
    const keyphraseHash = await prisma.systemSetting.findUnique({
      where: { key: "ACCOUNTS_KEYPHRASE_HASH" },
    });

    if (!keyphraseHash) {
      throw new Error("Accounts keyphrase not configured. Please set it in settings first.");
    }

    // Get the stored password
    const storedPassword = await prisma.systemSetting.findUnique({
      where: { key: "ACCOUNTS_PASSWORD" },
    });

    // Check if input matches stored password or keyphrase
    let isValid = false;

    // Option 1: Check if input matches stored password
    if (storedPassword && input === storedPassword.value) {
      isValid = true;
    }

    // Option 2: Check if input is the keyphrase
    if (!isValid) {
      isValid = await bcrypt.compare(input, keyphraseHash.value);
    }

    return { isValid };
  },

  // Get accounts settings (without sensitive data)
  getAccountsSettings: async () => {
    const keyphraseHash = await prisma.systemSetting.findUnique({
      where: { key: "ACCOUNTS_KEYPHRASE_HASH" },
    });

    return {
      isConfigured: !!keyphraseHash,
    };
  },
};

module.exports = settingsService;
