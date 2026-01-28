const { prisma } = require("../../database/prisma");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const containerService = require("../containers/containers.service");

const loadingSheetService = {
  // Upload photo for a loading item
  uploadPhoto: async (file, containerCode, shippingMark) => {
    if (!file) {
      throw new Error("No file provided");
    }

    // Create organized folder structure: uploads/containerCode/shippingMark/
    const uploadsRoot = path.join(process.cwd(), "uploads");
    const containerDir = path.join(uploadsRoot, containerCode);
    const markDir = path.join(containerDir, shippingMark || "general");

    // Ensure directories exist
    if (!fs.existsSync(uploadsRoot)) {
      fs.mkdirSync(uploadsRoot, { recursive: true });
    }
    if (!fs.existsSync(containerDir)) {
      fs.mkdirSync(containerDir, { recursive: true });
    }
    if (!fs.existsSync(markDir)) {
      fs.mkdirSync(markDir, { recursive: true });
    }

    // Generate unique filename
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(markDir, fileName);

    // Save file
    const fileData = file.buffer || file.data || Buffer.from(file);
    await fs.promises.writeFile(filePath, fileData);

    // Return relative path for database
    return `/uploads/${containerCode}/${shippingMark || "general"}/${fileName}`;
  },

  // Create or update loading sheet with items
  createOrUpdateLoadingSheet: async (containerId, data, userId) => {
    const { id, shippingMark, clientName, items, status } = data;
    // Sanitize clientId: convert empty string to null to avoid Foreign Key violations
    const clientId = data.clientId || null;

    // Verify container exists
    const container = await prisma.container.findUnique({
      where: { id: containerId },
    });

    if (!container) {
      throw new Error("Container not found");
    }

    let loadingSheet = null;
    let oldSheet = null;

    // 1. Try to find by ID if provided (Editing specific sheet)
    if (id) {
      loadingSheet = await prisma.loadingSheet.findUnique({
        where: { id },
        include: { items: true }
      });
      oldSheet = JSON.parse(JSON.stringify(loadingSheet));
    }

    // 2. If no ID, or not found, try to find by Container + Mark (Legacy/Duplicate check)
    if (!loadingSheet && shippingMark) {
        loadingSheet = await prisma.loadingSheet.findFirst({
            where: {
            containerId,
            shippingMark: shippingMark,
            },
            include: { items: true }
        });
        if (loadingSheet) oldSheet = JSON.parse(JSON.stringify(loadingSheet));
    }

    const changes = [];

    if (loadingSheet) {
      // Update existing
      if (shippingMark !== loadingSheet.shippingMark) {
          changes.push({ field: 'shippingMark', old: loadingSheet.shippingMark, new: shippingMark });
      }
      if (clientName !== loadingSheet.clientName) {
          changes.push({ field: 'clientName', old: loadingSheet.clientName, new: clientName });
      }
      
      loadingSheet = await prisma.loadingSheet.update({
        where: { id: loadingSheet.id },
        data: {
          shippingMark: shippingMark, // Allow updating mark
          clientName,
          clientId,
          status: status || loadingSheet.status,
        },
      });

      // Simple item change detection (compare counts for now, or could be more complex)
      const oldItemCount = oldSheet?.items?.length || 0;
      const newItemCount = items?.length || 0;
      if (oldItemCount !== newItemCount) {
          changes.push({ field: 'itemsCount', old: oldItemCount, new: newItemCount });
      }

      // Delete existing items to replace with new ones
      await prisma.loadingItem.deleteMany({
        where: { loadingSheetId: loadingSheet.id },
      });
    } else {
      // Create new
      loadingSheet = await prisma.loadingSheet.create({
        data: {
          containerId,
          shippingMark: shippingMark || null,
          clientName,
          clientId,
          status: status || "DRAFT",
        },
      });
    }

    // Create items
    if (items && items.length > 0) {
      const itemsToCreate = items.map((item) => ({
        loadingSheetId: loadingSheet.id,
        photo: item.photo || null, // Keep original photo path - don't modify it
        particular: item.particular,
        mark: item.mark || null,
        itemNo: item.itemNo || item.particular,
        ctn: parseInt(item.ctn) || 0,
        pcs: parseInt(item.pcs) || 0,
        tPcs: parseInt(item.ctn || 0) * parseInt(item.pcs || 0),
        unit: item.unit || "PCS",
        cbm: parseFloat(item.cbm) || 0,
        tCbm: parseInt(item.ctn || 0) * parseFloat(item.cbm || 0),
        wt: parseFloat(item.wt) || 0,
        tWt: parseInt(item.ctn || 0) * parseFloat(item.wt || 0),
      }));

      await prisma.loadingItem.createMany({
        data: itemsToCreate,
      });
    }

    // Log activities
    if (userId) {
        if (changes.length > 0) {
            await Promise.all(changes.map(change => 
                prisma.loadingActivity.create({
                    data: {
                        loadingSheetId: loadingSheet.id,
                        userId,
                        type: "UPDATE",
                        field: change.field,
                        oldValue: change.old ? String(change.old) : null,
                        newValue: change.new ? String(change.new) : null
                    }
                })
            ));
        } else if (!oldSheet) {
            await prisma.loadingActivity.create({
                data: {
                    loadingSheetId: loadingSheet.id,
                    userId,
                    type: "CREATE",
                    newValue: shippingMark || 'General'
                }
            });
        }
    }

    // Recalculate totals
    await containerService.recalculateContainerTotals(containerId);

    // Return with items
    return await prisma.loadingSheet.findUnique({
      where: { id: loadingSheet.id },
      include: {
        items: true,
        activities: {
          include: {
            user: {
              select: { name: true, role: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
  },

  // Get activities
  getActivities: async (filters = {}) => {
    const { loadingSheetId, containerId, search, page = 1, limit = 20 } = filters;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    
    if (loadingSheetId) where.loadingSheetId = loadingSheetId;
    if (containerId) {
        where.loadingSheet = { containerId };
    }

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { field: { contains: search, mode: 'insensitive' } },
        { oldValue: { contains: search, mode: 'insensitive' } },
        { newValue: { contains: search, mode: 'insensitive' } },
        { loadingSheet: { container: { containerCode: { contains: search, mode: 'insensitive' } } } },
        { loadingSheet: { shippingMark: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [activities, total] = await Promise.all([
      prisma.loadingActivity.findMany({
        where,
        include: {
          user: { select: { name: true, username: true } },
          loadingSheet: {
              include: {
                  container: { select: { containerCode: true } }
              }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.loadingActivity.count({ where })
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

  // Get all loading sheets for a container
  getLoadingSheetsByContainer: async (containerId) => {
    const container = await prisma.container.findUnique({
      where: { id: containerId },
      include: {
        loadingSheets: {
          include: {
            items: true,
            _count: {
              select: { items: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!container) {
      throw new Error("Container not found");
    }

    // Calculate totals for each sheet
    const sheetsWithTotals = container.loadingSheets.map((sheet) => {
      const totals = sheet.items.reduce(
        (acc, item) => {
          acc.ctn += item.ctn;
          acc.tPcs += item.tPcs;
          acc.tCbm += item.tCbm;
          acc.tWt += item.tWt;
          return acc;
        },
        { ctn: 0, tPcs: 0, tCbm: 0, tWt: 0 }
      );

      return {
        ...sheet,
        totals: {
          ctn: totals.ctn,
          tPcs: totals.tPcs,
          tCbm: parseFloat(totals.tCbm.toFixed(3)),
          tWt: parseFloat(totals.tWt.toFixed(2)),
        },
      };
    });

    return {
      container,
      loadingSheets: sheetsWithTotals,
    };
  },

  // Get single loading sheet
  getLoadingSheetById: async (id) => {
    const sheet = await prisma.loadingSheet.findUnique({
      where: { id },
      include: {
        container: true,
        items: {
          orderBy: { createdAt: "asc" },
        },
        activities: {
          include: {
            user: {
              select: { name: true, role: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!sheet) {
      throw new Error("Loading sheet not found");
    }

    return sheet;
  },

  // Delete loading sheet
  deleteLoadingSheet: async (id, userId) => {
    const sheet = await prisma.loadingSheet.findUnique({
      where: { id },
    });

    if (!sheet) {
      throw new Error("Loading sheet not found");
    }

    if (userId) {
        await prisma.loadingActivity.create({
            data: {
                loadingSheetId: id,
                userId,
                type: "DELETE",
                newValue: sheet.shippingMark || 'General'
            }
        });
    }

    await prisma.loadingSheet.delete({
      where: { id },
    });

    // Recalculate totals if container exists
    if (sheet.containerId) {
       await containerService.recalculateContainerTotals(sheet.containerId);
    }

    return { message: "Loading sheet deleted successfully" };
  },

  // Get shipping mark suggestions
  getShippingMarkSuggestions: async (search) => {
    // 1. Search in shipping mark master first
    const masterMarks = await prisma.shippingMark.findMany({
      where: {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      take: 5,
    });

    // 2. Search in previous loading sheets as fallback/complement
    const sheets = await prisma.loadingSheet.findMany({
      where: {
        shippingMark: {
          contains: search,
          mode: "insensitive",
        },
      },
      select: {
        shippingMark: true,
        clientName: true,
      },
      distinct: ["shippingMark"],
      take: 5,
    });

    const suggestions = [];
    const seenMarks = new Set();

    // Add master marks first (higher priority)
    masterMarks.forEach(sm => {
      suggestions.push({
        mark: sm.name,
        client: sm.client?.name || null,
        clientId: sm.client?.id || null,
        source: 'master'
      });
      seenMarks.add(sm.name.toUpperCase());
    });

    // Add historical marks
    sheets.forEach(s => {
      if (s.shippingMark && !seenMarks.has(s.shippingMark.toUpperCase())) {
        suggestions.push({
          mark: s.shippingMark,
          client: s.clientName,
          clientId: null,
          source: 'history'
        });
      }
    });

    return suggestions.slice(0, 10);
  },

  // Update status only
  updateStatus: async (id, status, userId) => {
    const sheet = await prisma.loadingSheet.findUnique({ where: { id } });
    if (!sheet) throw new Error("Loading sheet not found");

    const updated = await prisma.loadingSheet.update({
      where: { id },
      data: { status },
    });

    if (userId) {
        await prisma.loadingActivity.create({
            data: {
                loadingSheetId: id,
                userId,
                type: "STATUS_CHANGE",
                field: "status",
                oldValue: sheet.status,
                newValue: status
            },
        });
    }

    return updated;
  },
};

module.exports = loadingSheetService;
