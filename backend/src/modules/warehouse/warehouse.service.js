const { prisma } = require('../../database/prisma');

const warehouseService = {
  // Get all stock items with pagination and search
  getStock: async ({ page, limit, search }) => {
    const skip = (page - 1) * limit;
    
    const where = search ? {
      OR: [
        { itemName: { contains: search, mode: 'insensitive' } },
        { itemNo: { contains: search, mode: 'insensitive' } },
        { mark: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    const [items, total] = await Promise.all([
      prisma.warehouseItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          loadingSheet: {
            select: {
              shippingCode: true,
              status: true
            }
          }
        }
      }),
      prisma.warehouseItem.count({ where })
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },

  // Update stock quantity (inward/outward)
  updateStock: async (itemId, quantity, movementType, notes, userId) => {
    if (!['INWARD', 'OUTWARD'].includes(movementType)) {
      throw new Error('Invalid movement type. Use INWARD or OUTWARD');
    }

    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    const item = await prisma.warehouseItem.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      throw new Error('Item not found');
    }

    // Calculate new quantity
    let newQuantity = item.quantity;
    if (movementType === 'INWARD') {
      newQuantity += quantity;
    } else {
      if (item.quantity < quantity) {
        throw new Error('Insufficient stock');
      }
      newQuantity -= quantity;
    }

    // Update item quantity
    const updatedItem = await prisma.warehouseItem.update({
      where: { id: itemId },
      data: {
        quantity: newQuantity,
        updatedAt: new Date()
      }
    });

    // Record movement history
    await prisma.stockMovement.create({
      data: {
        itemId,
        quantity,
        movementType,
        previousQuantity: item.quantity,
        newQuantity,
        notes,
        userId,
        createdAt: new Date()
      }
    });

    return {
      item: updatedItem,
      movement: {
        type: movementType,
        quantity,
        previousStock: item.quantity,
        newStock: newQuantity
      }
    };
  },

  // Get stock movement history
  getMovementHistory: async ({ page, limit, startDate, endDate }) => {
    const skip = (page - 1) * limit;
    
    let where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          item: {
            select: {
              itemName: true,
              itemNo: true,
              mark: true
            }
          },
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.stockMovement.count({ where })
    ]);

    return {
      movements,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },

  // Get low stock alerts (items below minimum threshold)
  getLowStockAlerts: async () => {
    const lowStockItems = await prisma.warehouseItem.findMany({
      where: {
        quantity: {
          lte: prisma.warehouseItem.fields.minStockLevel
        }
      },
      orderBy: { quantity: 'asc' },
      include: {
        loadingSheet: {
          select: {
            shippingCode: true
          }
        }
      }
    });

    return {
      alerts: lowStockItems,
      count: lowStockItems.length
    };
  },

  // Confirm arrival of items from loading sheet
  confirmArrival: async (loadingSheetId, userId) => {
    const loadingSheet = await prisma.loadingSheet.findUnique({
      where: { id: loadingSheetId },
      include: { items: true }
    });

    if (!loadingSheet) {
      throw new Error('Loading sheet not found');
    }

    if (loadingSheet.status !== 'ARRIVED') {
      throw new Error('Loading sheet must be in ARRIVED status');
    }

    // Update loading sheet status
    await prisma.loadingSheet.update({
      where: { id: loadingSheetId },
      data: { status: 'WAREHOUSE' }
    });

    // Create warehouse items for each loading sheet item
    const warehouseItems = await Promise.all(
      loadingSheet.items.map(item =>
        prisma.warehouseItem.create({
          data: {
            itemName: item.product,
            itemNo: item.itemNo,
            mark: item.mark,
            quantity: item.pcs,
            ctn: item.ctn,
            cbm: item.cbm,
            weight: item.weight,
            loadingSheetId: loadingSheetId,
            minStockLevel: 10, // Default minimum stock level
            status: 'AVAILABLE'
          }
        })
      )
    );

    // Record bulk movement
    await prisma.stockMovement.create({
      data: {
        itemId: warehouseItems[0].id, // Reference first item
        quantity: loadingSheet.items.reduce((sum, item) => sum + item.pcs, 0),
        movementType: 'INWARD',
        previousQuantity: 0,
        newQuantity: loadingSheet.items.reduce((sum, item) => sum + item.pcs, 0),
        notes: `Bulk arrival from loading sheet ${loadingSheet.shippingCode}`,
        userId,
        createdAt: new Date()
      }
    });

    return {
      message: 'Arrival confirmed and items added to warehouse',
      itemsCount: warehouseItems.length,
      loadingSheet: {
        id: loadingSheet.id,
        shippingCode: loadingSheet.shippingCode,
        status: 'WAREHOUSE'
      }
    };
  },

  // Get single item by ID
  getItemById: async (itemId) => {
    const item = await prisma.warehouseItem.findUnique({
      where: { id: itemId },
      include: {
        loadingSheet: {
          select: {
            shippingCode: true,
            arrivalDate: true,
            status: true
          }
        },
        movements: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!item) {
      throw new Error('Item not found');
    }

    return item;
  }
};

module.exports = warehouseService;