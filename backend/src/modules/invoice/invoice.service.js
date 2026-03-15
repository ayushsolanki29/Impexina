const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const invoiceService = {
  // Get all containers with their invoice status
  getAllContainers: async (query = {}) => {
    const { page = 1, limit = 10, search = "" } = query;
    const skip = (page - 1) * limit;

    const where = {};
    if (search) {
      where.OR = [
        { containerCode: { contains: search, mode: "insensitive" } },
        { origin: { contains: search, mode: "insensitive" } },
      ];
    }

    if (query.origin) {
      where.origin = { contains: query.origin, mode: "insensitive" };
    }

    if (query.dateFrom || query.dateTo) {
      where.loadingDate = {};
      if (query.dateFrom) where.loadingDate.gte = new Date(query.dateFrom);
      if (query.dateTo) where.loadingDate.lte = new Date(query.dateTo);
    }

    const [containers, total] = await Promise.all([
      prisma.container.findMany({
        where,
        include: {
          invoice: {
            select: { id: true, status: true, invNo: true }
          }
        },
        orderBy: { loadingDate: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.container.count({ where }),
    ]);

    return {
      data: containers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // Get invoice by containerId
  getInvoiceByContainer: async (containerId) => {
    const container = await prisma.container.findUnique({
      where: { id: containerId },
      include: {
        invoice: {
          include: {
            items: { orderBy: { sequence: "asc" } }
          }
        }
      }
    });

    if (!container) throw new Error("Container not found");

    // If no invoice exists, return container data for creation flow
    return {
      container,
      invoice: container.invoice
    };
  },

  // Import items from Loading Sheets with pricing calculation
  importFromLoadingSheets: async (containerId) => {
    const loadingSheets = await prisma.loadingSheet.findMany({
      where: { containerId },
      include: {
        items: true
      }
    });

    if (!loadingSheets || loadingSheets.length === 0) {
      return [];
    }

    // Transform LoadingItems to InvoiceItems
    const transformedItems = [];
    let globalIndex = 0;
    loadingSheets.forEach(sheet => {
      sheet.items.forEach(item => {
        transformedItems.push({
          itemNumber: item.mark || "",
          description: item.particular,
          ctn: item.ctn,
          qtyPerCtn: item.pcs,
          unit: item.unit,
          tQty: item.tPcs,
          unitPrice: 0, // Default, user will fill
          amountUsd: 0, // Will be calculated
          hsn: "", // Empty by default
          photo: item.photo,
          sequence: globalIndex++
        });
      });
    });

    return transformedItems;
  },

  // Create or Update invoice
  createOrUpdate: async (containerId, data, userId) => {
    const {
      items = [],
      invNo,
      invoiceNo,
      invoiceDate,
      status,
      // Ignore packing list specific fields that might come in from frontend defaults
      sellerCompanyName,
      sellerAddress,
      sellerIecNo,
      sellerGst,
      sellerEmail,
      ...headerData
    } = data;

    // 1. Get container code if not provided
    const container = await prisma.container.findUnique({ where: { id: containerId } });
    if (!container) throw new Error("Container not found");

    const invoice = await prisma.invoice.findUnique({
      where: { containerId }
    });

    // 2. Prepare Items Data with calculations
    const itemsToCreate = items.map((item, index) => {
      const ctn = parseInt(item.ctn) || 0;
      const qtyPerCtn = parseInt(item.qtyPerCtn) || 0;
      const tQty = parseInt(item.tQty) || (ctn * qtyPerCtn);
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const amountUsd = Math.round(parseFloat(item.amountUsd) || (tQty * unitPrice));

      return {
        itemNumber: item.itemNumber || "",
        description: item.description,
        ctn,
        qtyPerCtn,
        unit: item.unit || "PCS",
        tQty,
        unitPrice,
        amountUsd,
        hsn: item.hsn || "",
        photo: item.photo,
        sequence: index
      };
    });

    // 3. Calculate Totals
    const totalCtn = itemsToCreate.reduce((sum, i) => sum + i.ctn, 0);
    const totalQty = itemsToCreate.reduce((sum, i) => sum + i.tQty, 0);
    const totalAmountUsd = itemsToCreate.reduce((sum, i) => sum + i.amountUsd, 0);

    // 4. Upsert Invoice
    let result;
    if (invoice) {
      // Update
      result = await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          ...headerData,
          invNo: invNo || invoice.invNo,
          invoiceNo: invoiceNo,
          invoiceDate: invoiceDate ? new Date(invoiceDate) : null,
          status: status || (invoice ? invoice.status : "DRAFT"),
          totalCtn,
          totalQty,
          totalAmountUsd,
          updatedBy: String(userId),
          items: {
            deleteMany: {}, // Replace all items
            create: itemsToCreate
          }
        },
        include: { items: true }
      });
    } else {
      // Create
      result = await prisma.invoice.create({
        data: {
          ...headerData,
          containerId,
          containerCode: container.containerCode,
          invNo: invNo || `INV-${container.containerCode}`,
          invoiceNo: invoiceNo,
          invoiceDate: invoiceDate ? new Date(invoiceDate) : null,
          status: status || (invoice ? invoice.status : "DRAFT"),
          totalCtn,
          totalQty,
          totalAmountUsd,
          createdBy: String(userId),
          updatedBy: String(userId),
          items: {
            create: itemsToCreate
          }
        },
        include: { items: true }
      });
    }

    // 5. Log activity
    if (userId) {
      await prisma.invoiceActivity.create({
        data: {
          invoiceId: result.id,
          userId: parseInt(userId),
          type: invoice ? "UPDATED" : "CREATED",
          note: invoice
            ? `Updated invoice ${result.invNo} for ${container.containerCode}`
            : `Created invoice ${result.invNo} for ${container.containerCode}`,
          oldValue: invoice ? JSON.stringify({ invNo: invoice.invNo, status: invoice.status }) : null,
          newValue: JSON.stringify({ invNo: result.invNo, status: result.status })
        }
      });
    }

    return result;
  },

  delete: async (id, userId) => {
    return await prisma.invoice.delete({
      where: { id }
    });
  },

  // Update only the status
  patchStatus: async (id, status, userId) => {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { container: true }
    });

    if (!invoice) throw new Error("Invoice not found");

    const result = await prisma.invoice.update({
      where: { id },
      data: { status, updatedBy: String(userId) }
    });

    if (userId) {
      await prisma.invoiceActivity.create({
        data: {
          invoiceId: id,
          userId: parseInt(userId),
          type: "STATUS_CHANGE",
          note: `Status changed to ${status}`,
          oldValue: JSON.stringify({ status: invoice.status }),
          newValue: JSON.stringify({ status: result.status })
        }
      });
    }

    return result;
  }
};

module.exports = invoiceService;
