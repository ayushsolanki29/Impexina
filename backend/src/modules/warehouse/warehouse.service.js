const { prisma } = require("../../database/prisma");
const XLSX = require("xlsx");

const warehouseService = {
  // Initialize warehouse plan from container
  initializeFromContainer: async (containerCode, userId) => {
    try {
      // Check if warehouse plan already exists
      const existing = await prisma.warehousePlan.findUnique({
        where: { containerCode },
        include: {
          marks: true,
        },
      });

      if (existing) {
        return {
          success: true,
          message: "Warehouse plan already exists",
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

      // Process marks from loading sheets
      const markGroups = {};
      let totalCTN = 0;
      let totalCBM = 0;
      let totalWeight = 0;

      container.loadingSheets.forEach((sheet) => {
        const mark = sheet.shippingMark.name;

        if (!markGroups[mark]) {
          markGroups[mark] = {
            mark,
            ctn: 0,
            product: "MIX ITEM",
            totalCBM: 0,
            totalWeight: 0,
            loadingDate: sheet.loadingDate,
            items: [],
          };
        }

        sheet.items.forEach((item) => {
          markGroups[mark].ctn += item.ctn || 0;
          markGroups[mark].totalCBM += parseFloat(item.tcbm) || 0;
          markGroups[mark].totalWeight += parseFloat(item.twt) || 0;

          // Collect items for product determination
          markGroups[mark].items.push(item.particular);

          // Update totals
          totalCTN += item.ctn || 0;
          totalCBM += parseFloat(item.tcbm) || 0;
          totalWeight += parseFloat(item.twt) || 0;
        });

        // Determine product name
        const uniqueItems = [...new Set(markGroups[mark].items)];
        if (uniqueItems.length <= 3) {
          markGroups[mark].product = uniqueItems.join(", ");
        }
      });

      // Create warehouse plan
      const warehousePlan = await prisma.warehousePlan.create({
        data: {
          containerCode,
          origin: container.origin,
          loadingDate: container.loadingSheets[0]?.loadingDate || new Date(),
          totalCTN,
          totalCBM: parseFloat(totalCBM.toFixed(3)),
          totalWeight: parseFloat(totalWeight.toFixed(2)),
          totalMarks: Object.keys(markGroups).length,
          status: "PENDING",
        },
      });

      // Create marks
      const markPromises = Object.values(markGroups).map(async (markData) => {
        return await prisma.warehouseMark.create({
          data: {
            containerCode,
            mark: markData.mark,
            ctn: markData.ctn,
            product: markData.product,
            totalCBM: parseFloat(markData.totalCBM.toFixed(3)),
            totalWeight: parseFloat(markData.totalWeight.toFixed(2)),
            loadingDate: markData.loadingDate,
            status: "PENDING",
          },
        });
      });

      await Promise.all(markPromises);

      // Create activity
      await prisma.warehousePlanActivity.create({
        data: {
          containerCode,
          userId,
          type: "CREATED",
          newValue: {
            containerCode,
            totalMarks: Object.keys(markGroups).length,
            totalCTN,
            totalCBM: parseFloat(totalCBM.toFixed(3)),
            totalWeight: parseFloat(totalWeight.toFixed(2)),
          },
          note: "Warehouse plan initialized from container",
        },
      });

      // Get full warehouse plan
      const fullPlan = await prisma.warehousePlan.findUnique({
        where: { containerCode },
        include: {
          marks: {
            orderBy: {
              mark: "asc",
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
        message: "Warehouse plan initialized successfully",
        data: fullPlan,
      };
    } catch (error) {
      console.error("Error initializing warehouse plan:", error);
      throw error;
    }
  },

  // Get warehouse plan
  getWarehousePlan: async (containerCode) => {
    try {
      const warehousePlan = await prisma.warehousePlan.findUnique({
        where: { containerCode },
        include: {
          marks: {
            orderBy: {
              mark: "asc",
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

      if (!warehousePlan) {
        throw new Error("Warehouse plan not found");
      }

      return {
        success: true,
        data: warehousePlan,
      };
    } catch (error) {
      console.error("Error getting warehouse plan:", error);
      throw error;
    }
  },

  // Add new mark
  addMark: async (containerCode, markData, userId) => {
    try {
      const {
        mark,
        ctn,
        product,
        totalCBM,
        totalWeight,
        loadingDate,
        deliveryDate,
        invNo,
        gst,
        transporter,
        status = "PENDING",
      } = markData;

      // Check if mark already exists
      const existingMark = await prisma.warehouseMark.findFirst({
        where: {
          containerCode,
          mark,
        },
      });

      if (existingMark) {
        throw new Error("Mark already exists in warehouse plan");
      }

      // Create new mark
      const newMark = await prisma.warehouseMark.create({
        data: {
          containerCode,
          mark,
          ctn: parseInt(ctn) || 0,
          product: product || "MIX ITEM",
          totalCBM: parseFloat(totalCBM) || 0,
          totalWeight: parseFloat(totalWeight) || 0,
          loadingDate: loadingDate ? new Date(loadingDate) : new Date(),
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
          invNo,
          gst,
          transporter,
          status,
        },
      });

      // Update warehouse plan totals
      const warehousePlan = await prisma.warehousePlan.findUnique({
        where: { containerCode },
      });

      const updates = {
        totalCTN: warehousePlan.totalCTN + (parseInt(ctn) || 0),
        totalCBM: warehousePlan.totalCBM + (parseFloat(totalCBM) || 0),
        totalWeight: warehousePlan.totalWeight + (parseFloat(totalWeight) || 0),
        totalMarks: warehousePlan.totalMarks + 1,
      };

      // Update status counts
      updates[`${status.toLowerCase()}Count`] = 
        warehousePlan[`${status.toLowerCase()}Count`] + 1;

      // Update delivery tracking
      if (deliveryDate) updates.withDeliveryDate = warehousePlan.withDeliveryDate + 1;
      if (invNo) updates.withInvoice = warehousePlan.withInvoice + 1;
      if (gst) updates.withGST = warehousePlan.withGST + 1;
      if (transporter) updates.withTransporter = warehousePlan.withTransporter + 1;

      await prisma.warehousePlan.update({
        where: { containerCode },
        data: updates,
      });

      // Create activity
      await prisma.warehousePlanActivity.create({
        data: {
          containerCode,
          userId,
          type: "MARK_ADDED",
          newValue: markData,
          note: `Added new mark: ${mark}`,
        },
      });

      return {
        success: true,
        message: "Mark added successfully",
        data: newMark,
      };
    } catch (error) {
      console.error("Error adding mark:", error);
      throw error;
    }
  },

  // Update mark
  updateMark: async (containerCode, markId, markData, userId) => {
    try {
      const {
        ctn,
        product,
        totalCBM,
        totalWeight,
        loadingDate,
        deliveryDate,
        invNo,
        gst,
        transporter,
        status,
      } = markData;

      // Get existing mark
      const existingMark = await prisma.warehouseMark.findUnique({
        where: { id: markId },
      });

      if (!existingMark || existingMark.containerCode !== containerCode) {
        throw new Error("Mark not found");
      }

      const oldValue = { ...existingMark };

      // Update mark
      const updatedMark = await prisma.warehouseMark.update({
        where: { id: markId },
        data: {
          ...(ctn !== undefined && { ctn: parseInt(ctn) }),
          ...(product !== undefined && { product }),
          ...(totalCBM !== undefined && { totalCBM: parseFloat(totalCBM) }),
          ...(totalWeight !== undefined && { totalWeight: parseFloat(totalWeight) }),
          ...(loadingDate !== undefined && { loadingDate: new Date(loadingDate) }),
          ...(deliveryDate !== undefined && { 
            deliveryDate: deliveryDate ? new Date(deliveryDate) : null 
          }),
          ...(invNo !== undefined && { invNo }),
          ...(gst !== undefined && { gst }),
          ...(transporter !== undefined && { transporter }),
          ...(status !== undefined && { status }),
        },
      });

      // Update warehouse plan totals if quantities changed
      if (ctn !== undefined || totalCBM !== undefined || totalWeight !== undefined) {
        const warehousePlan = await prisma.warehousePlan.findUnique({
          where: { containerCode },
        });

        const ctnDiff = (parseInt(ctn) || existingMark.ctn) - existingMark.ctn;
        const cbmDiff = (parseFloat(totalCBM) || existingMark.totalCBM) - existingMark.totalCBM;
        const weightDiff = (parseFloat(totalWeight) || existingMark.totalWeight) - existingMark.totalWeight;

        await prisma.warehousePlan.update({
          where: { containerCode },
          data: {
            totalCTN: warehousePlan.totalCTN + ctnDiff,
            totalCBM: parseFloat((warehousePlan.totalCBM + cbmDiff).toFixed(3)),
            totalWeight: parseFloat((warehousePlan.totalWeight + weightDiff).toFixed(2)),
          },
        });
      }

      // Update status counts if status changed
      if (status && status !== existingMark.status) {
        const warehousePlan = await prisma.warehousePlan.findUnique({
          where: { containerCode },
        });

        await prisma.warehousePlan.update({
          where: { containerCode },
          data: {
            [`${existingMark.status.toLowerCase()}Count`]: 
              Math.max(0, warehousePlan[`${existingMark.status.toLowerCase()}Count`] - 1),
            [`${status.toLowerCase()}Count`]: 
              warehousePlan[`${status.toLowerCase()}Count`] + 1,
          },
        });
      }

      // Update delivery tracking
      const warehousePlan = await prisma.warehousePlan.findUnique({
        where: { containerCode },
      });

      const deliveryUpdates = {};
      
      if (deliveryDate !== undefined) {
        const hadDelivery = existingMark.deliveryDate !== null;
        const hasDelivery = deliveryDate !== null && deliveryDate !== '';
        
        if (hadDelivery && !hasDelivery) {
          deliveryUpdates.withDeliveryDate = Math.max(0, warehousePlan.withDeliveryDate - 1);
        } else if (!hadDelivery && hasDelivery) {
          deliveryUpdates.withDeliveryDate = warehousePlan.withDeliveryDate + 1;
        }
      }

      // Similar logic for invNo, gst, transporter...
      if (Object.keys(deliveryUpdates).length > 0) {
        await prisma.warehousePlan.update({
          where: { containerCode },
          data: deliveryUpdates,
        });
      }

      // Create activity
      await prisma.warehousePlanActivity.create({
        data: {
          containerCode,
          userId,
          type: "MARK_UPDATED",
          oldValue,
          newValue: markData,
          note: `Updated mark: ${existingMark.mark}`,
        },
      });

      return {
        success: true,
        message: "Mark updated successfully",
        data: updatedMark,
      };
    } catch (error) {
      console.error("Error updating mark:", error);
      throw error;
    }
  },

  // Delete mark
  deleteMark: async (containerCode, markId, userId) => {
    try {
      // Get mark details
      const mark = await prisma.warehouseMark.findUnique({
        where: { id: markId },
      });

      if (!mark || mark.containerCode !== containerCode) {
        throw new Error("Mark not found");
      }

      // Delete mark
      await prisma.warehouseMark.delete({
        where: { id: markId },
      });

      // Update warehouse plan totals
      const warehousePlan = await prisma.warehousePlan.findUnique({
        where: { containerCode },
      });

      const updates = {
        totalCTN: Math.max(0, warehousePlan.totalCTN - mark.ctn),
        totalCBM: parseFloat(Math.max(0, warehousePlan.totalCBM - mark.totalCBM).toFixed(3)),
        totalWeight: parseFloat(Math.max(0, warehousePlan.totalWeight - mark.totalWeight).toFixed(2)),
        totalMarks: Math.max(0, warehousePlan.totalMarks - 1),
        [`${mark.status.toLowerCase()}Count`]: 
          Math.max(0, warehousePlan[`${mark.status.toLowerCase()}Count`] - 1),
      };

      // Update delivery tracking
      if (mark.deliveryDate) updates.withDeliveryDate = Math.max(0, warehousePlan.withDeliveryDate - 1);
      if (mark.invNo) updates.withInvoice = Math.max(0, warehousePlan.withInvoice - 1);
      if (mark.gst) updates.withGST = Math.max(0, warehousePlan.withGST - 1);
      if (mark.transporter) updates.withTransporter = Math.max(0, warehousePlan.withTransporter - 1);

      await prisma.warehousePlan.update({
        where: { containerCode },
        data: updates,
      });

      // Create activity
      await prisma.warehousePlanActivity.create({
        data: {
          containerCode,
          userId,
          type: "MARK_DELETED",
          oldValue: mark,
          note: `Deleted mark: ${mark.mark}`,
        },
      });

      return {
        success: true,
        message: "Mark deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting mark:", error);
      throw error;
    }
  },

  // Search warehouse plan
  searchWarehousePlan: async (containerCode, searchQuery, filters = {}) => {
    try {
      const { status, transporter } = filters;

      const where = {
        containerCode,
      };

      // Add search conditions
      if (searchQuery) {
        where.OR = [
          { mark: { contains: searchQuery, mode: "insensitive" } },
          { product: { contains: searchQuery, mode: "insensitive" } },
          { transporter: { contains: searchQuery, mode: "insensitive" } },
          { invNo: { contains: searchQuery, mode: "insensitive" } },
        ];
      }

      // Add status filter
      if (status && status !== "all") {
        where.status = status.toUpperCase();
      }

      // Add transporter filter
      if (transporter && transporter !== "all") {
        where.transporter = transporter;
      }

      const marks = await prisma.warehouseMark.findMany({
        where,
        orderBy: {
          mark: "asc",
        },
      });

      // Get warehouse plan for totals
      const warehousePlan = await prisma.warehousePlan.findUnique({
        where: { containerCode },
      });

      // Calculate filtered totals
      const totals = marks.reduce(
        (acc, mark) => ({
          totalCTN: acc.totalCTN + (mark.ctn || 0),
          totalCBM: acc.totalCBM + (mark.totalCBM || 0),
          totalWeight: acc.totalWeight + (mark.totalWeight || 0),
          itemsWithDelivery: acc.itemsWithDelivery + (mark.deliveryDate ? 1 : 0),
          itemsWithInvoice: acc.itemsWithInvoice + (mark.invNo ? 1 : 0),
          itemsWithTransporter: acc.itemsWithTransporter + (mark.transporter ? 1 : 0),
          completedItems: acc.completedItems + (mark.status === "COMPLETED" ? 1 : 0),
        }),
        {
          totalCTN: 0,
          totalCBM: 0,
          totalWeight: 0,
          itemsWithDelivery: 0,
          itemsWithInvoice: 0,
          itemsWithTransporter: 0,
          completedItems: 0,
        }
      );

      return {
        success: true,
        data: {
          warehousePlan,
          marks,
          totals,
          filteredCount: marks.length,
        },
      };
    } catch (error) {
      console.error("Error searching warehouse plan:", error);
      throw error;
    }
  },

  // Export to Excel
  exportToExcel: async (containerCode) => {
    try {
      const warehousePlan = await prisma.warehousePlan.findUnique({
        where: { containerCode },
        include: {
          marks: {
            orderBy: {
              mark: "asc",
            },
          },
        },
      });

      if (!warehousePlan) {
        throw new Error("Warehouse plan not found");
      }

      // Prepare data for Excel
      const excelData = warehousePlan.marks.map((mark) => ({
        "CONTAINER CODE": warehousePlan.containerCode,
        "MARK": mark.mark,
        "CTN": mark.ctn,
        "PRODUCT": mark.product || "-",
        "TOTAL CBM": mark.totalCBM.toFixed(3),
        "TOTAL WEIGHT": mark.totalWeight,
        "LOADING DATE": mark.loadingDate 
          ? new Date(mark.loadingDate).toLocaleDateString()
          : "-",
        "DELIVERY DATE": mark.deliveryDate
          ? new Date(mark.deliveryDate).toLocaleDateString()
          : "-",
        "INV NO.": mark.invNo || "-",
        "GST": mark.gst || "-",
        "TRANSPORTER": mark.transporter || "-",
        "STATUS": mark.status,
      }));

      return excelData;
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      throw error;
    }
  },

  // Get unique transporters
  getUniqueTransporters: async (containerCode) => {
    try {
      const transporters = await prisma.warehouseMark.findMany({
        where: {
          containerCode,
          transporter: {
            not: null,
          },
        },
        distinct: ["transporter"],
        select: {
          transporter: true,
        },
        orderBy: {
          transporter: "asc",
        },
      });

      return transporters.map(t => t.transporter).filter(Boolean);
    } catch (error) {
      console.error("Error getting unique transporters:", error);
      throw error;
    }
  },

  // Get activities
  getActivities: async (containerCode, limit = 20) => {
    try {
      const activities = await prisma.warehousePlanActivity.findMany({
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

  // Get all warehouse plans
  getAllWarehousePlans: async ({ page = 1, limit = 10, search = "", status }) => {
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

      const [warehousePlans, total] = await Promise.all([
        prisma.warehousePlan.findMany({
          where,
          skip,
          take: limit,
          include: {
            _count: {
              select: { marks: true, activities: true },
            },
            marks: {
              select: {
                status: true,
              },
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
        }),
        prisma.warehousePlan.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        warehousePlans,
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
      console.error("Error getting all warehouse plans:", error);
      throw error;
    }
  },

  // Update warehouse plan status
  updateWarehousePlanStatus: async (containerCode, status, userId) => {
    try {
      const warehousePlan = await prisma.warehousePlan.findUnique({
        where: { containerCode },
      });

      if (!warehousePlan) {
        throw new Error("Warehouse plan not found");
      }

      const oldStatus = warehousePlan.status;

      // Update warehouse plan status
      const updatedPlan = await prisma.warehousePlan.update({
        where: { containerCode },
        data: { status },
      });

      // Create activity
      await prisma.warehousePlanActivity.create({
        data: {
          containerCode,
          userId,
          type: "STATUS_CHANGE",
          oldValue: { status: oldStatus },
          newValue: { status },
          note: `Changed warehouse plan status from ${oldStatus} to ${status}`,
        },
      });

      return {
        success: true,
        message: "Warehouse plan status updated",
        data: updatedPlan,
      };
    } catch (error) {
      console.error("Error updating warehouse plan status:", error);
      throw error;
    }
  },

  // Import from Excel
  importFromExcel: async (containerCode, excelData, userId) => {
    try {
      const warehousePlan = await prisma.warehousePlan.findUnique({
        where: { containerCode },
      });

      if (!warehousePlan) {
        throw new Error("Warehouse plan not found. Initialize first.");
      }

      const marksToCreate = [];
      const marksToUpdate = [];

      for (const row of excelData) {
        const existingMark = await prisma.warehouseMark.findFirst({
          where: {
            containerCode,
            mark: row.MARK,
          },
        });

        if (existingMark) {
          // Update existing mark
          marksToUpdate.push({
            id: existingMark.id,
            data: {
              ctn: parseInt(row.CTN) || 0,
              product: row.PRODUCT || "MIX ITEM",
              totalCBM: parseFloat(row["TOTAL CBM"]) || 0,
              totalWeight: parseFloat(row["TOTAL WEIGHT"]) || 0,
              loadingDate: row["LOADING DATE"] ? new Date(row["LOADING DATE"]) : null,
              deliveryDate: row["DELIVERY DATE"] ? new Date(row["DELIVERY DATE"]) : null,
              invNo: row["INV NO."] || null,
              gst: row.GST || null,
              transporter: row.TRANSPORTER || null,
              status: row.STATUS || "PENDING",
            },
          });
        } else {
          // Create new mark
          marksToCreate.push({
            mark: row.MARK,
            ctn: parseInt(row.CTN) || 0,
            product: row.PRODUCT || "MIX ITEM",
            totalCBM: parseFloat(row["TOTAL CBM"]) || 0,
            totalWeight: parseFloat(row["TOTAL WEIGHT"]) || 0,
            loadingDate: row["LOADING DATE"] ? new Date(row["LOADING DATE"]) : null,
            deliveryDate: row["DELIVERY DATE"] ? new Date(row["DELIVERY DATE"]) : null,
            invNo: row["INV NO."] || null,
            gst: row.GST || null,
            transporter: row.TRANSPORTER || null,
            status: row.STATUS || "PENDING",
          });
        }
      }

      // Create new marks
      if (marksToCreate.length > 0) {
        await prisma.warehouseMark.createMany({
          data: marksToCreate.map(mark => ({
            containerCode,
            ...mark,
          })),
        });
      }

      // Update existing marks
      for (const mark of marksToUpdate) {
        await prisma.warehouseMark.update({
          where: { id: mark.id },
          data: mark.data,
        });
      }

      // Recalculate totals
      await warehouseService.recalculateTotals(containerCode);

      // Create activity
      await prisma.warehousePlanActivity.create({
        data: {
          containerCode,
          userId,
          type: "IMPORTED",
          newValue: {
            importedCount: marksToCreate.length + marksToUpdate.length,
            newMarks: marksToCreate.length,
            updatedMarks: marksToUpdate.length,
          },
          note: "Imported warehouse plan from Excel",
        },
      });

      return {
        success: true,
        message: `Imported ${marksToCreate.length} new marks and updated ${marksToUpdate.length} marks`,
      };
    } catch (error) {
      console.error("Error importing from Excel:", error);
      throw error;
    }
  },

  // Recalculate totals
  recalculateTotals: async (containerCode) => {
    try {
      const marks = await prisma.warehouseMark.findMany({
        where: { containerCode },
      });

      const totals = marks.reduce(
        (acc, mark) => ({
          totalCTN: acc.totalCTN + (mark.ctn || 0),
          totalCBM: acc.totalCBM + (mark.totalCBM || 0),
          totalWeight: acc.totalWeight + (mark.totalWeight || 0),
          totalMarks: acc.totalMarks + 1,
          pendingCount: acc.pendingCount + (mark.status === "PENDING" ? 1 : 0),
          dispatchedCount: acc.dispatchedCount + (mark.status === "DISPATCHED" ? 1 : 0),
          holdCount: acc.holdCount + (mark.status === "HOLD" ? 1 : 0),
          draftCount: acc.draftCount + (mark.status === "DRAFT" ? 1 : 0),
          withDeliveryDate: acc.withDeliveryDate + (mark.deliveryDate ? 1 : 0),
          withInvoice: acc.withInvoice + (mark.invNo ? 1 : 0),
          withGST: acc.withGST + (mark.gst ? 1 : 0),
          withTransporter: acc.withTransporter + (mark.transporter ? 1 : 0),
        }),
        {
          totalCTN: 0,
          totalCBM: 0,
          totalWeight: 0,
          totalMarks: 0,
          pendingCount: 0,
          dispatchedCount: 0,
          holdCount: 0,
          draftCount: 0,
          withDeliveryDate: 0,
          withInvoice: 0,
          withGST: 0,
          withTransporter: 0,
        }
      );

      await prisma.warehousePlan.update({
        where: { containerCode },
        data: totals,
      });

      return totals;
    } catch (error) {
      console.error("Error recalculating totals:", error);
      throw error;
    }
  },
};

module.exports = warehouseService;