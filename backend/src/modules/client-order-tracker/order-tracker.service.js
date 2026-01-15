const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class OrderTrackerService {
  // Get all orders
  async getAllOrders(filters) {
    const {
      page = 1,
      limit = 50,
      search = '',
      status = '',
      shippingCode = '',
      supplier = ''
    } = filters;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where conditions
    const where = {};
    
    if (search) {
      where.OR = [
        { shippingMark: { contains: search, mode: 'insensitive' } },
        { product: { contains: search, mode: 'insensitive' } },
        { supplier: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (shippingCode) {
      where.shippingCode = { contains: shippingCode, mode: 'insensitive' };
    }
    
    if (supplier) {
      where.supplier = { contains: supplier, mode: 'insensitive' };
    }
    
    const [orders, total] = await Promise.all([
      prisma.orderTracker.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true
            }
          },
          updatedBy: {
            select: {
              id: true,
              name: true
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.orderTracker.count({ where })
    ]);
    
    return {
      orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  // Get single order
  async getOrderById(id) {
    const order = await prisma.orderTracker.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    return order;
  }

  // Create order
  async createOrder(data, userId) {
    const order = await prisma.orderTracker.create({
      data: {
        ...data,
        createdById: userId,
        updatedById: userId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    return order;
  }

  // Create multiple orders
  async createMultipleOrders(ordersData, userId) {
    if (!Array.isArray(ordersData) || ordersData.length === 0) {
      throw new Error('Please provide an array of orders');
    }
    
    // Add createdBy and updatedBy to each order
    const ordersWithUser = ordersData.map(order => ({
      ...order,
      createdById: userId,
      updatedById: userId
    }));
    
    const result = await prisma.orderTracker.createMany({
      data: ordersWithUser,
      skipDuplicates: false
    });
    
    return {
      count: result.count,
      message: `${result.count} orders created successfully`
    };
  }

  // Update order
  async updateOrder(id, updates, userId) {
    const order = await prisma.orderTracker.findUnique({
      where: { id }
    });
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    const updatedOrder = await prisma.orderTracker.update({
      where: { id },
      data: {
        ...updates,
        updatedById: userId
      }
    });
    
    return updatedOrder;
  }

  // Delete order
  async deleteOrder(id) {
    const order = await prisma.orderTracker.findUnique({
      where: { id }
    });
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    await prisma.orderTracker.delete({
      where: { id }
    });
    
    return { success: true };
  }

  // Update status
  async updateStatus(id, status, userId) {
    const order = await prisma.orderTracker.findUnique({
      where: { id }
    });
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    const updatedOrder = await prisma.orderTracker.update({
      where: { id },
      data: {
        status,
        updatedById: userId
      }
    });
    
    return updatedOrder;
  }

  // Get stats
  async getStats() {
    const [
      totalOrders,
      loadedOrders,
      inTransitOrders,
      arrivedOrders,
      deliveredOrders,
      pendingOrders,
      totalQuantity,
      totalCTN,
      totalAmount
    ] = await Promise.all([
      prisma.orderTracker.count(),
      prisma.orderTracker.count({ where: { status: 'LOADED' } }),
      prisma.orderTracker.count({ where: { status: 'IN_TRANSIT' } }),
      prisma.orderTracker.count({ where: { status: 'ARRIVED' } }),
      prisma.orderTracker.count({ where: { status: 'DELIVERED' } }),
      prisma.orderTracker.count({ where: { status: 'PENDING' } }),
      prisma.orderTracker.aggregate({
        _sum: { quantity: true }
      }),
      prisma.orderTracker.aggregate({
        _sum: { ctn: true }
      }),
      prisma.orderTracker.aggregate({
        _sum: { totalAmount: true }
      })
    ]);
    
    return {
      totalOrders,
      statusCounts: {
        loaded: loadedOrders,
        inTransit: inTransitOrders,
        arrived: arrivedOrders,
        delivered: deliveredOrders,
        pending: pendingOrders
      },
      totals: {
        quantity: totalQuantity._sum.quantity || 0,
        ctn: totalCTN._sum.ctn || 0,
        amount: totalAmount._sum.totalAmount || 0
      }
    };
  }

  // Get orders by shipping code
  async getOrdersByShippingCode(shippingCode) {
    const orders = await prisma.orderTracker.findMany({
      where: {
        shippingCode: {
          contains: shippingCode,
          mode: 'insensitive'
        }
      },
      orderBy: { shippingMark: 'asc' }
    });
    
    return orders;
  }

  // Search orders
  async searchOrders(query) {
    const orders = await prisma.orderTracker.findMany({
      where: {
        OR: [
          { shippingMark: { contains: query, mode: 'insensitive' } },
          { product: { contains: query, mode: 'insensitive' } },
          { supplier: { contains: query, mode: 'insensitive' } },
          { shippingCode: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 50,
      orderBy: { shippingMark: 'asc' }
    });
    
    return orders;
  }

  // Export orders
  async exportOrders(format = 'json') {
    const orders = await prisma.orderTracker.findMany({
      orderBy: { shippingMark: 'asc' }
    });
    
    if (format === 'csv') {
      // Convert to CSV
      const csvRows = [];
      
      // Add header
      const headers = [
        'Shipping Mark', 'Supplier', 'Product', 'Quantity', 'CTN',
        'Shipping Mode', 'Deposit', 'Balance Amount', 'Total Amount',
        'Payment Date', 'Delivery Date', 'Loading Date', 'Arrival Date',
        'Shipping Code', 'Status', 'LR No'
      ];
      csvRows.push(headers.join(','));
      
      // Add data rows
      orders.forEach(order => {
        const row = [
          order.shippingMark,
          order.supplier || '',
          order.product,
          order.quantity,
          order.ctn,
          order.shippingMode || '',
          order.deposit || '',
          order.balanceAmount || '',
          order.totalAmount || '',
          order.paymentDate || '',
          order.deliveryDate || '',
          order.loadingDate || '',
          order.arrivalDate || '',
          order.shippingCode || '',
          order.status,
          order.lrNo || ''
        ].map(value => {
          // Escape commas and quotes for CSV
          if (typeof value === 'string') {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        
        csvRows.push(row.join(','));
      });
      
      return csvRows.join('\n');
    }
    
    // Default JSON format
    return orders;
  }

  // Bulk update by shipping code
  async bulkUpdateByShippingCode(shippingCode, updates, userId) {
    const orders = await prisma.orderTracker.findMany({
      where: {
        shippingCode: shippingCode
      }
    });
    
    if (orders.length === 0) {
      throw new Error('No orders found with this shipping code');
    }
    
    // Update all orders with the same shipping code
    const result = await prisma.orderTracker.updateMany({
      where: {
        shippingCode: shippingCode
      },
      data: {
        ...updates,
        updatedById: userId
      }
    });
    
    return {
      count: result.count,
      message: `${result.count} orders updated successfully`
    };
  }
  async createSheet(data, userId) {
    // If clientId is provided, create sheet linked to client
    const sheetData = {
      name: data.name,
      month: data.month,
      createdBy: userId, 
      updatedBy: String(userId)
    };

    if (data.clientId) {
      sheetData.clientId = data.clientId;
    }

    const sheet = await prisma.orderSheet.create({
      data: sheetData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            companyName: true
          }
        }
      }
    });
    return sheet;
  }

  // Get All Sheets
  async getAllSheets() {
    const sheets = await prisma.orderSheet.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { orders: true }
        },
        client: {
          select: {
            id: true,
            name: true,
            companyName: true
          }
        }
      }
    });

    // Calculate totals dynamically if not relying on stored fields
    const enrichedSheets = await Promise.all(sheets.map(async (sheet) => {
       const aggregations = await prisma.orderTracker.aggregate({
         where: { sheetId: sheet.id },
         _sum: { totalAmount: true }
       });
       return {
         ...sheet,
         totalAmount: aggregations._sum.totalAmount || 0
       };
    }));

    return enrichedSheets;
  }

  // Get clients for suggestions
  async getClientsForSuggestions(search = '') {
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      select: {
        id: true,
        name: true,
        companyName: true,
        city: true,
        type: true
      },
      take: 20,
      orderBy: { name: 'asc' }
    });

    return clients;
  }

  // Create a new client (quick create)
  async createQuickClient(data, userId) {
    const client = await prisma.client.create({
      data: {
        name: data.name,
        companyName: data.companyName || data.name,
        type: 'CLIENT',
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        companyName: true
      }
    });
    return client;
  }

  // Get Sheet by ID with Orders
  async getSheetById(id) {
    const sheet = await prisma.orderSheet.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: 'asc' } // Keep entry order
        },
        client: {
          select: {
            id: true,
            name: true,
            companyName: true
          }
        }
      }
    });

    if (!sheet) throw new Error("Sheet not found");
    return sheet;
  }

  // Update Sheet Orders (Bulk Save)
  async updateSheetOrders(sheetId, ordersData, userId) {
      // Transaction to ensure data integrity
      return await prisma.$transaction(async (tx) => {
         // 1. Process updates and creations
         for (const order of ordersData) {
            // Sanitize data: remove frontend keys and system fields
            const { 
                id, 
                _key, 
                isNew, 
                createdAt, 
                updatedAt, 
                createdBy, 
                updatedBy, 
                sheetId: _, 
                ...dbData 
            } = order;

            if (id && !String(id).startsWith('temp_')) {
               // Update existing
               await tx.orderTracker.update({
                  where: { id: id },
                  data: {
                    ...dbData,
                    sheetId, 
                    updatedById: userId
                  }
               });
            } else {
               // Create new
               await tx.orderTracker.create({
                  data: {
                     ...dbData,
                     sheetId,
                     createdById: userId,
                     updatedById: userId
                  }
               });
            }
         }

         // 2. Update Sheet Totals
         const aggregations = await tx.orderTracker.aggregate({
            where: { sheetId },
            _count: { id: true },
            _sum: { totalAmount: true }
         });

         const updatedSheet = await tx.orderSheet.update({
            where: { id: sheetId },
            data: {
               totalOrders: aggregations._count.id,
               totalAmount: aggregations._sum.totalAmount || 0,
               updatedBy: String(userId) // Ensure string format matches schema expectations if changed
            }
         });

         return updatedSheet;
      });
  }

  // Delete Sheet
  async deleteSheet(id) {
    return await prisma.orderSheet.delete({
      where: { id }
    });
  }
}

module.exports = new OrderTrackerService();