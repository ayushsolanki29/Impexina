const { prisma } = require("../../database/prisma");

const containerSummaryService = {
  // Create new summary
  createSummary: async (data, userId, userName) => {
    try {
      const { month, status, containers } = data;

      // Check if summary for this month already exists for user
      const existingSummary = await prisma.containerSummary.findFirst({
        where: {
          month,
          createdBy: userName,
        },
      });

      if (existingSummary) {
        throw new Error(`A summary for ${month} already exists.`);
      }

      // Calculate totals
      const totals = containers.reduce(
        (acc, container) => {
          const inr = container.dollar * container.dollarRate;
          const duty = inr * 0.165; // 16.5%
          const total = inr + duty;
          const gst = total * 0.18; // 18%
          const totalDuty = duty + gst;
          const finalAmount = totalDuty + container.doCharge + container.cfs;

          return {
            totalCTN: acc.totalCTN + (container.ctn || 0),
            totalDollar: acc.totalDollar + (container.dollar || 0),
            totalINR: acc.totalINR + inr,
            totalFinalAmount: acc.totalFinalAmount + finalAmount,
          };
        },
        {
          totalContainers: containers.length,
          totalCTN: 0,
          totalDollar: 0,
          totalINR: 0,
          totalFinalAmount: 0,
        }
      );

      // Create summary with containers
      const summary = await prisma.containerSummary.create({
        data: {
          month,
          status: status || "DRAFT",
          totalContainers: totals.totalContainers,
          totalCTN: totals.totalCTN,
          totalDollar: parseFloat(totals.totalDollar.toFixed(2)),
          totalINR: parseFloat(totals.totalINR.toFixed(2)),
          totalFinalAmount: parseFloat(totals.totalFinalAmount.toFixed(2)),
          createdBy: userName,
          updatedBy: userName,
          containers: {
            create: containers.map((container, index) => {
              const inr = container.dollar * container.dollarRate;
              const duty = inr * 0.165;
              const total = inr + duty;
              const gst = total * 0.18;
              const totalDuty = duty + gst;
              const finalAmount =
                totalDuty + container.doCharge + container.cfs;

              return {
                containerNo: index + 1,
                containerCode: container.containerCode || "",
                ctn: container.ctn || 0,
                loadingDate: container.loadingDate
                  ? new Date(container.loadingDate)
                  : null,
                eta: container.eta || "",
                status: container.status || "Loaded",
                dollar: container.dollar || 0,
                dollarRate: container.dollarRate || 89.7,
                doCharge: container.doCharge || 58000,
                cfs: container.cfs || 21830,
                inr: parseFloat(inr.toFixed(2)),
                duty: parseFloat(duty.toFixed(2)),
                total: parseFloat(total.toFixed(2)),
                gst: parseFloat(gst.toFixed(2)),
                totalDuty: parseFloat(totalDuty.toFixed(2)),
                finalAmount: parseFloat(finalAmount.toFixed(2)),
                shippingLine: container.shippingLine || "",
                bl: container.bl || "",
                containerNoField: container.containerNo || "",
                sims: container.sims || "",
                // New Fields
                invoiceNo: container.invoiceNo || "",
                invoiceDate: container.invoiceDate ? new Date(container.invoiceDate) : null,
                location: container.location || "",
                deliveryDate: container.deliveryDate ? new Date(container.deliveryDate) : null,
                shipper: container.shipper || "",
                workflowStatus: container.workflowStatus || "",
              };
            }),
          },
        },
        include: {
          containers: {
            orderBy: {
              containerNo: "asc",
            },
          },
        },
      });

      // Create activity log
      await prisma.summaryActivity.create({
        data: {
          summaryId: summary.id,
          userId,
          type: "CREATED",
          newValue: {
            month,
            status: summary.status,
            containerCount: containers.length,
          },
          note: `Created new summary for ${month}`,
        },
      });

      return {
        success: true,
        message: "Summary created successfully",
        data: summary,
      };
    } catch (error) {
      console.error("Error creating summary:", error);
      throw error;
    }
  },

  // Get all summaries with pagination
  getAllSummaries: async ({
    page = 1,
    limit = 10,
    search = "",
    status,
    createdBy,
  }) => {
    try {
      const skip = (page - 1) * limit;

      const where = {};

      if (search) {
        where.month = {
          contains: search,
          mode: "insensitive",
        };
      }

      if (status) {
        where.status = status;
      }

      if (createdBy) {
        where.createdBy = createdBy;
      }

      const [summaries, total] = await Promise.all([
        prisma.containerSummary.findMany({
          where,
          skip,
          take: limit,
          include: {
            containers: {
              select: {
                id: true,
                summaryId: true,
                containerNo: true,
                containerCode: true,
                ctn: true,
                dollar: true,
                finalAmount: true,
                status: true,
              },
            },
            // This is correct - _count is at the summary level
            _count: {
              select: {
                containers: true,
                activities: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
        prisma.containerSummary.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        summaries: summaries.map((summary) => ({
          ...summary,
          // Add containerCount from _count
          containerCount: summary._count.containers,
          activityCount: summary._count.activities,
          // Remove _count from the response
          _count: undefined,
        })),
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
      console.error("Error getting all summaries:", error);
      throw error;
    }
  },
  // Get single summary by ID
  getSummaryById: async (summaryId) => {
    try {
      const summary = await prisma.containerSummary.findUnique({
        where: { id: summaryId },
        include: {
          containers: {
            orderBy: {
              containerNo: "asc",
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

      if (!summary) {
        throw new Error("Summary not found");
      }

      return {
        success: true,
        data: summary,
      };
    } catch (error) {
      console.error("Error getting summary:", error);
      throw error;
    }
  },

  // Update summary
  updateSummary: async (summaryId, data, userId, userName) => {
    try {
      const { month, status, containers } = data;

      // Get existing summary
      const existingSummary = await prisma.containerSummary.findUnique({
        where: { id: summaryId },
        include: {
          containers: true,
        },
      });

      if (!existingSummary) {
        throw new Error("Summary not found");
      }

      // Calculate totals if containers are provided
      let totals = {
        totalContainers: existingSummary.totalContainers,
        totalCTN: existingSummary.totalCTN,
        totalDollar: existingSummary.totalDollar,
        totalINR: existingSummary.totalINR,
        totalFinalAmount: existingSummary.totalFinalAmount,
      };

      if (containers && containers.length > 0) {
        // Delete existing containers and create new ones
        await prisma.containerInSummary.deleteMany({
          where: { summaryId },
        });

        // Recalculate totals
        totals = containers.reduce(
          (acc, container) => {
            const inr = container.dollar * container.dollarRate;
            const duty = inr * 0.165;
            const total = inr + duty;
            const gst = total * 0.18;
            const totalDuty = duty + gst;
            const finalAmount = totalDuty + container.doCharge + container.cfs;

            return {
              totalContainers: containers.length,
              totalCTN: acc.totalCTN + (container.ctn || 0),
              totalDollar: acc.totalDollar + (container.dollar || 0),
              totalINR: acc.totalINR + inr,
              totalFinalAmount: acc.totalFinalAmount + finalAmount,
            };
          },
          {
            totalContainers: 0,
            totalCTN: 0,
            totalDollar: 0,
            totalINR: 0,
            totalFinalAmount: 0,
          }
        );
      }

      // Update summary
      const updateData = {
        ...(month && { month }),
        ...(status && { status }),
        updatedBy: userName,
        ...(containers && {
          totalContainers: totals.totalContainers,
          totalCTN: totals.totalCTN,
          totalDollar: parseFloat(totals.totalDollar.toFixed(2)),
          totalINR: parseFloat(totals.totalINR.toFixed(2)),
          totalFinalAmount: parseFloat(totals.totalFinalAmount.toFixed(2)),
        }),
      };

      const summary = await prisma.containerSummary.update({
        where: { id: summaryId },
        data: updateData,
        include: {
          containers: true,
        },
      });

      // Create containers if provided
      if (containers && containers.length > 0) {
        await prisma.containerInSummary.createMany({
          data: containers.map((container, index) => {
            const inr = container.dollar * container.dollarRate;
            const duty = inr * 0.165;
            const total = inr + duty;
            const gst = total * 0.18;
            const totalDuty = duty + gst;
            const finalAmount = totalDuty + container.doCharge + container.cfs;

            return {
              summaryId,
              containerNo: index + 1,
              containerCode: container.containerCode || "",
              ctn: container.ctn || 0,
              loadingDate: container.loadingDate
                ? new Date(container.loadingDate)
                : null,
              eta: container.eta || "",
              status: container.status || "Loaded",
              dollar: container.dollar || 0,
              dollarRate: container.dollarRate || 89.7,
              doCharge: container.doCharge || 58000,
              cfs: container.cfs || 21830,
              inr: parseFloat(inr.toFixed(2)),
              duty: parseFloat(duty.toFixed(2)),
              total: parseFloat(total.toFixed(2)),
              gst: parseFloat(gst.toFixed(2)),
              totalDuty: parseFloat(totalDuty.toFixed(2)),
              finalAmount: parseFloat(finalAmount.toFixed(2)),
              shippingLine: container.shippingLine || "",
              bl: container.bl || "",
              containerNoField: container.containerNo || "",
              sims: container.sims || "",
              // New Fields
              invoiceNo: container.invoiceNo || "",
              invoiceDate: container.invoiceDate ? new Date(container.invoiceDate) : null,
              location: container.location || "",
              deliveryDate: container.deliveryDate ? new Date(container.deliveryDate) : null,
              shipper: container.shipper || "",
              workflowStatus: container.workflowStatus || "",
            };
          }),
        });
      }

      // Create activity log
      await prisma.summaryActivity.create({
        data: {
          summaryId,
          userId,
          type: "UPDATED",
          newValue: {
            month: summary.month,
            status: summary.status,
            containerCount: summary.totalContainers,
          },
          note: `Updated summary for ${summary.month}`,
        },
      });

      return {
        success: true,
        message: "Summary updated successfully",
        data: summary,
      };
    } catch (error) {
      console.error("Error updating summary:", error);
      throw error;
    }
  },

  // Delete summary
  deleteSummary: async (summaryId, userId) => {
    try {
      const summary = await prisma.containerSummary.findUnique({
        where: { id: summaryId },
      });

      if (!summary) {
        throw new Error("Summary not found");
      }

      // Create activity log before deletion
      await prisma.summaryActivity.create({
        data: {
          summaryId,
          userId,
          type: "DELETED",
          oldValue: {
            month: summary.month,
            status: summary.status,
          },
          note: `Deleted summary for ${summary.month}`,
        },
      });

      // Delete summary (containers will cascade)
      await prisma.containerSummary.delete({
        where: { id: summaryId },
      });

      return {
        success: true,
        message: "Summary deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting summary:", error);
      throw error;
    }
  },

  // Get summary statistics
  getStatistics: async (createdBy) => {
    try {
      const where = {};
      if (createdBy) {
        where.createdBy = createdBy;
      }

      const summaries = await prisma.containerSummary.findMany({
        where,
        select: {
          totalContainers: true,
          totalCTN: true,
          totalDollar: true,
          totalFinalAmount: true,
          status: true,
        },
      });

      const stats = summaries.reduce(
        (acc, summary) => {
          return {
            totalSummaries: acc.totalSummaries + 1,
            totalContainers: acc.totalContainers + summary.totalContainers,
            totalCTN: acc.totalCTN + summary.totalCTN,
            totalDollar: acc.totalDollar + summary.totalDollar,
            totalFinalAmount: acc.totalFinalAmount + summary.totalFinalAmount,
            draftCount:
              summary.status === "DRAFT" ? acc.draftCount + 1 : acc.draftCount,
            activeCount:
              summary.status === "ACTIVE"
                ? acc.activeCount + 1
                : acc.activeCount,
            archivedCount:
              summary.status === "ARCHIVED"
                ? acc.archivedCount + 1
                : acc.archivedCount,
          };
        },
        {
          totalSummaries: 0,
          totalContainers: 0,
          totalCTN: 0,
          totalDollar: 0,
          totalFinalAmount: 0,
          draftCount: 0,
          activeCount: 0,
          archivedCount: 0,
        }
      );

      return stats;
    } catch (error) {
      console.error("Error getting statistics:", error);
      throw error;
    }
  },

  // Export summary to CSV
  exportToCSV: async (summaryId) => {
    try {
      const summary = await prisma.containerSummary.findUnique({
        where: { id: summaryId },
        include: {
          containers: {
            orderBy: {
              containerNo: "asc",
            },
          },
        },
      });

      if (!summary) {
        throw new Error("Summary not found");
      }

      // Prepare CSV data
      const headers = [
        "NO",
        "CONTAINER CODE",
        "CTN",
        "LOADING DATE",
        "ETA",
        "DOLLAR",
        "DOLLAR RATE",
        "INR",
        "DUTY 16.5%",
        "TOTAL",
        "GST 18%",
        "TOTAL DUTY",
        "DO CHARGE",
        "CFS",
        "FINAL AMOUNT",
        "SHIPPING LINE",
        "BL",
        "CONTAINER NO.",
        "SIMS",
        "STATUS",
      ];

      const rows = summary.containers.map((container) => [
        container.containerNo,
        container.containerCode || "",
        container.ctn,
        container.loadingDate
          ? new Date(container.loadingDate).toISOString().split("T")[0]
          : "",
        container.eta || "",
        container.dollar.toFixed(2),
        container.dollarRate.toFixed(2),
        container.inr.toFixed(2),
        container.duty.toFixed(2),
        container.total.toFixed(2),
        container.gst.toFixed(2),
        container.totalDuty.toFixed(2),
        container.doCharge.toFixed(2),
        container.cfs.toFixed(2),
        container.finalAmount.toFixed(2),
        container.shippingLine || "",
        container.bl || "",
        container.containerNoField || "",
        container.sims || "",
        container.status,
      ]);

      // Add summary row
      const summaryRow = [
        "",
        "SUMMARY TOTALS",
        summary.totalCTN,
        "",
        "",
        summary.totalDollar.toFixed(2),
        "",
        summary.totalINR.toFixed(2),
        "",
        "",
        "",
        "",
        "",
        "",
        summary.totalFinalAmount.toFixed(2),
        "",
        "",
        "",
        "",
        summary.status,
      ];

      rows.push([]); // Empty row
      rows.push(summaryRow);

      return {
        headers,
        rows,
        summary: {
          month: summary.month,
          totalContainers: summary.totalContainers,
          totalCTN: summary.totalCTN,
          totalDollar: summary.totalDollar,
          totalINR: summary.totalINR,
          totalFinalAmount: summary.totalFinalAmount,
        },
      };
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      throw error;
    }
  },

  // Export all summaries to CSV
  exportAllToCSV: async (createdBy) => {
    try {
      const where = {};
      if (createdBy) {
        where.createdBy = createdBy;
      }

      const summaries = await prisma.containerSummary.findMany({
        where,
        include: {
          containers: {
            orderBy: {
              containerNo: "asc",
            },
          },
        },
        orderBy: {
          month: "asc",
        },
      });

      if (summaries.length === 0) {
        throw new Error("No summaries found");
      }

      // Prepare CSV data for all summaries
      const headers = [
        "MONTH",
        "STATUS",
        "NO",
        "CONTAINER CODE",
        "CTN",
        "LOADING DATE",
        "DOLLAR",
        "DOLLAR RATE",
        "INR",
        "DUTY 16.5%",
        "GST 18%",
        "TOTAL DUTY",
        "DO CHARGE",
        "CFS",
        "FINAL AMOUNT",
        "SHIPPING LINE",
        "CONTAINER NO.",
        "STATUS",
      ];

      const rows = [];

      summaries.forEach((summary) => {
        // Add summary header row
        rows.push([
          summary.month,
          summary.status,
          "SUMMARY",
          "",
          summary.totalCTN,
          "",
          summary.totalDollar.toFixed(2),
          "",
          summary.totalINR.toFixed(2),
          "",
          "",
          "",
          "",
          "",
          summary.totalFinalAmount.toFixed(2),
          "",
          "",
          "",
        ]);

        // Add container rows
        summary.containers.forEach((container) => {
          rows.push([
            summary.month,
            summary.status,
            container.containerNo,
            container.containerCode || "",
            container.ctn,
            container.loadingDate
              ? new Date(container.loadingDate).toISOString().split("T")[0]
              : "",
            container.dollar.toFixed(2),
            container.dollarRate.toFixed(2),
            container.inr.toFixed(2),
            container.duty.toFixed(2),
            container.gst.toFixed(2),
            container.totalDuty.toFixed(2),
            container.doCharge.toFixed(2),
            container.cfs.toFixed(2),
            container.finalAmount.toFixed(2),
            container.shippingLine || "",
            container.containerNoField || "",
            container.status,
          ]);
        });

        // Add empty row between summaries
        rows.push([]);
      });

      return {
        headers,
        rows,
        totalSummaries: summaries.length,
      };
    } catch (error) {
      console.error("Error exporting all to CSV:", error);
      throw error;
    }
  },

  // Search summaries
  searchSummaries: async (query, createdBy) => {
    try {
      const where = {
        OR: [
          { month: { contains: query, mode: "insensitive" } },
          { status: { contains: query, mode: "insensitive" } },
        ],
      };

      if (createdBy) {
        where.createdBy = createdBy;
      }

      const summaries = await prisma.containerSummary.findMany({
        where,
        include: {
          containers: {
            select: {
              _count: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      });

      return summaries;
    } catch (error) {
      console.error("Error searching summaries:", error);
      throw error;
    }
  },
};

module.exports = containerSummaryService;
