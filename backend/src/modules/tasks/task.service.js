const { prisma } = require("../../database/prisma");
class TaskService {
  // Get all tasks (admin view)
  async getAllTasks(filters) {
    const {
      page = 1,
      limit = 20,
      search = "",
      status = "",
      frequency = "",
      assigneeId = "",
    } = filters;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where conditions
    const where = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (frequency) {
      where.frequency = frequency;
    }

    if (assigneeId) {
      where.assigneeId = parseInt(assigneeId);
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          assignedBy: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.task.count({ where }),
    ]);

    // Check for overdue tasks
    const updatedTasks = tasks.map((task) => {
      const isOverdue =
        task.status === "PENDING" &&
        new Date() > new Date(task.createdAt.getTime() + 24 * 60 * 60 * 1000);

      return {
        ...task,
        isOverdue,
      };
    });

    return {
      tasks: updatedTasks,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  // Get user's own tasks
  async getMyTasks(userId, filters = {}) {
    const { status = "", frequency = "" } = filters;

    const where = {
      assigneeId: userId,
    };

    if (status) {
      where.status = status;
    }

    if (frequency) {
      where.frequency = frequency;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return tasks;
  }

  // Get single task
  async getTaskById(id) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    return task;
  }

// Update the createTask method in tasks.service.js
async createTask(data, assignedById) {
  const { assigneeId, deadlineDay, ...taskData } = data;
  
  // Validate assignee exists
  const assignee = await prisma.user.findUnique({
    where: { id: parseInt(assigneeId) }
  });
  
  if (!assignee) {
    throw new Error('Assignee not found');
  }
  
  // Convert deadlineDay to number or null
  const deadlineDayValue = deadlineDay && deadlineDay !== '' 
    ? parseInt(deadlineDay) 
    : null;
  
  const task = await prisma.task.create({
    data: {
      ...taskData,
      deadlineDay: deadlineDayValue, // Fixed: Convert empty string to null
      assigneeId: parseInt(assigneeId),
      assignedById
    },
    include: {
      assignee: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  
  return task;
}

  // Update task
  async updateTask(id, updates, userId, userRole) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: true,
      },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    // Check permissions
    const isAssignee = task.assigneeId === userId;
    const isAdmin = userRole === "ADMIN";
    const isCreator = task.assignedById === userId;

    // Only admin or creator can update task details
    // User can only update status and notes
    const allowedUpdates = {};

    if (isAdmin || isCreator) {
      // Admin/creator can update everything
      if (updates.title !== undefined) allowedUpdates.title = updates.title;
      if (updates.description !== undefined)
        allowedUpdates.description = updates.description;
      if (updates.frequency !== undefined)
        allowedUpdates.frequency = updates.frequency;
      if (updates.deadlineDay !== undefined)
        allowedUpdates.deadlineDay = updates.deadlineDay;
      if (updates.timeline !== undefined)
        allowedUpdates.timeline = updates.timeline;
      if (updates.assigneeId !== undefined) {
        // Validate new assignee
        const newAssignee = await prisma.user.findUnique({
          where: { id: parseInt(updates.assigneeId) },
        });

        if (!newAssignee) {
          throw new Error("New assignee not found");
        }
        allowedUpdates.assigneeId = parseInt(updates.assigneeId);
      }
    }

    // Both admin and assignee can update status and notes
    if (isAdmin || isAssignee) {
      if (updates.status !== undefined) {
        allowedUpdates.status = updates.status;

        // If marking as completed, set completedAt
        if (updates.status === "COMPLETED") {
          allowedUpdates.completedAt = new Date();
        } else if (updates.status === "PENDING") {
          allowedUpdates.completedAt = null;
        }
      }

      if (updates.notes !== undefined) allowedUpdates.notes = updates.notes;
    }

    // If no updates allowed
    if (Object.keys(allowedUpdates).length === 0) {
      throw new Error("You do not have permission to update this task");
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: allowedUpdates,
    });

    return updatedTask;
  }

  // Delete task
  async deleteTask(id) {
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    await prisma.task.delete({
      where: { id },
    });

    return { success: true };
  }

  // Mark task as complete
  async markTaskComplete(id, userId, notes = "") {
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    // Check if user is the assignee
    if (task.assigneeId !== userId) {
      throw new Error("You can only mark your own tasks as complete");
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        notes,
      },
    });

    return updatedTask;
  }

  // Get users for task assignment
  async getUsersForAssignment() {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: ["EMPLOYEE", "NEW_JOINNER"] },
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
      },
      orderBy: { name: "asc" },
    });

    return users;
  }

  // Get dashboard stats
  async getTaskStats(userId, userRole) {
    let stats = {};

    if (userRole === "ADMIN") {
      // Admin sees all stats
      const [
        totalTasks,
        pendingTasks,
        completedTasks,
        dailyTasks,
        weeklyTasks,
        monthlyTasks,
      ] = await Promise.all([
        prisma.task.count(),
        prisma.task.count({ where: { status: "PENDING" } }),
        prisma.task.count({ where: { status: "COMPLETED" } }),
        prisma.task.count({ where: { frequency: "DAILY" } }),
        prisma.task.count({ where: { frequency: "WEEKLY" } }),
        prisma.task.count({ where: { frequency: "MONTHLY" } }),
      ]);

      // Count overdue tasks
      const allPendingTasks = await prisma.task.findMany({
        where: { status: "PENDING" },
        select: { createdAt: true },
      });

      const overdueTasks = allPendingTasks.filter((task) => {
        return (
          new Date() > new Date(task.createdAt.getTime() + 24 * 60 * 60 * 1000)
        );
      }).length;

      stats = {
        totalTasks,
        pendingTasks,
        completedTasks,
        overdueTasks,
        dailyTasks,
        weeklyTasks,
        monthlyTasks,
      };
    } else {
      // User sees only their stats
      const [
        myTotalTasks,
        myPendingTasks,
        myCompletedTasks,
        myTodayTasks,
        myDailyTasks,
        myWeeklyTasks,
      ] = await Promise.all([
        prisma.task.count({ where: { assigneeId: userId } }),
        prisma.task.count({
          where: {
            assigneeId: userId,
            status: "PENDING",
          },
        }),
        prisma.task.count({
          where: {
            assigneeId: userId,
            status: "COMPLETED",
          },
        }),
        prisma.task.count({
          where: {
            assigneeId: userId,
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        prisma.task.count({
          where: {
            assigneeId: userId,
            frequency: "DAILY",
          },
        }),
        prisma.task.count({
          where: {
            assigneeId: userId,
            frequency: "WEEKLY",
          },
        }),
      ]);

      stats = {
        myTotalTasks,
        myPendingTasks,
        myCompletedTasks,
        myTodayTasks,
        myDailyTasks,
        myWeeklyTasks,
      };
    }

    return stats;
  }

  // Get task by frequency
  async getTasksByFrequency(userId, frequency) {
    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        frequency: frequency,
      },
      orderBy: { createdAt: "desc" },
    });

    return tasks;
  }
}

module.exports = new TaskService();
