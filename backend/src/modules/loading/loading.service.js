const { prisma } = require("../../database/prisma");
const {
  validateLoadingSheet,
  validateLoadingSheetUpdate,
  validateItems,
} = require("./loading.validation");
const csv = require("csv-parser");
const fs = require("fs");

const loadingSheetService = {
  // Create new loading sheet with items
  createLoadingSheet: async (data, userId) => {
    const { error } = validateLoadingSheet(data);
    if (error) throw new Error(error.details[0].message);

    // Check if shipping code already exists
    const existingSheet = await prisma.loadingSheet.findUnique({
      where: { shippingCode: data.shippingCode },
    });

    if (existingSheet) {
      throw new Error("Loading sheet with this shipping code already exists");
    }

    // Create loading sheet with items
    const loadingSheet = await prisma.loadingSheet.create({
      data: {
        ...data,
        items: {
          create: data.items,
        },
      },
      include: {
        items: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "LOADING_SHEET_CREATED",
        module: "LOADING_SHEET",
        details: {
          loadingSheetId: loadingSheet.id,
          shippingCode: loadingSheet.shippingCode,
          itemCount: data.items.length,
        },
        userId: userId,
        status: "success",
      },
    });

    return loadingSheet;
  },

  // Get all loading sheets with filters
  getAllLoadingSheets: async ({
    page,
    limit,
    status,
    search,
    startDate,
    endDate,
  }) => {
    const skip = (page - 1) * limit;

    let where = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { shippingCode: { contains: search, mode: "insensitive" } },
        { shippingMark: { contains: search, mode: "insensitive" } },
        { supplier: { contains: search, mode: "insensitive" } },
        { transporter: { contains: search, mode: "insensitive" } },
      ];
    }

    if (startDate || endDate) {
      where.loadingDate = {};
      if (startDate) where.loadingDate.gte = new Date(startDate);
      if (endDate) where.loadingDate.lte = new Date(endDate);
    }

    const [loadingSheets, total] = await Promise.all([
      prisma.loadingSheet.findMany({
        where,
        skip,
        take: limit,
        include: {
          items: {
            select: {
              id: true,
              itemName: true,
              itemNo: true,
              mark: true,
              ctn: true,
              pcs: true,
              cbm: true,
              weight: true,
            },
          },
          _count: {
            select: {
              items: true,
              warehouseItems: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.loadingSheet.count({ where }),
    ]);

    return {
      loadingSheets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  // Get loading sheet by ID with detailed information
  getLoadingSheetById: async (id) => {
    const loadingSheet = await prisma.loadingSheet.findUnique({
      where: { id },
      include: {
        items: true,
        warehouseItems: {
          include: {
            movements: {
              take: 5,
              orderBy: { createdAt: "desc" },
              include: {
                user: {
                  select: { name: true },
                },
              },
            },
          },
        },
        duties: {
          include: {
            approvedBy: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    if (!loadingSheet) {
      throw new Error("Loading sheet not found");
    }

    // Calculate totals
    const totals = {
      totalItems: loadingSheet.items.length,
      totalCTN: loadingSheet.items.reduce((sum, item) => sum + item.ctn, 0),
      totalPCS: loadingSheet.items.reduce((sum, item) => sum + item.pcs, 0),
      totalCBM: loadingSheet.items.reduce(
        (sum, item) => sum + (item.cbm || 0),
        0
      ),
      totalWeight: loadingSheet.items.reduce(
        (sum, item) => sum + (item.weight || 0),
        0
      ),
    };

    return {
      ...loadingSheet,
      totals,
    };
  },

  // Update loading sheet
  updateLoadingSheet: async (id, data, userId) => {
    const { error } = validateLoadingSheetUpdate(data);
    if (error) throw new Error(error.details[0].message);

    const loadingSheet = await prisma.loadingSheet.findUnique({
      where: { id },
    });

    if (!loadingSheet) {
      throw new Error("Loading sheet not found");
    }

    // Prevent updating certain fields if sheet is in warehouse
    if (
      loadingSheet.status === "WAREHOUSE" ||
      loadingSheet.status === "AVAILABLE"
    ) {
      const restrictedFields = ["shippingCode", "loadingDate", "arrivalDate"];
      const attemptedRestricted = Object.keys(data).filter((key) =>
        restrictedFields.includes(key)
      );

      if (attemptedRestricted.length > 0) {
        throw new Error(
          `Cannot update ${attemptedRestricted.join(
            ", "
          )} when loading sheet is in ${loadingSheet.status} status`
        );
      }
    }

    const updatedSheet = await prisma.loadingSheet.update({
      where: { id },
      data: data,
      include: {
        items: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "LOADING_SHEET_UPDATED",
        module: "LOADING_SHEET",
        details: {
          loadingSheetId: id,
          updatedFields: Object.keys(data),
        },
        userId: userId,
        status: "success",
      },
    });

    return updatedSheet;
  },

  // Update loading sheet status
  updateLoadingSheetStatus: async (id, status, userId) => {
    const validStatuses = [
      "IN_TRANSIT",
      "ARRIVED",
      "WAREHOUSE",
      "AVAILABLE",
      "COMPLETED",
    ];
    if (!validStatuses.includes(status)) {
      throw new Error(
        "Invalid status. Must be one of: " + validStatuses.join(", ")
      );
    }

    const loadingSheet = await prisma.loadingSheet.findUnique({
      where: { id },
    });

    if (!loadingSheet) {
      throw new Error("Loading sheet not found");
    }

    // Validate status transition
    const statusFlow = {
      IN_TRANSIT: ["ARRIVED"],
      ARRIVED: ["WAREHOUSE"],
      WAREHOUSE: ["AVAILABLE"],
      AVAILABLE: ["COMPLETED"],
      COMPLETED: [],
    };

    if (!statusFlow[loadingSheet.status].includes(status)) {
      throw new Error(
        `Cannot change status from ${loadingSheet.status} to ${status}`
      );
    }

    const updatedSheet = await prisma.loadingSheet.update({
      where: { id },
      data: { status },
      include: {
        items: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "LOADING_SHEET_STATUS_UPDATED",
        module: "LOADING_SHEET",
        details: {
          loadingSheetId: id,
          shippingCode: loadingSheet.shippingCode,
          fromStatus: loadingSheet.status,
          toStatus: status,
        },
        userId: userId,
        status: "success",
      },
    });

    return updatedSheet;
  },

  // Add items to existing loading sheet
  addItemsToLoadingSheet: async (loadingSheetId, items, userId) => {
    const { error } = validateItems(items);
    if (error) throw new Error(error.details[0].message);

    const loadingSheet = await prisma.loadingSheet.findUnique({
      where: { id: loadingSheetId },
    });

    if (!loadingSheet) {
      throw new Error("Loading sheet not found");
    }

    // Prevent adding items if sheet is completed
    if (loadingSheet.status === "COMPLETED") {
      throw new Error("Cannot add items to completed loading sheet");
    }

    const createdItems = await prisma.loadingSheetItem.createMany({
      data: items.map((item) => ({
        ...item,
        loadingSheetId,
      })),
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "ITEMS_ADDED_TO_LOADING_SHEET",
        module: "LOADING_SHEET",
        details: {
          loadingSheetId,
          itemCount: items.length,
          items: items.map((item) => item.itemName),
        },
        userId: userId,
        status: "success",
      },
    });

    return {
      message: `${items.length} items added successfully`,
      count: createdItems.count,
    };
  },

  // Process CSV file
  processCSV: async (file, userId) => {
    return new Promise((resolve, reject) => {
      const results = [];
      const errors = [];

      fs.createReadStream(file.path)
        .pipe(csv())
        .on("data", (data) => {
          try {
            // Map CSV columns to loading sheet item structure
            const item = {
              itemName: data["PRODUCT"] || data["Descriptions"] || "",
              itemNo: data["ITEM NO"] || data["Item Number"] || "",
              mark: data["MARK"] || data["SHIPPING MARK"] || "",
              ctn: parseInt(data["CTN"] || data["Ctn."] || "0"),
              pcs: parseInt(
                data["PCS"] || data["Qty./ Ctn"] || data["T-QTY"] || "0"
              ),
              cbm: parseFloat(data["CBM"] || data["T.CBM"] || "0"),
              weight: parseFloat(
                data["WEIGHT"] || data["T.WT"] || data["T.KG"] || "0"
              ),
              unitPrice: parseFloat(
                data["UNIT PRICE"] || data["U.price"] || "0"
              ),
              totalPrice: parseFloat(
                data["TOTAL PRICE"] || data["Amount/USD"] || "0"
              ),
              hsnCode: data["HSN"] || data["HSN Code"] || "",
            };

            // Validate required fields
            if (!item.itemName || item.ctn === 0 || item.pcs === 0) {
              errors.push(`Invalid row: ${JSON.stringify(data)}`);
              return;
            }

            results.push(item);
          } catch (error) {
            errors.push(`Error processing row: ${error.message}`);
          }
        })
        .on("end", async () => {
          try {
            // Create a new loading sheet from CSV data
            const shippingCode = `CSV_${Date.now()}`;

            const loadingSheet = await prisma.loadingSheet.create({
              data: {
                shippingCode,
                shippingMark: "CSV_IMPORT",
                supplier: "CSV Import",
                status: "IN_TRANSIT",
                loadingDate: new Date(),
                items: {
                  create: results,
                },
              },
              include: {
                items: true,
              },
            });

            // Log activity
            await prisma.activityLog.create({
              data: {
                action: "CSV_IMPORT_PROCESSED",
                module: "LOADING_SHEET",
                details: {
                  loadingSheetId: loadingSheet.id,
                  shippingCode: loadingSheet.shippingCode,
                  successfulItems: results.length,
                  failedItems: errors.length,
                  errors: errors.slice(0, 10), // Limit error logging
                },
                userId: userId,
                status: errors.length > 0 ? "error" : "success",
              },
            });

            // Clean up file
            fs.unlinkSync(file.path);

            resolve({
              message: `CSV processed successfully`,
              loadingSheet: {
                id: loadingSheet.id,
                shippingCode: loadingSheet.shippingCode,
                itemCount: loadingSheet.items.length,
              },
              summary: {
                totalRecords: results.length + errors.length,
                successful: results.length,
                failed: errors.length,
                errors: errors.slice(0, 5), // Return first 5 errors
              },
            });
          } catch (error) {
            reject(error);
          }
        })
        .on("error", (error) => {
          reject(error);
        });
    });
  },

  // Delete loading sheet
  deleteLoadingSheet: async (id, userId) => {
    const loadingSheet = await prisma.loadingSheet.findUnique({
      where: { id },
      include: {
        warehouseItems: true,
        duties: true,
      },
    });

    if (!loadingSheet) {
      throw new Error("Loading sheet not found");
    }

    // Prevent deletion if there are dependent records
    if (loadingSheet.warehouseItems.length > 0) {
      throw new Error(
        "Cannot delete loading sheet with warehouse items. Delete warehouse items first."
      );
    }

    if (loadingSheet.duties.length > 0) {
      throw new Error(
        "Cannot delete loading sheet with duty records. Delete duty records first."
      );
    }

    // Delete items first (due to foreign key constraint)
    await prisma.loadingSheetItem.deleteMany({
      where: { loadingSheetId: id },
    });

    // Then delete the loading sheet
    await prisma.loadingSheet.delete({
      where: { id },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "LOADING_SHEET_DELETED",
        module: "LOADING_SHEET",
        details: {
          loadingSheetId: id,
          shippingCode: loadingSheet.shippingCode,
        },
        userId: userId,
        status: "success",
      },
    });
  },

  // Get loading sheet statistics
  getStatistics: async () => {
    const [
      totalSheets,
      inTransit,
      arrived,
      inWarehouse,
      available,
      completed,
      recentSheets,
    ] = await Promise.all([
      prisma.loadingSheet.count(),
      prisma.loadingSheet.count({ where: { status: "IN_TRANSIT" } }),
      prisma.loadingSheet.count({ where: { status: "ARRIVED" } }),
      prisma.loadingSheet.count({ where: { status: "WAREHOUSE" } }),
      prisma.loadingSheet.count({ where: { status: "AVAILABLE" } }),
      prisma.loadingSheet.count({ where: { status: "COMPLETED" } }),
      prisma.loadingSheet.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          shippingCode: true,
          status: true,
          loadingDate: true,
          arrivalDate: true,
          _count: {
            select: { items: true },
          },
        },
      }),
    ]);

    return {
      totals: {
        total: totalSheets,
        inTransit,
        arrived,
        inWarehouse,
        available,
        completed,
      },
      recentSheets,
    };
  },
};

module.exports = loadingSheetService;
