const { prisma } = require("../../../database/prisma");
const XLSX = require("xlsx");

const paymentCollectionService = {
  // Generate default sheet name
  generateDefaultName: () => {
    const now = new Date();
    const year = now.getFullYear();
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `Payment Collection - ${monthNames[now.getMonth()]} ${year}`;
  },

  // Get all sheets with pagination
  getAllSheets: async ({ page = 1, limit = 20, search = "", status, fiscalYear }) => {
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
      
      if (fiscalYear) {
        where.fiscalYear = fiscalYear;
      }
      
      const [sheets, total] = await Promise.all([
        prisma.paymentCollectionSheet.findMany({
          where,
          skip,
          take: parseInt(limit),
          include: {
            _count: {
              select: { entries: true },
            },
            entries: {
              select: {
                amount24_25: true,
                addCompany: true,
                amount25_26: true,
                advance: true,
                balance: true,
              },
              take: 5, // Just for summary calculation
            },
          },
          orderBy: [
            { updatedAt: 'desc' },
          ],
        }),
        prisma.paymentCollectionSheet.count({ where }),
      ]);
      
      // Calculate summary for each sheet
      const sheetsWithSummary = sheets.map(sheet => {
        const totals = sheet.entries.reduce(
          (acc, entry) => ({
            total24_25: acc.total24_25 + (entry.amount24_25 || 0),
            totalAddCompany: acc.totalAddCompany + (entry.addCompany || 0),
            total25_26: acc.total25_26 + (entry.amount25_26 || 0),
            totalAdvance: acc.totalAdvance + (entry.advance || 0),
            totalBalance: acc.totalBalance + (entry.balance || 0),
          }),
          { total24_25: 0, totalAddCompany: 0, total25_26: 0, totalAdvance: 0, totalBalance: 0 }
        );
        
        return {
          ...sheet,
          summary: {
            ...totals,
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
      console.error("Error getting payment collection sheets:", error);
      throw error;
    }
  },
  
  // Get sheet by ID with entries
  getSheetById: async (sheetId) => {
    try {
      const sheet = await prisma.paymentCollectionSheet.findUnique({
        where: { id: sheetId },
        include: {
          entries: {
            orderBy: [
              { isHighlighted: 'desc' },
              { expectedDate: 'asc' },
              { createdAt: 'desc' },
            ],
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
          total24_25: acc.total24_25 + (entry.amount24_25 || 0),
          totalAddCompany: acc.totalAddCompany + (entry.addCompany || 0),
          total25_26: acc.total25_26 + (entry.amount25_26 || 0),
          totalAdvance: acc.totalAdvance + (entry.advance || 0),
          totalBalance: acc.totalBalance + (entry.balance || 0),
        }),
        { total24_25: 0, totalAddCompany: 0, total25_26: 0, totalAdvance: 0, totalBalance: 0 }
      );
      
      // Calculate statistics
      const stats = {
        pendingEntries: sheet.entries.filter(e => e.paymentStatus === 'PENDING').length,
        partiallyPaidEntries: sheet.entries.filter(e => e.paymentStatus === 'PARTIAL').length,
        paidEntries: sheet.entries.filter(e => e.paymentStatus === 'PAID').length,
        highlightedEntries: sheet.entries.filter(e => e.isHighlighted).length,
      };
      
      return {
        ...sheet,
        totals,
        stats,
      };
    } catch (error) {
      console.error("Error getting payment collection sheet:", error);
      throw error;
    }
  },
  
  // Create new sheet
  createSheet: async (sheetData, userId) => {
    try {
      const { name, description, fiscalYear, tags = [], dueDate } = sheetData;
      
      // Generate default name if not provided
      let finalName = name;
      if (!finalName) {
        finalName = paymentCollectionService.generateDefaultName();
      }
      
      // Check if name already exists
      const existingSheet = await prisma.paymentCollectionSheet.findUnique({
        where: { name: finalName },
      });
      
      if (existingSheet) {
        // Append number if name exists
        let counter = 1;
        let newName = `${finalName} (${counter})`;
        while (await prisma.paymentCollectionSheet.findUnique({ where: { name: newName } })) {
          counter++;
          newName = `${finalName} (${counter})`;
        }
        finalName = newName;
      }
      
      // Determine fiscal year if not provided
      const currentYear = new Date().getFullYear();
      const finalFiscalYear = fiscalYear || `${currentYear}-${currentYear + 1}`;
      
      const sheet = await prisma.paymentCollectionSheet.create({
        data: {
          name: finalName,
          description: description || null,
          fiscalYear: finalFiscalYear,
          tags: tags || [],
          status: 'ACTIVE',
          dueDate: dueDate ? new Date(dueDate) : null,
          createdBy: userId.toString(),
        },
      });
      
      return sheet;
    } catch (error) {
      console.error("Error creating payment collection sheet:", error);
      throw error;
    }
  },
  
  // Update sheet details
  updateSheet: async (sheetId, sheetData, userId) => {
    try {
      const { name, description, status, isLocked, tags, fiscalYear, dueDate } = sheetData;
      
      // If updating name, check uniqueness
      if (name) {
        const existingSheet = await prisma.paymentCollectionSheet.findFirst({
          where: {
            name,
            NOT: { id: sheetId },
          },
        });
        
        if (existingSheet) {
          throw new Error("Sheet with this name already exists");
        }
      }
      
      const sheet = await prisma.paymentCollectionSheet.update({
        where: { id: sheetId },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(status && { status }),
          ...(isLocked !== undefined && { isLocked }),
          ...(tags && { tags }),
          ...(fiscalYear && { fiscalYear }),
          ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
          updatedBy: userId.toString(),
          updatedAt: new Date(),
        },
      });
      
      return sheet;
    } catch (error) {
      console.error("Error updating payment collection sheet:", error);
      throw error;
    }
  },
  
  // Delete sheet (soft delete by changing status)
  deleteSheet: async (sheetId, userId) => {
    try {
      const sheet = await prisma.paymentCollectionSheet.update({
        where: { id: sheetId },
        data: {
          status: 'CANCELLED',
          updatedBy: userId.toString(),
          updatedAt: new Date(),
        },
      });
      
      return {
        message: "Sheet cancelled successfully",
        sheet,
      };
    } catch (error) {
      console.error("Error deleting payment collection sheet:", error);
      throw error;
    }
  },
  
  // Get sheet entries
  getSheetEntries: async (sheetId, { page = 1, limit = 50, search = "", status, highlight }) => {
    try {
      const skip = (page - 1) * limit;
      
      const where = {
        sheetId,
      };
      
      if (search) {
        where.clientName = { contains: search, mode: 'insensitive' };
      }
      
      if (status) {
        where.paymentStatus = status;
      }
      
      if (highlight !== undefined) {
        where.isHighlighted = highlight === 'true';
      }
      
      const [entries, total] = await Promise.all([
        prisma.paymentCollectionEntry.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: [
            { isHighlighted: 'desc' },
            { expectedDate: 'asc' },
            { createdAt: 'desc' },
          ],
        }),
        prisma.paymentCollectionEntry.count({ where }),
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
      console.error("Error getting sheet entries:", error);
      throw error;
    }
  },
  
  // Add entry to sheet
  addEntry: async (sheetId, entryData, userId) => {
    try {
      const {
        clientName,
        expectedDate,
        amount24_25 = 0,
        addCompany = 0,
        amount25_26 = 0,
        advance = 0,
        isHighlighted = false,
        notes,
        paymentMode,
        paymentRef,
      } = entryData;
      
      // Calculate balance
      const balance = (amount25_26 || 0) - (advance || 0);
      
      // Determine payment status
      let paymentStatus = 'PENDING';
      if (advance > 0 && advance < amount25_26) {
        paymentStatus = 'PARTIAL';
      } else if (advance >= amount25_26) {
        paymentStatus = 'PAID';
      }
      
      const entry = await prisma.paymentCollectionEntry.create({
        data: {
          sheetId,
          clientName: clientName || "",
          expectedDate: expectedDate ? new Date(expectedDate) : null,
          amount24_25: parseFloat(amount24_25) || 0,
          addCompany: parseFloat(addCompany) || 0,
          amount25_26: parseFloat(amount25_26) || 0,
          advance: parseFloat(advance) || 0,
          balance,
          isHighlighted,
          notes: notes || null,
          paymentMode: paymentMode || null,
          paymentRef: paymentRef || null,
          paymentStatus,
          createdBy: userId.toString(),
        },
      });
      
      // Update sheet totals
      await paymentCollectionService.updateSheetTotals(sheetId);
      
      return entry;
    } catch (error) {
      console.error("Error adding payment collection entry:", error);
      throw error;
    }
  },
  
  // Update entry
  updateEntry: async (entryId, entryData, userId) => {
    try {
      const {
        clientName,
        expectedDate,
        amount24_25,
        addCompany,
        amount25_26,
        advance,
        isHighlighted,
        notes,
        paymentMode,
        paymentRef,
      } = entryData;
      
      // Get current entry to know sheetId
      const currentEntry = await prisma.paymentCollectionEntry.findUnique({
        where: { id: entryId },
        select: { sheetId: true },
      });
      
      if (!currentEntry) {
        throw new Error("Entry not found");
      }
      
      // Calculate balance if amount25_26 or advance changed
      let balance;
      let paymentStatus;
      
      if (amount25_26 !== undefined || advance !== undefined) {
        const entry = await prisma.paymentCollectionEntry.findUnique({
          where: { id: entryId },
          select: { amount25_26: true, advance: true },
        });
        
        const finalAmount25_26 = amount25_26 !== undefined ? parseFloat(amount25_26) || 0 : entry.amount25_26;
        const finalAdvance = advance !== undefined ? parseFloat(advance) || 0 : entry.advance;
        
        balance = finalAmount25_26 - finalAdvance;
        
        // Determine payment status
        if (finalAdvance <= 0) {
          paymentStatus = 'PENDING';
        } else if (finalAdvance > 0 && finalAdvance < finalAmount25_26) {
          paymentStatus = 'PARTIAL';
        } else if (finalAdvance >= finalAmount25_26) {
          paymentStatus = 'PAID';
        }
      }
      
      const updateData = {
        ...(clientName !== undefined && { clientName }),
        ...(expectedDate !== undefined && { expectedDate: expectedDate ? new Date(expectedDate) : null }),
        ...(amount24_25 !== undefined && { amount24_25: parseFloat(amount24_25) || 0 }),
        ...(addCompany !== undefined && { addCompany: parseFloat(addCompany) || 0 }),
        ...(amount25_26 !== undefined && { amount25_26: parseFloat(amount25_26) || 0 }),
        ...(advance !== undefined && { advance: parseFloat(advance) || 0 }),
        ...(isHighlighted !== undefined && { isHighlighted }),
        ...(notes !== undefined && { notes }),
        ...(paymentMode !== undefined && { paymentMode }),
        ...(paymentRef !== undefined && { paymentRef }),
        ...(balance !== undefined && { balance }),
        ...(paymentStatus !== undefined && { paymentStatus }),
        updatedBy: userId.toString(),
        updatedAt: new Date(),
      };
      
      const entry = await prisma.paymentCollectionEntry.update({
        where: { id: entryId },
        data: updateData,
      });
      
      // Update sheet totals
      await paymentCollectionService.updateSheetTotals(currentEntry.sheetId);
      
      return entry;
    } catch (error) {
      console.error("Error updating payment collection entry:", error);
      throw error;
    }
  },
  
  // Delete entry
  deleteEntry: async (entryId, userId) => {
    try {
      const entry = await prisma.paymentCollectionEntry.findUnique({
        where: { id: entryId },
        select: { sheetId: true },
      });
      
      if (!entry) {
        throw new Error("Entry not found");
      }
      
      await prisma.paymentCollectionEntry.delete({
        where: { id: entryId },
      });
      
      // Update sheet totals
      await paymentCollectionService.updateSheetTotals(entry.sheetId);
      
      return {
        message: "Entry deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting payment collection entry:", error);
      throw error;
    }
  },
  
  // Bulk update entries (for saving entire sheet)
  bulkUpdateEntries: async (sheetId, entriesData, userId) => {
    try {
      // First, delete all existing entries
      await prisma.paymentCollectionEntry.deleteMany({
        where: { sheetId },
      });
      
      // Then create new entries
      const entries = await prisma.$transaction(
        entriesData.map(entryData => {
          const {
            clientName,
            expectedDate,
            amount24_25 = 0,
            addCompany = 0,
            amount25_26 = 0,
            advance = 0,
            isHighlighted = false,
            notes,
            paymentMode,
            paymentRef,
          } = entryData;
          
          // Calculate balance
          const balance = (amount25_26 || 0) - (advance || 0);
          
          // Determine payment status
          let paymentStatus = 'PENDING';
          if (advance > 0 && advance < amount25_26) {
            paymentStatus = 'PARTIAL';
          } else if (advance >= amount25_26) {
            paymentStatus = 'PAID';
          }
          
          return prisma.paymentCollectionEntry.create({
            data: {
              sheetId,
              clientName: clientName || "",
              expectedDate: expectedDate ? new Date(expectedDate) : null,
              amount24_25: parseFloat(amount24_25) || 0,
              addCompany: parseFloat(addCompany) || 0,
              amount25_26: parseFloat(amount25_26) || 0,
              advance: parseFloat(advance) || 0,
              balance,
              isHighlighted,
              notes: notes || null,
              paymentMode: paymentMode || null,
              paymentRef: paymentRef || null,
              paymentStatus,
              createdBy: userId.toString(),
            },
          });
        })
      );
      
      // Update sheet totals
      await paymentCollectionService.updateSheetTotals(sheetId);
      
      return {
        message: `${entries.length} entries updated successfully`,
        entries,
      };
    } catch (error) {
      console.error("Error bulk updating payment collection entries:", error);
      throw error;
    }
  },
  
  // Helper: Update sheet totals
  updateSheetTotals: async (sheetId) => {
    try {
      const entries = await prisma.paymentCollectionEntry.findMany({
        where: { sheetId },
        select: {
          amount24_25: true,
          addCompany: true,
          amount25_26: true,
          advance: true,
          balance: true,
        },
      });
      
      const totals = entries.reduce(
        (acc, entry) => ({
          total24_25: acc.total24_25 + (entry.amount24_25 || 0),
          totalAddCompany: acc.totalAddCompany + (entry.addCompany || 0),
          total25_26: acc.total25_26 + (entry.amount25_26 || 0),
          totalAdvance: acc.totalAdvance + (entry.advance || 0),
          totalBalance: acc.totalBalance + (entry.balance || 0),
        }),
        { total24_25: 0, totalAddCompany: 0, total25_26: 0, totalAdvance: 0, totalBalance: 0 }
      );
      
      await prisma.paymentCollectionSheet.update({
        where: { id: sheetId },
        data: {
          total24_25: totals.total24_25,
          totalAddCompany: totals.totalAddCompany,
          total25_26: totals.total25_26,
          totalAdvance: totals.totalAdvance,
          totalBalance: totals.totalBalance,
          updatedAt: new Date(),
        },
      });
      
      return totals;
    } catch (error) {
      console.error("Error updating sheet totals:", error);
      throw error;
    }
  },
  
  // Get sheet statistics
  getSheetStats: async (sheetId) => {
    try {
      const sheet = await prisma.paymentCollectionSheet.findUnique({
        where: { id: sheetId },
        include: {
          entries: {
            select: {
              amount24_25: true,
              addCompany: true,
              amount25_26: true,
              advance: true,
              balance: true,
              paymentStatus: true,
              isHighlighted: true,
              expectedDate: true,
            },
          },
        },
      });
      
      if (!sheet) {
        throw new Error("Sheet not found");
      }
      
      // Calculate various stats
      const statusStats = sheet.entries.reduce((acc, entry) => {
        acc[entry.paymentStatus] = (acc[entry.paymentStatus] || 0) + 1;
        return acc;
      }, {});
      
      // Overdue calculations (entries with past expected date and not paid)
      const now = new Date();
      const overdueEntries = sheet.entries.filter(entry => 
        entry.expectedDate && 
        new Date(entry.expectedDate) < now && 
        entry.paymentStatus !== 'PAID'
      );
      
      // Client breakdown
      const clientStats = sheet.entries.reduce((acc, entry) => {
        if (!acc[entry.clientName]) {
          acc[entry.clientName] = {
            totalAmount: 0,
            totalAdvance: 0,
            balance: 0,
            count: 0,
          };
        }
        acc[entry.clientName].totalAmount += entry.amount25_26 || 0;
        acc[entry.clientName].totalAdvance += entry.advance || 0;
        acc[entry.clientName].balance += entry.balance || 0;
        acc[entry.clientName].count += 1;
        return acc;
      }, {});
      
      return {
        totals: {
          total24_25: sheet.total24_25,
          totalAddCompany: sheet.totalAddCompany,
          total25_26: sheet.total25_26,
          totalAdvance: sheet.totalAdvance,
          totalBalance: sheet.totalBalance,
          entryCount: sheet.entries.length,
        },
        statusStats,
        overdue: {
          count: overdueEntries.length,
          totalAmount: overdueEntries.reduce((sum, entry) => sum + (entry.balance || 0), 0),
        },
        clientBreakdown: Object.entries(clientStats)
          .map(([clientName, stats]) => ({
            clientName,
            ...stats,
          }))
          .sort((a, b) => b.balance - a.balance)
          .slice(0, 10), // Top 10 clients by balance
      };
    } catch (error) {
      console.error("Error getting payment collection sheet stats:", error);
      throw error;
    }
  },
  
  // Export sheet to Excel
  exportSheetToExcel: async (sheetId) => {
    try {
      const sheet = await prisma.paymentCollectionSheet.findUnique({
        where: { id: sheetId },
        include: {
          entries: {
            orderBy: [
              { isHighlighted: 'desc' },
              { expectedDate: 'asc' },
            ],
          },
        },
      });
      
      if (!sheet) {
        throw new Error("Sheet not found");
      }
      
      // Prepare data for Excel
      const excelData = sheet.entries.map((entry, index) => ({
        "S.No": index + 1,
        "Client Name": entry.clientName,
        "Expected Date": entry.expectedDate ? new Date(entry.expectedDate).toLocaleDateString() : "",
        "24-25 Amount": entry.amount24_25 || 0,
        "Add Company": entry.addCompany || 0,
        "25-26 Amount": entry.amount25_26 || 0,
        "Advance": entry.advance || 0,
        "Balance": entry.balance || 0,
        "Status": entry.paymentStatus,
        "Highlighted": entry.isHighlighted ? "Yes" : "No",
        "Notes": entry.notes || "",
        "Payment Mode": entry.paymentMode || "",
        "Payment Ref": entry.paymentRef || "",
      }));
      
      return {
        sheet,
        entries: excelData,
      };
    } catch (error) {
      console.error("Error exporting payment collection sheet:", error);
      throw error;
    }
  },
  
  // Get dashboard overview
  getDashboardOverview: async () => {
    try {
      const [
        totalSheets,
        activeSheets,
        totalEntries,
        recentSheets,
      ] = await Promise.all([
        prisma.paymentCollectionSheet.count(),
        prisma.paymentCollectionSheet.count({ where: { status: 'ACTIVE' } }),
        prisma.paymentCollectionEntry.count(),
        prisma.paymentCollectionSheet.findMany({
          where: { status: 'ACTIVE' },
          orderBy: { updatedAt: 'desc' },
          take: 5,
          include: {
            _count: {
              select: { entries: true },
            },
            entries: {
              select: {
                amount24_25: true,
                addCompany: true,
                amount25_26: true,
                advance: true,
              },
              take: 10,
            },
          },
        }),
      ]);
      
      // Calculate overall totals from all sheets
      const allSheets = await prisma.paymentCollectionSheet.findMany({
        select: {
          total24_25: true,
          totalAddCompany: true,
          total25_26: true,
          totalAdvance: true,
          totalBalance: true,
        },
      });
      
      const overallTotals = allSheets.reduce(
        (acc, sheet) => ({
          total24_25: acc.total24_25 + (sheet.total24_25 || 0),
          totalAddCompany: acc.totalAddCompany + (sheet.totalAddCompany || 0),
          total25_26: acc.total25_26 + (sheet.total25_26 || 0),
          totalAdvance: acc.totalAdvance + (sheet.totalAdvance || 0),
          totalBalance: acc.totalBalance + (sheet.totalBalance || 0),
        }),
        { total24_25: 0, totalAddCompany: 0, total25_26: 0, totalAdvance: 0, totalBalance: 0 }
      );
      
      // Calculate summary for recent sheets
      const recentSheetsWithSummary = recentSheets.map(sheet => {
        const totals = sheet.entries.reduce(
          (acc, entry) => ({
            total24_25: acc.total24_25 + (entry.amount24_25 || 0),
            totalAddCompany: acc.totalAddCompany + (entry.addCompany || 0),
            total25_26: acc.total25_26 + (entry.amount25_26 || 0),
            totalAdvance: acc.totalAdvance + (entry.advance || 0),
          }),
          { total24_25: 0, totalAddCompany: 0, total25_26: 0, totalAdvance: 0 }
        );
        
        return {
          ...sheet,
          summary: {
            ...totals,
            balance: totals.total25_26 - totals.totalAdvance,
            entryCount: sheet._count.entries,
          },
        };
      });
      
      return {
        totals: {
          totalSheets,
          activeSheets,
          totalEntries,
        },
        overallTotals,
        recentSheets: recentSheetsWithSummary,
      };
    } catch (error) {
      console.error("Error getting payment collection dashboard overview:", error);
      throw error;
    }
  },
};

module.exports = paymentCollectionService;