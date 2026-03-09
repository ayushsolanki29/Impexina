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
                { city: { contains: search, mode: "insensitive" } },
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
                    // Get linked containers from transactions and loading sheets
                    transactions: {
                        select: { containerCode: true },
                    },
                    loadingSheets: {
                        select: { container: { select: { containerCode: true } } },
                    }
                },
                orderBy: { createdAt: "desc" },
            }),
            prisma.client.count({ where }),
        ]);

        // Process clients to have a flat list of unique container codes
        const processedClients = clients.map(client => {
            const containerCodes = new Set();
            client.transactions.forEach(t => {
                if (t.containerCode) containerCodes.add(t.containerCode);
            });
            client.loadingSheets.forEach(ls => {
                if (ls.container?.containerCode) containerCodes.add(ls.container.containerCode);
            });

            return {
                ...client,
                transactions: undefined, // Remove from response
                loadingSheets: undefined, // Remove from response
                containerCodes: Array.from(containerCodes)
            };
        });

        return {
            clients: processedClients,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    },

    // Get single client ledger
    getClientLedger: async (clientId, filters = {}) => {
        const { containerCode, sheetName, dateFrom, dateTo, dateType = "transactionDate" } = filters;

        // Map frontend values to Prisma fields
        const dateField = (dateType === "deliveryDate") ? "deliveryDate" :
            (dateType === "paymentDate") ? "paymentDate" : "transactionDate";

        const where = { clientId };
        if (containerCode) where.containerCode = { startsWith: containerCode, mode: 'insensitive' };
        if (sheetName) where.sheetName = sheetName;

        if (dateFrom || dateTo) {
            where[dateField] = {};
            if (dateFrom) where[dateField].gte = new Date(dateFrom);
            if (dateTo) where[dateField].lte = new Date(dateTo);
        }

        // TRF transactions filter
        const trfWhere = { clientId };
        if (sheetName) trfWhere.sheetName = sheetName;

        // TRF transactions only have transactionDate and paymentDate
        const trfDateField = (dateType === "paymentDate") ? "paymentDate" : "transactionDate";

        if ((dateFrom || dateTo) && (dateType !== "deliveryDate" || dateType === "paymentDate" || dateType === "transactionDate")) {
            // Note: If filtering by deliveryDate, TRF txns won't match anything 
            // but we usually filter them by transactionDate in that case or just skip filter.
            // Let's stay safe:
            if (dateType === "deliveryDate") {
                // If they filter specifically by delivery date, maybe they don't want TRF txns?
                // Or maybe they want TRF txns regardless?
                // Let's assume for TRF they still want it filtered by transactionDate if "deliveryDate" is chosen?
                // Actually, if I am filtering a statement by "Delivery Date", maybe TRF transactions should not be filtered (should show all)?
                // Or filtered by their primary date? 
                // Let's filter TRF by transactionDate as a fallback for deliveryDate.
                trfWhere.transactionDate = {};
                if (dateFrom) trfWhere.transactionDate.gte = new Date(dateFrom);
                if (dateTo) trfWhere.transactionDate.lte = new Date(dateTo);
            } else {
                trfWhere[trfDateField] = {};
                if (dateFrom) trfWhere[trfDateField].gte = new Date(dateFrom);
                if (dateTo) trfWhere[trfDateField].lte = new Date(dateTo);
            }
        }

        const client = await prisma.client.findUnique({
            where: { id: clientId },
            include: {
                transactions: {
                    where,
                    orderBy: { transactionDate: 'desc' }
                },
                trfTransactions: {
                    where: trfWhere,
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
                weight: cleanData.weight ? parseFloat(cleanData.weight) : undefined,
                rate: cleanData.rate ? parseFloat(cleanData.rate) : undefined,
                transactionDate: new Date(cleanData.transactionDate),
                deliveryDate: cleanData.deliveryDate ? new Date(cleanData.deliveryDate) : undefined,
                paymentDate: cleanData.paymentDate ? new Date(cleanData.paymentDate) : undefined,
                billingType: cleanData.billingType || 'FLAT', // Default billing type
                sheetName: cleanData.sheetName ? cleanData.sheetName.toUpperCase() : undefined,
                paymentMode: cleanData.paymentMode ? cleanData.paymentMode : undefined, // Handle empty string
                containerCode: cleanData.containerCode ? cleanData.containerCode : undefined,
                from: cleanData.from || undefined,
                to: cleanData.to || undefined
            }
        });
    },

    // Update transaction
    updateTransaction: async (id, data) => {
        // Build update payload with only the fields that are updatable
        // This prevents sending auto-managed fields like createdAt, updatedAt, clientId, etc.
        const updateData = {};

        // String fields
        if (data.containerCode !== undefined) updateData.containerCode = data.containerCode || null;
        if (data.containerMark !== undefined) updateData.containerMark = data.containerMark || null;
        if (data.particulars !== undefined) updateData.particulars = data.particulars;
        if (data.billingType !== undefined) updateData.billingType = data.billingType || 'FLAT';
        if (data.sheetName !== undefined) updateData.sheetName = data.sheetName ? data.sheetName.toUpperCase() : null;
        if (data.paymentMode !== undefined) updateData.paymentMode = data.paymentMode || null;
        if (data.paymentRef !== undefined) updateData.paymentRef = data.paymentRef || null;
        if (data.from !== undefined) updateData.from = data.from || null;
        if (data.to !== undefined) updateData.to = data.to || null;
        if (data.notes !== undefined) updateData.notes = data.notes || null;

        // Numeric fields - always parse to avoid string type errors
        if (data.amount !== undefined) updateData.amount = parseFloat(data.amount) || 0;
        if (data.paid !== undefined) updateData.paid = parseFloat(data.paid) || 0;
        if (data.balance !== undefined) updateData.balance = parseFloat(data.balance) || 0;
        if (data.quantity !== undefined) updateData.quantity = data.quantity ? parseFloat(data.quantity) : null;
        if (data.weight !== undefined) updateData.weight = data.weight ? parseFloat(data.weight) : null;
        if (data.rate !== undefined) updateData.rate = data.rate ? parseFloat(data.rate) : null;

        // Date fields
        if (data.transactionDate) updateData.transactionDate = new Date(data.transactionDate);
        if (data.deliveryDate) updateData.deliveryDate = new Date(data.deliveryDate);
        if (data.paymentDate) updateData.paymentDate = new Date(data.paymentDate);

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

    // Get All Containers (linked with client)
    getClientContainers: async (clientId, filters = {}) => {
        const { origin, dateFrom, dateTo } = filters;

        // 1. Fetch all transactions for this client to find linked container codes and sheet names
        const transactions = await prisma.clientTransaction.findMany({
            where: { clientId },
            select: {
                containerCode: true,
                sheetName: true,
                amount: true,
                paid: true,
                rate: true,
                balance: true
            }
        });

        // Map containerCode to sheetName and collect linked codes
        const containerToSheet = {};
        const linkedCodesFromTxns = new Set();
        // Also compute auto-status per container/sheet
        const workspaceStats = {}; // key -> { totalRows, filledRows, totalAmount, totalPaid }
        transactions.forEach(t => {
            if (t.containerCode) {
                linkedCodesFromTxns.add(t.containerCode);
                if (t.sheetName && !containerToSheet[t.containerCode]) {
                    containerToSheet[t.containerCode] = t.sheetName;
                }
            }
            // Compute stats per workspace key
            const key = t.containerCode || t.sheetName;
            if (key) {
                if (!workspaceStats[key]) {
                    workspaceStats[key] = { totalRows: 0, filledRows: 0, totalAmount: 0, totalPaid: 0 };
                }
                workspaceStats[key].totalRows++;
                workspaceStats[key].totalAmount += (parseFloat(t.amount) || 0);
                workspaceStats[key].totalPaid += (parseFloat(t.paid) || 0);
                // A row is "filled" if it has amount and rate
                if (t.amount && t.rate) {
                    workspaceStats[key].filledRows++;
                }
            }
        });

        // 2. Build where for Master Container - only those linked to this client
        const containerWhere = {
            OR: [
                { loadingSheets: { some: { clientId } } },
                { containerCode: { in: Array.from(linkedCodesFromTxns) } }
            ]
        };

        if (origin) {
            containerWhere.origin = { contains: origin, mode: 'insensitive' };
        }
        if (dateFrom || dateTo) {
            containerWhere.loadingDate = {};
            if (dateFrom) containerWhere.loadingDate.gte = new Date(dateFrom);
            if (dateTo) containerWhere.loadingDate.lte = new Date(dateTo);
        }

        // Fetch linked master containers
        const containers = await prisma.container.findMany({
            where: containerWhere,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                containerCode: true,
                origin: true,
                loadingDate: true,
                createdAt: true
            }
        });

        // Blank sheets where clause
        const blankWhere = {
            clientId,
            containerCode: null,
            sheetName: { not: null }
        };

        if (dateFrom || dateTo) {
            blankWhere.createdAt = {};
            if (dateFrom) blankWhere.createdAt.gte = new Date(dateFrom);
            if (dateTo) blankWhere.createdAt.lte = new Date(dateTo);
        }

        // Enforce CAPS on blank sheets and containers
        let blankSheets = [];
        if (!origin) {
            blankSheets = await prisma.clientTransaction.findMany({
                where: blankWhere,
                distinct: ['sheetName'],
                select: {
                    sheetName: true,
                    createdAt: true
                }
            });
        }

        // Fetch manual statuses for all workspaces
        const manualStatuses = await prisma.clientSheetStatus.findMany({
            where: { clientId }
        });
        const statusMap = {};
        manualStatuses.forEach(s => {
            statusMap[s.sheetKey] = { completed: s.completed, completedAt: s.completedAt, completedBy: s.completedBy };
        });

        // Helper to compute status for a workspace
        const computeStatus = (key) => {
            const manual = statusMap[key];
            if (manual && manual.completed) {
                return { status: 'COMPLETED', manual: true, completedAt: manual.completedAt, completedBy: manual.completedBy };
            }
            const stats = workspaceStats[key];
            if (!stats || stats.totalRows === 0) {
                return { status: 'PENDING', manual: false };
            }
            // Auto-complete: all rows filled + balance is 0
            const balance = stats.totalAmount - stats.totalPaid;
            if (stats.filledRows === stats.totalRows && Math.abs(balance) < 0.01) {
                return { status: 'COMPLETED', manual: false };
            }
            if (stats.filledRows > 0 || stats.totalPaid > 0) {
                return { status: 'IN_PROGRESS', manual: false };
            }
            return { status: 'PENDING', manual: false };
        };

        return {
            containers: containers.map(c => ({
                ...c,
                sheetName: containerToSheet[c.containerCode] || null,
                accountStatus: computeStatus(c.containerCode)
            })),
            blankSheets: blankSheets.map(s => ({
                id: s.sheetName,
                sheetName: s.sheetName.toUpperCase(),
                createdAt: s.createdAt,
                accountStatus: computeStatus(s.sheetName?.toUpperCase())
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
    },

    // ===== TRF Transaction Functions =====

    // Add TRF transaction
    addTrfTransaction: async (clientId, data) => {
        // Validate client exists
        const client = await prisma.client.findUnique({
            where: { id: clientId }
        });
        if (!client) throw new Error("Client not found");

        // Clean data
        const { isNew, id, ...cleanData } = data;

        // Calculate total and balance
        const amount = parseFloat(cleanData.amount || 0);
        const booking = parseFloat(cleanData.booking || 0);
        const rate = parseFloat(cleanData.rate || 0);
        const paid = parseFloat(cleanData.paid || 0);
        const total = rate > 0 ? (amount + booking) * rate : (amount + booking);
        const balance = total - paid;

        return prisma.clientTrfTransaction.create({
            data: {
                clientId,
                particular: cleanData.particular || "",
                amount,
                booking,
                rate,
                total,
                paid,
                balance,
                transactionDate: cleanData.transactionDate ? new Date(cleanData.transactionDate) : new Date(),
                paymentDate: cleanData.paymentDate ? new Date(cleanData.paymentDate) : undefined,
                paymentMode: cleanData.paymentMode || undefined,
                sheetName: cleanData.sheetName ? cleanData.sheetName.toUpperCase() : undefined
            }
        });
    },

    // Update TRF transaction
    updateTrfTransaction: async (id, data) => {
        // Build update payload with only updatable fields (whitelist approach)
        const updateData = {};

        // String fields
        if (data.particular !== undefined) updateData.particular = data.particular || "";
        if (data.paymentMode !== undefined) updateData.paymentMode = data.paymentMode || null;
        if (data.sheetName !== undefined) updateData.sheetName = data.sheetName ? data.sheetName.toUpperCase() : null;

        // Numeric fields - always parse
        if (data.amount !== undefined || data.booking !== undefined || data.rate !== undefined || data.paid !== undefined) {
            const amount = parseFloat(data.amount || 0);
            const booking = parseFloat(data.booking || 0);
            const rate = parseFloat(data.rate || 0);
            const paid = parseFloat(data.paid || 0);

            updateData.amount = amount;
            updateData.booking = booking;
            updateData.rate = rate;
            updateData.paid = paid;
            updateData.total = rate > 0 ? (amount + booking) * rate : (amount + booking);
            updateData.balance = updateData.total - paid;
        }

        // Date fields
        if (data.transactionDate) updateData.transactionDate = new Date(data.transactionDate);
        if (data.paymentDate) updateData.paymentDate = new Date(data.paymentDate);

        return prisma.clientTrfTransaction.update({
            where: { id },
            data: updateData
        });
    },

    // Delete TRF transaction
    deleteTrfTransaction: async (id) => {
        return prisma.clientTrfTransaction.delete({
            where: { id }
        });
    },

    // ===== Sheet Status Functions =====

    // Get status for a workspace
    getSheetStatus: async (clientId, sheetKey) => {
        const status = await prisma.clientSheetStatus.findUnique({
            where: { clientId_sheetKey: { clientId, sheetKey } }
        });
        return status;
    },

    // Toggle status for a workspace
    updateSheetStatus: async (clientId, sheetKey, completed, userName) => {
        return prisma.clientSheetStatus.upsert({
            where: { clientId_sheetKey: { clientId, sheetKey } },
            create: {
                clientId,
                sheetKey,
                completed,
                completedAt: completed ? new Date() : null,
                completedBy: completed ? userName : null
            },
            update: {
                completed,
                completedAt: completed ? new Date() : null,
                completedBy: completed ? userName : null
            }
        });
    }
};

module.exports = AccountClientsService;
