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
        },
      });

      if (existingSummary) {
        throw new Error(`A summary for ${month} already exists.`);
      }

      // Calculate totals
      const totals = containers.reduce(
        (acc, container) => {
          const inr = container.dollar * container.dollarRate;
          const dutyPercent = container.dutyPercent ?? 16.5;
          const gstPercent = container.gstPercent ?? 18.0;
          const dutyCalc = inr * (dutyPercent / 100);
          const totalCalc = inr + dutyCalc;
          const gstCalc = totalCalc * (gstPercent / 100);
          const duty = container.duty != null ? Number(container.duty) : dutyCalc;
          const total = inr + duty;
          const gst = container.gst != null ? Number(container.gst) : total * (gstPercent / 100);
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
              const dutyPercent = container.dutyPercent ?? 16.5;
              const gstPercent = container.gstPercent ?? 18.0;
              const dutyCalc = inr * (dutyPercent / 100);
              const totalCalc = inr + dutyCalc;
              const gstCalc = totalCalc * (gstPercent / 100);
              const duty = container.duty != null ? Number(container.duty) : dutyCalc;
              const total = inr + duty;
              const gst = container.gst != null ? Number(container.gst) : total * (gstPercent / 100);
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
                dutyPercent: container.dutyPercent ?? 16.5,
                gstPercent: container.gstPercent ?? 18.0,
                inr: parseFloat(inr.toFixed(2)),
                duty: parseFloat(duty.toFixed(2)),
                total: parseFloat(total.toFixed(2)),
                gst: parseFloat(gst.toFixed(2)),
                totalDuty: parseFloat(totalDuty.toFixed(2)),
                finalAmount: parseFloat(finalAmount.toFixed(2)),
                shippingLine: container.shippingLine || "",
                bl: container.bl || "",
                origin: container.origin || "",
                containerNoField: container.containerNo || "",
                sims: container.sims || "",
                pims: container.pims || "",
                cellStyles: container.cellStyles || {},
                isActive: container.isActive !== false,
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

  // Toggle active/inactive for a single container
  toggleContainerActive: async (summaryId, containerId, userId, userName) => {
    try {
      const container = await prisma.containerInSummary.findFirst({
        where: { id: containerId, summaryId },
      });
      if (!container) throw new Error("Container not found");

      const updated = await prisma.containerInSummary.update({
        where: { id: containerId },
        data: { isActive: !container.isActive },
      });

      await prisma.summaryActivity.create({
        data: {
          summaryId,
          userId,
          type: "UPDATED",
          field: "containerIsActive",
          oldValue: { containerId, isActive: container.isActive },
          newValue: { containerId, isActive: updated.isActive },
          note: `Container ${container.containerCode || containerId} marked as ${updated.isActive ? "active" : "inactive"}`,
        },
      });

      return updated;
    } catch (error) {
      console.error("Error toggling container active:", error);
      throw error;
    }
  },

  // Toggle active/inactive
  toggleSummaryActive: async (summaryId, userId, userName) => {
    try {
      const summary = await prisma.containerSummary.findUnique({ where: { id: summaryId } });
      if (!summary) throw new Error("Summary not found");

      const updated = await prisma.containerSummary.update({
        where: { id: summaryId },
        data: { isActive: !summary.isActive, updatedBy: userName },
      });

      await prisma.summaryActivity.create({
        data: {
          summaryId,
          userId,
          type: "UPDATED",
          field: "isActive",
          oldValue: { isActive: summary.isActive },
          newValue: { isActive: updated.isActive },
          note: `Summary marked as ${updated.isActive ? "active" : "inactive"}`,
        },
      });

      return updated;
    } catch (error) {
      console.error("Error toggling summary active:", error);
      throw error;
    }
  },

  // Get all containers (flat list) with pagination + filters
  getAllContainers: async (query = {}) => {
    const {
      page = 1,
      limit = 20,
      search = "",
      status = "",
      month = "",
      shippingLine = "",
      containerCode = "",
      origin = "",
      dateFrom = "",
      dateTo = "",
    } = query;

    try {
      const skip = (page - 1) * limit;
      const where = {};

      if (search) {
        where.OR = [
          { containerCode: { contains: search, mode: "insensitive" } },
          { bl: { contains: search, mode: "insensitive" } },
          { containerNoField: { contains: search, mode: "insensitive" } },
          { shippingLine: { contains: search, mode: "insensitive" } },
          { summary: { month: { contains: search, mode: "insensitive" } } },
        ];
      }

      // Only include containers from active summaries, and only active containers
      where.summary = { ...(where.summary || {}), isActive: true };
      where.isActive = true;

      // Multi-value filters (comma-separated)
      if (status) {
        const vals = status.split(",").map((v) => v.trim()).filter(Boolean);
        if (vals.length) where.status = { in: vals };
      }
      if (shippingLine) {
        const vals = shippingLine.split(",").map((v) => v.trim()).filter(Boolean);
        if (vals.length) where.shippingLine = { in: vals };
      }
      if (containerCode) {
        const vals = containerCode.split(",").map((v) => v.trim()).filter(Boolean);
        if (vals.length) where.containerCode = { in: vals };
      }
      if (origin) {
        const vals = origin.split(",").map((v) => v.trim()).filter(Boolean);
        if (vals.length) where.origin = { in: vals };
      }
      if (month) {
        const vals = month.split(",").map((v) => v.trim()).filter(Boolean);
        if (vals.length) where.summary = { month: { in: vals } };
      }
      if (dateFrom || dateTo) {
        where.loadingDate = {};
        if (dateFrom) where.loadingDate.gte = new Date(dateFrom);
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          where.loadingDate.lte = to;
        }
      }

      const [containers, total] = await Promise.all([
        prisma.containerInSummary.findMany({
          where,
          skip,
          take: limit,
          include: {
            summary: { select: { month: true, id: true, createdBy: true } },
          },
          orderBy: { loadingDate: "desc" },
        }),
        prisma.containerInSummary.count({ where }),
      ]);

      // Aggregate stats for filtered set
      const agg = await prisma.containerInSummary.aggregate({
        where,
        _sum: { dollar: true, finalAmount: true, ctn: true, duty: true, gst: true },
        _count: { id: true },
      });

      // Status breakdown
      const statusBreakdown = await prisma.containerInSummary.groupBy({
        by: ["status"],
        where,
        _count: { id: true },
      });

      const totalPages = Math.ceil(total / limit);

      return {
        containers: containers.map((c) => ({
          ...c,
          month: c.summary?.month,
          monthId: c.summary?.id,
          summaryCreatedBy: c.summary?.createdBy,
          summary: undefined,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        stats: {
          totalContainers: agg._count.id,
          totalValue: agg._sum.dollar || 0,
          totalFinalAmount: agg._sum.finalAmount || 0,
          totalCTN: agg._sum.ctn || 0,
          totalDuty: agg._sum.duty || 0,
          totalGST: agg._sum.gst || 0,
          statusBreakdown: statusBreakdown.reduce((acc, s) => {
            acc[s.status] = s._count.id;
            return acc;
          }, {}),
        },
      };
    } catch (error) {
      console.error("Error getting all containers:", error);
      throw error;
    }
  },

  // Get unique filter values for containers
  getContainerFilterOptions: async () => {
    try {
      const [origins, shippingLines, containerCodes, statuses, summaries] = await Promise.all([
        prisma.containerInSummary.findMany({ select: { origin: true }, distinct: ["origin"], where: { origin: { not: null, not: "" } } }),
        prisma.containerInSummary.findMany({ select: { shippingLine: true }, distinct: ["shippingLine"], where: { shippingLine: { not: null, not: "" } } }),
        prisma.containerInSummary.findMany({ select: { containerCode: true }, distinct: ["containerCode"], where: { containerCode: { not: "" } } }),
        prisma.containerInSummary.findMany({ select: { status: true }, distinct: ["status"], where: { status: { not: null, not: "" } } }),
        prisma.containerSummary.findMany({ select: { month: true }, where: { isActive: true }, orderBy: { createdAt: "desc" } }),
      ]);

      return {
        origins: origins.map((o) => o.origin).filter(Boolean).sort(),
        shippingLines: shippingLines.map((s) => s.shippingLine).filter(Boolean).sort(),
        containerCodes: containerCodes.map((c) => c.containerCode).filter(Boolean).sort(),
        statuses: statuses.map((s) => s.status).filter(Boolean).sort(),
        months: summaries.map((s) => s.month).filter(Boolean),
      };
    } catch (error) {
      console.error("Error getting filter options:", error);
      throw error;
    }
  },

  // Get all summaries with pagination
  getAllSummaries: async (query = {}) => {
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      createdBy,
      origin,
      dateFrom,
      dateTo
    } = query;
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

      if (origin) {
        where.containers = {
          some: { origin: { contains: origin, mode: "insensitive" } }
        };
      }

      if (dateFrom || dateTo) {
        if (!where.containers) where.containers = { some: {} };
        if (dateFrom) where.containers.some.loadingDate = { ...where.containers.some.loadingDate, gte: new Date(dateFrom) };
        if (dateTo) where.containers.some.loadingDate = { ...where.containers.some.loadingDate, lte: new Date(dateTo) };
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
                cellStyles: true,
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
            const dutyPercent = container.dutyPercent ?? 16.5;
            const gstPercent = container.gstPercent ?? 18.0;
            const dutyCalc = inr * (dutyPercent / 100);
            const totalCalc = inr + dutyCalc;
            const gstCalc = totalCalc * (gstPercent / 100);
            const duty = container.duty != null ? Number(container.duty) : dutyCalc;
            const total = inr + duty;
            const gst = container.gst != null ? Number(container.gst) : total * (gstPercent / 100);
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
            const dutyCalc = inr * 0.165;
            const totalCalc = inr + dutyCalc;
            const gstCalc = totalCalc * 0.18;
            const duty = container.duty != null ? Number(container.duty) : dutyCalc;
            const total = inr + duty;
            const gst = container.gst != null ? Number(container.gst) : total * 0.18;
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
              dutyPercent: container.dutyPercent ?? 16.5,
              gstPercent: container.gstPercent ?? 18.0,
              inr: parseFloat(inr.toFixed(2)),
              duty: parseFloat(duty.toFixed(2)),
              total: parseFloat(total.toFixed(2)),
              gst: parseFloat(gst.toFixed(2)),
              totalDuty: parseFloat(totalDuty.toFixed(2)),
              finalAmount: parseFloat(finalAmount.toFixed(2)),
              shippingLine: container.shippingLine || "",
              bl: container.bl || "",
              origin: container.origin || "",
              containerNoField: container.containerNo || "",
              sims: container.sims || "",
              pims: container.pims || "",
              cellStyles: container.cellStyles || {},
              isActive: container.isActive !== false,
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
          oldValue: {
            month: existingSummary.month,
            status: existingSummary.status,
            containerCount: existingSummary.totalContainers,
            totalFinalAmount: existingSummary.totalFinalAmount,
          },
          newValue: {
            month: summary.month,
            status: summary.status,
            containerCount: summary.totalContainers,
            totalFinalAmount: summary.totalFinalAmount,
          },
          note: `updated container summary for ${summary.month}`,
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
        "DUTY",
        "TOTAL",
        "GST",
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
        "DUTY",
        "GST",
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
  // Get global themes
  getThemes: async () => {
    try {
      const themes = await prisma.containerSummaryTheme.findMany();
      return themes;
    } catch (error) {
      console.error("Error getting themes:", error);
      throw error;
    }
  },

  // Get all activities across all summaries (global audit log)
  getAllActivities: async (query = {}) => {
    const { page = 1, limit = 50, type, summaryId, search = "" } = query;
    try {
      const skip = (page - 1) * limit;
      const where = {};

      if (type) where.type = type;
      if (summaryId) where.summaryId = summaryId;

      if (search) {
        where.OR = [
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { note: { contains: search, mode: 'insensitive' } },
          { field: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [activities, total] = await Promise.all([
        prisma.summaryActivity.findMany({
          where,
          include: {
            user: {
              select: { name: true, role: true },
            },
            summary: {
              select: { month: true },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.summaryActivity.count({ where }),
      ]);

      return {
        activities,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error getting all activities:", error);
      throw error;
    }
  },

  // Upsert global themes
  upsertThemes: async (themes, userId, userName) => {
    try {
      // Get old themes for log
      const oldThemes = await prisma.containerSummaryTheme.findMany();

      const operations = themes.map((theme) =>
        prisma.containerSummaryTheme.upsert({
          where: { field: theme.field },
          update: { color: theme.color, role: theme.role },
          create: { field: theme.field, color: theme.color, role: theme.role },
        })
      );

      await Promise.all(operations);

      // Create activity log for theme change
      await prisma.summaryActivity.create({
        data: {
          userId,
          type: "THEME_UPDATED",
          oldValue: oldThemes,
          newValue: themes,
          note: `Updated global color themes & field roles`,
        },
      });

      return { success: true };
    } catch (error) {
      console.error("Error upserting themes:", error);
      throw error;
    }
  },
};

module.exports = containerSummaryService;
