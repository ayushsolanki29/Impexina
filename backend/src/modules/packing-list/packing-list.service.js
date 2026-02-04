const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const packingListService = {
  // Get all containers with their packing list status
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
          packingList: {
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

  // Get packing list by containerId
  getPackingListByContainer: async (containerId) => {
    const container = await prisma.container.findUnique({
      where: { id: containerId },
      include: {
        packingList: {
          include: {
            items: { orderBy: { createdAt: "asc" } },
            companyMaster: true
          }
        }
      }
    });

    if (!container) throw new Error("Container not found");

    // If no packing list exists, we'll return the container data 
    // so the frontend can initiate a "Create" flow
    return {
      container,
      packingList: container.packingList
    };
  },

  // Import items from Loading Sheets
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

    // Transform LoadingItems to PackingListItems
    const transformedItems = [];
    loadingSheets.forEach(sheet => {
      sheet.items.forEach(item => {
        transformedItems.push({
          itemNumber: item.mark || "",
          particular: item.particular,
          ctn: item.ctn,
          qtyPerCtn: item.pcs,
          unit: item.unit,
          tQty: item.tPcs,
          kg: item.wt,
          tKg: item.tWt,
          photo: item.photo,
          // MIX and HSN are empty by default during import
          mix: "",
          hsn: ""
        });
      });
    });

    return transformedItems;
  },

  // Create or Update packing list
  createOrUpdate: async (containerId, data, userId) => {
    const {
      items = [],
      companyMasterId,
      invNo,
      invoiceNo,
      invoiceDate,
      ...headerData
    } = data;

    // 1. Get container code if not provided
    const container = await prisma.container.findUnique({ where: { id: containerId } });
    if (!container) throw new Error("Container not found");

    const packingList = await prisma.packingList.findUnique({
      where: { containerId }
    });

    // 2. Auto-upsert CompanyMaster for suggestions
    let masterRecord = null;
    if (headerData.headerCompanyName) {
      masterRecord = await prisma.companyMaster.upsert({
        where: { companyName: headerData.headerCompanyName },
        update: {
          companyAddress: headerData.headerCompanyAddress || "",
          companyPhone: headerData.headerPhone || "",
          bankName: headerData.bankName || "",
          beneficiaryName: headerData.beneficiaryName || "",
          swiftBic: headerData.swiftBic || "",
          bankAddress: headerData.bankAddress || "",
          accountNumber: headerData.accountNumber || "",
          stampImage: headerData.stampImage || null,
          stampSize: headerData.stampSize || "M",
          signatureText: headerData.stampText || "Authorized Signatory"
        },
        create: {
          companyName: headerData.headerCompanyName,
          companyAddress: headerData.headerCompanyAddress || "",
          companyPhone: headerData.headerPhone || "",
          bankName: headerData.bankName || "",
          beneficiaryName: headerData.beneficiaryName || "",
          swiftBic: headerData.swiftBic || "",
          bankAddress: headerData.bankAddress || "",
          accountNumber: headerData.accountNumber || "",
          stampImage: headerData.stampImage || null,
          stampSize: headerData.stampSize || "M",
          signatureText: headerData.stampText || "Authorized Signatory"
        }
      });
    }

    // 3. Prepare Items Data
    const itemsToCreate = items.map(item => ({
      itemNumber: item.itemNumber || item.mark || "", // Support mark for legacy/imports
      particular: item.particular,
      ctn: parseInt(item.ctn) || 0,
      qtyPerCtn: parseInt(item.qtyPerCtn) || 0,
      unit: item.unit || "PCS",
      tQty: parseInt(item.tQty) || 0,
      kg: parseFloat(item.kg) || 0,
      tKg: parseFloat(item.tKg) || 0,
      mix: item.mix || "",
      hsn: item.hsn || "",
      photo: item.photo
    }));

    // 4. Upsert Packing List
    let result;
    if (packingList) {
      // Update
      result = await prisma.packingList.update({
        where: { id: packingList.id },
        data: {
          ...headerData,
          invNo: invNo || packingList.invNo,
          invoiceNo: invoiceNo,
          invoiceDate: invoiceDate ? new Date(invoiceDate) : null,
          companyMasterId: masterRecord ? masterRecord.id : companyMasterId,
          updatedBy: String(userId),
          items: {
            deleteMany: {}, // Simple approach: replace all items
            create: itemsToCreate
          }
        },
        include: { items: true }
      });
    } else {
      // Create
      result = await prisma.packingList.create({
        data: {
          ...headerData,
          containerId,
          containerCode: container.containerCode,
          invNo: invNo || `INV-${container.containerCode}`,
          invoiceNo: invoiceNo,
          invoiceDate: invoiceDate ? new Date(invoiceDate) : null,
          companyMasterId: masterRecord ? masterRecord.id : companyMasterId,
          createdBy: String(userId),
          updatedBy: String(userId),
          items: {
            create: itemsToCreate
          }
        },
        include: { items: true }
      });
    }

    // 4. Update Totals in PackingList
    const totalCtn = itemsToCreate.reduce((sum, i) => sum + i.ctn, 0);
    const totalQty = itemsToCreate.reduce((sum, i) => sum + i.tQty, 0);
    const totalWeight = itemsToCreate.reduce((sum, i) => sum + i.tKg, 0);

    await prisma.packingList.update({
      where: { id: result.id },
      data: { totalCtn, totalQty, totalWeight }
    });

    return result;
  },

  // Delete packing list
  delete: async (id) => {
    return await prisma.packingList.delete({
      where: { id }
    });
  }
};

module.exports = packingListService;