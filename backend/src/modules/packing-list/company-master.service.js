const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const companyMasterService = {
  // Get all templates
  getAll: async () => {
    return await prisma.companyMaster.findMany({
      orderBy: { updatedAt: "desc" },
    });
  },

  // Get single template
  getById: async (id) => {
    return await prisma.companyMaster.findUnique({
      where: { id },
    });
  },

  // Create or update template
  upsert: async (data) => {
    const { id, ...rest } = data;
    
    if (id) {
      return await prisma.companyMaster.update({
        where: { id },
        data: rest,
      });
    }

    // Use companyName as unique key - update if exists, create if not
    if (!rest.companyName?.trim()) {
      throw new Error("Company name is required");
    }
    return await prisma.companyMaster.upsert({
      where: { companyName: rest.companyName.trim() },
      create: rest,
      update: rest,
    });
  },

  // Delete template
  delete: async (id) => {
    return await prisma.companyMaster.delete({
      where: { id },
    });
  },

  // Get suggestions for templates
  getSuggestions: async (searchString) => {
    return await prisma.companyMaster.findMany({
      where: {
        OR: [
          { companyName: { contains: searchString, mode: "insensitive" } },
          { bankName: { contains: searchString, mode: "insensitive" } },
        ],
      },
      take: 10,
    });
  },
};

module.exports = companyMasterService;
