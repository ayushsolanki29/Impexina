const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Valid PackingList fields (exclude Invoice-only fields like consignee*)
const PACKING_LIST_FIELDS = [
  'headerCompanyName', 'headerCompanyAddress', 'headerPhone',
  'sellerCompanyName', 'sellerAddress', 'sellerIecNo', 'sellerGst', 'sellerEmail',
  'bankName', 'beneficiaryName', 'swiftBic', 'bankAddress', 'accountNumber',
  'stampImage', 'stampPosition', 'stampSize', 'stampText',
  'showMixColumn', 'showHsnColumn', 'from', 'to', 'status'
];

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
            items: { orderBy: { sequence: "asc" } },
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
    let globalIndex = 0;
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
          hsn: "",
          sequence: globalIndex++
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
      status,
      ...headerData
    } = data;

    // Filter to only PackingList fields (ignore consignee* and other Invoice fields)
    const filteredHeaderData = {};
    for (const key of PACKING_LIST_FIELDS) {
      if (key in headerData) filteredHeaderData[key] = headerData[key];
    }

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
    const itemsToCreate = items.map((item, index) => ({
      itemNumber: item.itemNumber || item.mark || "", // Support mark for legacy/imports
      particular: item.particular,
      ctn: parseInt(item.ctn) || 0,
      qtyPerCtn: parseInt(item.qtyPerCtn) || 0,
      unit: item.unit || "PCS",
      tQty: parseInt(item.tQty) || 0,
      kg: parseFloat(item.kg) || 0,
      tKg: parseFloat(item.tKg) || 0,
      hsn: item.hsn || "",
      mix: item.mix || "",
      value: parseFloat(item.value) || null,
      dollarRate: parseFloat(item.dollarRate) || null,
      photo: item.photo,
      sequence: index
    }));

    // 4. Upsert Packing List
    let result;
    if (packingList) {
      // Update
      result = await prisma.packingList.update({
        where: { id: packingList.id },
        data: {
          ...filteredHeaderData,
          invNo: invNo || packingList.invNo,
          invoiceNo: invoiceNo,
          invoiceDate: invoiceDate ? new Date(invoiceDate) : null,
          status: status || packingList.status,
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
          ...filteredHeaderData,
          containerId,
          containerCode: container.containerCode,
          invNo: invNo || `INV-${container.containerCode}`,
          invoiceNo: invoiceNo,
          invoiceDate: invoiceDate ? new Date(invoiceDate) : null,
          status: status || "DRAFT",
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

    // 5. Log activity
    if (userId) {
      await prisma.packingListActivity.create({
        data: {
          packingListId: result.id,
          userId: parseInt(userId),
          type: packingList ? "UPDATED" : "CREATED",
          note: packingList
            ? `Updated packing list for ${container.containerCode}`
            : `Created packing list for ${container.containerCode}`,
          oldValue: packingList ? JSON.stringify({ invNo: packingList.invNo, status: packingList.status }) : null,
          newValue: JSON.stringify({ invNo: result.invNo, status: result.status })
        }
      });
    }

    return result;
  },

  // Delete packing list
  delete: async (id, userId) => {
    // Log before deletion (if needed, but note activities might be cascaded)
    if (userId) {
      const pl = await prisma.packingList.findUnique({ where: { id } });
      if (pl) {
        // Since activities are cascaded, a "DELETED" log here will be lost 
        // unless we log it to a different table or don't use cascade.
        // For now, I'll just perform the delete as requested.
      }
    }
    return await prisma.packingList.delete({
      where: { id }
    });
  },

  // Update only the status
  patchStatus: async (id, status, userId) => {
    const packingList = await prisma.packingList.findUnique({
      where: { id },
      include: { container: true }
    });

    if (!packingList) throw new Error("Packing list not found");

    const result = await prisma.packingList.update({
      where: { id },
      data: { status, updatedBy: String(userId) }
    });

    if (userId) {
      await prisma.packingListActivity.create({
        data: {
          packingListId: id,
          userId: parseInt(userId),
          type: "STATUS_CHANGE",
          note: `Status changed to ${status}`,
          oldValue: JSON.stringify({ status: packingList.status }),
          newValue: JSON.stringify({ status: result.status })
        }
      });
    }

    return result;
  }
};

module.exports = packingListService;