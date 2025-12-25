const { prisma } = require("../../database/prisma");

const bifurcationService = {
  // Initialize bifurcation from container
  initializeFromContainer: async (containerCode, userId) => {
    try {
      // Check if bifurcation already exists
      const existing = await prisma.bifurcationContainer.findUnique({
        where: { containerCode },
        include: {
          clients: {
            include: {
              items: true,
            },
          },
        },
      });

      if (existing) {
        return {
          success: true,
          message: "Bifurcation already exists",
          data: existing,
        };
      }

      // Get container details with loading sheets
      const container = await prisma.container.findUnique({
        where: { containerCode },
        include: {
          loadingSheets: {
            include: {
              shippingMark: true,
              items: {
                include: {
                  ctnMark: true,
                },
              },
            },
          },
        },
      });

      if (!container) {
        throw new Error("Container not found");
      }

      // Group items by shipping mark (client)
      const clientGroups = {};
      let totalCTN = 0;
      let totalCBM = 0;
      let totalWeight = 0;

      container.loadingSheets.forEach((sheet) => {
        const clientName = sheet.shippingMark.name;

        if (!clientGroups[clientName]) {
          clientGroups[clientName] = {
            clientName,
            loadingDate: sheet.loadingDate,
            ctn: 0,
            product: "MIX ITEM",
            totalCBM: 0,
            totalWeight: 0,
            items: [],
          };
        }

        sheet.items.forEach((item) => {
          clientGroups[clientName].ctn += item.ctn || 0;
          clientGroups[clientName].totalCBM += parseFloat(item.tcbm) || 0;
          clientGroups[clientName].totalWeight += parseFloat(item.twt) || 0;

          // Add to items list
          clientGroups[clientName].items.push({
            particular: item.particular,
            ctnMark: item.ctnMark.name,
            ctn: item.ctn,
            pcs: item.pcs,
            cbm: item.cbm,
            weight: item.wt,
            unit: item.unit,
            photo: item.photo,
          });

          // Update totals
          totalCTN += item.ctn || 0;
          totalCBM += parseFloat(item.tcbm) || 0;
          totalWeight += parseFloat(item.twt) || 0;
        });

        // Determine product name
        const itemCount = clientGroups[clientName].items.length;
        if (itemCount <= 5) {
          clientGroups[clientName].product = clientGroups[clientName].items
            .map((item) => item.particular)
            .join(", ");
        } else {
          clientGroups[clientName].product = "MIX ITEM";
        }
      });

      // Create bifurcation container
      const bifurcationContainer = await prisma.bifurcationContainer.create({
        data: {
          containerCode,
          origin: container.origin,
          loadingDate: container.loadingSheets[0]?.loadingDate || new Date(),
          status: "DRAFT",
          totalCTN,
          totalCBM: parseFloat(totalCBM.toFixed(3)),
          totalWeight: parseFloat(totalWeight.toFixed(2)),
          clientCount: Object.keys(clientGroups).length,
          sheetCount: container.loadingSheets.length,
        },
      });

      // Create clients and items
      const clientPromises = Object.values(clientGroups).map(
        async (clientGroup) => {
          const client = await prisma.bifurcationClient.create({
            data: {
              containerCode,
              clientName: clientGroup.clientName,
              loadingDate: clientGroup.loadingDate,
              ctn: clientGroup.ctn,
              product: clientGroup.product,
              totalCBM: parseFloat(clientGroup.totalCBM.toFixed(3)),
              totalWeight: parseFloat(clientGroup.totalWeight.toFixed(2)),
              status: "draft",
            },
          });

          // Create items for this client
          const itemPromises = clientGroup.items.map((item) =>
            prisma.bifurcationItem.create({
              data: {
                clientId: client.id,
                containerCode,
                particular: item.particular,
                ctnMark: item.ctnMark,
                ctn: item.ctn,
                pcs: item.pcs,
                cbm: item.cbm,
                weight: item.weight,
                unit: item.unit,
                photo: item.photo,
              },
            })
          );

          await Promise.all(itemPromises);
          return client;
        }
      );

      await Promise.all(clientPromises);

      // Create activity log
      await prisma.bifurcationActivity.create({
        data: {
          containerCode,
          userId,
          type: "CREATED",
          newValue: {
            containerCode,
            clientCount: Object.keys(clientGroups).length,
            totalCTN,
            totalCBM: parseFloat(totalCBM.toFixed(3)),
            totalWeight: parseFloat(totalWeight.toFixed(2)),
          },
          note: "Bifurcation initialized from container",
        },
      });

      // Get created bifurcation with relations
      const createdBifurcation = await prisma.bifurcationContainer.findUnique({
        where: { containerCode },
        include: {
          clients: {
            include: {
              items: true,
            },
          },
          activities: {
            include: {
              user: {
                select: {
                  name: true,
                  role: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 10,
          },
        },
      });

      return {
        success: true,
        message: "Bifurcation initialized successfully",
        data: createdBifurcation,
      };
    } catch (error) {
      console.error("Error initializing bifurcation:", error);
      throw error;
    }
  },

  // Get bifurcation by container code
// In bifurcationService.js

  // Get bifurcation by container code
  getBifurcation: async (containerCode) => {
    try {
      const bifurcation = await prisma.bifurcationContainer.findUnique({
        where: { containerCode },
        include: {
          clients: {
            include: {
              items: {
                orderBy: {
                  particular: "asc",
                },
              },
            },
            orderBy: {
              clientName: "asc",
            },
          },
          activities: {
            include: {
              user: {
                select: {
                  name: true,
                  role: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 20,
          },
        },
      });

      if (!bifurcation) {
        throw new Error("Bifurcation not found");
      }

      // 👇 THIS IS THE FIX 👇
      // Wrap the result so frontend sees 'success: true'
      return {
        success: true,
        data: bifurcation
      };
      
    } catch (error) {
      console.error("Error getting bifurcation:", error);
      throw error;
    }
  },
  // Update client bifurcation details
  updateClientDetails: async (containerCode, clientName, data, userId) => {
    try {
      const { deliveryDate, invNo, gst, from, to, lr, status } = data;

      // Find client
      const client = await prisma.bifurcationClient.findFirst({
        where: {
          containerCode,
          clientName,
        },
      });

      if (!client) {
        throw new Error("Client not found in bifurcation");
      }

      const oldValue = {
        deliveryDate: client.deliveryDate,
        invNo: client.invNo,
        gst: client.gst,
        from: client.from,
        to: client.to,
        lr: client.lr,
        status: client.status,
      };

      // Update client
      const updatedClient = await prisma.bifurcationClient.update({
        where: { id: client.id },
        data: {
          ...(deliveryDate && { deliveryDate: new Date(deliveryDate) }),
          ...(invNo && { invNo }),
          ...(gst && { gst }),
          ...(from && { from }),
          ...(to && { to }),
          ...(lr && { lr }),
          ...(status && { status }),
        },
      });

      // Create activity log
      await prisma.bifurcationActivity.create({
        data: {
          containerCode,
          userId,
          type: "CLIENT_UPDATED",
          oldValue,
          newValue: data,
          note: `Updated details for client: ${clientName}`,
        },
      });

      return {
        success: true,
        message: "Client details updated successfully",
        data: updatedClient,
      };
    } catch (error) {
      console.error("Error updating client details:", error);
      throw error;
    }
  },

  // Update container bifurcation details
  updateContainerDetails: async (containerCode, data, userId) => {
    try {
      const { deliveryDate, invNo, gst, from, to, lr, note, status } = data;

      const container = await prisma.bifurcationContainer.findUnique({
        where: { containerCode },
      });

      if (!container) {
        throw new Error("Bifurcation container not found");
      }

      const oldValue = {
        deliveryDate: container.deliveryDate,
        invNo: container.invNo,
        gst: container.gst,
        from: container.from,
        to: container.to,
        lr: container.lr,
        note: container.note,
        status: container.status,
      };

      // Update container
      const updatedContainer = await prisma.bifurcationContainer.update({
        where: { containerCode },
        data: {
          ...(deliveryDate && { deliveryDate: new Date(deliveryDate) }),
          ...(invNo && { invNo }),
          ...(gst && { gst }),
          ...(from && { from }),
          ...(to && { to }),
          ...(lr && { lr }),
          ...(note && { note }),
          ...(status && { status }),
        },
      });

      // Create activity log
      await prisma.bifurcationActivity.create({
        data: {
          containerCode,
          userId,
          type: "CONTAINER_UPDATED",
          oldValue,
          newValue: data,
          note: "Updated container bifurcation details",
        },
      });

      return {
        success: true,
        message: "Container details updated successfully",
        data: updatedContainer,
      };
    } catch (error) {
      console.error("Error updating container details:", error);
      throw error;
    }
  },

  // Add new client to bifurcation
  addNewClient: async (containerCode, clientData, userId) => {
    try {
      const {
        clientName,
        mark,
        ctn,
        product,
        totalCBM,
        totalWeight,
        loadingDate,
        deliveryDate,
        invNo,
        gst,
        from,
        to,
        lr,
      } = clientData;

      // Check if client already exists
      const existingClient = await prisma.bifurcationClient.findFirst({
        where: {
          containerCode,
          clientName,
        },
      });

      if (existingClient) {
        throw new Error("Client already exists in bifurcation");
      }

      // Create new client
      const newClient = await prisma.bifurcationClient.create({
        data: {
          containerCode,
          clientName: mark || clientName,
          loadingDate: loadingDate ? new Date(loadingDate) : new Date(),
          ctn: parseInt(ctn) || 0,
          product: product || "MIX ITEM",
          totalCBM: parseFloat(totalCBM) || 0,
          totalWeight: parseFloat(totalWeight) || 0,
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
          invNo,
          gst,
          from,
          to,
          lr,
          status: "draft",
        },
      });

      // Update container totals
      const container = await prisma.bifurcationContainer.findUnique({
        where: { containerCode },
      });

      await prisma.bifurcationContainer.update({
        where: { containerCode },
        data: {
          totalCTN: container.totalCTN + (parseInt(ctn) || 0),
          totalCBM: container.totalCBM + (parseFloat(totalCBM) || 0),
          totalWeight: container.totalWeight + (parseFloat(totalWeight) || 0),
          clientCount: container.clientCount + 1,
        },
      });

      // Create activity log
      await prisma.bifurcationActivity.create({
        data: {
          containerCode,
          userId,
          type: "CLIENT_ADDED",
          newValue: clientData,
          note: `Added new client: ${clientName}`,
        },
      });

      return {
        success: true,
        message: "Client added successfully",
        data: newClient,
      };
    } catch (error) {
      console.error("Error adding new client:", error);
      throw error;
    }
  },

  // Delete client from bifurcation
  deleteClient: async (containerCode, clientId, userId) => {
    try {
      // Get client details for activity log
      const client = await prisma.bifurcationClient.findUnique({
        where: { id: clientId },
      });

      if (!client || client.containerCode !== containerCode) {
        throw new Error("Client not found");
      }

      // Delete client (items will cascade)
      await prisma.bifurcationClient.delete({
        where: { id: clientId },
      });

      // Update container totals
      const container = await prisma.bifurcationContainer.findUnique({
        where: { containerCode },
      });

      await prisma.bifurcationContainer.update({
        where: { containerCode },
        data: {
          totalCTN: container.totalCTN - client.ctn,
          totalCBM: container.totalCBM - client.totalCBM,
          totalWeight: container.totalWeight - client.totalWeight,
          clientCount: container.clientCount - 1,
        },
      });

      // Create activity log
      await prisma.bifurcationActivity.create({
        data: {
          containerCode,
          userId,
          type: "CLIENT_REMOVED",
          oldValue: client,
          note: `Removed client: ${client.clientName}`,
        },
      });

      return {
        success: true,
        message: "Client deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting client:", error);
      throw error;
    }
  },

  // Mark bifurcation as complete
  markAsComplete: async (containerCode, userId) => {
    try {
      const container = await prisma.bifurcationContainer.findUnique({
        where: { containerCode },
      });

      if (!container) {
        throw new Error("Bifurcation not found");
      }

      if (container.status === "COMPLETED") {
        throw new Error("Bifurcation is already completed");
      }

      const oldStatus = container.status;

      // Update container status
      const updatedContainer = await prisma.bifurcationContainer.update({
        where: { containerCode },
        data: {
          status: "COMPLETED",
        },
      });

      // Update all clients to completed
      await prisma.bifurcationClient.updateMany({
        where: { containerCode },
        data: { status: "completed" },
      });

      // Create activity log
      await prisma.bifurcationActivity.create({
        data: {
          containerCode,
          userId,
          type: "STATUS_CHANGE",
          oldValue: { status: oldStatus },
          newValue: { status: "COMPLETED" },
          note: "Marked bifurcation as complete",
        },
      });

      return {
        success: true,
        message: "Bifurcation marked as complete",
        data: updatedContainer,
      };
    } catch (error) {
      console.error("Error marking as complete:", error);
      throw error;
    }
  },

  // Search bifurcation
  searchBifurcation: async (containerCode, searchQuery) => {
    try {
      const bifurcation = await prisma.bifurcationContainer.findUnique({
        where: { containerCode },
        include: {
          clients: {
            where: {
              OR: [
                { clientName: { contains: searchQuery, mode: "insensitive" } },
                { product: { contains: searchQuery, mode: "insensitive" } },
                { invNo: { contains: searchQuery, mode: "insensitive" } },
                { from: { contains: searchQuery, mode: "insensitive" } },
                { to: { contains: searchQuery, mode: "insensitive" } },
                { lr: { contains: searchQuery, mode: "insensitive" } },
              ],
            },
            include: {
              items: true,
            },
            orderBy: {
              clientName: "asc",
            },
          },
        },
      });

      if (!bifurcation) {
        throw new Error("Bifurcation not found");
      }

      return bifurcation;
    } catch (error) {
      console.error("Error searching bifurcation:", error);
      throw error;
    }
  },

  // Export bifurcation to Excel
  exportToExcel: async (containerCode) => {
    try {
      const bifurcation = await prisma.bifurcationContainer.findUnique({
        where: { containerCode },
        include: {
          clients: {
            include: {
              items: true,
            },
            orderBy: {
              clientName: "asc",
            },
          },
        },
      });

      if (!bifurcation) {
        throw new Error("Bifurcation not found");
      }

      // Prepare data for Excel
      const excelData = bifurcation.clients.map((client) => ({
        "CONTAINER CODE": bifurcation.containerCode,
        MARK: client.clientName,
        CTN: client.ctn,
        PRODUCT: client.product,
        "TOTAL CBM": client.totalCBM,
        "TOTAL WEIGHT": client.totalWeight,
        "LOADING DATE": client.loadingDate
          ? new Date(client.loadingDate).toLocaleDateString()
          : "",
        "DELIVERY DATE": client.deliveryDate
          ? new Date(client.deliveryDate).toLocaleDateString()
          : "",
        "INV NO.": client.invNo || "",
        GST: client.gst || "",
        FROM: client.from || "",
        TO: client.to || "",
        LR: client.lr || "",
        STATUS: client.status.toUpperCase(),
      }));

      return excelData;
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      throw error;
    }
  },

  // Get bifurcation activities
  getActivities: async (containerCode, limit = 20) => {
    try {
      const activities = await prisma.bifurcationActivity.findMany({
        where: { containerCode },
        include: {
          user: {
            select: {
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      });

      return activities;
    } catch (error) {
      console.error("Error getting activities:", error);
      throw error;
    }
  },

  // Get all bifurcations with pagination
  getAllBifurcations: async ({ page = 1, limit = 10, search = "", status }) => {
    try {
      const skip = (page - 1) * limit;

      const where = {};

      if (search) {
        where.containerCode = {
          contains: search,
          mode: "insensitive",
        };
      }

      if (status) {
        where.status = status;
      }

      const [bifurcations, total] = await Promise.all([
        prisma.bifurcationContainer.findMany({
          where,
          skip,
          take: limit,
          include: {
            clients: {
              select: {
                _count: {
                  select: { items: true },
                },
              },
            },
            _count: {
              select: { clients: true, activities: true },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
        prisma.bifurcationContainer.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        bifurcations,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      console.error("Error getting all bifurcations:", error);
      throw error;
    }
  },
};

module.exports = bifurcationService;