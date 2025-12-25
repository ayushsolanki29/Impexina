const { prisma } = require("../../database/prisma");

const packingListService = {
  // Initialize packing list from bifurcation
  initializeFromBifurcation: async (containerCode, companyMasterId, userId) => {
    try {
      // Check if packing list already exists
      const existing = await prisma.packingList.findUnique({
        where: { containerCode },
        include: {
          companyMaster: true,
          items: true,
        },
      });

      if (existing) {
        return {
          success: true,
          message: "Packing list already exists",
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

      // Get company master data
      const companyMaster = await prisma.companyMaster.findUnique({
        where: { id: companyMasterId },
      });

      if (!companyMaster) {
        throw new Error("Company master data not found");
      }

      // Generate invoice number
      const invNo = `IGPL${new Date().getFullYear().toString().slice(2)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      // Flatten items from all clients
      const allItems = [];
      let totalCtn = 0;
      let totalQty = 0;
      let totalWeight = 0;

      bifurcation.clients.forEach((client) => {
        client.items.forEach((item) => {
          const tQty = (item.ctn || 0) * (item.pcs || 0);
          const tKg = (item.ctn || 0) * (item.weight || 0);
          
          allItems.push({
            itemNumber: item.ctnMark || "",
            particular: item.particular,
            ctn: item.ctn || 0,
            qtyPerCtn: item.pcs || 0,
            unit: item.unit || "PCS",
            tQty,
            kg: item.weight || 0,
            tKg,
          });

          totalCtn += item.ctn || 0;
          totalQty += tQty;
          totalWeight += tKg;
        });
      });

      // Create packing list with all new fields
      const packingList = await prisma.packingList.create({
        data: {
          containerCode,
          invNo,
          invoiceNo: invNo,
          invoiceDate: new Date(),
          date: new Date(),
          
          // Header Information from company master
          headerCompanyName: companyMaster.companyName,
          headerCompanyAddress: companyMaster.companyAddress,
          headerPhone: companyMaster.companyPhone,
          
          // Seller Information from bifurcation
          sellerName: bifurcation.clients[0]?.from || "IMPORTER",
          sellerAddress: bifurcation.clients[0]?.to || "",
          sellerIecNo: "AAHCI1462J",
          sellerGst: bifurcation.gst || "",
          sellerEmail: "impexina91@gmail.com",
          
          // Invoice Information
          from: bifurcation.from || "CHINA",
          to: bifurcation.to || "INDIA",
          
          // Bank Details from company master
          bankName: companyMaster.bankName,
          beneficiaryName: companyMaster.beneficiaryName,
          swiftBic: companyMaster.swiftBic,
          bankAddress: companyMaster.bankAddress,
          accountNumber: companyMaster.accountNumber,
          
          // Stamp Settings
          stampText: companyMaster.signatureText || "Authorized Signatory",
          stampPosition: "BOTTOM_RIGHT",
          
          // Column Settings
          showMixColumn: true,
          showHsnColumn: true,
          
          // Legacy fields
          gst: bifurcation.gst || "",
          iecNo: "AAHCI1462J",
          
          // Totals
          totalCtn,
          totalQty,
          totalWeight,
          
          // Relations
          companyMasterId,
          
          // Metadata
          createdBy: userId.toString(),
          updatedBy: userId.toString(),
        },
      });

      // Create items
      const itemPromises = allItems.map((item) =>
        prisma.packingListItem.create({
          data: {
            packingListId: packingList.id,
            itemNumber: item.itemNumber,
            particular: item.particular,
            ctn: item.ctn,
            qtyPerCtn: item.qtyPerCtn,
            unit: item.unit,
            tQty: item.tQty,
            kg: item.kg,
            tKg: item.tKg,
            mix: "",
            hsn: "",
          },
        })
      );

      await Promise.all(itemPromises);

      // Create activity log
      await prisma.packingListActivity.create({
        data: {
          packingListId: packingList.id,
          userId,
          type: "CREATED",
          newValue: JSON.stringify({
            containerCode,
            invNo,
            totalCtn,
            totalQty,
            totalWeight,
          }),
          note: "Packing list initialized from bifurcation",
        },
      });

      // Get complete packing list
      const completePackingList = await prisma.packingList.findUnique({
        where: { id: packingList.id },
        include: {
          companyMaster: true,
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
        message: "Packing list initialized successfully",
        data: completePackingList,
      };
    } catch (error) {
      console.error("Error initializing packing list:", error);
      throw error;
    }
  },

  // Get packing list by container code
  getPackingList: async (containerCode) => {
    try {
      const packingList = await prisma.packingList.findUnique({
        where: { containerCode },
        include: {
          companyMaster: true,
          items: {
            orderBy: {
              particular: "asc",
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

      if (!packingList) {
        throw new Error("Packing list not found");
      }

      return {
        success: true,
        data: packingList,
      };
    } catch (error) {
      console.error("Error getting packing list:", error);
      throw error;
    }
  },

  // Enhanced update packing list with activity logging
  updatePackingList: async (containerCode, data, userId) => {
    try {
      // Get current packing list
      const currentList = await prisma.packingList.findUnique({
        where: { containerCode },
      });

      if (!currentList) {
        throw new Error("Packing list not found");
      }

      // Prepare update data
      const updateData = {
        // Header Information
        ...(data.headerCompanyName !== undefined && { headerCompanyName: data.headerCompanyName }),
        ...(data.headerCompanyAddress !== undefined && { headerCompanyAddress: data.headerCompanyAddress }),
        ...(data.headerPhone !== undefined && { headerPhone: data.headerPhone }),
        
        // Seller Information
        ...(data.sellerName !== undefined && { sellerName: data.sellerName }),
        ...(data.sellerAddress !== undefined && { sellerAddress: data.sellerAddress }),
        ...(data.sellerIecNo !== undefined && { sellerIecNo: data.sellerIecNo }),
        ...(data.sellerGst !== undefined && { sellerGst: data.sellerGst }),
        ...(data.sellerEmail !== undefined && { sellerEmail: data.sellerEmail }),
        
        // Invoice Information
        ...(data.invoiceNo !== undefined && { invoiceNo: data.invoiceNo }),
        ...(data.date !== undefined && { 
          invoiceDate: new Date(data.date),
          date: new Date(data.date)
        }),
        ...(data.from !== undefined && { from: data.from }),
        ...(data.to !== undefined && { to: data.to }),
        ...(data.lrNo !== undefined && { lrNo: data.lrNo }),
        
        // Bank Details
        ...(data.bankName !== undefined && { bankName: data.bankName }),
        ...(data.beneficiaryName !== undefined && { beneficiaryName: data.beneficiaryName }),
        ...(data.swiftBic !== undefined && { swiftBic: data.swiftBic }),
        ...(data.bankAddress !== undefined && { bankAddress: data.bankAddress }),
        ...(data.accountNumber !== undefined && { accountNumber: data.accountNumber }),
        
        // Stamp Settings
        ...(data.stampImage !== undefined && { stampImage: data.stampImage }),
        ...(data.stampPosition !== undefined && { stampPosition: data.stampPosition }),
        ...(data.stampText !== undefined && { stampText: data.stampText }),
        
        // Column Settings
        ...(data.showMixColumn !== undefined && { showMixColumn: data.showMixColumn }),
        ...(data.showHsnColumn !== undefined && { showHsnColumn: data.showHsnColumn }),
        
        // Status
        ...(data.status !== undefined && { status: data.status }),
        
        // Metadata
        updatedBy: userId.toString(),
        updatedAt: new Date(),
      };

      // Update packing list
      const updatedList = await prisma.packingList.update({
        where: { containerCode },
        data: updateData,
      });

      // Log field changes
      const changedFields = [];
      for (const [field, newValue] of Object.entries(data)) {
        const oldValue = currentList[field];
        if (oldValue !== newValue && newValue !== undefined) {
          changedFields.push(field);
          await prisma.packingListActivity.create({
            data: {
              packingListId: currentList.id,
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
        await prisma.packingListActivity.create({
          data: {
            packingListId: currentList.id,
            userId,
            type: "UPDATED",
            note: `Updated ${changedFields.length} field(s): ${changedFields.join(', ')}`,
          },
        });
      }

      return {
        success: true,
        message: "Packing list updated successfully",
        data: updatedList,
      };
    } catch (error) {
      console.error("Error updating packing list:", error);
      throw error;
    }
  },

  // Update items
  updateItems: async (containerCode, items, userId) => {
    try {
      const packingList = await prisma.packingList.findUnique({
        where: { containerCode },
      });

      if (!packingList) {
        throw new Error("Packing list not found");
      }

      // Delete existing items
      await prisma.packingListItem.deleteMany({
        where: { packingListId: packingList.id },
      });

      // Create new items
      const itemPromises = items.map((item) =>
        prisma.packingListItem.create({
          data: {
            packingListId: packingList.id,
            itemNumber: item.itemNumber,
            particular: item.particular,
            ctn: parseInt(item.ctn) || 0,
            qtyPerCtn: parseInt(item.qtyPerCtn) || 0,
            unit: item.unit || "PCS",
            tQty: parseInt(item.tQty) || 0,
            kg: parseFloat(item.kg) || 0,
            tKg: parseFloat(item.tKg) || 0,
            mix: item.mix || "",
            hsn: item.hsn || "",
            photo: item.photo,
          },
        })
      );

      await Promise.all(itemPromises);

      // Recalculate totals
      const totalCtn = items.reduce((sum, item) => sum + (parseInt(item.ctn) || 0), 0);
      const totalQty = items.reduce((sum, item) => sum + (parseInt(item.tQty) || 0), 0);
      const totalWeight = items.reduce((sum, item) => sum + (parseFloat(item.tKg) || 0), 0);

      // Update totals
      await prisma.packingList.update({
        where: { containerCode },
        data: {
          totalCtn,
          totalQty,
          totalWeight,
          updatedBy: userId.toString(),
          updatedAt: new Date(),
        },
      });

      // Create activity log
      await prisma.packingListActivity.create({
        data: {
          packingListId: packingList.id,
          userId,
          type: "ITEMS_UPDATED",
          newValue: JSON.stringify({ 
            itemCount: items.length, 
            totalCtn, 
            totalQty, 
            totalWeight 
          }),
          note: "Updated packing list items",
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

  // Get all company masters
  getCompanyMasters: async () => {
    try {
      const companies = await prisma.companyMaster.findMany({
        orderBy: {
          companyName: "asc",
        },
      });

      return {
        success: true,
        data: companies,
      };
    } catch (error) {
      console.error("Error getting company masters:", error);
      throw error;
    }
  },

  // Update company master
  updateCompanyMaster: async (companyId, data, userId) => {
    try {
      const company = await prisma.companyMaster.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        throw new Error("Company not found");
      }

      const updatedCompany = await prisma.companyMaster.update({
        where: { id: companyId },
        data: {
          ...data,
        },
      });

      return {
        success: true,
        message: "Company master updated successfully",
        data: updatedCompany,
      };
    } catch (error) {
      console.error("Error updating company master:", error);
      throw error;
    }
  },

  // Mark as printed
  markAsPrinted: async (containerCode, userId) => {
    try {
      const packingList = await prisma.packingList.findUnique({
        where: { containerCode },
      });

      if (!packingList) {
        throw new Error("Packing list not found");
      }

      const oldStatus = packingList.status;

      const updatedList = await prisma.packingList.update({
        where: { containerCode },
        data: {
          status: "PRINTED",
          updatedBy: userId.toString(),
          updatedAt: new Date(),
        },
      });

      // Create activity log
      await prisma.packingListActivity.create({
        data: {
          packingListId: packingList.id,
          userId,
          type: "STATUS_CHANGE",
          oldValue: oldStatus,
          newValue: "PRINTED",
          note: "Marked packing list as printed",
        },
      });

      return {
        success: true,
        message: "Packing list marked as printed",
        data: updatedList,
      };
    } catch (error) {
      console.error("Error marking as printed:", error);
      throw error;
    }
  },

  // Log activity
  logActivity: async (packingListId, userId, type, field, oldValue, newValue, note) => {
    try {
      const activity = await prisma.packingListActivity.create({
        data: {
          packingListId,
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
      const packingList = await prisma.packingList.findUnique({
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

      if (!packingList) {
        throw new Error("Packing list not found");
      }

      return packingList.activities;
    } catch (error) {
      console.error("Error getting activities:", error);
      throw error;
    }
  },

  // Get all packing lists
  getAllPackingLists: async ({ page = 1, limit = 10, search = "", status }) => {
    try {
      const skip = (page - 1) * limit;

      const where = {};

      if (search) {
        where.OR = [
          { containerCode: { contains: search, mode: "insensitive" } },
          { invoiceNo: { contains: search, mode: "insensitive" } },
          { sellerName: { contains: search, mode: "insensitive" } },
        ];
      }

      if (status) {
        where.status = status;
      }

      const [packingLists, total] = await Promise.all([
        prisma.packingList.findMany({
          where,
          skip,
          take: limit,
          include: {
            companyMaster: {
              select: {
                companyName: true,
              },
            },
            _count: {
              select: { items: true, activities: true },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
        prisma.packingList.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        packingLists,
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
      console.error("Error getting all packing lists:", error);
      throw error;
    }
  },
};

module.exports = packingListService;