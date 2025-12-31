const { prisma } = require("../../database/prisma");

const clientsService = {
  // Get all clients/leads
  getAllClients: async ({ 
    page = 1, 
    limit = 20, 
    search = "", 
    type = "", 
    status = "",
    city = "",
    sortBy = "createdAt",
    sortOrder = "desc"
  }) => {
    try {
      const skip = (page - 1) * limit;
      
      const where = {};
      
      // Search filter
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { contactPerson: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { companyName: { contains: search, mode: 'insensitive' } },
          { gstNumber: { contains: search, mode: 'insensitive' } },
        ];
      }
      
      // Type filter (LEAD or CLIENT)
      if (type && ["LEAD", "CLIENT"].includes(type.toUpperCase())) {
        where.type = type.toUpperCase();
      }
      
      // Status filter
      if (status) {
        where.status = status.toUpperCase();
      }
      
      // City filter
      if (city) {
        where.city = { contains: city, mode: 'insensitive' };
      }
      
      // Sort configuration
      const orderBy = {};
      if (sortBy === "name") {
        orderBy.name = sortOrder;
      } else if (sortBy === "status") {
        orderBy.status = sortOrder;
      } else if (sortBy === "lastContacted") {
        orderBy.lastContactedAt = sortOrder;
      } else {
        orderBy.createdAt = sortOrder;
      }
      
      const [clients, total] = await Promise.all([
        prisma.client.findMany({
          where,
          skip,
          take: parseInt(limit),
          include: {
            shippingMarks: {
              select: {
                name: true,
                source: true,
              },
              take: 3,
            },
            ctnMarks: {
              select: {
                name: true,
              },
              take: 3,
            },
            _count: {
              select: { 
                clientActivities: true,
                shippingMarks: true,
                orders: true,
              },
            },
          },
          orderBy,
        }),
        prisma.client.count({ where }),
      ]);
      
      const totalPages = Math.ceil(total / limit);
      
      return {
        clients,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      console.error("Error getting clients:", error);
      throw error;
    }
  },
  
  // Get client by ID
// Get client by ID - FIXED
getClientById: async (clientId) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        shippingMarks: {
          orderBy: { createdAt: 'desc' },
        },
        ctnMarks: {
          orderBy: { createdAt: 'desc' },
        },
        clientActivities: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        orders: {
          // REMOVE orderBy since Order model doesn't have createdAt
          // or order by id if needed
          orderBy: { id: 'desc' },
          take: 10,
        },
      },
    });
    
    if (!client) {
      throw new Error("Client not found");
    }
    
    return client;
  } catch (error) {
    console.error("Error getting client:", error);
    throw error;
  }
},
  
  // Create new client/lead
  createClient: async (clientData, userId, userName) => {
    try {
      const {
        name,
        contactPerson,
        email,
        phone,
        mobile,
        address,
        city,
        state,
        country,
        type,
        status,
        companyName,
        gstNumber,
        industry,
        creditLimit,
        paymentTerms,
        currency,
        notes,
        tags,
        source,
        rating,
        lastContactedAt,
        nextFollowUpAt,
      } = clientData;
      
      // Check if client already exists (by name and email/phone)
      const existingClient = await prisma.client.findFirst({
        where: {
          OR: [
            { name: name },
            { email: email ? email : undefined },
            { phone: phone ? phone : undefined },
          ],
        },
      });
      
      if (existingClient) {
        throw new Error("Client with same name, email or phone already exists");
      }
      
      const client = await prisma.$transaction(async (prisma) => {
        // Create client
        const newClient = await prisma.client.create({
          data: {
            name,
            contactPerson: contactPerson || null,
            email: email || null,
            phone: phone || null,
            mobile: mobile || null,
            address: address || null,
            city: city || null,
            state: state || null,
            country: country || "India",
            type: type || "LEAD",
            status: status || "NEW",
            companyName: companyName || null,
            gstNumber: gstNumber || null,
            industry: industry || null,
            creditLimit: creditLimit ? parseFloat(creditLimit) : null,
            paymentTerms: paymentTerms || "NET30",
            currency: currency || "INR",
            notes: notes || null,
            tags: tags || [],
            source: source || null,
            rating: rating || null,
            lastContactedAt: lastContactedAt ? new Date(lastContactedAt) : null,
            nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        
        // Create activity log
        await prisma.clientActivity.create({
          data: {
            clientId: newClient.id,
            type: "CREATE",
            description: "Client/Lead created",
            userId: userId.toString(),
            userName: userName,
            metadata: {
              createdBy: userName,
              timestamp: new Date().toISOString(),
            },
            createdAt: new Date(),
          },
        });
        
        return newClient;
      });
      
      return client;
    } catch (error) {
      console.error("Error creating client:", error);
      throw error;
    }
  },
  
  // Update client/lead
  updateClient: async (clientId, clientData, userId, userName) => {
    try {
      // Get old client data for comparison
      const oldClient = await prisma.client.findUnique({
        where: { id: clientId },
      });
      
      if (!oldClient) {
        throw new Error("Client not found");
      }
      
      const client = await prisma.$transaction(async (prisma) => {
        // Update client
        const updatedClient = await prisma.client.update({
          where: { id: clientId },
          data: {
            ...clientData,
            updatedAt: new Date(),
          },
        });
        
        // Create activity log for update
        const changes = [];
        Object.keys(clientData).forEach(key => {
          if (JSON.stringify(oldClient[key]) !== JSON.stringify(clientData[key])) {
            changes.push({
              field: key,
              oldValue: oldClient[key],
              newValue: clientData[key],
            });
          }
        });
        
        if (changes.length > 0) {
          await prisma.clientActivity.create({
            data: {
              clientId,
              type: "UPDATE",
              description: "Client details updated",
              userId: userId.toString(),
              userName: userName,
              metadata: {
                changes,
                updatedBy: userName,
                timestamp: new Date().toISOString(),
              },
              createdAt: new Date(),
            },
          });
        }
        
        return updatedClient;
      });
      
      return client;
    } catch (error) {
      console.error("Error updating client:", error);
      throw error;
    }
  },
  
  // Delete client/lead (soft delete - mark as INACTIVE)
  deleteClient: async (clientId, userId, userName) => {
    try {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });
      
      if (!client) {
        throw new Error("Client not found");
      }
      
      // Check if client has related data
      const [shippingMarksCount, ctnMarksCount, ordersCount] = await Promise.all([
        prisma.shippingMark.count({ where: { clientId } }),
        prisma.ctnMark.count({ where: { clientId } }),
        prisma.order.count({ where: { clientId } }),
      ]);
      
      if (shippingMarksCount > 0 || ctnMarksCount > 0 || ordersCount > 0) {
        // Soft delete - change status to INACTIVE
        await prisma.client.update({
          where: { id: clientId },
          data: {
            status: "INACTIVE",
            updatedAt: new Date(),
          },
        });
        
        // Create activity log
        await prisma.clientActivity.create({
          data: {
            clientId,
            type: "UPDATE",
            description: "Client marked as INACTIVE (has related data)",
            userId: userId.toString(),
            userName: userName,
            metadata: {
              deactivatedBy: userName,
              reason: "Has related shipping marks, container marks, or orders",
              timestamp: new Date().toISOString(),
            },
            createdAt: new Date(),
          },
        });
        
        return {
          message: "Client marked as INACTIVE (has related data)",
          type: "soft",
        };
      } else {
        // Hard delete
        await prisma.$transaction(async (prisma) => {
          // Delete activities first
          await prisma.clientActivity.deleteMany({
            where: { clientId },
          });
          
          // Delete client
          await prisma.client.delete({
            where: { id: clientId },
          });
        });
        
        return {
          message: "Client deleted successfully",
          type: "hard",
        };
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      throw error;
    }
  },
  
  // Convert lead to client
  convertLeadToClient: async (clientId, userId, userName) => {
    try {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });
      
      if (!client) {
        throw new Error("Client not found");
      }
      
      if (client.type === "CLIENT") {
        throw new Error("Already a client");
      }
      
      const updatedClient = await prisma.$transaction(async (prisma) => {
        // Update client type and status
        const convertedClient = await prisma.client.update({
          where: { id: clientId },
          data: {
            type: "CLIENT",
            status: "ACTIVE",
            convertedAt: new Date(),
            updatedAt: new Date(),
          },
        });
        
        // Create activity log
        await prisma.clientActivity.create({
          data: {
            clientId,
            type: "STATUS_CHANGE",
            description: "Lead converted to Client",
            userId: userId.toString(),
            userName: userName,
            metadata: {
              convertedBy: userName,
              oldType: "LEAD",
              newType: "CLIENT",
              oldStatus: client.status,
              newStatus: "ACTIVE",
              timestamp: new Date().toISOString(),
            },
            createdAt: new Date(),
          },
        });
        
        return convertedClient;
      });
      
      return updatedClient;
    } catch (error) {
      console.error("Error converting lead:", error);
      throw error;
    }
  },
  
  // Update client status
  updateClientStatus: async (clientId, status, userId, userName) => {
    try {
      const oldClient = await prisma.client.findUnique({
        where: { id: clientId },
      });
      
      if (!oldClient) {
        throw new Error("Client not found");
      }
      
      const updatedClient = await prisma.$transaction(async (prisma) => {
        // Update status
        const client = await prisma.client.update({
          where: { id: clientId },
          data: {
            status: status,
            updatedAt: new Date(),
            ...(status === "CONTACTED" ? { lastContactedAt: new Date() } : {}),
          },
        });
        
        // Create activity log
        await prisma.clientActivity.create({
          data: {
            clientId,
            type: "STATUS_CHANGE",
            description: `Status changed from ${oldClient.status} to ${status}`,
            userId: userId.toString(),
            userName: userName,
            metadata: {
              updatedBy: userName,
              oldStatus: oldClient.status,
              newStatus: status,
              timestamp: new Date().toISOString(),
            },
            createdAt: new Date(),
          },
        });
        
        return client;
      });
      
      return updatedClient;
    } catch (error) {
      console.error("Error updating status:", error);
      throw error;
    }
  },
  
  // Get client activities
  getClientActivities: async (clientId, { page = 1, limit = 20 }) => {
    try {
      const skip = (page - 1) * limit;
      
      const [activities, total] = await Promise.all([
        prisma.clientActivity.findMany({
          where: { clientId },
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.clientActivity.count({ where: { clientId } }),
      ]);
      
      const totalPages = Math.ceil(total / limit);
      
      return {
        activities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      console.error("Error getting activities:", error);
      throw error;
    }
  },
  
  // Add client activity
  addClientActivity: async (clientId, activityData, userId, userName) => {
    try {
      const { type, description, metadata } = activityData;
      
      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });
      
      if (!client) {
        throw new Error("Client not found");
      }
      
      // Update last contacted date for CALL, EMAIL, MEETING activities
      if (["CALL", "EMAIL", "MEETING"].includes(type)) {
        await prisma.client.update({
          where: { id: clientId },
          data: {
            lastContactedAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
      
      const activity = await prisma.clientActivity.create({
        data: {
          clientId,
          type,
          description,
          userId: userId.toString(),
          userName: userName,
          metadata: metadata || {},
          createdAt: new Date(),
        },
      });
      
      return activity;
    } catch (error) {
      console.error("Error adding activity:", error);
      throw error;
    }
  },
  
  // Get dashboard statistics
  getDashboardStats: async () => {
    try {
      const [
        totalClients,
        totalLeads,
        activeClients,
        newClients,
        inactiveClients,
        recentActivities,
        topCities,
        statusDistribution,
      ] = await Promise.all([
        // Total clients
        prisma.client.count(),
        
        // Total leads
        prisma.client.count({ where: { type: "LEAD" } }),
        
        // Active clients
        prisma.client.count({ where: { status: "ACTIVE" } }),
        
        // New clients/leads
        prisma.client.count({ 
          where: { 
            OR: [
              { status: "NEW" },
              { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
            ]
          } 
        }),
        
        // Inactive clients
        prisma.client.count({ where: { status: "INACTIVE" } }),
        
        // Recent activities (last 7 days)
        prisma.clientActivity.count({
          where: {
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        }),
        
        // Top cities
        prisma.client.groupBy({
          by: ['city'],
          where: { city: { not: null } },
          _count: { city: true },
          orderBy: { _count: { city: 'desc' } },
          take: 5,
        }),
        
        // Status distribution
        prisma.client.groupBy({
          by: ['status'],
          _count: { status: true },
        }),
      ]);
      
      return {
        totalClients,
        totalLeads,
        totalClientsOnly: totalClients - totalLeads,
        activeClients,
        newClients,
        inactiveClients,
        recentActivities,
        topCities: topCities.map(city => ({
          city: city.city,
          count: city._count.city,
        })),
        statusDistribution: statusDistribution.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {}),
      };
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      throw error;
    }
  },
  
  // Bulk update clients
  bulkUpdateClients: async (ids, updates, userId, userName) => {
    try {
      const result = await prisma.$transaction(async (prisma) => {
        // Update clients
        const updatedClients = await prisma.client.updateMany({
          where: { id: { in: ids } },
          data: {
            ...updates,
            updatedAt: new Date(),
          },
        });
        
        // Create activity logs for each client
        const activityPromises = ids.map(clientId =>
          prisma.clientActivity.create({
            data: {
              clientId,
              type: "UPDATE",
              description: "Bulk update performed",
              userId: userId.toString(),
              userName: userName,
              metadata: {
                updates,
                performedBy: userName,
                timestamp: new Date().toISOString(),
              },
              createdAt: new Date(),
            },
          })
        );
        
        await Promise.all(activityPromises);
        
        return {
          count: updatedClients.count,
          updatedIds: ids,
        };
      });
      
      return result;
    } catch (error) {
      console.error("Error in bulk update:", error);
      throw error;
    }
  },
  
  // Search suggestions
  searchSuggestions: async (search = "", type = "", limit = 10) => {
    try {
      const where = {};
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { contactPerson: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { companyName: { contains: search, mode: 'insensitive' } },
        ];
      }
      
      if (type) {
        where.type = type.toUpperCase();
      }
      
      const suggestions = await prisma.client.findMany({
        where,
        select: {
          id: true,
          name: true,
          contactPerson: true,
          email: true,
          phone: true,
          city: true,
          type: true,
          status: true,
          companyName: true,
        },
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      });
      
      return suggestions;
    } catch (error) {
      console.error("Error getting suggestions:", error);
      throw error;
    }
  },
  
  // Get distinct cities
  getCities: async () => {
    try {
      const cities = await prisma.client.findMany({
        where: { city: { not: null } },
        select: { city: true },
        distinct: ['city'],
        orderBy: { city: 'asc' },
      });
      
      return cities.map(c => c.city).filter(c => c);
    } catch (error) {
      console.error("Error getting cities:", error);
      throw error;
    }
  },
};

module.exports = clientsService;