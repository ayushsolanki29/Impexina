const { prisma } = require("../../database/prisma");

const clientsService = {
  // Get all clients with pagination and filtering
  getAllClients: async ({ page = 1, limit = 20, search = "", type = "", status = "" }) => {
    const skip = (page - 1) * limit;
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { updatedAt: "desc" },
      }),
      prisma.client.count({ where }),
    ]);

    return { clients, total, page: parseInt(page), totalPages: Math.ceil(total / limit) };
  },

  // Get client by ID
  getClientById: async (clientId) => {
    return prisma.client.findUnique({
      where: { id: clientId },
      include: {
        loadingSheets: {
          take: 10,
          orderBy: { createdAt: "desc" }
        },
        orders: {
          take: 10,
          orderBy: { id: "desc" }
        }
      }
    });
  },

  // Create new client
  createClient: async (data) => {
    return prisma.client.create({
      data,
    });
  },

  // Update client
  updateClient: async (clientId, data) => {
    return prisma.client.update({
      where: { id: clientId },
      data,
    });
  },

  // Delete client
  deleteClient: async (clientId) => {
    return prisma.client.delete({
      where: { id: clientId },
    });
  },

  // Search Suggestions (Lightweight)
  getSuggestions: async (search) => {
    if (!search) return [];
    
    return prisma.client.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { companyName: { contains: search, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        companyName: true,
        type: true
      },
      take: 10
    });
  }
};

module.exports = clientsService;
