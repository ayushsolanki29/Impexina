const { prisma } = require("../../../database/prisma");
const XLSX = require("xlsx");

const davidSheetService = {
  // Generate default sheet name
  generateDefaultName: () => {
    const now = new Date();
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `David Forex - ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  },

  // Get all sheets with pagination
  getAllSheets: async ({ page = 1, limit = 20, search = "", status, tags }) => {
    try {
      const skip = (page - 1) * limit;
      
      const where = {};
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } },
        ];
      }
      
      if (status) {
        where.status = status;
      }
      
      if (tags && Array.isArray(tags)) {
        where.tags = { hasEvery: tags };
      } else if (tags) {
        where.tags = { has: tags };
      }
      
      const [sheets, total] = await Promise.all([
        prisma.davidSheet.findMany({
          where,
          skip,
          take: parseInt(limit),
          include: {
            _count: {
              select: { entries: true },
            },
            entries: {
              select: {
                debitRMB: true,
                creditRMB: true,
                debitUSD: true,
                creditUSD: true,
              },
              take: 5, // Just for summary calculation
            },
          },
          orderBy: [
            { updatedAt: 'desc' },
          ],
        }),
        prisma.davidSheet.count({ where }),
      ]);
      
      // Calculate summary for each sheet
      const sheetsWithSummary = sheets.map(sheet => {
        const totals = sheet.entries.reduce(
          (acc, entry) => ({
            totalDebitRMB: acc.totalDebitRMB + (entry.debitRMB || 0),
            totalCreditRMB: acc.totalCreditRMB + (entry.creditRMB || 0),
            totalDebitUSD: acc.totalDebitUSD + (entry.debitUSD || 0),
            totalCreditUSD: acc.totalCreditUSD + (entry.creditUSD || 0),
          }),
          { totalDebitRMB: 0, totalCreditRMB: 0, totalDebitUSD: 0, totalCreditUSD: 0 }
        );
        
        const netRMB = totals.totalDebitRMB - totals.totalCreditRMB;
        const netUSD = totals.totalDebitUSD - totals.totalCreditUSD;
        
        return {
          ...sheet,
          summary: {
            ...totals,
            netRMB,
            netUSD,
            entryCount: sheet._count.entries,
          },
        };
      });
      
      const totalPages = Math.ceil(total / limit);
      
      return {
        sheets: sheetsWithSummary,
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
      console.error("Error getting David sheets:", error);
      throw error;
    }
  },
  
  // Get sheet by ID with entries
  getSheetById: async (sheetId) => {
    try {
      const sheet = await prisma.davidSheet.findUnique({
        where: { id: sheetId },
        include: {
          entries: {
            orderBy: { date: 'desc' },
          },
          _count: {
            select: { entries: true },
          },
        },
      });
      
      if (!sheet) {
        throw new Error("Sheet not found");
      }
      
      // Calculate totals
      const totals = sheet.entries.reduce(
        (acc, entry) => ({
          totalDebitRMB: acc.totalDebitRMB + (entry.debitRMB || 0),
          totalCreditRMB: acc.totalCreditRMB + (entry.creditRMB || 0),
          totalDebitUSD: acc.totalDebitUSD + (entry.debitUSD || 0),
          totalCreditUSD: acc.totalCreditUSD + (entry.creditUSD || 0),
        }),
        { totalDebitRMB: 0, totalCreditRMB: 0, totalDebitUSD: 0, totalCreditUSD: 0 }
      );
      
      const netRMB = totals.totalDebitRMB - totals.totalCreditRMB;
      const netUSD = totals.totalDebitUSD - totals.totalCreditUSD;
      
      return {
        ...sheet,
        totals: {
          ...totals,
          netRMB,
          netUSD,
        },
      };
    } catch (error) {
      console.error("Error getting David sheet:", error);
      throw error;
    }
  },
  
  // Create new sheet with default name
  createSheet: async (sheetData, userId) => {
    try {
      const { name, description, tags = [], currencyTypes = ["RMB", "USD"] } = sheetData;
      
      // Generate default name if not provided
      let finalName = name;
      if (!finalName) {
        finalName = davidSheetService.generateDefaultName();
      }
      
      // Check if name already exists
      const existingSheet = await prisma.davidSheet.findUnique({
        where: { name: finalName },
      });
      
      if (existingSheet) {
        // Append number if name exists
        let counter = 1;
        let newName = `${finalName} (${counter})`;
        while (await prisma.davidSheet.findUnique({ where: { name: newName } })) {
          counter++;
          newName = `${finalName} (${counter})`;
        }
        finalName = newName;
      }
      
      const sheet = await prisma.davidSheet.create({
        data: {
          name: finalName,
          description: description || null,
          currencyTypes: currencyTypes || ["RMB", "USD"],
          tags: tags || [],
          status: 'ACTIVE',
          createdBy: userId.toString(),
        },
      });
      
      return sheet;
    } catch (error) {
      console.error("Error creating David sheet:", error);
      throw error;
    }
  },
  
  // Update sheet details
  updateSheet: async (sheetId, sheetData, userId) => {
    try {
      const { name, description, status, isLocked, tags, currencyTypes } = sheetData;
      
      // If updating name, check uniqueness
      if (name) {
        const existingSheet = await prisma.davidSheet.findFirst({
          where: {
            name,
            NOT: { id: sheetId },
          },
        });
        
        if (existingSheet) {
          throw new Error("Sheet with this name already exists");
        }
      }
      
      const sheet = await prisma.davidSheet.update({
        where: { id: sheetId },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(status && { status }),
          ...(isLocked !== undefined && { isLocked }),
          ...(tags && { tags }),
          ...(currencyTypes && { currencyTypes }),
          updatedBy: userId.toString(),
          updatedAt: new Date(),
        },
      });
      
      return sheet;
    } catch (error) {
      console.error("Error updating David sheet:", error);
      throw error;
    }
  },
  
  // Delete sheet (soft delete by changing status to ARCHIVED)
  deleteSheet: async (sheetId, userId) => {
    try {
      const sheet = await prisma.davidSheet.update({
        where: { id: sheetId },
        data: {
          status: 'ARCHIVED',
          updatedBy: userId.toString(),
          updatedAt: new Date(),
        },
      });
      
      return {
        message: "Sheet archived successfully",
        sheet,
      };
    } catch (error) {
      console.error("Error deleting David sheet:", error);
      throw error;
    }
  },
  
  // Get sheet entries
  getSheetEntries: async (sheetId, { page = 1, limit = 50, search = "" }) => {
    try {
      const skip = (page - 1) * limit;
      
      const where = {
        sheetId,
      };
      
      if (search) {
        where.particulars = { contains: search, mode: 'insensitive' };
      }
      
      const [entries, total] = await Promise.all([
        prisma.davidSheetEntry.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: [
            { date: 'desc' },
            { createdAt: 'desc' },
          ],
        }),
        prisma.davidSheetEntry.count({ where }),
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
      console.error("Error getting David sheet entries:", error);
      throw error;
    }
  },
  
  // Add entry to sheet
  addEntry: async (sheetId, entryData, userId) => {
    try {
      const {
        date,
        particulars,
        debitRMB = 0,
        creditRMB = 0,
        debitUSD = 0,
        creditUSD = 0,
      } = entryData;
      
      // Validate amounts
      const finalDebitRMB = parseFloat(debitRMB) || 0;
      const finalCreditRMB = parseFloat(creditRMB) || 0;
      const finalDebitUSD = parseFloat(debitUSD) || 0;
      const finalCreditUSD = parseFloat(creditUSD) || 0;
      
      const entry = await prisma.davidSheetEntry.create({
        data: {
          sheetId,
          date: date ? new Date(date) : new Date(),
          particulars: particulars || "",
          debitRMB: finalDebitRMB,
          creditRMB: finalCreditRMB,
          debitUSD: finalDebitUSD,
          creditUSD: finalCreditUSD,
          totalDebitRMB: finalDebitRMB,
          totalCreditRMB: finalCreditRMB,
          totalDebitUSD: finalDebitUSD,
          totalCreditUSD: finalCreditUSD,
          isBalanced: (finalDebitRMB >= 0 && finalCreditRMB >= 0 && finalDebitUSD >= 0 && finalCreditUSD >= 0),
          createdBy: userId.toString(),
        },
      });
      
      return entry;
    } catch (error) {
      console.error("Error adding David sheet entry:", error);
      throw error;
    }
  },
  
  // Update entry
  updateEntry: async (entryId, entryData, userId) => {
    try {
      const {
        date,
        particulars,
        debitRMB,
        creditRMB,
        debitUSD,
        creditUSD,
      } = entryData;
      
      // Convert to numbers
      const finalDebitRMB = debitRMB !== undefined ? (parseFloat(debitRMB) || 0) : undefined;
      const finalCreditRMB = creditRMB !== undefined ? (parseFloat(creditRMB) || 0) : undefined;
      const finalDebitUSD = debitUSD !== undefined ? (parseFloat(debitUSD) || 0) : undefined;
      const finalCreditUSD = creditUSD !== undefined ? (parseFloat(creditUSD) || 0) : undefined;
      
      const updateData = {
        ...(date !== undefined && { date: date ? new Date(date) : new Date() }),
        ...(particulars !== undefined && { particulars }),
        ...(finalDebitRMB !== undefined && { debitRMB: finalDebitRMB }),
        ...(finalCreditRMB !== undefined && { creditRMB: finalCreditRMB }),
        ...(finalDebitUSD !== undefined && { debitUSD: finalDebitUSD }),
        ...(finalCreditUSD !== undefined && { creditUSD: finalCreditUSD }),
        updatedBy: userId.toString(),
        updatedAt: new Date(),
      };
      
      // Update calculated totals
      if (finalDebitRMB !== undefined) updateData.totalDebitRMB = finalDebitRMB;
      if (finalCreditRMB !== undefined) updateData.totalCreditRMB = finalCreditRMB;
      if (finalDebitUSD !== undefined) updateData.totalDebitUSD = finalDebitUSD;
      if (finalCreditUSD !== undefined) updateData.totalCreditUSD = finalCreditUSD;
      
      const entry = await prisma.davidSheetEntry.update({
        where: { id: entryId },
        data: updateData,
      });
      
      return entry;
    } catch (error) {
      console.error("Error updating David sheet entry:", error);
      throw error;
    }
  },
  
  // Delete entry
  deleteEntry: async (entryId, userId) => {
    try {
      await prisma.davidSheetEntry.delete({
        where: { id: entryId },
      });
      
      return {
        message: "Entry deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting David sheet entry:", error);
      throw error;
    }
  },
  
  // Bulk import entries
  importEntries: async (sheetId, entriesData, userId) => {
    try {
      if (!Array.isArray(entriesData) || entriesData.length === 0) {
        throw new Error("Entries data must be a non-empty array");
      }
      
      const entries = await prisma.$transaction(
        entriesData.map(entryData => {
          const {
            date,
            particulars,
            debitRMB = 0,
            creditRMB = 0,
            debitUSD = 0,
            creditUSD = 0,
          } = entryData;
          
          const finalDebitRMB = parseFloat(debitRMB) || 0;
          const finalCreditRMB = parseFloat(creditRMB) || 0;
          const finalDebitUSD = parseFloat(debitUSD) || 0;
          const finalCreditUSD = parseFloat(creditUSD) || 0;
          
          return prisma.davidSheetEntry.create({
            data: {
              sheetId,
              date: date ? new Date(date) : new Date(),
              particulars: particulars || "",
              debitRMB: finalDebitRMB,
              creditRMB: finalCreditRMB,
              debitUSD: finalDebitUSD,
              creditUSD: finalCreditUSD,
              totalDebitRMB: finalDebitRMB,
              totalCreditRMB: finalCreditRMB,
              totalDebitUSD: finalDebitUSD,
              totalCreditUSD: finalCreditUSD,
              isBalanced: (finalDebitRMB >= 0 && finalCreditRMB >= 0 && finalDebitUSD >= 0 && finalCreditUSD >= 0),
              createdBy: userId.toString(),
            },
          });
        })
      );
      
      return {
        message: `${entries.length} entries imported successfully`,
        entries,
      };
    } catch (error) {
      console.error("Error importing David sheet entries:", error);
      throw error;
    }
  },
  
  // Bulk update entries (for saving entire sheet)
  bulkUpdateEntries: async (sheetId, entriesData, userId) => {
    try {
      // First, delete all existing entries
      await prisma.davidSheetEntry.deleteMany({
        where: { sheetId },
      });
      
      // Then create new entries
      const entries = await prisma.$transaction(
        entriesData.map(entryData => {
          const {
            date,
            particulars,
            debitRMB = 0,
            creditRMB = 0,
            debitUSD = 0,
            creditUSD = 0,
          } = entryData;
          
          const finalDebitRMB = parseFloat(debitRMB) || 0;
          const finalCreditRMB = parseFloat(creditRMB) || 0;
          const finalDebitUSD = parseFloat(debitUSD) || 0;
          const finalCreditUSD = parseFloat(creditUSD) || 0;
          
          return prisma.davidSheetEntry.create({
            data: {
              sheetId,
              date: date ? new Date(date) : new Date(),
              particulars: particulars || "",
              debitRMB: finalDebitRMB,
              creditRMB: finalCreditRMB,
              debitUSD: finalDebitUSD,
              creditUSD: finalCreditUSD,
              totalDebitRMB: finalDebitRMB,
              totalCreditRMB: finalCreditRMB,
              totalDebitUSD: finalDebitUSD,
              totalCreditUSD: finalCreditUSD,
              isBalanced: (finalDebitRMB >= 0 && finalCreditRMB >= 0 && finalDebitUSD >= 0 && finalCreditUSD >= 0),
              createdBy: userId.toString(),
            },
          });
        })
      );
      
      return {
        message: `${entries.length} entries updated successfully`,
        entries,
      };
    } catch (error) {
      console.error("Error bulk updating David sheet entries:", error);
      throw error;
    }
  },
  
  // Get sheet statistics
  getSheetStats: async (sheetId) => {
    try {
      const entries = await prisma.davidSheetEntry.findMany({
        where: { sheetId },
        select: {
          date: true,
          particulars: true,
          debitRMB: true,
          creditRMB: true,
          debitUSD: true,
          creditUSD: true,
        },
      });
      
      // Calculate totals
      const totals = entries.reduce(
        (acc, entry) => ({
          totalDebitRMB: acc.totalDebitRMB + (entry.debitRMB || 0),
          totalCreditRMB: acc.totalCreditRMB + (entry.creditRMB || 0),
          totalDebitUSD: acc.totalDebitUSD + (entry.debitUSD || 0),
          totalCreditUSD: acc.totalCreditUSD + (entry.creditUSD || 0),
        }),
        { totalDebitRMB: 0, totalCreditRMB: 0, totalDebitUSD: 0, totalCreditUSD: 0 }
      );
      
      const netRMB = totals.totalDebitRMB - totals.totalCreditRMB;
      const netUSD = totals.totalDebitUSD - totals.totalCreditUSD;
      
      // Monthly breakdown
      const monthlyBreakdown = entries.reduce((acc, entry) => {
        if (!entry.date) return acc;
        
        const date = new Date(entry.date);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthYear]) {
          acc[monthYear] = {
            debitRMB: 0,
            creditRMB: 0,
            debitUSD: 0,
            creditUSD: 0,
            count: 0,
          };
        }
        
        acc[monthYear].debitRMB += entry.debitRMB || 0;
        acc[monthYear].creditRMB += entry.creditRMB || 0;
        acc[monthYear].debitUSD += entry.debitUSD || 0;
        acc[monthYear].creditUSD += entry.creditUSD || 0;
        acc[monthYear].count += 1;
        
        return acc;
      }, {});
      
      return {
        totals: {
          ...totals,
          netRMB,
          netUSD,
          entryCount: entries.length,
        },
        monthlyBreakdown: Object.entries(monthlyBreakdown).map(([monthYear, data]) => ({
          monthYear,
          ...data,
          netRMB: data.debitRMB - data.creditRMB,
          netUSD: data.debitUSD - data.creditUSD,
        })),
      };
    } catch (error) {
      console.error("Error getting David sheet stats:", error);
      throw error;
    }
  },
  
  // Export sheet to Excel
  exportSheetToExcel: async (sheetId) => {
    try {
      const sheet = await prisma.davidSheet.findUnique({
        where: { id: sheetId },
        include: {
          entries: {
            orderBy: { date: 'desc' },
          },
        },
      });
      
      if (!sheet) {
        throw new Error("Sheet not found");
      }
      
      // Prepare data for Excel
      const excelData = sheet.entries.map((entry, index) => ({
        "S.No": index + 1,
        "Date": entry.date ? new Date(entry.date).toLocaleDateString() : "",
        "Particulars": entry.particulars,
        "Debit (RMB)": entry.debitRMB || "",
        "Credit (RMB)": entry.creditRMB || "",
        "Debit (USD)": entry.debitUSD || "",
        "Credit (USD)": entry.creditUSD || "",
        "Net RMB": (entry.debitRMB || 0) - (entry.creditRMB || 0),
        "Net USD": (entry.debitUSD || 0) - (entry.creditUSD || 0),
      }));
      
      return {
        sheet,
        entries: excelData,
      };
    } catch (error) {
      console.error("Error exporting David sheet:", error);
      throw error;
    }
  },
  
  // Get dashboard overview
  getDashboardOverview: async () => {
    try {
      const [
        totalSheets,
        activeSheets,
        archivedSheets,
        totalEntries,
        recentSheets,
      ] = await Promise.all([
        prisma.davidSheet.count(),
        prisma.davidSheet.count({ where: { status: 'ACTIVE' } }),
        prisma.davidSheet.count({ where: { status: 'ARCHIVED' } }),
        prisma.davidSheetEntry.count(),
        prisma.davidSheet.findMany({
          where: { status: 'ACTIVE' },
          orderBy: { updatedAt: 'desc' },
          take: 5,
          include: {
            _count: {
              select: { entries: true },
            },
            entries: {
              select: {
                debitRMB: true,
                creditRMB: true,
                debitUSD: true,
                creditUSD: true,
              },
              take: 10,
            },
          },
        }),
      ]);
      
      // Calculate totals for recent sheets
      const recentSheetsWithTotals = recentSheets.map(sheet => {
        const totals = sheet.entries.reduce(
          (acc, entry) => ({
            debitRMB: acc.debitRMB + (entry.debitRMB || 0),
            creditRMB: acc.creditRMB + (entry.creditRMB || 0),
            debitUSD: acc.debitUSD + (entry.debitUSD || 0),
            creditUSD: acc.creditUSD + (entry.creditUSD || 0),
          }),
          { debitRMB: 0, creditRMB: 0, debitUSD: 0, creditUSD: 0 }
        );
        
        return {
          ...sheet,
          summary: {
            netRMB: totals.debitRMB - totals.creditRMB,
            netUSD: totals.debitUSD - totals.creditUSD,
            entryCount: sheet._count.entries,
          },
        };
      });
      
      return {
        totals: {
          totalSheets,
          activeSheets,
          archivedSheets,
          totalEntries,
        },
        recentSheets: recentSheetsWithTotals,
      };
    } catch (error) {
      console.error("Error getting David sheet dashboard overview:", error);
      throw error;
    }
  },
};

module.exports = davidSheetService;