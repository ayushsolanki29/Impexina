const { prisma } = require("../../database/prisma");

const containerService = {
  // Create a new container
  createContainer: async (data, userId) => {
    const { containerCode, origin, loadingDate } = data;

    // Check if container already exists
    const existing = await prisma.container.findUnique({
      where: { containerCode },
    });

    if (existing) {
      throw new Error(`Container with code "${containerCode}" already exists`);
    }

    const container = await prisma.container.create({
      data: {
        containerCode,
        origin,
        loadingDate: loadingDate ? new Date(loadingDate) : new Date(),
        status: "OPEN",
      },
    });

    // Log Activity
    if (userId) {
      await prisma.containerActivity.create({
        data: {
          containerId: container.id,
          userId,
          type: "CREATE",
          newValue: containerCode
        }
      });
    }

    return container;
  },

  // Get all containers with pagination and filters
  getAllContainers: async ({ page = 1, limit = 20, search, origin, status, startDate, endDate, minCtn, maxCtn }) => {
    const skip = (page - 1) * limit;
    const where = {};

    // 1. Basic Filters
    if (search) {
      where.containerCode = { contains: search, mode: "insensitive" };
    }
    if (origin) where.origin = origin;
    if (status) where.status = status;

    // 2. Date Range Filter
    if (startDate || endDate) {
      where.loadingDate = {};
      if (startDate) where.loadingDate.gte = new Date(startDate);
      if (endDate) where.loadingDate.lte = new Date(endDate);
    }

    // 3. CTN Range Filter (Now efficient with DB columns)
    if (minCtn || maxCtn) {
      where.totalCtn = {};
      if (minCtn) where.totalCtn.gte = parseInt(minCtn);
      if (maxCtn) where.totalCtn.lte = parseInt(maxCtn);
    }

    const [containers, total] = await Promise.all([
      prisma.container.findMany({
        where,
        skip,
        take: limit,
        orderBy: { loadingDate: "desc" },
        // We can still include loadingSheets if needed for other details, 
        // but for list view, we have everything in the container model now.
        include: {
          loadingSheets: {
             // Only select minimal fields if just counting clients, but we have clientCount now.
             select: { shippingMark: true } 
          }
        }
      }),
      prisma.container.count({ where }),
    ]);

    // 4. Calculate Global Stats (Server-side Aggregation from Container table)
    const aggregations = await prisma.container.aggregate({
      where,
      _sum: {
        totalCtn: true,
        totalCbm: true,
        totalWt: true,
      },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      containers,
      aggregates: {
        totalCTN: aggregations._sum.totalCtn || 0,
        totalCBM: parseFloat((aggregations._sum.totalCbm || 0).toFixed(3)),
        totalWT: parseFloat((aggregations._sum.totalWt || 0).toFixed(2)),
        totalContainers: total
      },
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },

    };
  },

  getUniqueOrigins: async () => {
    const origins = await prisma.container.findMany({
      distinct: ['origin'],
      select: {
        origin: true,
      },
      orderBy: {
        origin: 'asc',
      },
    });
    return origins.map(o => o.origin).filter(Boolean);
  },


  // Recalculate Totals (Helper to be called when items change)
  recalculateContainerTotals: async (containerId) => {
    const container = await prisma.container.findUnique({
      where: { id: containerId },
      include: {
        loadingSheets: {
          include: { items: true }
        }
      }
    });

    if (!container) return;

    let totalCtn = 0;
    let totalCbm = 0;
    let totalWt = 0;
    const clients = new Set();

    container.loadingSheets.forEach(sheet => {
      if (sheet.shippingMark) clients.add(sheet.shippingMark);
      sheet.items.forEach(item => {
        totalCtn += item.ctn || 0;
        // recalculate item totals just in case, or trust item.tCbm? 
        // Better to use stored item totals if accurate, or recompute.
        // Let's rely on item totals being correct (assuming item update logic handles them)
        // Actually, item.tCbm is usually (ctn * cbm). 
        // Let's sum up carefully.
        const itemCtn = item.ctn || 0;
        const itemCbm = item.cbm || 0;
        const itemWt = item.wt || 0;
        
        // If your item model stores accurate tCbm/tWt use that, otherwise calc:
        // Use simpler calc for safety if unsure where tCbm comes from
        totalCbm += (itemCtn * itemCbm); 
        totalWt += (itemCtn * itemWt);
      });
    });

    // Update container
    await prisma.container.update({
      where: { id: containerId },
      data: {
        totalCtn,
        totalCbm: parseFloat(totalCbm.toFixed(3)),
        totalWt: parseFloat(totalWt.toFixed(2)),
        clientCount: clients.size
      }
    });
  },

  // Get single container by ID
  getContainerById: async (id) => {
    const container = await prisma.container.findUnique({
      where: { id },
      include: {
        loadingSheets: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!container) {
      throw new Error("Container not found");
    }

    return container;
  },

  // Update container
  updateContainer: async (id, data, userId) => {
    const { containerCode, origin, loadingDate, status } = data;

    const container = await prisma.container.findUnique({
      where: { id },
    });

    if (container.createdAt instanceof Date) {
        // Just checking if we have the record
    }

    if (!container) {
      throw new Error("Container not found");
    }

    // Check if containerCode is being changed and if it already exists
    if (containerCode && containerCode !== container.containerCode) {
      const existing = await prisma.container.findUnique({
        where: { containerCode },
      });

      if (existing) {
        throw new Error(`Container with code "${containerCode}" already exists`);
      }
    }

    // Prepare changes for logging
    const changes = [];
    if (containerCode && containerCode !== container.containerCode) {
      changes.push({ field: 'containerCode', old: container.containerCode, new: containerCode });
    }
    if (origin && origin !== container.origin) {
      changes.push({ field: 'origin', old: container.origin, new: origin });
    }
    if (loadingDate) {
        const newDate = new Date(loadingDate).toISOString().split('T')[0];
        const oldDate = container.loadingDate ? new Date(container.loadingDate).toISOString().split('T')[0] : null;
        if (newDate !== oldDate) {
            changes.push({ field: 'loadingDate', old: oldDate, new: newDate });
        }
    }
    if (status && status !== container.status) {
      changes.push({ field: 'status', old: container.status, new: status });
    }

    const updated = await prisma.container.update({
      where: { id },
      data: {
        ...(containerCode && { containerCode }),
        ...(origin && { origin }),
        ...(loadingDate && { loadingDate: new Date(loadingDate) }),
        ...(status && { status }),
      },
    });

    // Log Activities
    if (userId && changes.length > 0) {
      await Promise.all(changes.map(change => 
        prisma.containerActivity.create({
          data: {
            containerId: id,
            userId,
            type: "UPDATE",
            field: change.field,
            oldValue: change.old ? String(change.old) : null,
            newValue: change.new ? String(change.new) : null
          }
        })
      ));
    }

    return updated;
  },

  // Get activities
  getActivities: async (filters = {}) => {
    const { containerId, search, page = 1, limit = 20 } = filters;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    
    if (containerId) where.containerId = containerId;
    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { field: { contains: search, mode: 'insensitive' } },
        { oldValue: { contains: search, mode: 'insensitive' } },
        { newValue: { contains: search, mode: 'insensitive' } },
        { container: { containerCode: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [activities, total] = await Promise.all([
      prisma.containerActivity.findMany({
        where,
        include: {
          user: { select: { name: true, username: true } },
          container: { select: { containerCode: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.containerActivity.count({ where })
    ]);

    return {
      data: activities,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  },

  // Delete container
  deleteContainer: async (id, userId) => {
    const container = await prisma.container.findUnique({
      where: { id },
    });

    if (!container) {
      throw new Error("Container not found");
    }

    // Log before delete (optional, but good for audit)
    if (userId) {
        await prisma.containerActivity.create({
            data: {
                containerId: id,
                userId,
                type: "DELETE",
                newValue: container.containerCode
            }
        });
    }

    await prisma.container.delete({
      where: { id },
    });

    return { message: "Container deleted successfully" };
  },
};

module.exports = containerService;
