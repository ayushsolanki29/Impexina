const { prisma } = require("../../../database/prisma");
const XLSX = require("xlsx");

const ahmedabadPettyCashService = {
  // Get all sheets
  getAllSheets: async ({ page = 1, limit = 20, search = "", status = "" }) => {
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
      
      const [sheets, total] = await Promise.all([
        prisma.ahmedabadPettyCash.findMany({
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
        prisma.ahmedabadPettyCash.count({ where }),
      ]);
      
      const totalPages = Math.ceil(total / limit);
      
      return {
        sheets,
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
      console.error("Error getting sheets:", error);
      throw error;
    }
  },
  
  // Get sheet by ID
  getSheetById: async (sheetId) => {
    try {
      const sheet = await prisma.ahmedabadPettyCash.findUnique({
        where: { id: sheetId },
        include: {
          entries: {
            orderBy: { entryDate: 'desc' },
          },
        },
      });
      
      if (!sheet) {
        throw new Error("Sheet not found");
      }
      
      return sheet;
    } catch (error) {
      console.error("Error getting sheet:", error);
      throw error;
    }
  },
  
  // Create new sheet
  createSheet: async ({ name, description, openingBalance, month, year }, userId) => {
    try {
      // Check if sheet with same name exists
      const existingSheet = await prisma.ahmedabadPettyCash.findFirst({
        where: { name },
      });
      
      if (existingSheet) {
        throw new Error("Sheet with this name already exists");
      }
      
      const sheet = await prisma.ahmedabadPettyCash.create({
        data: {
          name,
          description: description || null,
          openingBalance: parseFloat(openingBalance) || 0,
          closingBalance: parseFloat(openingBalance) || 0,
          month: month ? parseInt(month) : null,
          year: year ? parseInt(year) : null,
          createdBy: userId?.toString(),
        },
      });
      
      return sheet;
    } catch (error) {
      console.error("Error creating sheet:", error);
      throw error;
    }
  },
  
  // Update sheet
  updateSheet: async (sheetId, { name, description, openingBalance, status, isLocked }, userId) => {
    try {
      const sheet = await prisma.ahmedabadPettyCash.findUnique({
        where: { id: sheetId },
      });
      
      if (!sheet) {
        throw new Error("Sheet not found");
      }
      
      // Check name uniqueness if changed
      if (name && name !== sheet.name) {
        const existingSheet = await prisma.ahmedabadPettyCash.findFirst({
          where: { name, id: { not: sheetId } },
        });
        
        if (existingSheet) {
          throw new Error("Another sheet with this name already exists");
        }
      }
      
      // Recalculate closing balance if opening balance changed
      let closingBalance = sheet.closingBalance;
      if (openingBalance !== undefined && openingBalance !== sheet.openingBalance) {
        const balanceDiff = parseFloat(openingBalance) - sheet.openingBalance;
        closingBalance = sheet.closingBalance + balanceDiff;
      }
      
      const updatedSheet = await prisma.ahmedabadPettyCash.update({
        where: { id: sheetId },
        data: {
          name: name || sheet.name,
          description: description !== undefined ? description : sheet.description,
          openingBalance: openingBalance !== undefined ? parseFloat(openingBalance) : sheet.openingBalance,
          closingBalance,
          status: status || sheet.status,
          isLocked: isLocked !== undefined ? isLocked : sheet.isLocked,
          updatedBy: userId?.toString(),
        },
      });
      
      return updatedSheet;
    } catch (error) {
      console.error("Error updating sheet:", error);
      throw error;
    }
  },
  
  // Delete sheet
  deleteSheet: async (sheetId, userId) => {
    try {
      const sheet = await prisma.ahmedabadPettyCash.findUnique({
        where: { id: sheetId },
        include: {
          _count: {
            select: { entries: true },
          },
        },
      });
      
      if (!sheet) {
        throw new Error("Sheet not found");
      }
      
      // Soft delete (mark as ARCHIVED) if has entries
      if (sheet._count.entries > 0) {
        const updatedSheet = await prisma.ahmedabadPettyCash.update({
          where: { id: sheetId },
          data: {
            status: "ARCHIVED",
            updatedBy: userId?.toString(),
          },
        });
        
        return {
          message: "Sheet archived (contains entries)",
          type: "archive",
        };
      } else {
        // Hard delete if no entries
        await prisma.ahmedabadPettyCash.delete({
          where: { id: sheetId },
        });
        
        return {
          message: "Sheet deleted successfully",
          type: "delete",
        };
      }
    } catch (error) {
      console.error("Error deleting sheet:", error);
      throw error;
    }
  },
  
  // Get sheet entries
  getSheetEntries: async (sheetId, { 
    type, 
    startDate, 
    endDate, 
    search, 
    page = 1, 
    limit = 50 
  }) => {
    try {
      const skip = (page - 1) * limit;
      
      const where = { sheetId };
      
      if (type) {
        where.type = type;
      }
      
      if (startDate && endDate) {
        where.entryDate = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      }
      
      if (search) {
        where.OR = [
          { particular: { contains: search, mode: 'insensitive' } },
          { contCode: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
        ];
      }
      
      const [entries, total] = await Promise.all([
        prisma.ahmedabadPettyCashEntry.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { entryDate: 'desc' },
        }),
        prisma.ahmedabadPettyCashEntry.count({ where }),
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
  
  // Add entry to sheet
  addEntry: async (sheetId, entryData, userId) => {
    try {
      const { 
        type, 
        entryDate, 
        particular, 
        contCode, 
        mode, 
        credit, 
        debit, 
        notes 
      } = entryData;
      
      // Validate required fields
      if (!type || !particular) {
        throw new Error("Type and particular are required");
      }
      
      if (type === "CREDIT" && (!credit || parseFloat(credit) <= 0)) {
        throw new Error("Valid credit amount is required for CREDIT entries");
      }
      
      if (type === "DEBIT" && (!debit || parseFloat(debit) <= 0)) {
        throw new Error("Valid debit amount is required for DEBIT entries");
      }
      
      const result = await prisma.$transaction(async (prisma) => {
        // Create entry
        const entry = await prisma.ahmedabadPettyCashEntry.create({
          data: {
            sheetId,
            type,
            entryDate: entryDate ? new Date(entryDate) : new Date(),
            particular,
            contCode: contCode || null,
            mode: mode || "Cash",
            credit: type === "CREDIT" ? parseFloat(credit) : 0,
            debit: type === "DEBIT" ? parseFloat(debit) : 0,
            notes: notes || null,
            createdBy: userId?.toString(),
          },
        });
        
        // Update sheet totals
        const sheet = await prisma.ahmedabadPettyCash.findUnique({
          where: { id: sheetId },
        });
        
        const newTotalCredit = sheet.totalCredit + (type === "CREDIT" ? parseFloat(credit) : 0);
        const newTotalDebit = sheet.totalDebit + (type === "DEBIT" ? parseFloat(debit) : 0);
        const newClosingBalance = sheet.openingBalance + newTotalCredit - newTotalDebit;
        
        await prisma.ahmedabadPettyCash.update({
          where: { id: sheetId },
          data: {
            totalCredit: newTotalCredit,
            totalDebit: newTotalDebit,
            closingBalance: newClosingBalance,
            updatedBy: userId?.toString(),
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
      const oldEntry = await prisma.ahmedabadPettyCashEntry.findUnique({
        where: { id: entryId },
        include: {
          sheet: true,
        },
      });
      
      if (!oldEntry) {
        throw new Error("Entry not found");
      }
      
      const result = await prisma.$transaction(async (prisma) => {
        // Update entry
        const updatedEntry = await prisma.ahmedabadPettyCashEntry.update({
          where: { id: entryId },
          data: {
            ...entryData,
            credit: entryData.credit ? parseFloat(entryData.credit) : oldEntry.credit,
            debit: entryData.debit ? parseFloat(entryData.debit) : oldEntry.debit,
          },
        });
        
        // Recalculate sheet totals
        const allEntries = await prisma.ahmedabadPettyCashEntry.findMany({
          where: { sheetId: oldEntry.sheet.id },
        });
        
        const newTotalCredit = allEntries
          .filter(entry => entry.type === "CREDIT")
          .reduce((sum, entry) => sum + entry.credit, 0);
        
        const newTotalDebit = allEntries
          .filter(entry => entry.type === "DEBIT")
          .reduce((sum, entry) => sum + entry.debit, 0);
        
        const newClosingBalance = oldEntry.sheet.openingBalance + newTotalCredit - newTotalDebit;
        
        await prisma.ahmedabadPettyCash.update({
          where: { id: oldEntry.sheet.id },
          data: {
            totalCredit: newTotalCredit,
            totalDebit: newTotalDebit,
            closingBalance: newClosingBalance,
            updatedBy: userId?.toString(),
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
      const entry = await prisma.ahmedabadPettyCashEntry.findUnique({
        where: { id: entryId },
        include: {
          sheet: true,
        },
      });
      
      if (!entry) {
        throw new Error("Entry not found");
      }
      
      const result = await prisma.$transaction(async (prisma) => {
        // Delete entry
        await prisma.ahmedabadPettyCashEntry.delete({
          where: { id: entryId },
        });
        
        // Recalculate sheet totals
        const allEntries = await prisma.ahmedabadPettyCashEntry.findMany({
          where: { sheetId: entry.sheet.id },
        });
        
        const newTotalCredit = allEntries
          .filter(e => e.type === "CREDIT")
          .reduce((sum, e) => sum + e.credit, 0);
        
        const newTotalDebit = allEntries
          .filter(e => e.type === "DEBIT")
          .reduce((sum, e) => sum + e.debit, 0);
        
        const newClosingBalance = entry.sheet.openingBalance + newTotalCredit - newTotalDebit;
        
        await prisma.ahmedabadPettyCash.update({
          where: { id: entry.sheet.id },
          data: {
            totalCredit: newTotalCredit,
            totalDebit: newTotalDebit,
            closingBalance: newClosingBalance,
            updatedBy: userId?.toString(),
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
      const [totalSheets, activeSheets, totalEntries, recentEntries] = await Promise.all([
        prisma.ahmedabadPettyCash.count(),
        prisma.ahmedabadPettyCash.count({ where: { status: "ACTIVE" } }),
        prisma.ahmedabadPettyCashEntry.count(),
        prisma.ahmedabadPettyCashEntry.count({
          where: {
            entryDate: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);
      
      // Get latest sheet
      const latestSheet = await prisma.ahmedabadPettyCash.findFirst({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: 'desc' },
      });
      
      // Get recent high-value transactions
      const recentHighValue = await prisma.ahmedabadPettyCashEntry.findMany({
        where: {
          OR: [
            { credit: { gt: 5000 } },
            { debit: { gt: 5000 } },
          ],
        },
        orderBy: { entryDate: 'desc' },
        take: 5,
        include: {
          sheet: {
            select: { name: true },
          },
        },
      });
      
      return {
        totalSheets,
        activeSheets,
        totalEntries,
        recentEntries,
        latestSheet,
        recentHighValue: recentHighValue.map(entry => ({
          id: entry.id,
          particular: entry.particular,
          type: entry.type,
          amount: entry.type === "CREDIT" ? entry.credit : entry.debit,
          sheetName: entry.sheet.name,
          date: entry.entryDate,
        })),
      };
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      throw error;
    }
  },
  
  // Export sheet to Excel
  exportSheet: async (sheetId) => {
    try {
      const sheet = await prisma.ahmedabadPettyCash.findUnique({
        where: { id: sheetId },
        include: {
          entries: {
            orderBy: { entryDate: 'desc' },
          },
        },
      });
      
      if (!sheet) {
        throw new Error("Sheet not found");
      }
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Entries sheet
      const entriesData = sheet.entries.map((entry, index) => ({
        "S.No": index + 1,
        "Date": new Date(entry.entryDate).toLocaleDateString(),
        "Type": entry.type,
        "Particular": entry.particular,
        "Container Code": entry.contCode || "",
        "Mode": entry.mode,
        "Credit": entry.credit || 0,
        "Debit": entry.debit || 0,
        "Notes": entry.notes || "",
        "Created": new Date(entry.createdAt).toLocaleString(),
      }));
      
      const entriesSheet = XLSX.utils.json_to_sheet(entriesData);
      XLSX.utils.book_append_sheet(workbook, entriesSheet, "Transactions");
      
      // Summary sheet
      const summaryData = [
        {
          "Sheet Name": sheet.name,
          "Description": sheet.description || "",
          "Opening Balance": sheet.openingBalance,
          "Total Credit": sheet.totalCredit,
          "Total Debit": sheet.totalDebit,
          "Closing Balance": sheet.closingBalance,
          "Total Transactions": sheet.entries.length,
          "Status": sheet.status,
          "Created": new Date(sheet.createdAt).toLocaleDateString(),
          "Updated": new Date(sheet.updatedAt).toLocaleDateString(),
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
      console.error("Error exporting sheet:", error);
      throw error;
    }
  },
  
  // Duplicate sheet
  duplicateSheet: async (sheetId, name, userId) => {
    try {
      const sheet = await prisma.ahmedabadPettyCash.findUnique({
        where: { id: sheetId },
        include: {
          entries: true,
        },
      });
      
      if (!sheet) {
        throw new Error("Sheet not found");
      }
      
      const newSheetName = name || `${sheet.name} (Copy)`;
      
      // Check if name already exists
      const existingSheet = await prisma.ahmedabadPettyCash.findFirst({
        where: { name: newSheetName },
      });
      
      if (existingSheet) {
        throw new Error("A sheet with this name already exists");
      }
      
      const result = await prisma.$transaction(async (prisma) => {
        // Create new sheet
        const newSheet = await prisma.ahmedabadPettyCash.create({
          data: {
            name: newSheetName,
            description: sheet.description,
            openingBalance: sheet.openingBalance,
            closingBalance: sheet.openingBalance, // Start with opening balance only
            month: sheet.month,
            year: sheet.year,
            status: "ACTIVE",
            isLocked: false,
            createdBy: userId?.toString(),
          },
        });
        
        // Duplicate entries
        if (sheet.entries.length > 0) {
          const entryPromises = sheet.entries.map(entry =>
            prisma.ahmedabadPettyCashEntry.create({
              data: {
                sheetId: newSheet.id,
                type: entry.type,
                entryDate: entry.entryDate,
                particular: entry.particular,
                contCode: entry.contCode,
                mode: entry.mode,
                credit: entry.credit,
                debit: entry.debit,
                notes: entry.notes,
                createdBy: userId?.toString(),
              },
            })
          );
          
          await Promise.all(entryPromises);
        }
        
        return newSheet;
      });
      
      return result;
    } catch (error) {
      console.error("Error duplicating sheet:", error);
      throw error;
    }
  },
  
  // Get container code suggestions
  getContainerCodeSuggestions: async (search = "") => {
    try {
      const suggestions = await prisma.ahmedabadPettyCashEntry.findMany({
        where: {
          contCode: {
            contains: search,
            mode: 'insensitive',
          },
          contCode: { not: null },
        },
        select: {
          contCode: true,
        },
        distinct: ['contCode'],
        orderBy: { contCode: 'asc' },
        take: 10,
      });
      
      return suggestions.map(s => s.contCode).filter(Boolean);
    } catch (error) {
      console.error("Error getting container code suggestions:", error);
      throw error;
    }
  },
};

module.exports = ahmedabadPettyCashService;