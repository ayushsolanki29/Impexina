const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class DashboardService {
  // Get dashboard overview stats
  async getDashboardOverview(userId) {
    const [
      totalOrders,
      totalTasks,
      totalClients,
      totalUsers,
      
      // Order status counts
      pendingOrders,
      loadedOrders,
      inTransitOrders,
      arrivedOrders,
      deliveredOrders,
      
      // Task status counts
      pendingTasks,
      completedTasks,
      
      // Recent data
      recentOrders,
      recentTasks,
      recentTransactions,
      
      // Monthly stats
      monthlyOrderStats,
      monthlyTaskStats,
      
      // Container stats
      totalContainers,
      activeContainers,
      
      // Financial stats
      totalRevenue,
      pendingPayments,
      
      // Quick stats
      todayOrders,
      thisWeekOrders,
      thisMonthOrders,

      // User Context (New)
      currentUser,
      myAssignedTasks
    ] = await Promise.all([
      // Total counts
      prisma.orderTracker.count(),
      prisma.task.count(),
      prisma.client.count(),
      prisma.user.count({ where: { isActive: true } }),
      
      // Order status counts
      prisma.orderTracker.count({ where: { status: 'PENDING' } }),
      prisma.orderTracker.count({ where: { status: 'LOADED' } }),
      prisma.orderTracker.count({ where: { status: 'IN_TRANSIT' } }),
      prisma.orderTracker.count({ where: { status: 'ARRIVED' } }),
      prisma.orderTracker.count({ where: { status: 'DELIVERED' } }),
      
      // Task status counts
      prisma.task.count({ where: { status: 'PENDING' } }),
      prisma.task.count({ where: { status: 'COMPLETED' } }),
      
      // Recent data (last 7 days)
      prisma.orderTracker.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { name: true }
          }
        }
      }),
      prisma.task.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          assignee: {
            select: { name: true }
          }
        }
      }),
      prisma.clientTransaction.findMany({
        take: 10,
        orderBy: { transactionDate: 'desc' },
        include: {
          client: {
            select: { name: true }
          }
        }
      }),
      
      // Monthly stats
      this.getMonthlyOrderStats(),
      this.getMonthlyTaskStats(),
      
      // Container stats
      prisma.container.count(),
      prisma.container.count({ 
        where: { 
          loadingSheets: {
            some: {
              status: { in: ['IN_TRANSIT', 'IN_PORT', 'IN_SEA', 'ARRIVED'] }
            }
          }
        }
      }),
      
      // Financial stats (from order tracker)
      prisma.orderTracker.aggregate({
        _sum: { totalAmount: true }
      }),
      prisma.orderTracker.aggregate({
        _sum: { balanceAmount: true },
        where: { status: { in: ['PENDING', 'LOADED', 'IN_TRANSIT', 'ARRIVED'] } }
      }),
      
      // Time-based stats
      prisma.orderTracker.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.orderTracker.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7))
          }
        }
      }),
      prisma.orderTracker.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30))
          }
        }
      }),

      // User Context Fetching
      userId ? prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, role: true }
      }) : Promise.resolve(null),

      userId ? prisma.task.findMany({
        where: { 
          assigneeId: userId,
          status: { not: 'COMPLETED' }
        },
        orderBy: { items: { deadlineDay: 'asc' }, createdAt: 'desc' }, // Sort by deadline if available
        take: 5
      }) : Promise.resolve([])
    ]);
    
    return {
      currentUser,
      myAssignedTasks: myAssignedTasks?.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.deadlineDay ? 'HIGH' : 'MEDIUM',
        dueDate: t.deadlineDay ? `Day ${t.deadlineDay}` : 'Flexible'
      })),
      summary: {
        totalOrders,
        totalTasks,
        totalClients,
        totalUsers,
        totalContainers,
        activeContainers,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        pendingPayments: pendingPayments._sum.balanceAmount || 0
      },
      
      orderStatus: {
        pending: pendingOrders,
        loaded: loadedOrders,
        inTransit: inTransitOrders,
        arrived: arrivedOrders,
        delivered: deliveredOrders
      },
      
      taskStatus: {
        pending: pendingTasks,
        completed: completedTasks
      },
      
      timeStats: {
        today: todayOrders,
        thisWeek: thisWeekOrders,
        thisMonth: thisMonthOrders
      },
      
      recentData: {
        orders: recentOrders.map(order => ({
          id: order.id,
          shippingMark: order.shippingMark,
          product: order.product,
          status: order.status,
          quantity: order.quantity,
          createdAt: order.createdAt,
          createdBy: order.createdBy.name,
          arrivalDate: order.arrivalDate,
          supplier: order.supplier,
          totalAmount: order.totalAmount
        })),
        tasks: recentTasks.map(task => ({
          id: task.id,
          title: task.title,
          assignee: task.assignee?.name,
          status: task.status,
          dueDate: task.completedAt
        })),
        transactions: recentTransactions.map(transaction => ({
          id: transaction.id,
          client: transaction.client?.name,
          amount: transaction.amount,
          type: transaction.type,
          date: transaction.transactionDate
        }))
      },
      
      monthlyStats: {
        orders: monthlyOrderStats,
        tasks: monthlyTaskStats
      }
    };
  }

  // Get monthly order statistics
  async getMonthlyOrderStats() {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    
    const orders = await prisma.orderTracker.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      select: {
        createdAt: true,
        status: true,
        totalAmount: true
      }
    });
    
    // Group by month
    const monthlyStats = {};
    orders.forEach(order => {
      const monthYear = order.createdAt.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthlyStats[monthYear]) {
        monthlyStats[monthYear] = {
          total: 0,
          count: 0,
          pending: 0,
          loaded: 0,
          inTransit: 0,
          arrived: 0,
          delivered: 0
        };
      }
      
      monthlyStats[monthYear].total += order.totalAmount || 0;
      monthlyStats[monthYear].count += 1;
      monthlyStats[monthYear][order.status.toLowerCase()] += 1;
    });
    
    // Convert to array and ensure last 6 months
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      result.push({
        month: monthYear,
        ...(monthlyStats[monthYear] || {
          total: 0,
          count: 0,
          pending: 0,
          loaded: 0,
          inTransit: 0,
          arrived: 0,
          delivered: 0
        })
      });
    }
    
    return result;
  }

  // Get monthly task statistics
  async getMonthlyTaskStats() {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    
    const tasks = await prisma.task.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      select: {
        createdAt: true,
        status: true,
        frequency: true
      }
    });
    
    // Group by month
    const monthlyStats = {};
    tasks.forEach(task => {
      const monthYear = task.createdAt.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthlyStats[monthYear]) {
        monthlyStats[monthYear] = {
          total: 0,
          pending: 0,
          completed: 0,
          daily: 0,
          weekly: 0,
          monthly: 0
        };
      }
      
      monthlyStats[monthYear].total += 1;
      monthlyStats[monthYear][task.status.toLowerCase()] += 1;
      monthlyStats[monthYear][task.frequency.toLowerCase()] += 1;
    });
    
    // Convert to array and ensure last 6 months
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      result.push({
        month: monthYear,
        ...(monthlyStats[monthYear] || {
          total: 0,
          pending: 0,
          completed: 0,
          daily: 0,
          weekly: 0,
          monthly: 0
        })
      });
    }
    
    return result;
  }

  // Get shipping code statistics
  async getShippingCodeStats() {
    const orders = await prisma.orderTracker.findMany({
      select: {
        shippingCode: true,
        status: true,
        quantity: true,
        totalAmount: true
      },
      where: {
        shippingCode: {
          not: null
        }
      }
    });
    
    // Group by shipping code
    const codeStats = {};
    orders.forEach(order => {
      if (!order.shippingCode) return;
      
      if (!codeStats[order.shippingCode]) {
        codeStats[order.shippingCode] = {
          totalOrders: 0,
          totalQuantity: 0,
          totalAmount: 0,
          pending: 0,
          loaded: 0,
          inTransit: 0,
          arrived: 0,
          delivered: 0
        };
      }
      
      codeStats[order.shippingCode].totalOrders += 1;
      codeStats[order.shippingCode].totalQuantity += order.quantity || 0;
      codeStats[order.shippingCode].totalAmount += order.totalAmount || 0;
      codeStats[order.shippingCode][order.status.toLowerCase()] += 1;
    });
    
    // Convert to array and sort by total orders
    return Object.entries(codeStats)
      .map(([code, stats]) => ({
        shippingCode: code,
        ...stats
      }))
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, 10); // Top 10 shipping codes
  }

  // Get supplier statistics
  async getSupplierStats() {
    const orders = await prisma.orderTracker.findMany({
      select: {
        supplier: true,
        quantity: true,
        totalAmount: true
      },
      where: {
        supplier: {
          not: null
        }
      }
    });
    
    // Group by supplier
    const supplierStats = {};
    orders.forEach(order => {
      if (!order.supplier) return;
      
      if (!supplierStats[order.supplier]) {
        supplierStats[order.supplier] = {
          totalOrders: 0,
          totalQuantity: 0,
          totalAmount: 0
        };
      }
      
      supplierStats[order.supplier].totalOrders += 1;
      supplierStats[order.supplier].totalQuantity += order.quantity || 0;
      supplierStats[order.supplier].totalAmount += order.totalAmount || 0;
    });
    
    // Convert to array and sort by total amount
    return Object.entries(supplierStats)
      .map(([supplier, stats]) => ({
        supplier,
        ...stats
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10); // Top 10 suppliers
  }

  // Get user performance statistics
  async getUserPerformance() {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        role: true,
        createdTasks: {
          select: {
            status: true
          }
        },
        assignedTasks: {
          select: {
            status: true
          }
        },
        createdOrders: {
          select: {
            status: true,
            totalAmount: true
          }
        }
      }
    });
    
    return users.map(user => {
      const createdTasks = user.createdTasks;
      const assignedTasks = user.assignedTasks;
      const createdOrders = user.createdOrders;
      
      const completedTasks = assignedTasks.filter(t => t.status === 'COMPLETED').length;
      const pendingTasks = assignedTasks.filter(t => t.status === 'PENDING').length;
      
      const ordersCreated = createdOrders.length;
      const ordersValue = createdOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      
      return {
        id: user.id,
        name: user.name,
        role: user.role,
        tasks: {
          total: assignedTasks.length,
          completed: completedTasks,
          pending: pendingTasks,
          completionRate: assignedTasks.length > 0 ? (completedTasks / assignedTasks.length * 100).toFixed(1) : 0
        },
        orders: {
          total: ordersCreated,
          value: ordersValue,
          averageValue: ordersCreated > 0 ? (ordersValue / ordersCreated).toFixed(2) : 0
        },
        productivity: {
          score: ((completedTasks * 0.6) + (ordersCreated * 0.4)).toFixed(1)
        }
      };
    });
  }

  // Get upcoming deadlines
  async getUpcomingDeadlines() {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const [upcomingTasks, upcomingOrders] = await Promise.all([
      // Tasks due in next 7 days
      prisma.task.findMany({
        where: {
          status: 'PENDING',
          completedAt: null,
          OR: [
            {
              completedAt: {
                gte: now,
                lte: nextWeek
              }
            },
            {
              deadlineDay: {
                not: null
              }
            }
          ]
        },
        include: {
          assignee: {
            select: { name: true }
          }
        },
        orderBy: { completedAt: 'asc' },
        take: 20
      }),
      
      // Orders with upcoming dates
      prisma.orderTracker.findMany({
        where: {
          OR: [
            {
              arrivalDate: {
                contains: new Date().getDate().toString()
              }
            },
            {
              loadingDate: {
                contains: new Date().getDate().toString()
              }
            },
            {
              deliveryDate: {
                contains: new Date().getDate().toString()
              }
            }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      })
    ]);
    
    return {
      tasks: upcomingTasks.map(task => ({
        id: task.id,
        title: task.title,
        assignee: task.assignee?.name,
        deadline: task.completedAt || `Day ${task.deadlineDay}`,
        status: task.status,
        priority: task.deadlineDay ? 'HIGH' : 'MEDIUM'
      })),
      orders: upcomingOrders.map(order => ({
        id: order.id,
        shippingMark: order.shippingMark,
        product: order.product,
        dates: {
          payment: order.paymentDate,
          delivery: order.deliveryDate,
          loading: order.loadingDate,
          arrival: order.arrivalDate
        },
        status: order.status
      }))
    };
  }

  // Get system health status
  async getSystemHealth() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const [recentActivities, activeUsers, pendingJobs] = await Promise.all([
      // Recent activities
      prisma.$queryRaw`
        SELECT 
          COUNT(*) as count,
          EXTRACT(HOUR FROM "createdAt") as hour
        FROM "LoadingActivity"
        WHERE "createdAt" >= ${oneHourAgo}
        GROUP BY EXTRACT(HOUR FROM "createdAt")
        ORDER BY hour DESC
        LIMIT 6
      `,
      
      // Active users (users with activity in last 24 hours)
      prisma.user.count({
        where: {
          OR: [
            { createdTasks: { some: { createdAt: { gte: oneHourAgo } } } },
            { createdOrders: { some: { createdAt: { gte: oneHourAgo } } } },
            { loadingActivities: { some: { createdAt: { gte: oneHourAgo } } } }
          ]
        }
      }),
      
      // Pending jobs/tasks
      prisma.task.count({
        where: {
          status: 'PENDING',
          createdAt: { lte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
        }
      })
    ]);
    
    const databaseStatus = await this.checkDatabaseStatus();
    
    return {
      database: databaseStatus,
      recentActivities: recentActivities,
      activeUsers,
      pendingJobs,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: now
    };
  }

  // Check database status
  async checkDatabaseStatus() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        message: 'Database connection is working',
        timestamp: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message,
        timestamp: new Date()
      };
    }
  }

  // Get quick statistics for dashboard widgets
  async getQuickStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const [
      todayOrders,
      yesterdayOrders,
      todayTasks,
      yesterdayTasks,
      todayRevenue,
      yesterdayRevenue,
      pendingShipments,
      completedShipments
    ] = await Promise.all([
      // Today's orders
      prisma.orderTracker.count({
        where: { createdAt: { gte: today } }
      }),
      
      // Yesterday's orders
      prisma.orderTracker.count({
        where: { 
          createdAt: { 
            gte: yesterday,
            lt: today
          } 
        }
      }),
      
      // Today's tasks
      prisma.task.count({
        where: { createdAt: { gte: today } }
      }),
      
      // Yesterday's tasks
      prisma.task.count({
        where: { 
          createdAt: { 
            gte: yesterday,
            lt: today
          } 
        }
      }),
      
      // Today's revenue
      prisma.orderTracker.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: today } }
      }),
      
      // Yesterday's revenue
      prisma.orderTracker.aggregate({
        _sum: { totalAmount: true },
        where: { 
          createdAt: { 
            gte: yesterday,
            lt: today
          } 
        }
      }),
      
      // Pending shipments
      prisma.orderTracker.count({
        where: { status: { in: ['PENDING', 'LOADED', 'IN_TRANSIT'] } }
      }),
      
      // Completed shipments
      prisma.orderTracker.count({
        where: { status: 'DELIVERED' }
      })
    ]);
    
    return {
      orders: {
        today: todayOrders,
        yesterday: yesterdayOrders,
        change: yesterdayOrders > 0 
          ? ((todayOrders - yesterdayOrders) / yesterdayOrders * 100).toFixed(1)
          : '100'
      },
      tasks: {
        today: todayTasks,
        yesterday: yesterdayTasks,
        change: yesterdayTasks > 0 
          ? ((todayTasks - yesterdayTasks) / yesterdayTasks * 100).toFixed(1)
          : '100'
      },
      revenue: {
        today: todayRevenue._sum.totalAmount || 0,
        yesterday: yesterdayRevenue._sum.totalAmount || 0,
        change: (yesterdayRevenue._sum.totalAmount || 0) > 0 
          ? (((todayRevenue._sum.totalAmount || 0) - (yesterdayRevenue._sum.totalAmount || 0)) / (yesterdayRevenue._sum.totalAmount || 0) * 100).toFixed(1)
          : '100'
      },
      shipments: {
        pending: pendingShipments,
        completed: completedShipments,
        completionRate: (pendingShipments + completedShipments) > 0
          ? (completedShipments / (pendingShipments + completedShipments) * 100).toFixed(1)
          : 0
      }
    };
  }
}

module.exports = new DashboardService();