const { prisma } = require("../../../database/prisma");

const AccountClientsService = {
  // Get all clients (Fetch from CRM Clients)
  getAllClients: async ({ page = 1, limit = 20, search = "", location = "" }) => {
    const skip = (page - 1) * limit;
    
    // Build where clause for CRM Client
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }
    
    // Fetch clients
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: parseInt(limit),
        select: {
            id: true,
            name: true,
            companyName: true,
            city: true,
            phone: true,
            email: true,
            // Calculate balance on the fly or fetched if stored on Client? 
            // For now, we'll fetch transactions to sum them up or use a calculated field if we added one (we didn't add balance to Client yet, let's compute or assume 0 for list view optimization)
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.client.count({ where }),
    ]);

    return {
      clients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // Get single client ledger
  getClientLedger: async (clientId, containerCode, sheetName) => {
    const where = { clientId };
    if (containerCode) where.containerCode = containerCode;
    if (sheetName) where.sheetName = sheetName;

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        transactions: {
          where,
          orderBy: { transactionDate: 'desc' }
        }
      }
    });

    if (!client) return null;

    // Fetch all unique sheet names and container codes for the client
    const allTxns = await prisma.clientTransaction.findMany({
        where: { clientId },
        select: { sheetName: true, containerCode: true },
        distinct: ['sheetName', 'containerCode']
    });

    const sheets = new Set();
    allTxns.forEach(t => {
        if (t.sheetName) sheets.add(t.sheetName);
        if (t.containerCode) sheets.add(t.containerCode);
    });

    return {
        ...client,
        availableSheets: Array.from(sheets).sort()
    };

    if (!client) throw new Error("Client not found");

    // Calculate totals
    const totalExpense = client.transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPaid = client.transactions
      .filter(t => t.type === 'PAYMENT')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      ...client,
      totalExpense,
      totalPaid,
      balance: totalExpense - totalPaid
    };
  },

  // Add transaction
  addTransaction: async (clientId, data) => {
    // Validate client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });
    if (!client) throw new Error("Client not found");

    // Clean data (remove isNew, id if temp)
    const { isNew, id, ...cleanData } = data;

    return prisma.clientTransaction.create({
      data: {
        clientId,
        ...cleanData,
        // Ensure numeric fields are floats
        amount: parseFloat(cleanData.amount || 0),
        paid: parseFloat(cleanData.paid || 0),
        balance: parseFloat(cleanData.amount || 0) - parseFloat(cleanData.paid || 0),
        quantity: cleanData.quantity ? parseFloat(cleanData.quantity) : undefined,
        rate: cleanData.rate ? parseFloat(cleanData.rate) : undefined,
        transactionDate: new Date(cleanData.transactionDate),
        deliveryDate: cleanData.deliveryDate ? new Date(cleanData.deliveryDate) : undefined,
        paymentDate: cleanData.paymentDate ? new Date(cleanData.paymentDate) : undefined,
        billingType: cleanData.billingType || 'FLAT', // Default billing type
        sheetName: cleanData.sheetName ? cleanData.sheetName.toUpperCase() : undefined,
        paymentMode: cleanData.paymentMode ? cleanData.paymentMode : undefined, // Handle empty string
        containerCode: cleanData.containerCode ? cleanData.containerCode : undefined
      }
    });
  },

  // Update transaction
  updateTransaction: async (id, data) => {
     // Prepare data
     const { isNew, id: _id, ...updateData } = data; // Remove isNew and id from payload
     
     if (data.amount || data.paid) {
         // Recalculate balance if amount/paid changes
         // This is complex without current state, simplified:
         // Ideally front-end sends full payload or we allow partials. 
         // For Excel view, usually specific fields update.
         if (data.amount) updateData.amount = parseFloat(data.amount);
         if (data.paid) updateData.paid = parseFloat(data.paid);
         if (data.quantity) updateData.quantity = parseFloat(data.quantity);
         if (data.rate) updateData.rate = parseFloat(data.rate);
         if (data.transactionDate) updateData.transactionDate = new Date(data.transactionDate);
         if (data.deliveryDate) updateData.deliveryDate = new Date(data.deliveryDate);
         if (data.paymentDate) updateData.paymentDate = new Date(data.paymentDate);
     }
     
     // Clean up enums/optional fields
     if (updateData.paymentMode === "") updateData.paymentMode = null;
     if (updateData.containerCode === "") updateData.containerCode = null;
     if (updateData.sheetName) updateData.sheetName = updateData.sheetName.toUpperCase();

     return prisma.clientTransaction.update({
        where: { id },
        data: updateData
     });
  },

  // Delete transaction
  deleteTransaction: async (id) => {
    return prisma.clientTransaction.delete({
      where: { id }
    });
  },

    // Get Suggestion for Containers
    getContainerSuggestions: async (query) => {
        if (!query) return [];
        
        const suggestions = await prisma.clientTransaction.findMany({
            where: {
                containerCode: {
                    contains: query,
                    mode: 'insensitive'
                }
            },
            distinct: ['containerCode'],
            select: { containerCode: true },
            take: 5
        });

        return suggestions.map(s => s.containerCode).filter(Boolean);
    },

    // Get All Containers (for Selection)
    getClientContainers: async (clientId) => {
        // Fetch from Master Container table
        const containers = await prisma.container.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                containerCode: true,
                origin: true,
                loadingDate: true,
                createdAt: true
            }
        });

        // Fetch all transactions for this client to find linked sheet names
        const transactions = await prisma.clientTransaction.findMany({
            where: { clientId },
            select: {
                containerCode: true,
                sheetName: true
            }
        });

        // Map containerCode to sheetName
        const containerToSheet = {};
        transactions.forEach(t => {
            if (t.containerCode && t.sheetName && !containerToSheet[t.containerCode]) {
                containerToSheet[t.containerCode] = t.sheetName;
            }
        });

        // Enforce CAPS on blank sheets and containers
        const blankSheets = await prisma.clientTransaction.findMany({
            where: {
                clientId,
                containerCode: null,
                sheetName: { not: null }
            },
            distinct: ['sheetName'],
            select: {
                sheetName: true,
                createdAt: true
            }
        });
        
        return {
            containers: containers.map(c => ({
                ...c,
                sheetName: containerToSheet[c.containerCode] || null
            })),
            blankSheets: blankSheets.map(s => ({
                id: s.sheetName,
                sheetName: s.sheetName.toUpperCase(),
                createdAt: s.createdAt
            }))
        };
    },

    // Rename sheet
    renameSheet: async (clientId, oldSheetName, newSheetName) => {
        if (!newSheetName) throw new Error("New sheet name is required");
        
        return prisma.clientTransaction.updateMany({
            where: {
                clientId,
                sheetName: oldSheetName
            },
            data: {
                sheetName: newSheetName.toUpperCase()
            }
        });
    }
};

module.exports = AccountClientsService;
