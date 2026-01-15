const { prisma } = require('../../database/prisma');

const bifurcationService = {
  // Fetch bifurcation report data
  getBifurcationReport: async (filters = {}) => {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const skip = (page - 1) * limit;

    // 1. Get the "MIX ITEM" limit from settings
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'BIFURCATION_ITEM_LIMIT' }
    });
    const mixLimit = setting ? parseInt(setting.value) : 5;

    // 2. Fetch Containers first to paginate grouped data correctly
    const containerWhere = {
      status: { not: 'ARCHIVED' }
    };

    if (filters.containerId) {
      containerWhere.id = filters.containerId;
    }

    // Apply search and date filters if provided
    if (filters.search || filters.dateFrom || filters.dateTo) {
      const subWhere = {};
      
      if (filters.search) {
        subWhere.OR = [
          { containerCode: { contains: filters.search, mode: 'insensitive' } },
          { loadingSheets: { some: { shippingMark: { contains: filters.search, mode: 'insensitive' } } } }
        ];
      }

      if (filters.dateFrom || filters.dateTo) {
        subWhere.loadingDate = {};
        if (filters.dateFrom) subWhere.loadingDate.gte = new Date(filters.dateFrom);
        if (filters.dateTo) subWhere.loadingDate.lte = new Date(filters.dateTo);
      }

      Object.assign(containerWhere, subWhere);
    }

    const totalContainers = await prisma.container.count({ where: containerWhere });
    const containers = await prisma.container.findMany({
      where: containerWhere,
      orderBy: { containerCode: 'asc' },
      skip,
      take: limit,
      include: {
        loadingSheets: {
          include: {
            items: true,
            bifurcation: true
          },
          orderBy: { shippingMark: 'asc' }
        }
      }
    });

    // 3. Flatten and Transform data
    const reportData = [];
    containers.forEach(container => {
      container.loadingSheets.forEach(sheet => {
        // Calculate Product Description
        const distinctParticulars = [...new Set(sheet.items.map(i => i.particular).filter(Boolean))];
        let productDescription = distinctParticulars.join(', ');
        
        if (distinctParticulars.length > mixLimit) {
          productDescription = 'MIX ITEM';
        }

        // Totals
        const totalCtn = sheet.items.reduce((sum, item) => sum + (item.ctn || 0), 0);
        const totalCbm = sheet.items.reduce((sum, item) => sum + (item.tCbm || 0), 0);
        const totalWt = sheet.items.reduce((sum, item) => sum + (item.tWt || 0), 0);

        // Container-level totals (sum of all loading sheets in this container)
        const containerTotalCbm = container.loadingSheets.reduce((sum, s) => {
          return sum + s.items.reduce((iSum, i) => iSum + (i.tCbm || 0), 0);
        }, 0);
        const containerTotalWt = container.loadingSheets.reduce((sum, s) => {
          return sum + s.items.reduce((iSum, i) => iSum + (i.tWt || 0), 0);
        }, 0);

        reportData.push({
          id: sheet.id,
          containerId: container.id,
          containerCode: container.containerCode,
          loadingDate: container.loadingDate,
          mark: sheet.shippingMark || 'N/A',
          clientName: sheet.clientName || '',
          ctn: totalCtn,
          product: productDescription,
          totalCbm: parseFloat(totalCbm.toFixed(3)),
          containerTotalCbm: parseFloat(containerTotalCbm.toFixed(3)),
          totalWt: parseFloat(totalWt.toFixed(2)),
          containerTotalWt: parseFloat(containerTotalWt.toFixed(2)),
          deliveryDate: sheet.bifurcation?.deliveryDate || null,
          invoiceNo: sheet.bifurcation?.invoiceNo || '',
          gst: sheet.bifurcation?.gst || '',
          gstAmount: sheet.bifurcation?.gstAmount || 0,
          from: sheet.bifurcation?.from || '',
          to: sheet.bifurcation?.to || '',
          lrNo: sheet.bifurcation?.lrNo || false
        });
      });
    });

    return { 
      data: reportData,
      pagination: {
        page,
        limit,
        total: totalContainers,
        totalPages: Math.ceil(totalContainers / limit)
      },
      settings: {
        mixLimit
      }
    };
  },

  // Update or Create Bifurcation details
  upsertBifurcation: async (loadingSheetId, data, userId) => {
    const { invoiceNo, gst, gstAmount, deliveryDate, from, to, lrNo } = data;

    // Get existing details for comparison
    const existing = await prisma.bifurcation.findUnique({
      where: { loadingSheetId }
    });

    // We need the containerId for the record
    const sheet = await prisma.loadingSheet.findUnique({
        where: { id: loadingSheetId },
        select: { containerId: true }
    });

    if (!sheet) throw new Error("Loading Sheet not found");

    const result = await prisma.bifurcation.upsert({
      where: { loadingSheetId },
      update: {
        invoiceNo,
        gst,
        gstAmount: parseFloat(gstAmount) || 0,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        from,
        to,
        lrNo: Boolean(lrNo)
      },
      create: {
        loadingSheetId,
        containerId: sheet.containerId,
        invoiceNo,
        gst,
        gstAmount: parseFloat(gstAmount) || 0,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        from,
        to,
        lrNo: Boolean(lrNo)
      }
    });

    // Log activities if something changed
    if (userId) {
      const fields = ['invoiceNo', 'gst', 'gstAmount', 'deliveryDate', 'from', 'to', 'lrNo'];
      const activities = [];

      for (const field of fields) {
        let oldVal = existing ? existing[field] : null;
        let newVal = result[field];

        // Format for comparison (dates and nulls)
        if (field === 'deliveryDate') {
          oldVal = oldVal ? new Date(oldVal).toISOString().split('T')[0] : null;
          newVal = newVal ? new Date(newVal).toISOString().split('T')[0] : null;
        }

        if (String(oldVal) !== String(newVal)) {
          activities.push({
            bifurcationId: result.id,
            userId,
            type: existing ? 'UPDATE' : 'CREATE',
            field,
            oldValue: existing ? String(oldVal) : null,
            newValue: String(newVal)
          });
        }
      }

      if (activities.length > 0) {
        await prisma.bifurcationActivity.createMany({
          data: activities
        });
      }
    }

    return result;
  },

  getBifurcationActivities: async (filters = {}) => {
    const { bifurcationId, containerId, search, page = 1, limit = 20 } = filters;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    
    if (bifurcationId) where.bifurcationId = bifurcationId;
    if (containerId) {
      where.bifurcation = { containerId };
    }

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { username: { contains: search, mode: 'insensitive' } } },
        { field: { contains: search, mode: 'insensitive' } },
        { oldValue: { contains: search, mode: 'insensitive' } },
        { newValue: { contains: search, mode: 'insensitive' } },
        { bifurcation: { container: { containerCode: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    const total = await prisma.bifurcationActivity.count({ where });
    const activities = await prisma.bifurcationActivity.findMany({
      where,
      include: {
        user: { select: { name: true, username: true } },
        bifurcation: { 
            include: {
                container: { select: { containerCode: true } }
            }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

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

  getUniqueContainersForActivities: async () => {
    const activities = await prisma.bifurcationActivity.findMany({
      distinct: ['bifurcationId'],
      select: {
        bifurcation: {
          select: {
            container: {
              select: {
                id: true,
                containerCode: true
              }
            }
          }
        }
      }
    });

    const containers = activities
      .map(a => a.bifurcation?.container)
      .filter(Boolean);
    
    // De-duplicate by id
    const uniqueMap = new Map();
    containers.forEach(c => uniqueMap.set(c.id, c));
    
    return Array.from(uniqueMap.values()).map(c => ({
      containerId: c.id,
      containerCode: c.containerCode
    })).sort((a, b) => 
      a.containerCode.localeCompare(b.containerCode)
    );
  },

  // Update System Settings
  updateSetting: async (key, value) => {
    return await prisma.systemSetting.upsert({
      where: { key },
      update: { value: value.toString() },
      create: { key, value: value.toString() }
    });
  },

  getSetting: async (key) => {
    return await prisma.systemSetting.findUnique({
      where: { key }
    });
  },

  // Search containers with aggregated data for suggestions
  searchContainers: async (query) => {
    if (!query) return [];

    const containers = await prisma.container.findMany({
      where: {
        containerCode: { contains: query, mode: 'insensitive' },
        status: { not: 'ARCHIVED' }
      },
      take: 10,
      include: {
        loadingSheets: {
          include: {
            bifurcation: true,
            items: true
          }
        }
      },
      orderBy: { loadingDate: 'desc' }
    });

    return containers.map(container => {
      // Aggregate data from loading sheets
      const invoices = new Set();
      const locations = new Set();
      let totalCtn = 0;
      let shippingLine = '';
      
      container.loadingSheets.forEach(sheet => {
        if (sheet.bifurcation) {
          if (sheet.bifurcation.invoiceNo) invoices.add(sheet.bifurcation.invoiceNo);
          if (sheet.bifurcation.to) locations.add(sheet.bifurcation.to);
        }
        
        // Sum up cartons from items
        const sheetCtn = sheet.items.reduce((sum, item) => sum + (item.ctn || 0), 0);
        totalCtn += sheetCtn;
      });

      // Join sets into comma-separated strings
      const invoiceNo = Array.from(invoices).join(', ');
      const shippingLocation = Array.from(locations).join(', ');

      return {
        id: container.id,
        containerCode: container.containerCode,
        loadingDate: container.loadingDate,
        status: ['Loaded', 'Insea', 'Delivered'].includes(container.status) ? container.status : 'Loaded',
        ctn: totalCtn || container.totalCtn || 0,
        invoiceNo,
        shippingLocation,
        shippingLine // If available in future
      };
    });
  }
};

module.exports = bifurcationService;
