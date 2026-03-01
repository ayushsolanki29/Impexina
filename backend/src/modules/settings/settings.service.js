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
    const cbmVeryHigh = await prisma.systemSetting.findUnique({
      where: { key: "BIFURCATION_CBM_VERY_HIGH" },
    });
    const cbmHigh = await prisma.systemSetting.findUnique({
      where: { key: "BIFURCATION_CBM_HIGH" },
    });

    return {
      mixLimit: mixLimit ? parseInt(mixLimit.value) : 5,
      weightVeryHighThreshold: weightVeryHigh ? parseFloat(weightVeryHigh.value) : 20,
      weightHighThreshold: weightHigh ? parseFloat(weightHigh.value) : 50,
      cbmVeryHighThreshold: cbmVeryHigh ? parseFloat(cbmVeryHigh.value) : 68,
      cbmHighThreshold: cbmHigh ? parseFloat(cbmHigh.value) : 69,
    };
  },

  // Update bifurcation settings
  updateBifurcationSettings: async ({ mixLimit, weightVeryHighThreshold, weightHighThreshold, cbmVeryHighThreshold, cbmHighThreshold }) => {
    const settings = [
      { key: "BIFURCATION_ITEM_LIMIT", value: mixLimit, desc: "Product layout limit for bifurcation reports." },
      { key: "BIFURCATION_WT_VERY_HIGH", value: weightVeryHighThreshold, desc: "Weight threshold for Red highlighting." },
      { key: "BIFURCATION_WT_HIGH", value: weightHighThreshold, desc: "Weight threshold for Yellow highlighting." },
      { key: "BIFURCATION_CBM_VERY_HIGH", value: cbmVeryHighThreshold, desc: "CBM threshold for Red highlighting." },
      { key: "BIFURCATION_CBM_HIGH", value: cbmHighThreshold, desc: "CBM threshold for Yellow highlighting." },
    ];

    for (const s of settings) {
      if (s.value !== undefined && s.value !== null) {
        await prisma.systemSetting.upsert({
          where: { key: s.key },
          update: { value: s.value.toString() },
          create: {
            key: s.key,
            value: s.value.toString(),
            description: s.desc
          },
        });
      }
    }

    return {
      success: true,
      settings: {
        mixLimit,
        weightVeryHighThreshold,
        weightHighThreshold,
        cbmVeryHighThreshold,
        cbmHighThreshold
      }
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
