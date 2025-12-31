const { prisma } = require("../../../database/prisma");
const XLSX = require("xlsx");

const mumbaiLedgerService = {
  // Get all ledgers
  getAllLedgers: async ({ page = 1, limit = 20, search = "", status = "" }) => {
    try {
      const skip = (page - 1) * limit;
      
      const where = {};
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }
      
      if (status) {
        where.status = status;
      }
      
      const [ledgers, total] = await Promise.all([
        prisma.mumbaiLedger.findMany({
          where,
          skip,
          take: parseInt(limit),
          include: {
            _count: {
              select: { entries: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.mumbaiLedger.count({ where }),
      ]);
      
      const totalPages = Math.ceil(total / limit);
      
      return {
        ledgers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      console.error("Error getting ledgers:", error);
      throw error;
    }
  },
  
  // Get ledger by ID
  getLedgerById: async (ledgerId) => {
    try {
      const ledger = await prisma.mumbaiLedger.findUnique({
        where: { id: ledgerId },
        include: {
          entries: {
            orderBy: { entryDate: 'desc' },
          },
        },
      });
      
      if (!ledger) {
        throw new Error("Ledger not found");
      }
      
      return ledger;
    } catch (error) {
      console.error("Error getting ledger:", error);
      throw error;
    }
  },
  
  // Create new ledger
  createLedger: async ({ name, description, month, year }, userId) => {
    try {
      // Check if ledger with same name exists
      const existingLedger = await prisma.mumbaiLedger.findFirst({
        where: { name },
      });
      
      if (existingLedger) {
        throw new Error("Ledger with this name already exists");
      }
      
      const ledger = await prisma.mumbaiLedger.create({
        data: {
          name,
          description: description || null,
          month: month ? parseInt(month) : null,
          year: year ? parseInt(year) : null,
          createdBy: userId.toString(),
        },
      });
      
      return ledger;
    } catch (error) {
      console.error("Error creating ledger:", error);
      throw error;
    }
  },
  
  // Update ledger
  updateLedger: async (ledgerId, { name, description, status, isLocked }, userId) => {
    try {
      const ledger = await prisma.mumbaiLedger.findUnique({
        where: { id: ledgerId },
      });
      
      if (!ledger) {
        throw new Error("Ledger not found");
      }
      
      // Check name uniqueness if changed
      if (name && name !== ledger.name) {
        const existingLedger = await prisma.mumbaiLedger.findFirst({
          where: { name, id: { not: ledgerId } },
        });
        
        if (existingLedger) {
          throw new Error("Another ledger with this name already exists");
        }
      }
      
      const updatedLedger = await prisma.mumbaiLedger.update({
        where: { id: ledgerId },
        data: {
          name: name || ledger.name,
          description: description !== undefined ? description : ledger.description,
          status: status || ledger.status,
          isLocked: isLocked !== undefined ? isLocked : ledger.isLocked,
          updatedBy: userId.toString(),
        },
      });
      
      return updatedLedger;
    } catch (error) {
      console.error("Error updating ledger:", error);
      throw error;
    }
  },
  
  // Delete ledger
  deleteLedger: async (ledgerId, userId) => {
    try {
      const ledger = await prisma.mumbaiLedger.findUnique({
        where: { id: ledgerId },
        include: {
          _count: {
            select: { entries: true },
          },
        },
      });
      
      if (!ledger) {
        throw new Error("Ledger not found");
      }
      
      // Soft delete (mark as ARCHIVED) if has entries
      if (ledger._count.entries > 0) {
        const updatedLedger = await prisma.mumbaiLedger.update({
          where: { id: ledgerId },
          data: {
            status: "ARCHIVED",
            updatedBy: userId.toString(),
          },
        });
        
        return {
          message: "Ledger archived (contains entries)",
          type: "archive",
        };
      } else {
        // Hard delete if no entries
        await prisma.mumbaiLedger.delete({
          where: { id: ledgerId },
        });
        
        return {
          message: "Ledger deleted successfully",
          type: "delete",
        };
      }
    } catch (error) {
      console.error("Error deleting ledger:", error);
      throw error;
    }
  },
  
  // Get ledger entries
  getLedgerEntries: async (ledgerId, { 
    type, 
    containerCode, 
    startDate, 
    endDate, 
    page = 1, 
    limit = 50 
  }) => {
    try {
      const skip = (page - 1) * limit;
      
      const where = { ledgerId };
      
      if (type) {
        where.type = type;
      }
      
      if (containerCode) {
        where.containerCode = { contains: containerCode, mode: 'insensitive' };
      }
      
      if (startDate && endDate) {
        where.entryDate = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      }
      
      const [entries, total] = await Promise.all([
        prisma.mumbaiLedgerEntry.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { entryDate: 'desc' },
        }),
        prisma.mumbaiLedgerEntry.count({ where }),
      ]);
      
      const totalPages = Math.ceil(total / limit);
      
      return {
        entries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      console.error("Error getting entries:", error);
      throw error;
    }
  },
  
  // Add entry to ledger
  addEntry: async (ledgerId, entryData, userId) => {
    try {
      const { 
        type, 
        entryDate, 
        containerCode, 
        expenseNote, 
        advanceNote, 
        items, 
        amount 
      } = entryData;
      
      // Validate required fields
      if (!type || !amount) {
        throw new Error("Type and amount are required");
      }
      
      if (type === "EXPENSE" && !containerCode) {
        throw new Error("Container code is required for expense entries");
      }
      
      if (type === "ADVANCE" && !advanceNote) {
        throw new Error("Advance note is required for advance entries");
      }
      
      const result = await prisma.$transaction(async (prisma) => {
        // Create entry
        const entry = await prisma.mumbaiLedgerEntry.create({
          data: {
            ledgerId,
            type,
            entryDate: entryDate ? new Date(entryDate) : new Date(),
            containerCode: containerCode || null,
            expenseNote: expenseNote || null,
            advanceNote: advanceNote || null,
            items: items || [],
            amount: parseFloat(amount),
          },
        });
        
        // Update ledger totals
        const ledger = await prisma.mumbaiLedger.findUnique({
          where: { id: ledgerId },
        });
        
        let newTotalExpense = ledger.totalExpense;
        let newTotalAdvance = ledger.totalAdvance;
        
        if (type === "EXPENSE") {
          newTotalExpense += parseFloat(amount);
        } else if (type === "ADVANCE") {
          newTotalAdvance += parseFloat(amount);
        }
        
        const newTotalBalance = newTotalAdvance - newTotalExpense;
        
        await prisma.mumbaiLedger.update({
          where: { id: ledgerId },
          data: {
            totalExpense: newTotalExpense,
            totalAdvance: newTotalAdvance,
            totalBalance: newTotalBalance,
            updatedBy: userId.toString(),
          },
        });
        
        return entry;
      });
      
      return result;
    } catch (error) {
      console.error("Error adding entry:", error);
      throw error;
    }
  },
  
  // Update entry
  updateEntry: async (entryId, entryData, userId) => {
    try {
      const oldEntry = await prisma.mumbaiLedgerEntry.findUnique({
        where: { id: entryId },
        include: {
          ledger: true,
        },
      });
      
      if (!oldEntry) {
        throw new Error("Entry not found");
      }
      
      const result = await prisma.$transaction(async (prisma) => {
        // Update entry
        const updatedEntry = await prisma.mumbaiLedgerEntry.update({
          where: { id: entryId },
          data: {
            ...entryData,
            amount: entryData.amount ? parseFloat(entryData.amount) : oldEntry.amount,
            items: entryData.items !== undefined ? entryData.items : oldEntry.items,
          },
        });
        
        // Recalculate ledger totals
        const allEntries = await prisma.mumbaiLedgerEntry.findMany({
          where: { ledgerId: oldEntry.ledgerId },
        });
        
        const newTotalExpense = allEntries
          .filter(entry => entry.type === "EXPENSE")
          .reduce((sum, entry) => sum + entry.amount, 0);
        
        const newTotalAdvance = allEntries
          .filter(entry => entry.type === "ADVANCE")
          .reduce((sum, entry) => sum + entry.amount, 0);
        
        const newTotalBalance = newTotalAdvance - newTotalExpense;
        
        await prisma.mumbaiLedger.update({
          where: { id: oldEntry.ledgerId },
          data: {
            totalExpense: newTotalExpense,
            totalAdvance: newTotalAdvance,
            totalBalance: newTotalBalance,
            updatedBy: userId.toString(),
          },
        });
        
        return updatedEntry;
      });
      
      return result;
    } catch (error) {
      console.error("Error updating entry:", error);
      throw error;
    }
  },
  
  // Delete entry
  deleteEntry: async (entryId, userId) => {
    try {
      const entry = await prisma.mumbaiLedgerEntry.findUnique({
        where: { id: entryId },
        include: {
          ledger: true,
        },
      });
      
      if (!entry) {
        throw new Error("Entry not found");
      }
      
      const result = await prisma.$transaction(async (prisma) => {
        // Delete entry
        await prisma.mumbaiLedgerEntry.delete({
          where: { id: entryId },
        });
        
        // Recalculate ledger totals
        const allEntries = await prisma.mumbaiLedgerEntry.findMany({
          where: { ledgerId: entry.ledgerId },
        });
        
        const newTotalExpense = allEntries
          .filter(e => e.type === "EXPENSE")
          .reduce((sum, e) => sum + e.amount, 0);
        
        const newTotalAdvance = allEntries
          .filter(e => e.type === "ADVANCE")
          .reduce((sum, e) => sum + e.amount, 0);
        
        const newTotalBalance = newTotalAdvance - newTotalExpense;
        
        await prisma.mumbaiLedger.update({
          where: { id: entry.ledgerId },
          data: {
            totalExpense: newTotalExpense,
            totalAdvance: newTotalAdvance,
            totalBalance: newTotalBalance,
            updatedBy: userId.toString(),
          },
        });
        
        return {
          message: "Entry deleted successfully",
        };
      });
      
      return result;
    } catch (error) {
      console.error("Error deleting entry:", error);
      throw error;
    }
  },
  
  // Get dashboard stats
  getDashboardStats: async () => {
    try {
      const [totalLedgers, activeLedgers, totalEntries, recentEntries] = await Promise.all([
        prisma.mumbaiLedger.count(),
        prisma.mumbaiLedger.count({ where: { status: "ACTIVE" } }),
        prisma.mumbaiLedgerEntry.count(),
        prisma.mumbaiLedgerEntry.count({
          where: {
            entryDate: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);
      
      // Get top 5 containers with most expenses
      const topContainers = await prisma.mumbaiLedgerEntry.groupBy({
        by: ['containerCode'],
        where: {
          type: "EXPENSE",
          containerCode: { not: null },
        },
        _sum: {
          amount: true,
        },
        orderBy: {
          _sum: {
            amount: 'desc',
          },
        },
        take: 5,
      });
      
      // Get monthly totals for last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const monthlyTotals = await prisma.mumbaiLedgerEntry.groupBy({
        by: ['type'],
        where: {
          entryDate: {
            gte: sixMonthsAgo,
          },
        },
        _sum: {
          amount: true,
        },
      });
      
      const expenseTotal = monthlyTotals.find(t => t.type === "EXPENSE")?._sum.amount || 0;
      const advanceTotal = monthlyTotals.find(t => t.type === "ADVANCE")?._sum.amount || 0;
      const balance = advanceTotal - expenseTotal;
      
      return {
        totalLedgers,
        activeLedgers,
        totalEntries,
        recentEntries,
        expenseTotal,
        advanceTotal,
        balance,
        topContainers: topContainers.map(container => ({
          containerCode: container.containerCode,
          totalExpense: container._sum.amount,
        })),
      };
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      throw error;
    }
  },
  
  // Export ledger to Excel
  exportLedger: async (ledgerId) => {
    try {
      const ledger = await prisma.mumbaiLedger.findUnique({
        where: { id: ledgerId },
        include: {
          entries: {
            orderBy: { entryDate: 'desc' },
          },
        },
      });
      
      if (!ledger) {
        throw new Error("Ledger not found");
      }
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Entries sheet
      const entriesData = ledger.entries.map((entry, index) => ({
        "S.No": index + 1,
        "Date": new Date(entry.entryDate).toLocaleDateString(),
        "Type": entry.type,
        "Container Code": entry.containerCode || "",
        "Expense Note": entry.expenseNote || "",
        "Advance Note": entry.advanceNote || "",
        "Items": JSON.stringify(entry.items || []),
        "Amount": entry.amount,
        "Created": new Date(entry.createdAt).toLocaleString(),
      }));
      
      const entriesSheet = XLSX.utils.json_to_sheet(entriesData);
      XLSX.utils.book_append_sheet(workbook, entriesSheet, "Entries");
      
      // Summary sheet
      const summaryData = [
        {
          "Ledger Name": ledger.name,
          "Description": ledger.description || "",
          "Total Expense": ledger.totalExpense,
          "Total Advance": ledger.totalAdvance,
          "Net Balance": ledger.totalBalance,
          "Total Entries": ledger.entries.length,
          "Status": ledger.status,
          "Created": new Date(ledger.createdAt).toLocaleDateString(),
          "Updated": new Date(ledger.updatedAt).toLocaleDateString(),
        },
      ];
      
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
      
      // Write to buffer
      const excelBuffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
      });
      
      return excelBuffer;
    } catch (error) {
      console.error("Error exporting ledger:", error);
      throw error;
    }
  },
  
  // Duplicate ledger
  duplicateLedger: async (ledgerId, name, userId) => {
    try {
      const ledger = await prisma.mumbaiLedger.findUnique({
        where: { id: ledgerId },
        include: {
          entries: true,
        },
      });
      
      if (!ledger) {
        throw new Error("Ledger not found");
      }
      
      const newLedgerName = name || `${ledger.name} (Copy)`;
      
      // Check if name already exists
      const existingLedger = await prisma.mumbaiLedger.findFirst({
        where: { name: newLedgerName },
      });
      
      if (existingLedger) {
        throw new Error("A ledger with this name already exists");
      }
      
      const result = await prisma.$transaction(async (prisma) => {
        // Create new ledger
        const newLedger = await prisma.mumbaiLedger.create({
          data: {
            name: newLedgerName,
            description: ledger.description,
            month: ledger.month,
            year: ledger.year,
            status: "ACTIVE",
            isLocked: false,
            totalExpense: 0,
            totalAdvance: 0,
            totalBalance: 0,
            createdBy: userId.toString(),
          },
        });
        
        // Duplicate entries
        if (ledger.entries.length > 0) {
          const entryPromises = ledger.entries.map(entry =>
            prisma.mumbaiLedgerEntry.create({
              data: {
                ledgerId: newLedger.id,
                type: entry.type,
                entryDate: entry.entryDate,
                containerCode: entry.containerCode,
                expenseNote: entry.expenseNote,
                advanceNote: entry.advanceNote,
                items: entry.items,
                amount: entry.amount,
              },
            })
          );
          
          await Promise.all(entryPromises);
        }
        
        return newLedger;
      });
      
      return result;
    } catch (error) {
      console.error("Error duplicating ledger:", error);
      throw error;
    }
  },
  
  // Get container suggestions
  getContainerSuggestions: async (search = "") => {
    try {
      const suggestions = await prisma.mumbaiLedgerEntry.findMany({
        where: {
          containerCode: {
            contains: search,
            mode: 'insensitive',
          },
          containerCode: { not: null },
        },
        select: {
          containerCode: true,
        },
        distinct: ['containerCode'],
        orderBy: { containerCode: 'asc' },
        take: 10,
      });
      
      return suggestions.map(s => s.containerCode).filter(Boolean);
    } catch (error) {
      console.error("Error getting container suggestions:", error);
      throw error;
    }
  },
};

module.exports = mumbaiLedgerService;