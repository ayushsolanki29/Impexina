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
  createClient: async (data, user) => {
    // Check for existing client with same name (case-insensitive)
    const existing = await prisma.client.findFirst({
      where: { name: { equals: data.name, mode: 'insensitive' } }
    });

    if (existing) {
      throw new Error(`Client "${data.name}" already exists`);
    }

    const client = await prisma.client.create({
      data,
    });

    // Log Activity
    if (user) {
      await prisma.clientActivity.create({
        data: {
          clientId: client.id,
          userId: String(user.id),
          userName: user.name,
          type: 'CREATE',
          description: `Created client: ${client.name}`,
          metadata: data
        }
      });
    }

    return client;
  },

  // Update client
  updateClient: async (clientId, data, user) => {
    if (data.name) {
      const existing = await prisma.client.findFirst({
        where: {
          name: { equals: data.name, mode: 'insensitive' },
          id: { not: clientId }
        }
      });

      if (existing) {
        throw new Error(`Another client with name "${data.name}" already exists`);
      }
    }

    const client = await prisma.client.update({
      where: { id: clientId },
      data,
    });

    // Log Activity
    if (user) {
      await prisma.clientActivity.create({
        data: {
          clientId,
          userId: String(user.id),
          userName: user.name,
          type: 'UPDATE',
          description: `Updated client: ${client.name}`,
          metadata: data
        }
      });
    }

    return client;
  },

  // Delete client
  deleteClient: async (clientId, user) => {
    const client = await prisma.client.findUnique({ where: { id: clientId } });

    // Log Activity before deletion (optional since cascaded)
    if (user && client) {
      // Since it cascades, the activity would be deleted. 
      // We can keep it if we want to log it to a different table, 
      // but following existing pattern for now.
    }

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
