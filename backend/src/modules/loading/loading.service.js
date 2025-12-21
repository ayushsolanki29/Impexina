const { prisma } = require("../../database/prisma");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
const loadingService = {
  // Create or update loading sheet - Multiple clients per container
  createOrUpdateLoadingSheet: async (data, userId) => {
    const { containerCode, origin, loadingDate, shippingMark, rows } = data;

    // Check if container exists
    let container = await prisma.container.findUnique({
      where: { containerCode },
    });

    // Create container if not exists
    if (!container) {
      container = await prisma.container.create({
        data: {
          containerCode,
          origin,
        },
      });
    }

    // Check if shipping mark exists
    let shippingMarkRecord = await prisma.shippingMark.findUnique({
      where: { name: shippingMark },
    });

    // Create shipping mark if not exists
    if (!shippingMarkRecord) {
      shippingMarkRecord = await prisma.shippingMark.create({
        data: {
          name: shippingMark,
          source: origin,
        },
      });
    }

    // Generate unique identifier for this loading sheet
    // This ensures multiple clients can have same shipping mark in same container
    const loadingSheet = await prisma.loadingSheet.create({
      data: {
        containerId: container.id,
        shippingMarkId: shippingMarkRecord.id,
        loadingDate: new Date(loadingDate),
        status: "DRAFT",
      },
      include: {
        items: true,
      },
    });

    // Process items
    for (const row of rows) {
      // Check if ctn mark exists
      let ctnMark = await prisma.ctnMark.findUnique({
        where: { name: row.ctnMark },
      });

      // Create ctn mark if not exists
      if (!ctnMark) {
        ctnMark = await prisma.ctnMark.create({
          data: {
            name: row.ctnMark,
          },
        });
      }

      // Create new item
      const itemData = {
        particular: row.particular,
        itemNo: row.itemNo || row.particular,
        ctn: Number(row.ctn),
        pcs: Number(row.pcs),
        tpcs: Number(row.ctn) * Number(row.pcs),
        cbm: Number(row.cbm),
        tcbm: Number(row.ctn) * Number(row.cbm),
        wt: Number(row.wt),
        twt: Number(row.ctn) * Number(row.wt),
        unit: row.unit || "PCS",
        photo: row.photo || null,
        ctnMarkId: ctnMark.id,
        loadingSheetId: loadingSheet.id,
      };

      await prisma.loadingItem.create({
        data: itemData,
      });
    }

    // Create activity log
    await prisma.loadingActivity.create({
      data: {
        loadingSheetId: loadingSheet.id,
        userId: userId,
        type: "CREATE", // Fixed: Always CREATE for new loading sheet
        newValue: {
          containerCode,
          origin,
          loadingDate,
          shippingMark,
          itemsCount: rows.length,
        },
      },
    });

    // Get created loading sheet with relations
    const createdLoadingSheet = await prisma.loadingSheet.findUnique({
      where: { id: loadingSheet.id },
      include: {
        container: true,
        shippingMark: true,
        items: {
          include: {
            ctnMark: true,
          },
        },
      },
    });

    return {
      message: "Loading sheet created successfully",
      data: createdLoadingSheet,
      id: loadingSheet.id,
    };
  },
  // Get all loading sheets with pagination
  getAllLoadingSheets: async ({ page, limit, search, status }) => {
    const skip = (page - 1) * limit;

    const where = {};

    if (search) {
      where.OR = [
        {
          container: {
            containerCode: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          shippingMark: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [loadingSheets, total] = await Promise.all([
      prisma.loadingSheet.findMany({
        where,
        skip,
        take: limit,
        include: {
          container: true,
          shippingMark: true,
          items: true,
          _count: {
            select: { items: true },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.loadingSheet.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      loadingSheets,
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

  // Get loading sheet by ID
  getLoadingSheetById: async (id) => {
    return prisma.loadingSheet.findUnique({
      where: { id },
      include: {
        container: true,
        shippingMark: true,
        items: {
          include: {
            ctnMark: true,
          },
        },
        loadingActivities: {
          include: {
            user: {
              select: {
                name: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  },

  // Get container suggestions
  getContainerSuggestions: async (search) => {
    return prisma.container.findMany({
      where: {
        containerCode: {
          contains: search,
          mode: "insensitive",
        },
      },
      select: {
        containerCode: true,
        origin: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });
  },
  uploadPhoto: async (file, containerCode) => {
    if (!file) {
      throw new Error("No file provided");
    }

    if (!containerCode) {
      throw new Error("Container code is required");
    }

    // Create container-specific folder
    const uploadsRoot = path.join(process.cwd(), "uploads");
    const uploadDir = path.join(uploadsRoot, containerCode);

    // Ensure directories exist
    if (!fs.existsSync(uploadsRoot)) {
      fs.mkdirSync(uploadsRoot, { recursive: true });
    }

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename with UUID
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);

    // Save file - ensure we have buffer data
    const fileData = file.buffer || file.data || Buffer.from(file);
    await fs.promises.writeFile(filePath, fileData);

    // Return relative path for database
    return `/uploads/${containerCode}/${fileName}`;
  },
  // Get shipping mark suggestions
  getShippingMarkSuggestions: async (search) => {
    return prisma.shippingMark.findMany({
      where: {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
      select: {
        name: true,
        source: true,
      },
      orderBy: {
        name: "asc",
      },
      take: 10,
    });
  },

  // Update loading sheet status
  updateLoadingSheetStatus: async (id, status, userId) => {
    const loadingSheet = await prisma.loadingSheet.findUnique({
      where: { id },
    });

    if (!loadingSheet) {
      throw new Error("Loading sheet not found");
    }

    const updated = await prisma.loadingSheet.update({
      where: { id },
      data: { status },
    });

    // Create activity log for status change
    await prisma.loadingActivity.create({
      data: {
        loadingSheetId: id,
        userId: userId,
        type: "STATUS_CHANGE",
        oldValue: { status: loadingSheet.status },
        newValue: { status },
      },
    });

    return updated;
  },

  // Delete loading sheet
  deleteLoadingSheet: async (id, userId) => {
    const loadingSheet = await prisma.loadingSheet.findUnique({
      where: { id },
    });

    if (!loadingSheet) {
      throw new Error("Loading sheet not found");
    }

    // Create activity log before deletion
    await prisma.loadingActivity.create({
      data: {
        loadingSheetId: id,
        userId: userId,
        type: "UPDATE",
        oldValue: loadingSheet,
        newValue: null,
      },
    });

    // Delete items first (cascade will handle)
    await prisma.loadingItem.deleteMany({
      where: { loadingSheetId: id },
    });

    // Delete loading sheet
    await prisma.loadingSheet.delete({
      where: { id },
    });
  },

  // Get loading sheets by container
  getLoadingSheetsByContainer: async (containerCode) => {
    const container = await prisma.container.findUnique({
      where: { containerCode },
      include: {
        loadingSheets: {
          include: {
            shippingMark: true,
            items: {
              include: {
                ctnMark: true,
              },
            },
          },
        },
      },
    });

    if (!container) {
      throw new Error("Container not found");
    }

    return container;
  },

  // Get loading sheet activities
  getLoadingSheetActivities: async (id) => {
    return prisma.loadingActivity.findMany({
      where: { loadingSheetId: id },
      include: {
        user: {
          select: {
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },
  // Get all containers with aggregated data - DEBUG VERSION
  getAllContainers: async ({
    page,
    limit,
    search,
    origin,
    status,
    dateFrom,
    dateTo,
  }) => {
    try {
      console.log("Getting containers with params:", {
        page,
        limit,
        search,
        origin,
        status,
        dateFrom,
        dateTo,
      });

      const skip = (page - 1) * limit;

      // Build where clause for loading sheets
      const sheetWhere = {};

      if (status && status !== "") {
        sheetWhere.status = status;
        console.log("Status filter:", status);
      }

      if (dateFrom || dateTo) {
        sheetWhere.loadingDate = {};
        if (dateFrom) {
          sheetWhere.loadingDate.gte = new Date(dateFrom);
          console.log("Date from:", dateFrom);
        }
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          sheetWhere.loadingDate.lte = toDate;
          console.log("Date to:", dateTo);
        }
      }

      // Build container where clause
      const containerWhere = {
        loadingSheets: {
          some: Object.keys(sheetWhere).length > 0 ? sheetWhere : {},
        },
      };

      // Add search filter
      if (search && search !== "") {
        containerWhere.containerCode = {
          contains: search,
          mode: "insensitive",
        };
        console.log("Search filter:", search);
      }

      // Add origin filter
      if (origin && origin !== "") {
        containerWhere.origin = origin;
        console.log("Origin filter:", origin);
      }

      console.log(
        "Container WHERE clause:",
        JSON.stringify(containerWhere, null, 2)
      );

      // Get all containers with their loading sheets
      const containers = await prisma.container.findMany({
        where: containerWhere,
        skip,
        take: limit,
        include: {
          loadingSheets: {
            where: sheetWhere,
            include: {
              shippingMark: true,
              items: true,
            },
            orderBy: {
              loadingDate: "desc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      console.log(`Found ${containers.length} containers`);

      // Get total count for pagination
      const total = await prisma.container.count({
        where: containerWhere,
      });

      console.log(`Total containers in DB: ${total}`);

      // If no containers found, return empty result
      if (containers.length === 0) {
        return {
          containers: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
      }

      // Aggregate data for each container
      const aggregatedContainers = containers.map((container) => {
        let totalCTN = 0;
        let totalPCS = 0;
        let totalCBM = 0;
        let totalWeight = 0;
        const clients = new Set();
        let latestStatus = "DRAFT";
        let latestLoadingDate = null;

        console.log(
          `Processing container ${container.containerCode} with ${container.loadingSheets.length} sheets`
        );

        container.loadingSheets.forEach((sheet) => {
          // Add shipping mark to clients
          if (sheet.shippingMark?.name) {
            clients.add(sheet.shippingMark.name);
          }

          // Update latest status and date
          if (
            !latestLoadingDate ||
            new Date(sheet.loadingDate) > new Date(latestLoadingDate)
          ) {
            latestLoadingDate = sheet.loadingDate;
            latestStatus = sheet.status;
          }

          // Sum up items
          sheet.items.forEach((item) => {
            totalCTN += item.ctn || 0;
            totalPCS += item.tpcs || 0;
            totalCBM += parseFloat(item.tcbm) || 0;
            totalWeight += parseFloat(item.twt) || 0;
          });
        });

        const result = {
          id: container.id,
          containerCode: container.containerCode,
          origin: container.origin,
          status: latestStatus,
          loadingDate: latestLoadingDate,
          totalCTN,
          totalPCS,
          totalCBM: parseFloat(totalCBM.toFixed(3)),
          totalWeight: parseFloat(totalWeight.toFixed(2)),
          clientCount: clients.size,
          clients: Array.from(clients).sort(),
          sheetCount: container.loadingSheets.length,
          createdAt: container.createdAt,
        };

        console.log(`Container ${container.containerCode} aggregated:`, {
          totalCTN,
          totalPCS,
          totalCBM,
          totalWeight,
          clientCount: clients.size,
        });

        return result;
      });

      const totalPages = Math.ceil(total / limit);

      const finalResult = {
        containers: aggregatedContainers,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };

      console.log("Final result:", {
        containersCount: finalResult.containers.length,
        pagination: finalResult.pagination,
      });

      return finalResult;
    } catch (error) {
      console.error("Error in getAllContainers:", error);
      throw error;
    }
  },

  // Get single container details
  getContainerDetails: async (containerCode) => {
    const container = await prisma.container.findUnique({
      where: { containerCode },
      include: {
        loadingSheets: {
          include: {
            shippingMark: true,
            items: {
              include: {
                ctnMark: true,
              },
            },
            loadingActivities: {
              include: {
                user: {
                  select: {
                    name: true,
                    role: true,
                  },
                },
              },
              orderBy: {
                createdAt: "desc",
              },
              take: 20, // Limit activities
            },
          },
          orderBy: {
            loadingDate: "desc",
          },
        },
      },
    });

    if (!container) {
      throw new Error("Container not found");
    }

    // Aggregate totals
    let totalCTN = 0;
    let totalPCS = 0;
    let totalCBM = 0;
    let totalWeight = 0;
    const clients = new Set();
    let latestStatus = "DRAFT";

    container.loadingSheets.forEach((sheet) => {
      if (sheet.shippingMark?.name) {
        clients.add(sheet.shippingMark.name);
      }

      sheet.items.forEach((item) => {
        totalCTN += item.ctn || 0;
        totalPCS += item.tpcs || 0;
        totalCBM += parseFloat(item.tcbm) || 0;
        totalWeight += parseFloat(item.twt) || 0;
      });
    });

    return {
      ...container,
      aggregatedTotals: {
        totalCTN,
        totalPCS,
        totalCBM: parseFloat(totalCBM.toFixed(3)),
        totalWeight: parseFloat(totalWeight.toFixed(2)),
        clientCount: clients.size,
        clients: Array.from(clients).sort(),
      },
    };
  },

  // Update container status (update all loading sheets)
  updateContainerStatus: async (containerCode, status, userId) => {
    const container = await prisma.container.findUnique({
      where: { containerCode },
      include: {
        loadingSheets: true,
      },
    });

    if (!container) {
      throw new Error("Container not found");
    }

    // Update all loading sheets for this container
    const updatePromises = container.loadingSheets.map((sheet) =>
      prisma.loadingSheet.update({
        where: { id: sheet.id },
        data: { status },
      })
    );

    await Promise.all(updatePromises);

    // Create activity logs for each sheet
    const activityPromises = container.loadingSheets.map((sheet) =>
      prisma.loadingActivity.create({
        data: {
          loadingSheetId: sheet.id,
          userId: userId,
          type: "STATUS_CHANGE",
          oldValue: { status: sheet.status },
          newValue: { status },
          createdAt: new Date(), // Ensure same timestamp for bulk update
        },
      })
    );

    await Promise.all(activityPromises);

    return {
      success: true,
      message: `Status updated to ${status} for ${container.loadingSheets.length} loading sheets`,
      containerCode,
      status,
    };
  },

  // Export containers to Excel
  exportContainersToExcel: async ({
    search,
    origin,
    status,
    dateFrom,
    dateTo,
  }) => {
    const sheetWhere = {};

    if (status) {
      sheetWhere.status = status;
    }

    if (dateFrom || dateTo) {
      sheetWhere.loadingDate = {};
      if (dateFrom) {
        sheetWhere.loadingDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        sheetWhere.loadingDate.lte = toDate;
      }
    }

    const containers = await prisma.container.findMany({
      where: {
        ...(search && {
          containerCode: {
            contains: search,
            mode: "insensitive",
          },
        }),
        ...(origin && { origin }),
        loadingSheets: {
          some: sheetWhere,
        },
      },
      include: {
        loadingSheets: {
          where: sheetWhere,
          include: {
            shippingMark: true,
            items: true,
          },
        },
      },
      orderBy: {
        containerCode: "asc",
      },
    });

    // Format data for Excel
    const excelData = containers.map((container) => {
      let totalCTN = 0;
      let totalPCS = 0;
      let totalCBM = 0;
      let totalWeight = 0;
      const clients = new Set();
      let latestStatus = "DRAFT";
      let latestLoadingDate = null;

      container.loadingSheets.forEach((sheet) => {
        if (sheet.shippingMark?.name) {
          clients.add(sheet.shippingMark.name);
        }

        if (
          !latestLoadingDate ||
          new Date(sheet.loadingDate) > new Date(latestLoadingDate)
        ) {
          latestLoadingDate = sheet.loadingDate;
          latestStatus = sheet.status;
        }

        sheet.items.forEach((item) => {
          totalCTN += item.ctn || 0;
          totalPCS += item.tpcs || 0;
          totalCBM += parseFloat(item.tcbm) || 0;
          totalWeight += parseFloat(item.twt) || 0;
        });
      });

      return {
        "Container Code": container.containerCode,
        Origin: container.origin,
        Status: latestStatus,
        "Last Loading Date": latestLoadingDate
          ? new Date(latestLoadingDate).toLocaleDateString()
          : "N/A",
        "Total CTN": totalCTN,
        "Total PCS": totalPCS,
        "Total CBM": parseFloat(totalCBM.toFixed(3)),
        "Total Weight (KG)": parseFloat(totalWeight.toFixed(2)),
        "Client Count": clients.size,
        Clients: Array.from(clients).sort().join(", "),
        "Loading Sheets Count": container.loadingSheets.length,
        "Created Date": new Date(container.createdAt).toLocaleDateString(),
      };
    });

    return excelData;
  },

  // Get activity log for export/download
  logExportActivity: async (userId, filters = {}) => {
    await prisma.loadingActivity.create({
      data: {
        userId: userId,
        type: "EXPORT",
        newValue: {
          exportType: "CONTAINERS_EXCEL",
          filters,
          timestamp: new Date().toISOString(),
        },
      },
    });
  },
   // Get container details with items grouped by client
  getContainerDetailsWithItems: async (containerCode, filters = {}) => {
    const container = await prisma.container.findUnique({
      where: { containerCode },
      include: {
        loadingSheets: {
          where: {
            ...(filters.status && { status: filters.status }),
            ...(filters.dateFrom || filters.dateTo ? {
              loadingDate: {
                ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
                ...(filters.dateTo && { 
                  lte: new Date(filters.dateTo)
                })
              }
            } : {}),
          },
          include: {
            shippingMark: true,
            items: {
              where: {
                ...(filters.search && {
                  OR: [
                    { particular: { contains: filters.search, mode: 'insensitive' } },
                    { itemNo: { contains: filters.search, mode: 'insensitive' } },
                    { ctnMark: { 
                      name: { contains: filters.search, mode: 'insensitive' } 
                    }},
                  ]
                }),
                ...(filters.ctnRange && {
                  ctn: {
                    gte: filters.ctnRange.min,
                    lte: filters.ctnRange.max
                  }
                }),
                ...(filters.weightRange && {
                  wt: {
                    gte: filters.weightRange.min,
                    lte: filters.weightRange.max
                  }
                }),
                ...(filters.cbmRange && {
                  cbm: {
                    gte: filters.cbmRange.min,
                    lte: filters.cbmRange.max
                  }
                }),
              },
              include: {
                ctnMark: true,
              },
              orderBy: {
                createdAt: 'desc'
              }
            },
          },
          orderBy: {
            loadingDate: 'desc'
          }
        }
      }
    });

    if (!container) {
      throw new Error("Container not found");
    }

    // Group items by client (shipping mark)
    const clientGroups = {};
    let overallTotals = {
      totalCTN: 0,
      totalPCS: 0,
      totalCBM: 0,
      totalWeight: 0,
      totalItems: 0,
      totalClients: 0
    };

    container.loadingSheets.forEach(sheet => {
      const clientName = sheet.shippingMark.name;
      
      if (!clientGroups[clientName]) {
        clientGroups[clientName] = {
          client: clientName,
          loadingDate: sheet.loadingDate,
          status: sheet.status,
          items: [],
          totals: {
            ctn: 0,
            pcs: 0,
            tpcs: 0,
            cbm: 0,
            tcbm: 0,
            wt: 0,
            twt: 0,
            itemCount: 0
          }
        };
      }

      sheet.items.forEach(item => {
        const itemData = {
          id: item.id,
          photo: item.photo,
          particular: item.particular,
          mark: sheet.shippingMark.name,
          ctnMark: item.ctnMark.name,
          itemNo: item.itemNo,
          ctn: item.ctn,
          pcs: item.pcs,
          tpcs: item.tpcs,
          unit: item.unit,
          cbm: item.cbm,
          tcbm: item.tcbm,
          wt: item.wt,
          twt: item.twt,
          createdAt: item.createdAt
        };

        clientGroups[clientName].items.push(itemData);
        
        // Update client totals
        clientGroups[clientName].totals.ctn += item.ctn;
        clientGroups[clientName].totals.pcs += item.pcs;
        clientGroups[clientName].totals.tpcs += item.tpcs;
        clientGroups[clientName].totals.cbm += item.cbm;
        clientGroups[clientName].totals.tcbm += item.tcbm;
        clientGroups[clientName].totals.wt += item.wt;
        clientGroups[clientName].totals.twt += item.twt;
        clientGroups[clientName].totals.itemCount++;

        // Update overall totals
        overallTotals.totalCTN += item.ctn;
        overallTotals.totalPCS += item.tpcs;
        overallTotals.totalCBM += item.tcbm;
        overallTotals.totalWeight += item.twt;
        overallTotals.totalItems++;
      });
    });

    // Convert to array and sort
    const clientGroupsArray = Object.values(clientGroups).map(group => ({
      ...group,
      totals: {
        ...group.totals,
        tcbm: parseFloat(group.totals.tcbm.toFixed(3)),
        twt: parseFloat(group.totals.twt.toFixed(2))
      }
    }));

    // Sort by client name or total CTN
    clientGroupsArray.sort((a, b) => {
      if (filters.sortBy === 'ctn') {
        return b.totals.ctn - a.totals.ctn;
      }
      return a.client.localeCompare(b.client);
    });

    overallTotals.totalClients = clientGroupsArray.length;
    overallTotals.totalCBM = parseFloat(overallTotals.totalCBM.toFixed(3));
    overallTotals.totalWeight = parseFloat(overallTotals.totalWeight.toFixed(2));

    return {
      container: {
        code: container.containerCode,
        origin: container.origin,
        createdAt: container.createdAt
      },
      clientGroups: clientGroupsArray,
      overallTotals,
      filtersApplied: filters
    };
  },

// Fix the export functions - they should call this.getContainerDetailsWithItems
exportContainerToExcel: async (containerCode, selectedClients = [], filters = {}) => {
  const containerData = await this.getContainerDetailsWithItems(containerCode, filters);
  
  // Filter by selected clients if any
  let filteredGroups = containerData.clientGroups;
  if (selectedClients.length > 0) {
    filteredGroups = containerData.clientGroups.filter(group => 
      selectedClients.includes(group.client)
    );
  }

  // Prepare Excel data
  const excelData = {
    // Summary Sheet
    summary: filteredGroups.map(group => ({
      'Client': group.client,
      'Loading Date': new Date(group.loadingDate).toLocaleDateString(),
      'Status': group.status,
      'Total Items': group.totals.itemCount,
      'Total CTN': group.totals.ctn,
      'Total PCS': group.totals.pcs,
      'Total T.PCS': group.totals.tpcs,
      'Total CBM': group.totals.tcbm,
      'Total Weight (KG)': group.totals.twt,
      'Average CBM per CTN': group.totals.ctn > 0 ? (group.totals.tcbm / group.totals.ctn).toFixed(3) : 0,
      'Average Weight per CTN': group.totals.ctn > 0 ? (group.totals.twt / group.totals.ctn).toFixed(2) : 0
    })),

    // Items Sheet (all items)
    items: filteredGroups.flatMap(group => 
      group.items.map(item => ({
        'Container': containerCode,
        'Client': group.client,
        'Loading Date': new Date(group.loadingDate).toLocaleDateString(),
        'Particular': item.particular,
        'Shipping Mark': item.mark,
        'CTN Mark': item.ctnMark,
        'Item No': item.itemNo,
        'CTN': item.ctn,
        'PCS': item.pcs,
        'T.PCS': item.tpcs,
        'Unit': item.unit,
        'CBM per CTN': item.cbm,
        'Total CBM': item.tcbm,
        'Weight per CTN (KG)': item.wt,
        'Total Weight (KG)': item.twt,
        'Photo': item.photo ? 'Yes' : 'No'
      }))
    ),

    // Totals Sheet
    totals: [{
      'Container': containerCode,
      'Total Clients': containerData.overallTotals.totalClients,
      'Total Items': containerData.overallTotals.totalItems,
      'Total CTN': containerData.overallTotals.totalCTN,
      'Total PCS': containerData.overallTotals.totalPCS,
      'Total CBM': containerData.overallTotals.totalCBM,
      'Total Weight (KG)': containerData.overallTotals.totalWeight,
      'Average Items per Client': (containerData.overallTotals.totalItems / containerData.overallTotals.totalClients).toFixed(1),
      'Average CTN per Client': (containerData.overallTotals.totalCTN / containerData.overallTotals.totalClients).toFixed(1),
      'Generated Date': new Date().toLocaleDateString()
    }]
  };

  return excelData;
},

 
// Generate image data for preview
generateContainerImageData: async (containerCode, selectedClients = [], filters = {}) => {
  const containerData = await this.getContainerDetailsWithItems(containerCode, filters);
  
  // Filter by selected clients if any
  let filteredGroups = containerData.clientGroups;
  if (selectedClients.length > 0) {
    filteredGroups = containerData.clientGroups.filter(group => 
      selectedClients.includes(group.client)
    );
  }

  // Prepare image data format
  return {
    container: containerData.container,
    clientGroups: filteredGroups,
    overallTotals: containerData.overallTotals,
    generatedAt: new Date(),
    selectedClients,
    filters
  };
},

  // Update container status
  updateContainerStatus: async (containerCode, status, userId) => {
    const container = await prisma.container.findUnique({
      where: { containerCode },
      include: {
        loadingSheets: true
      }
    });

    if (!container) {
      throw new Error("Container not found");
    }

    // Update all loading sheets for this container
    const updatePromises = container.loadingSheets.map(sheet => 
      prisma.loadingSheet.update({
        where: { id: sheet.id },
        data: { status }
      })
    );

    await Promise.all(updatePromises);

    // Create activity logs
    const activityPromises = container.loadingSheets.map(sheet =>
      prisma.loadingActivity.create({
        data: {
          loadingSheetId: sheet.id,
          userId: userId,
          type: "STATUS_CHANGE",
          oldValue: { status: sheet.status },
          newValue: { status },
          note: `Container ${containerCode} status changed to ${status}`
        }
      })
    );

    await Promise.all(activityPromises);

    return {
      success: true,
      message: `Container ${containerCode} status updated to ${status}`,
      containerCode,
      status,
      updatedSheets: container.loadingSheets.length
    };
  },

  // Search within container with pagination
  searchContainerItems: async (containerCode, searchTerm, page = 1, limit = 50) => {
    const skip = (page - 1) * limit;

    const items = await prisma.loadingItem.findMany({
      where: {
        loadingSheet: {
          container: {
            containerCode: containerCode
          }
        },
        OR: [
          { particular: { contains: searchTerm, mode: 'insensitive' } },
          { itemNo: { contains: searchTerm, mode: 'insensitive' } },
          { 
            ctnMark: {
              name: { contains: searchTerm, mode: 'insensitive' }
            }
          }
        ]
      },
      include: {
        loadingSheet: {
          include: {
            shippingMark: true,
            container: true
          }
        },
        ctnMark: true
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });

    const total = await prisma.loadingItem.count({
      where: {
        loadingSheet: {
          container: {
            containerCode: containerCode
          }
        },
        OR: [
          { particular: { contains: searchTerm, mode: 'insensitive' } },
          { itemNo: { contains: searchTerm, mode: 'insensitive' } },
          { 
            ctnMark: {
              name: { contains: searchTerm, mode: 'insensitive' }
            }
          }
        ]
      }
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total
      }
    };
  },
};

module.exports = loadingService;
