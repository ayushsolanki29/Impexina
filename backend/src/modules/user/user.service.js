const bcrypt = require('bcryptjs');
const { prisma } = require('../../../database');
const { validateUserCreate, validateUserUpdate } = require('./user.validation');

const userService = {
  // Get all users with filtering and pagination
  getAllUsers: async ({ page, limit, search, role }) => {
    const skip = (page - 1) * limit;
    
    let where = { isActive: true };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },

  // Get user by ID
  getUserById: async (userId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        activityLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            action: true,
            module: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  },

  // Create new user
  createUser: async (userData) => {
    const { error } = validateUserCreate(userData);
    if (error) throw new Error(error.details[0].message);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        action: 'USER_CREATED',
        module: 'USER_MANAGEMENT',
        details: {
          userId: user.id,
          email: user.email,
          role: user.role
        },
        userId: userData.createdBy || user.id, // Use creator ID if available
        status: 'success'
      }
    });

    return user;
  },

  // Update user
  updateUser: async (userId, userData) => {
    const { error } = validateUserUpdate(userData);
    if (error) throw new Error(error.details[0].message);

    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Prepare update data
    const updateData = { ...userData };
    
    // If password is being updated, hash it
    if (userData.password) {
      updateData.password = await bcrypt.hash(userData.password, 12);
    } else {
      delete updateData.password; // Remove password if not updating
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        action: 'USER_UPDATED',
        module: 'USER_MANAGEMENT',
        details: {
          userId: user.id,
          updatedFields: Object.keys(userData)
        },
        userId: userData.updatedBy || user.id,
        status: 'success'
      }
    });

    return user;
  },

  // Delete user (soft delete)
  deleteUser: async (userId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Soft delete by setting isActive to false
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false }
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        action: 'USER_DELETED',
        module: 'USER_MANAGEMENT',
        details: {
          userId: user.id,
          email: user.email
        },
        userId: userId, // Admin who deleted
        status: 'success'
      }
    });
  },

  // Get user performance metrics
  getUserPerformance: async (userId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        activityLogs: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        stockMovements: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            item: {
              select: {
                itemName: true
              }
            }
          }
        },
        createdInvoices: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            invoiceNo: true,
            totalAmount: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Calculate performance metrics
    const totalActions = user.activityLogs.length;
    const successfulActions = user.activityLogs.filter(log => log.status === 'success').length;
    const accuracy = totalActions > 0 ? (successfulActions / totalActions) * 100 : 0;

    const recentStockMovements = user.stockMovements.length;
    const recentInvoices = user.createdInvoices.length;

    // Get daily task completion (simplified)
    const dailyTasks = await calculateDailyTasks(userId);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      performance: {
        accuracy: Math.round(accuracy),
        totalActions,
        successfulActions,
        recentStockMovements,
        recentInvoices,
        dailyTasksCompleted: dailyTasks.today,
        weeklyTasksCompleted: dailyTasks.week
      },
      recentActivity: user.activityLogs.slice(0, 10),
      recentInvoices: user.createdInvoices.slice(0, 5),
      recentStockMovements: user.stockMovements.slice(0, 5)
    };
  },

  // Update last login timestamp
  updateLastLogin: async (userId) => {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() }
    });
  }
};

// Helper function to calculate daily tasks
async function calculateDailyTasks(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)

  const [todayTasks, weekTasks] = await Promise.all([
    prisma.activityLog.count({
      where: {
        userId,
        createdAt: {
          gte: today
        },
        status: 'success'
      }
    }),
    prisma.activityLog.count({
      where: {
        userId,
        createdAt: {
          gte: weekStart
        },
        status: 'success'
      }
    })
  ]);

  return {
    today: todayTasks,
    week: weekTasks
  };
}

module.exports = userService;