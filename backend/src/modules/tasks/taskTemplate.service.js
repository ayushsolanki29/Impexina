const { prisma } = require("../../database/prisma");

// System constant - can be overridden via SystemSetting
const DEFAULT_MIN_COMPLETION_CHARS = 30;

class TaskTemplateService {
  // Get minimum completion characters from settings
  async getMinCompletionChars() {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: "TASK_COMPLETION_MIN_CHARS" },
      });
      return setting ? parseInt(setting.value) : DEFAULT_MIN_COMPLETION_CHARS;
    } catch (error) {
      return DEFAULT_MIN_COMPLETION_CHARS;
    }
  }

  // =====================================================
  // TASK TEMPLATES
  // =====================================================

  // Get all templates
  async getAllTemplates(filters = {}) {
    const { search = "", category = "", isActive = true, page = 1, limit = 20 } = filters;

    const where = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category && category !== "ALL") {
      where.category = category;
    }

    if (isActive !== undefined && isActive !== "ALL") {
      where.isActive = isActive === true || isActive === "true";
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [templates, total] = await Promise.all([
      prisma.taskTemplate.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, name: true, username: true },
          },
          _count: {
            select: { assignments: true },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.taskTemplate.count({ where }),
    ]);

    return {
      templates,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  // Get single template
  async getTemplateById(id) {
    const template = await prisma.taskTemplate.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, username: true },
        },
        assignments: {
          include: {
            assignee: {
              select: { id: true, name: true, username: true },
            },
          },
        },
      },
    });

    if (!template) {
      throw new Error("Template not found");
    }

    return template;
  }

  // Create template
  async createTemplate(data, createdById) {
    // Helper to parse int or return null
    const parseIntOrNull = (val) => {
      if (val === null || val === undefined || val === "") return null;
      const parsed = parseInt(val);
      return isNaN(parsed) ? null : parsed;
    };

    const template = await prisma.taskTemplate.create({
      data: {
        title: data.title,
        description: data.description || null,
        category: data.category || null,
        defaultSchedule: data.defaultSchedule || "DAILY",
        defaultDeadlineDay: parseIntOrNull(data.defaultDeadlineDay),
        defaultDeadlineWeekday: parseIntOrNull(data.defaultDeadlineWeekday),
        isSystemTemplate: data.isSystemTemplate || false,
        isActive: true,
        createdById,
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    return template;
  }

  // Update template
  async updateTemplate(id, updates) {
    const template = await prisma.taskTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new Error("Template not found");
    }

    if (template.isSystemTemplate) {
      throw new Error("System templates cannot be modified");
    }

    // Helper to parse int or return null
    const parseIntOrNull = (val) => {
      if (val === null || val === undefined || val === "") return null;
      const parsed = parseInt(val);
      return isNaN(parsed) ? null : parsed;
    };

    const updatedTemplate = await prisma.taskTemplate.update({
      where: { id },
      data: {
        title: updates.title,
        description: updates.description,
        category: updates.category,
        defaultSchedule: updates.defaultSchedule,
        defaultDeadlineDay: parseIntOrNull(updates.defaultDeadlineDay),
        defaultDeadlineWeekday: parseIntOrNull(updates.defaultDeadlineWeekday),
        isActive: updates.isActive,
      },
    });

    return updatedTemplate;
  }

  // Delete template
  async deleteTemplate(id) {
    const template = await prisma.taskTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new Error("Template not found");
    }

    if (template.isSystemTemplate) {
      throw new Error("System templates cannot be deleted");
    }

    await prisma.taskTemplate.delete({
      where: { id },
    });

    return { success: true };
  }

  // Get template categories
  async getCategories() {
    const categories = await prisma.taskTemplate.findMany({
      where: { category: { not: null } },
      distinct: ["category"],
      select: { category: true },
    });

    return categories.map((c) => c.category).filter(Boolean);
  }

  // =====================================================
  // TASK ASSIGNMENTS
  // =====================================================

  // Get all assignments (admin view)
  async getAllAssignments(filters = {}) {
    const {
      search = "",
      scheduleType = "",
      assigneeId = "",
      isActive = true,
      page = 1,
      limit = 20,
    } = filters;

    const where = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (scheduleType && scheduleType !== "ALL") {
      where.scheduleType = scheduleType;
    }

    if (assigneeId && assigneeId !== "ALL") {
      where.assigneeId = parseInt(assigneeId);
    }

    if (isActive !== undefined && isActive !== "ALL") {
      where.isActive = isActive === true || isActive === "true";
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [assignments, total] = await Promise.all([
      prisma.taskAssignment.findMany({
        where,
        include: {
          template: {
            select: { id: true, title: true, category: true },
          },
          assignee: {
            select: { id: true, name: true, username: true },
          },
          assignedBy: {
            select: { id: true, name: true, username: true },
          },
          _count: {
            select: { completions: true },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.taskAssignment.count({ where }),
    ]);

    // Calculate current status for each assignment
    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        const currentStatus = await this.getAssignmentCurrentStatus(assignment);
        return { ...assignment, currentStatus };
      })
    );

    return {
      assignments: enrichedAssignments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  // Get user's assigned tasks (My Tasks)
  async getMyTasks(userId, filters = {}) {
    const { scheduleType = "", isActive = true } = filters;

    const where = {
      assigneeId: userId,
      isActive: true,
      isPaused: false,
    };

    if (scheduleType && scheduleType !== "ALL") {
      where.scheduleType = scheduleType;
    }

    const assignments = await prisma.taskAssignment.findMany({
      where,
      include: {
        template: {
          select: { id: true, title: true, category: true },
        },
        assignedBy: {
          select: { id: true, name: true },
        },
        completions: {
          orderBy: { completedAt: "desc" },
          take: 5,
        },
      },
      orderBy: [{ scheduleType: "asc" }, { createdAt: "asc" }],
    });

    // Enrich with current status
    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        const currentStatus = await this.getAssignmentCurrentStatus(assignment);
        const lastCompletion = assignment.completions[0] || null;
        return { ...assignment, currentStatus, lastCompletion };
      })
    );

    return enrichedAssignments;
  }

  // Get single assignment
  async getAssignmentById(id) {
    const assignment = await prisma.taskAssignment.findUnique({
      where: { id },
      include: {
        template: true,
        assignee: {
          select: { id: true, name: true, username: true },
        },
        assignedBy: {
          select: { id: true, name: true, username: true },
        },
        completions: {
          orderBy: { completedAt: "desc" },
          include: {
            completedBy: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!assignment) {
      throw new Error("Task assignment not found");
    }

    const currentStatus = await this.getAssignmentCurrentStatus(assignment);
    return { ...assignment, currentStatus };
  }

  // Create assignment (from template or custom)
  async createAssignment(data, assignedById) {
    let taskData = {};

    // Helper to parse int or return null
    const parseIntOrNull = (val) => {
      if (val === null || val === undefined || val === "") return null;
      const parsed = parseInt(val);
      return isNaN(parsed) ? null : parsed;
    };

    if (data.templateId) {
      // Create from template
      const template = await prisma.taskTemplate.findUnique({
        where: { id: data.templateId },
      });

      if (!template) {
        throw new Error("Template not found");
      }

      taskData = {
        templateId: template.id,
        title: data.title || template.title,
        description: data.description || template.description,
        category: data.category || template.category,
        scheduleType: data.scheduleType || template.defaultSchedule,
        deadlineDay: parseIntOrNull(data.deadlineDay) ?? template.defaultDeadlineDay,
        deadlineWeekday: parseIntOrNull(data.deadlineWeekday) ?? template.defaultDeadlineWeekday,
      };
    } else {
      // Custom task
      taskData = {
        title: data.title,
        description: data.description || null,
        category: data.category || null,
        scheduleType: data.scheduleType || "DAILY",
        deadlineDay: parseIntOrNull(data.deadlineDay),
        deadlineWeekday: parseIntOrNull(data.deadlineWeekday),
      };
    }

    // Validate assignee
    const assignee = await prisma.user.findUnique({
      where: { id: parseInt(data.assigneeId) },
    });

    if (!assignee) {
      throw new Error("Assignee not found");
    }

    const assignment = await prisma.taskAssignment.create({
      data: {
        ...taskData,
        timeline: data.timeline || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        assigneeId: parseInt(data.assigneeId),
        assignedById,
        isSelfCreated: data.isSelfCreated || false,
        isActive: true,
      },
      include: {
        assignee: {
          select: { id: true, name: true },
        },
      },
    });

    return assignment;
  }

  // Create self-task (user creates their own task)
  async createSelfTask(data, userId) {
    // Helper to parse int or return null
    const parseIntOrNull = (val) => {
      if (val === null || val === undefined || val === "") return null;
      const parsed = parseInt(val);
      return isNaN(parsed) ? null : parsed;
    };

    const assignment = await prisma.taskAssignment.create({
      data: {
        title: data.title,
        description: data.description || null,
        category: data.category || "PERSONAL",
        scheduleType: data.scheduleType || "DAILY",
        timeline: data.timeline || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        deadlineDay: parseIntOrNull(data.deadlineDay),
        deadlineWeekday: parseIntOrNull(data.deadlineWeekday),
        assigneeId: userId,
        assignedById: userId,
        isSelfCreated: true,
        isActive: true,
      },
    });

    return assignment;
  }

  // Update assignment
  async updateAssignment(id, updates, userId, userRole) {
    const assignment = await prisma.taskAssignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      throw new Error("Task assignment not found");
    }

    // Check permissions
    const isAdmin = userRole === "ADMIN";
    const isCreator = assignment.assignedById === userId;
    const isAssignee = assignment.assigneeId === userId;

    if (!isAdmin && !isCreator && !(isAssignee && assignment.isSelfCreated)) {
      throw new Error("You do not have permission to update this task");
    }

    // Helper to parse int or return null
    const parseIntOrNull = (val) => {
      if (val === null || val === undefined || val === "") return null;
      const parsed = parseInt(val);
      return isNaN(parsed) ? null : parsed;
    };

    const updatedAssignment = await prisma.taskAssignment.update({
      where: { id },
      data: {
        title: updates.title,
        description: updates.description,
        category: updates.category,
        scheduleType: updates.scheduleType,
        timeline: updates.timeline,
        startDate: updates.startDate ? new Date(updates.startDate) : null,
        endDate: updates.endDate ? new Date(updates.endDate) : null,
        deadlineDay: parseIntOrNull(updates.deadlineDay),
        deadlineWeekday: parseIntOrNull(updates.deadlineWeekday),
        isPaused: updates.isPaused,
        isActive: updates.isActive,
      },
    });

    return updatedAssignment;
  }

  // Delete assignment
  async deleteAssignment(id, userId, userRole) {
    const assignment = await prisma.taskAssignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      throw new Error("Task assignment not found");
    }

    const isAdmin = userRole === "ADMIN";
    const isCreator = assignment.assignedById === userId;
    const isAssignee = assignment.assigneeId === userId && assignment.isSelfCreated;

    if (!isAdmin && !isCreator && !isAssignee) {
      throw new Error("You do not have permission to delete this task");
    }

    await prisma.taskAssignment.delete({
      where: { id },
    });

    return { success: true };
  }

  // =====================================================
  // TASK COMPLETIONS
  // =====================================================

  // Complete a task
  async completeTask(assignmentId, userId, completionNote) {
    const minChars = await this.getMinCompletionChars();

    if (!completionNote || completionNote.trim().length < minChars) {
      throw new Error(`Completion note must be at least ${minChars} characters`);
    }

    const assignment = await prisma.taskAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new Error("Task assignment not found");
    }

    // Check if user is the assignee
    if (assignment.assigneeId !== userId) {
      throw new Error("You can only complete tasks assigned to you");
    }

    // Calculate period based on schedule type
    const { periodStart, periodEnd } = this.calculatePeriod(assignment.scheduleType, assignment);

    // Check if already completed for this period
    const existingCompletion = await prisma.taskCompletion.findFirst({
      where: {
        assignmentId,
        periodStart,
        periodEnd,
      },
    });

    if (existingCompletion) {
      throw new Error("This task has already been completed for the current period");
    }

    // Determine if on time
    const now = new Date();
    const isOnTime = now <= periodEnd;

    const completion = await prisma.taskCompletion.create({
      data: {
        assignmentId,
        periodStart,
        periodEnd,
        completedById: userId,
        completionNote: completionNote.trim(),
        status: "COMPLETED",
        isOnTime,
      },
      include: {
        assignment: {
          select: { title: true },
        },
      },
    });

    return completion;
  }

  // Get completions for an assignment
  async getCompletions(assignmentId, filters = {}) {
    const { page = 1, limit = 20 } = filters;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [completions, total] = await Promise.all([
      prisma.taskCompletion.findMany({
        where: { assignmentId },
        include: {
          completedBy: {
            select: { id: true, name: true },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { completedAt: "desc" },
      }),
      prisma.taskCompletion.count({ where: { assignmentId } }),
    ]);

    return {
      completions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  // Get user's completion history
  async getMyCompletions(userId, filters = {}) {
    const { page = 1, limit = 20, dateFrom, dateTo } = filters;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { completedById: userId };

    if (dateFrom || dateTo) {
      where.completedAt = {};
      if (dateFrom) where.completedAt.gte = new Date(dateFrom);
      if (dateTo) where.completedAt.lte = new Date(dateTo);
    }

    const [completions, total] = await Promise.all([
      prisma.taskCompletion.findMany({
        where,
        include: {
          assignment: {
            select: { id: true, title: true, category: true, scheduleType: true },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { completedAt: "desc" },
      }),
      prisma.taskCompletion.count({ where }),
    ]);

    return {
      completions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  // Calculate period start and end based on schedule type
  calculatePeriod(scheduleType, assignment) {
    const now = new Date();
    let periodStart, periodEnd;

    switch (scheduleType) {
      case "DAILY":
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;

      case "WEEKLY":
        const dayOfWeek = now.getDay();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        periodStart = weekStart;
        periodEnd = weekEnd;
        break;

      case "MONTHLY":
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;

      case "DATE_RANGE":
        periodStart = assignment.startDate || now;
        periodEnd = assignment.endDate || now;
        break;

      case "SPECIFIC_DATE":
        periodStart = assignment.startDate || now;
        periodEnd = assignment.startDate || now;
        periodEnd.setHours(23, 59, 59, 999);
        break;

      case "AS_PER_REQUIREMENT":
        // For as-needed tasks, each completion is unique (use current timestamp)
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());
        periodEnd = new Date(periodStart.getTime() + 1000); // 1 second window
        break;

      default:
        periodStart = now;
        periodEnd = now;
    }

    return { periodStart, periodEnd };
  }

  // Get current status of an assignment
  async getAssignmentCurrentStatus(assignment) {
    const { periodStart, periodEnd } = this.calculatePeriod(
      assignment.scheduleType,
      assignment
    );

    const completion = await prisma.taskCompletion.findFirst({
      where: {
        assignmentId: assignment.id,
        periodStart: { gte: periodStart },
        periodEnd: { lte: periodEnd },
      },
    });

    if (completion) {
      return {
        status: "COMPLETED",
        completedAt: completion.completedAt,
        isOnTime: completion.isOnTime,
      };
    }

    const now = new Date();
    if (now > periodEnd) {
      return { status: "OVERDUE", dueDate: periodEnd };
    }

    return {
      status: "PENDING",
      dueDate: periodEnd,
      periodStart,
      periodEnd,
    };
  }

  // =====================================================
  // STATISTICS
  // =====================================================

  async getStats(userId, userRole) {
    let stats = {};

    if (userRole === "ADMIN") {
      const [
        totalTemplates,
        totalAssignments,
        activeAssignments,
        todayCompletions,
        dailyTasks,
        weeklyTasks,
        monthlyTasks,
      ] = await Promise.all([
        prisma.taskTemplate.count({ where: { isActive: true } }),
        prisma.taskAssignment.count(),
        prisma.taskAssignment.count({ where: { isActive: true, isPaused: false } }),
        prisma.taskCompletion.count({
          where: {
            completedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        }),
        prisma.taskAssignment.count({ where: { scheduleType: "DAILY", isActive: true } }),
        prisma.taskAssignment.count({ where: { scheduleType: "WEEKLY", isActive: true } }),
        prisma.taskAssignment.count({ where: { scheduleType: "MONTHLY", isActive: true } }),
      ]);

      stats = {
        totalTemplates,
        totalAssignments,
        activeAssignments,
        todayCompletions,
        dailyTasks,
        weeklyTasks,
        monthlyTasks,
      };
    } else {
      const myTasks = await this.getMyTasks(userId);
      const pendingTasks = myTasks.filter((t) => t.currentStatus.status === "PENDING").length;
      const completedTasks = myTasks.filter((t) => t.currentStatus.status === "COMPLETED").length;
      const overdueTasks = myTasks.filter((t) => t.currentStatus.status === "OVERDUE").length;

      const [totalCompletions, todayCompletions] = await Promise.all([
        prisma.taskCompletion.count({ where: { completedById: userId } }),
        prisma.taskCompletion.count({
          where: {
            completedById: userId,
            completedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        }),
      ]);

      stats = {
        totalTasks: myTasks.length,
        pendingTasks,
        completedTasks,
        overdueTasks,
        totalCompletions,
        todayCompletions,
        dailyTasks: myTasks.filter((t) => t.scheduleType === "DAILY").length,
        weeklyTasks: myTasks.filter((t) => t.scheduleType === "WEEKLY").length,
        monthlyTasks: myTasks.filter((t) => t.scheduleType === "MONTHLY").length,
      };
    }

    return stats;
  }

  // Get users for task assignment
  async getUsersForAssignment() {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
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

  // =====================================================
  // ADMIN PERFORMANCE REPORTS
  // =====================================================

  // Get all completions for admin with filters
  async getAllCompletions(filters = {}) {
    const {
      page = 1,
      limit = 20,
      userId = "",
      dateFrom = "",
      dateTo = "",
      scheduleType = "",
    } = filters;

    const where = {};

    if (userId && userId !== "ALL") {
      where.completedById = parseInt(userId);
    }

    if (scheduleType && scheduleType !== "ALL") {
      where.assignment = {
        scheduleType,
      };
    }

    if (dateFrom || dateTo) {
      where.completedAt = {};
      if (dateFrom) where.completedAt.gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.completedAt.lte = endDate;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [completions, total] = await Promise.all([
      prisma.taskCompletion.findMany({
        where,
        include: {
          assignment: {
            select: { id: true, title: true, category: true, scheduleType: true },
          },
          completedBy: {
            select: { id: true, name: true, username: true },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { completedAt: "desc" },
      }),
      prisma.taskCompletion.count({ where }),
    ]);

    return {
      completions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  // Get user performance report
  async getUserPerformanceReport(filters = {}) {
    const { dateFrom = "", dateTo = "", userId = "" } = filters;

    // Build date filter
    const dateFilter = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      dateFilter.lte = endDate;
    }

    const completedAtFilter = Object.keys(dateFilter).length > 0 ? { completedAt: dateFilter } : {};

    // Get all active users or specific user
    const userWhere = { isActive: true };
    if (userId && userId !== "ALL") {
      userWhere.id = parseInt(userId);
    }

    const users = await prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
      },
      orderBy: { name: "asc" },
    });

    // Get performance data for each user
    const performanceData = await Promise.all(
      users.map(async (user) => {
        // Get assignments for user
        const totalAssignments = await prisma.taskAssignment.count({
          where: { assigneeId: user.id, isActive: true },
        });

        // Get completions
        const completions = await prisma.taskCompletion.findMany({
          where: {
            completedById: user.id,
            ...completedAtFilter,
          },
          include: {
            assignment: {
              select: { scheduleType: true },
            },
          },
        });

        const totalCompletions = completions.length;
        const onTimeCompletions = completions.filter((c) => c.isOnTime).length;
        const lateCompletions = completions.filter((c) => !c.isOnTime).length;

        // By schedule type
        const dailyCompletions = completions.filter(
          (c) => c.assignment?.scheduleType === "DAILY"
        ).length;
        const weeklyCompletions = completions.filter(
          (c) => c.assignment?.scheduleType === "WEEKLY"
        ).length;
        const monthlyCompletions = completions.filter(
          (c) => c.assignment?.scheduleType === "MONTHLY"
        ).length;

        // Calculate on-time rate
        const onTimeRate = totalCompletions > 0 
          ? Math.round((onTimeCompletions / totalCompletions) * 100) 
          : 0;

        return {
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role,
          },
          stats: {
            totalAssignments,
            totalCompletions,
            onTimeCompletions,
            lateCompletions,
            onTimeRate,
            dailyCompletions,
            weeklyCompletions,
            monthlyCompletions,
          },
        };
      })
    );

    // Calculate overall stats
    const overallStats = {
      totalUsers: performanceData.length,
      totalCompletions: performanceData.reduce((sum, p) => sum + p.stats.totalCompletions, 0),
      totalOnTime: performanceData.reduce((sum, p) => sum + p.stats.onTimeCompletions, 0),
      totalLate: performanceData.reduce((sum, p) => sum + p.stats.lateCompletions, 0),
      averageOnTimeRate: performanceData.length > 0
        ? Math.round(
            performanceData.reduce((sum, p) => sum + p.stats.onTimeRate, 0) / performanceData.length
          )
        : 0,
    };

    return {
      users: performanceData,
      overallStats,
    };
  }

  // Get performance summary by period (weekly/monthly)
  async getPerformanceSummary(filters = {}) {
    const { period = "weekly", dateFrom = "", dateTo = "" } = filters;

    let startDate, endDate;
    const now = new Date();

    if (dateFrom && dateTo) {
      startDate = new Date(dateFrom);
      endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === "weekly") {
      // Last 8 weeks
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 56);
      startDate.setHours(0, 0, 0, 0);
      endDate = now;
    } else {
      // Last 6 months
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 6);
      startDate.setHours(0, 0, 0, 0);
      endDate = now;
    }

    // Get all completions in range
    const completions = await prisma.taskCompletion.findMany({
      where: {
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        completedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { completedAt: "asc" },
    });

    // Group by period
    const periodData = {};

    completions.forEach((completion) => {
      const date = new Date(completion.completedAt);
      let periodKey;

      if (period === "weekly") {
        // Get week start (Sunday)
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        periodKey = weekStart.toISOString().split("T")[0];
      } else {
        // Month key
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }

      if (!periodData[periodKey]) {
        periodData[periodKey] = {
          period: periodKey,
          label: period === "weekly"
            ? `Week of ${new Date(periodKey).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
            : new Date(periodKey + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" }),
          totalCompletions: 0,
          onTimeCompletions: 0,
          lateCompletions: 0,
          uniqueUsers: new Set(),
        };
      }

      periodData[periodKey].totalCompletions++;
      if (completion.isOnTime) {
        periodData[periodKey].onTimeCompletions++;
      } else {
        periodData[periodKey].lateCompletions++;
      }
      periodData[periodKey].uniqueUsers.add(completion.completedById);
    });

    // Convert to array and calculate rates
    const summaryData = Object.values(periodData)
      .map((p) => ({
        period: p.period,
        label: p.label,
        totalCompletions: p.totalCompletions,
        onTimeCompletions: p.onTimeCompletions,
        lateCompletions: p.lateCompletions,
        activeUsers: p.uniqueUsers.size,
        onTimeRate: p.totalCompletions > 0
          ? Math.round((p.onTimeCompletions / p.totalCompletions) * 100)
          : 0,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    return {
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      data: summaryData,
    };
  }
}

module.exports = new TaskTemplateService();
