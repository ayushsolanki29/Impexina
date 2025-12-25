const { prisma } = require("../../database/prisma");

const commercialInvoiceService = {
  // Initialize commercial invoice from bifurcation
  initializeFromBifurcation: async (containerCode, companyData, userId) => {
    try {
      // Check if invoice already exists
      const existing = await prisma.commercialInvoice.findUnique({
        where: { containerCode },
        include: {
          items: true,
        },
      });

      if (existing) {
        return {
          success: true,
          message: "Commercial invoice already exists",
          data: existing,
        };
      }

      // Get bifurcation data
      const bifurcation = await prisma.bifurcationContainer.findUnique({
        where: { containerCode },
        include: {
          clients: {
            include: {
              items: true,
            },
          },
        },
      });

      if (!bifurcation) {
        throw new Error("Bifurcation not found for container");
      }

      // Generate invoice number
      const invoiceNo = `CI${new Date().getFullYear().toString().slice(2)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      // Flatten items from all clients
      const allItems = [];
      let totalCtn = 0;
      let totalQty = 0;
      let totalAmount = 0;

      bifurcation.clients.forEach((client) => {
        client.items.forEach((item) => {
          const tQty = (item.ctn || 0) * (item.pcs || 0);
          const unitPrice = 0.05; // Default unit price
          const amountUsd = tQty * unitPrice;
          
          allItems.push({
            itemNumber: item.ctnMark || "",
            description: item.particular,
            ctn: item.ctn || 0,
            qtyPerCtn: item.pcs || 0,
            unit: item.unit || "PCS",
            tQty,
            unitPrice,
            amountUsd,
          });

          totalCtn += item.ctn || 0;
          totalQty += tQty;
          totalAmount += amountUsd;
        });
      });

      // Create commercial invoice
      const invoice = await prisma.commercialInvoice.create({
        data: {
          containerCode,
          invoiceNo,
          invoiceDate: new Date(),
          
          // Header Information
          companyName: companyData.companyName || "YIWU ZHOULAI TRADING CO., LIMITED",
          companyAddress: companyData.companyAddress || "Add.: Room 801, Unit 3, Building 1, Jiuheyuan, Jiangdong Street, Yiwu City, Jinhua City, Zhejiang Province Tel.:13735751445",
          title: "COMMERCIAL INVOICE",
          
          // Buyer Information
          buyerName: bifurcation.clients[0]?.from || "IMPEXINA GLOBAL PVT LTD",
          buyerAddress: bifurcation.clients[0]?.to || "Ground Floor, C-5, Gami Industrial Park Pawane\nMIDC Road NAVI MUMBAI, THANE, Maharashtra, 400705",
          buyerIEC: "IEC NO.: AAHCI1462J",
          buyerGST: "GST NO.: 27AAHCI1462J1ZG",
          buyerEmail: "EMAIL: impexina91@gmail.com",
          
          // Invoice Information
          from: "CHINA",
          to: bifurcation.to || "INDIA",
          cifText: "TOTAL CIF USD 9010 AND 90 WITHIN DAYS AFTER DELIVERY",
          
          // Bank Details
          bankDetail: `BENEFICIARY'S BANK NAME: ZHEJIANG TAILONG COMMERCIAL BANK\nBENEFICIARY NAME: YIWU ZHOULAI TRADING CO.,LIMITED\nSWIFT BIC: ZJTLNBHXKXX\nBENEFICIARY'S BANK ADD: ROOM 801, UNIT 3, BUILDING 1, JIUHEYUAN, JIANGDONG STREET, YIWU CITY, JINHUA CITY, ZHEJIANG PROVINCE\nBENEFICIARY A/C NO.: 330800202001000155179`,
          
          // Stamp Settings
          stampText: "YIWU ZHOULAI TRADING CO., LIMITED\nAUTHORIZED SIGNATORY",
          stampPosition: "BOTTOM_RIGHT",
          
          // Totals
          totalCtn,
          totalQty,
          totalAmount,
          
          // Metadata
          createdBy: userId.toString(),
          updatedBy: userId.toString(),
        },
      });

      // Create items
      const itemPromises = allItems.map((item) =>
        prisma.commercialInvoiceItem.create({
          data: {
            invoiceId: invoice.id,
            itemNumber: item.itemNumber,
            description: item.description,
            ctn: item.ctn,
            qtyPerCtn: item.qtyPerCtn,
            unit: item.unit,
            tQty: item.tQty,
            unitPrice: item.unitPrice,
            amountUsd: item.amountUsd,
          },
        })
      );

      await Promise.all(itemPromises);

      // Create activity log
      await prisma.commercialInvoiceActivity.create({
        data: {
          invoiceId: invoice.id,
          userId,
          type: "CREATED",
          note: "Commercial invoice initialized from bifurcation",
        },
      });

      // Get complete invoice
      const completeInvoice = await prisma.commercialInvoice.findUnique({
        where: { id: invoice.id },
        include: {
          items: true,
          activities: {
            include: {
              user: {
                select: {
                  name: true,
                  username: true,
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
        message: "Commercial invoice initialized successfully",
        data: completeInvoice,
      };
    } catch (error) {
      console.error("Error initializing commercial invoice:", error);
      throw error;
    }
  },

  // Get commercial invoice by container code
  getCommercialInvoice: async (containerCode) => {
    try {
      const invoice = await prisma.commercialInvoice.findUnique({
        where: { containerCode },
        include: {
          items: {
            orderBy: {
              description: "asc",
            },
          },
          activities: {
            include: {
              user: {
                select: {
                  name: true,
                  username: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 50,
          },
        },
      });

      if (!invoice) {
        throw new Error("Commercial invoice not found");
      }

      return {
        success: true,
        data: invoice,
      };
    } catch (error) {
      console.error("Error getting commercial invoice:", error);
      throw error;
    }
  },

  // Update commercial invoice
  updateCommercialInvoice: async (containerCode, data, userId) => {
    try {
      // Get current invoice
      const currentInvoice = await prisma.commercialInvoice.findUnique({
        where: { containerCode },
      });

      if (!currentInvoice) {
        throw new Error("Commercial invoice not found");
      }

      // Prepare update data
      const updateData = {
        // Header Information
        ...(data.companyName !== undefined && { companyName: data.companyName }),
        ...(data.companyAddress !== undefined && { companyAddress: data.companyAddress }),
        ...(data.title !== undefined && { title: data.title }),
        
        // Buyer Information
        ...(data.buyerName !== undefined && { buyerName: data.buyerName }),
        ...(data.buyerAddress !== undefined && { buyerAddress: data.buyerAddress }),
        ...(data.buyerIEC !== undefined && { buyerIEC: data.buyerIEC }),
        ...(data.buyerGST !== undefined && { buyerGST: data.buyerGST }),
        ...(data.buyerEmail !== undefined && { buyerEmail: data.buyerEmail }),
        
        // Invoice Information
        ...(data.invoiceNo !== undefined && { invoiceNo: data.invoiceNo }),
        ...(data.date !== undefined && { invoiceDate: new Date(data.date) }),
        ...(data.from !== undefined && { from: data.from }),
        ...(data.to !== undefined && { to: data.to }),
        ...(data.cifText !== undefined && { cifText: data.cifText }),
        
        // Bank Details
        ...(data.bankDetail !== undefined && { bankDetail: data.bankDetail }),
        
        // Stamp Settings
        ...(data.stampImage !== undefined && { stampImage: data.stampImage }),
        ...(data.stampPosition !== undefined && { stampPosition: data.stampPosition }),
        ...(data.stampText !== undefined && { stampText: data.stampText }),
        
        // Status
        ...(data.status !== undefined && { status: data.status }),
        
        // Metadata
        updatedBy: userId.toString(),
        updatedAt: new Date(),
      };

      // Update invoice
      const updatedInvoice = await prisma.commercialInvoice.update({
        where: { containerCode },
        data: updateData,
      });

      // Log field changes
      const changedFields = [];
      for (const [field, newValue] of Object.entries(data)) {
        const oldValue = currentInvoice[field];
        if (oldValue !== newValue && newValue !== undefined) {
          changedFields.push(field);
          await prisma.commercialInvoiceActivity.create({
            data: {
              invoiceId: currentInvoice.id,
              userId,
              type: "FIELD_UPDATED",
              field,
              oldValue: oldValue?.toString() || "",
              newValue: newValue?.toString() || "",
              note: `Updated ${field}`,
            },
          });
        }
      }

      // Log overall update if fields changed
      if (changedFields.length > 0) {
        await prisma.commercialInvoiceActivity.create({
          data: {
            invoiceId: currentInvoice.id,
            userId,
            type: "UPDATED",
            note: `Updated ${changedFields.length} field(s): ${changedFields.join(', ')}`,
          },
        });
      }

      return {
        success: true,
        message: "Commercial invoice updated successfully",
        data: updatedInvoice,
      };
    } catch (error) {
      console.error("Error updating commercial invoice:", error);
      throw error;
    }
  },

  // Update items
  updateItems: async (containerCode, items, userId) => {
    try {
      const invoice = await prisma.commercialInvoice.findUnique({
        where: { containerCode },
      });

      if (!invoice) {
        throw new Error("Commercial invoice not found");
      }

      // Delete existing items
      await prisma.commercialInvoiceItem.deleteMany({
        where: { invoiceId: invoice.id },
      });

      // Create new items
      const itemPromises = items.map((item) =>
        prisma.commercialInvoiceItem.create({
          data: {
            invoiceId: invoice.id,
            itemNumber: item.itemNumber,
            description: item.description,
            ctn: parseInt(item.ctn) || 0,
            qtyPerCtn: parseInt(item.qtyPerCtn) || 0,
            unit: item.unit || "PCS",
            tQty: parseInt(item.tQty) || 0,
            unitPrice: parseFloat(item.unitPrice) || 0,
            amountUsd: parseFloat(item.amountUsd) || 0,
            photo: item.photo,
            fromPerson: item.from,
            toPerson: item.to,
          },
        })
      );

      await Promise.all(itemPromises);

      // Recalculate totals
      const totalCtn = items.reduce((sum, item) => sum + (parseInt(item.ctn) || 0), 0);
      const totalQty = items.reduce((sum, item) => sum + (parseInt(item.tQty) || 0), 0);
      const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.amountUsd) || 0), 0);

      // Update totals
      await prisma.commercialInvoice.update({
        where: { containerCode },
        data: {
          totalCtn,
          totalQty,
          totalAmount,
          updatedBy: userId.toString(),
          updatedAt: new Date(),
        },
      });

      // Create activity log
      await prisma.commercialInvoiceActivity.create({
        data: {
          invoiceId: invoice.id,
          userId,
          type: "ITEMS_UPDATED",
          note: "Updated commercial invoice items",
        },
      });

      return {
        success: true,
        message: "Items updated successfully",
      };
    } catch (error) {
      console.error("Error updating items:", error);
      throw error;
    }
  },

  // Mark as printed
  markAsPrinted: async (containerCode, userId) => {
    try {
      const invoice = await prisma.commercialInvoice.findUnique({
        where: { containerCode },
      });

      if (!invoice) {
        throw new Error("Commercial invoice not found");
      }

      const oldStatus = invoice.status;

      const updatedInvoice = await prisma.commercialInvoice.update({
        where: { containerCode },
        data: {
          status: "PRINTED",
          updatedBy: userId.toString(),
          updatedAt: new Date(),
        },
      });

      // Create activity log
      await prisma.commercialInvoiceActivity.create({
        data: {
          invoiceId: invoice.id,
          userId,
          type: "STATUS_CHANGE",
          oldValue: oldStatus,
          newValue: "PRINTED",
          note: "Marked commercial invoice as printed",
        },
      });

      return {
        success: true,
        message: "Commercial invoice marked as printed",
        data: updatedInvoice,
      };
    } catch (error) {
      console.error("Error marking as printed:", error);
      throw error;
    }
  },

  // Log activity
  logActivity: async (invoiceId, userId, type, field, oldValue, newValue, note) => {
    try {
      const activity = await prisma.commercialInvoiceActivity.create({
        data: {
          invoiceId,
          userId,
          type,
          field,
          oldValue,
          newValue,
          note,
        },
      });
      return activity;
    } catch (error) {
      console.error("Error logging activity:", error);
      throw error;
    }
  },

  // Get activities
  getActivities: async (containerCode, limit = 50) => {
    try {
      const invoice = await prisma.commercialInvoice.findUnique({
        where: { containerCode },
        include: {
          activities: {
            include: {
              user: {
                select: {
                  name: true,
                  username: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
            take: limit,
          },
        },
      });

      if (!invoice) {
        throw new Error("Commercial invoice not found");
      }

      return invoice.activities;
    } catch (error) {
      console.error("Error getting activities:", error);
      throw error;
    }
  },

  // Get all commercial invoices
  getAllCommercialInvoices: async ({ page = 1, limit = 10, search = "", status }) => {
    try {
      const skip = (page - 1) * limit;

      const where = {};

      if (search) {
        where.OR = [
          { containerCode: { contains: search, mode: "insensitive" } },
          { invoiceNo: { contains: search, mode: "insensitive" } },
          { buyerName: { contains: search, mode: "insensitive" } },
        ];
      }

      if (status) {
        where.status = status;
      }

      const [invoices, total] = await Promise.all([
        prisma.commercialInvoice.findMany({
          where,
          skip,
          take: limit,
          include: {
            _count: {
              select: { items: true, activities: true },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
        prisma.commercialInvoice.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        invoices,
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
      console.error("Error getting all commercial invoices:", error);
      throw error;
    }
  },
};

module.exports = commercialInvoiceService;