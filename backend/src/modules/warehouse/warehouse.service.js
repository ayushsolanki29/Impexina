const { prisma } = require('../../database/prisma');

const warehouseService = {
  // Fetch warehouse report data
  getWarehouseReport: async (filters = {}) => {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch Containers first
    const containerWhere = {
      status: { not: 'ARCHIVED' }
    };

    if (filters.containerId) {
      containerWhere.id = filters.containerId;
    }

    // Apply search and date filters
    if (filters.search || filters.dateFrom || filters.dateTo || filters.origin) {
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

      if (filters.origin) {
        subWhere.origin = { contains: filters.origin, mode: 'insensitive' };
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
            warehouse: true,
            bifurcation: true
          },
          orderBy: { shippingMark: 'asc' }
        }
      }
    });

    // Flatten and Transform data
    const reportData = [];
    containers.forEach(container => {
      container.loadingSheets.forEach(sheet => {
        // Calculate Product Description (using same logic as bifurcation)
        const distinctParticulars = [...new Set(sheet.items.map(i => i.particular).filter(Boolean))];
        let productDescription = distinctParticulars.join(', ');
        
        // Items are limited for display, though we don't have the setting here yet, let's just join them
        if (distinctParticulars.length > 5) {
          productDescription = 'MIX ITEM';
        }

        const totalCtn = sheet.items.reduce((sum, item) => sum + (item.ctn || 0), 0);
        const totalCbm = sheet.items.reduce((sum, item) => sum + (item.tCbm || 0), 0);
        const totalWt = sheet.items.reduce((sum, item) => sum + (item.tWt || 0), 0);

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
          origin: container.origin || '',
          mark: sheet.shippingMark || 'N/A',
          clientName: sheet.clientName || '',
          ctn: totalCtn,
          product: productDescription,
          totalCbm: parseFloat(totalCbm.toFixed(3)),
          containerTotalCbm: parseFloat(containerTotalCbm.toFixed(3)),
          totalWt: parseFloat(totalWt.toFixed(2)),
          containerTotalWt: parseFloat(containerTotalWt.toFixed(2)),
          
          // Data from bifurcation (read-only in warehouse plan)
          deliveryDate: sheet.bifurcation?.deliveryDate || null,
          invoiceNo: sheet.bifurcation?.invoiceNo || '',
          gst: sheet.bifurcation?.gst || '',
          gstAmount: sheet.bifurcation?.gstAmount ?? 0,
          from: sheet.bifurcation?.from || '',
          to: sheet.bifurcation?.to || '',
          lrNo: sheet.bifurcation?.lrNo ?? false,
          
          // Only transporter is from warehouse model
          transporter: sheet.warehouse?.transporter || ''
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
      }
    };
  },

  // Update or Create Warehouse details (Only Transporter)
  upsertWarehouse: async (loadingSheetId, data, userId) => {
    const { transporter } = data;

    // Get existing for activities
    const existing = await prisma.warehouse.findUnique({
      where: { loadingSheetId }
    });

    const sheet = await prisma.loadingSheet.findUnique({
        where: { id: loadingSheetId },
        select: { containerId: true }
    });

    if (!sheet) throw new Error("Loading Sheet not found");

    const result = await prisma.warehouse.upsert({
      where: { loadingSheetId },
      update: {
        transporter
      },
      create: {
        loadingSheetId,
        containerId: sheet.containerId,
        transporter
      }
    });

    // Activities
    if (userId) {
      const field = 'transporter';
      let oldVal = existing ? existing[field] : null;
      let newVal = result[field];

      if (String(oldVal) !== String(newVal)) {
          await prisma.warehouseActivity.create({
            data: {
              warehouseId: result.id,
              userId,
              type: existing ? 'UPDATE' : 'CREATE',
              field,
              oldValue: existing ? String(oldVal) : null,
              newValue: String(newVal)
            }
          });
      }
    }

    return result;
  },

  getWarehouseActivities: async (filters = {}) => {
    const { warehouseId, containerId, search, page = 1, limit = 20 } = filters;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    
    if (warehouseId) where.warehouseId = warehouseId;
    if (containerId) {
      where.warehouse = { containerId };
    }

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { field: { contains: search, mode: 'insensitive' } },
        { oldValue: { contains: search, mode: 'insensitive' } },
        { newValue: { contains: search, mode: 'insensitive' } },
        { warehouse: { container: { containerCode: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    const total = await prisma.warehouseActivity.count({ where });
    const activities = await prisma.warehouseActivity.findMany({
      where,
      include: {
        user: { select: { name: true, username: true } },
        warehouse: { 
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

  getTransporters: async () => {
    const transporters = await prisma.warehouse.findMany({
      where: { transporter: { not: null, not: "" } },
      select: { transporter: true },
      distinct: ['transporter']
    });
    return transporters.map(t => t.transporter).sort();
  }
};

module.exports = warehouseService;
