const { prisma } = require("../../../database/prisma");

const forexService = {
  // Get all forex sheets with search
  getAllSheets: async ({ page = 1, limit = 20, search = "", currency, status }) => {
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
      
      if (currency) {
        where.baseCurrency = currency;
      }
      
      if (status) {
        where.status = status;
      }
      
      const [sheets, total] = await Promise.all([
        prisma.forexSheet.findMany({
          where,
          skip,
          take: parseInt(limit),
          include: {
            _count: {
              select: { entries: true },
            },
            entries: {
              take: 1,
              orderBy: { date: 'desc' },
            },
          },
          orderBy: [
            { updatedAt: 'desc' },
            { name: 'asc' },
          ],
        }),
        prisma.forexSheet.count({ where }),
      ]);
      
      // Calculate totals for each sheet
      const sheetsWithTotals = await Promise.all(
        sheets.map(async (sheet) => {
          const totals = await prisma.forexEntry.aggregate({
            where: { sheetId: sheet.id },
            _sum: {
              debitRMB: true,
              creditRMB: true,
              debitUSD: true,
              creditUSD: true,
              debitEUR: true,
              creditEUR: true,
              debitGBP: true,
              creditGBP: true,
              debitJPY: true,
              creditJPY: true,
              debitOther: true,
              creditOther: true,
            },
          });
          
          return {
            ...sheet,
            totals: {
              rmb: {
                debit: totals._sum.debitRMB || 0,
                credit: totals._sum.creditRMB || 0,
                balance: (totals._sum.debitRMB || 0) - (totals._sum.creditRMB || 0),
              },
              usd: {
                debit: totals._sum.debitUSD || 0,
                credit: totals._sum.creditUSD || 0,
                balance: (totals._sum.debitUSD || 0) - (totals._sum.creditUSD || 0),
              },
              eur: {
                debit: totals._sum.debitEUR || 0,
                credit: totals._sum.creditEUR || 0,
                balance: (totals._sum.debitEUR || 0) - (totals._sum.creditEUR || 0),
              },
              gbp: {
                debit: totals._sum.debitGBP || 0,
                credit: totals._sum.creditGBP || 0,
                balance: (totals._sum.debitGBP || 0) - (totals._sum.creditGBP || 0),
              },
              jpy: {
                debit: totals._sum.debitJPY || 0,
                credit: totals._sum.creditJPY || 0,
                balance: (totals._sum.debitJPY || 0) - (totals._sum.creditJPY || 0),
              },
              other: {
                debit: totals._sum.debitOther || 0,
                credit: totals._sum.creditOther || 0,
                balance: (totals._sum.debitOther || 0) - (totals._sum.creditOther || 0),
              },
            },
          };
        })
      );
      
      const totalPages = Math.ceil(total / limit);
      
      return {
        sheets: sheetsWithTotals,
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
      console.error("Error getting forex sheets:", error);
      throw error;
    }
  },
  
  // Get sheet by ID with entries
  getSheetById: async (sheetId) => {
    try {
      const sheet = await prisma.forexSheet.findUnique({
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
        throw new Error("Forex sheet not found");
      }
      
      // Calculate sheet totals
      const totals = await prisma.forexEntry.aggregate({
        where: { sheetId },
        _sum: {
          debitRMB: true,
          creditRMB: true,
          debitUSD: true,
          creditUSD: true,
          debitEUR: true,
          creditEUR: true,
          debitGBP: true,
          creditGBP: true,
          debitJPY: true,
          creditJPY: true,
          debitOther: true,
          creditOther: true,
        },
      });
      
      // Calculate running balances
      let rmbRunning = 0;
      let usdRunning = 0;
      let eurRunning = 0;
      let gbpRunning = 0;
      let jpyRunning = 0;
      let otherRunning = 0;
      
      const entriesWithBalance = sheet.entries.map(entry => {
        const debitRMB = entry.debitRMB || 0;
        const creditRMB = entry.creditRMB || 0;
        const debitUSD = entry.debitUSD || 0;
        const creditUSD = entry.creditUSD || 0;
        const debitEUR = entry.debitEUR || 0;
        const creditEUR = entry.creditEUR || 0;
        const debitGBP = entry.debitGBP || 0;
        const creditGBP = entry.creditGBP || 0;
        const debitJPY = entry.debitJPY || 0;
        const creditJPY = entry.creditJPY || 0;
        const debitOther = entry.debitOther || 0;
        const creditOther = entry.creditOther || 0;
        
        rmbRunning += (debitRMB - creditRMB);
        usdRunning += (debitUSD - creditUSD);
        eurRunning += (debitEUR - creditEUR);
        gbpRunning += (debitGBP - creditGBP);
        jpyRunning += (debitJPY - creditJPY);
        otherRunning += (debitOther - creditOther);
        
        return {
          ...entry,
          runningBalances: {
            rmb: rmbRunning,
            usd: usdRunning,
            eur: eurRunning,
            gbp: gbpRunning,
            jpy: jpyRunning,
            other: otherRunning,
          },
        };
      });
      
      return {
        ...sheet,
        entries: entriesWithBalance,
        totals: {
          rmb: {
            debit: totals._sum.debitRMB || 0,
            credit: totals._sum.creditRMB || 0,
            balance: (totals._sum.debitRMB || 0) - (totals._sum.creditRMB || 0),
          },
          usd: {
            debit: totals._sum.debitUSD || 0,
            credit: totals._sum.creditUSD || 0,
            balance: (totals._sum.debitUSD || 0) - (totals._sum.creditUSD || 0),
          },
          eur: {
            debit: totals._sum.debitEUR || 0,
            credit: totals._sum.creditEUR || 0,
            balance: (totals._sum.debitEUR || 0) - (totals._sum.creditEUR || 0),
          },
          gbp: {
            debit: totals._sum.debitGBP || 0,
            credit: totals._sum.creditGBP || 0,
            balance: (totals._sum.debitGBP || 0) - (totals._sum.creditGBP || 0),
          },
          jpy: {
            debit: totals._sum.debitJPY || 0,
            credit: totals._sum.creditJPY || 0,
            balance: (totals._sum.debitJPY || 0) - (totals._sum.creditJPY || 0),
          },
          other: {
            debit: totals._sum.debitOther || 0,
            credit: totals._sum.creditOther || 0,
            balance: (totals._sum.debitOther || 0) - (totals._sum.creditOther || 0),
          },
        },
      };
    } catch (error) {
      console.error("Error getting forex sheet:", error);
      throw error;
    }
  },
  
  // Create new forex sheet
  createSheet: async (sheetData, userId) => {
    try {
      const { name, description, baseCurrency, tags = [] } = sheetData;
      
      if (!name || name.trim() === "") {
        throw new Error("Sheet name is required");
      }
      
      // Check if sheet with same name already exists
      const existingSheet = await prisma.forexSheet.findUnique({
        where: { name: name.trim() },
      });
      
      if (existingSheet) {
        throw new Error("A sheet with this name already exists");
      }
      
      const sheet = await prisma.forexSheet.create({
        data: {
          name: name.trim(),
          description: description || null,
          baseCurrency: baseCurrency || 'RMB',
          tags: tags || [],
          status: 'ACTIVE',
          createdBy: userId.toString(),
        },
      });
      
      return sheet;
    } catch (error) {
      console.error("Error creating forex sheet:", error);
      throw error;
    }
  },
  
  // Update sheet details
  updateSheet: async (sheetId, sheetData, userId) => {
    try {
      const { name, description, baseCurrency, status, isLocked, tags } = sheetData;
      
      // If updating name, check uniqueness
      if (name) {
        const existingSheet = await prisma.forexSheet.findFirst({
          where: {
            name: name.trim(),
            NOT: { id: sheetId },
          },
        });
        
        if (existingSheet) {
          throw new Error("A sheet with this name already exists");
        }
      }
      
      const sheet = await prisma.forexSheet.update({
        where: { id: sheetId },
        data: {
          ...(name && { name: name.trim() }),
          ...(description !== undefined && { description }),
          ...(baseCurrency && { baseCurrency }),
          ...(status && { status }),
          ...(isLocked !== undefined && { isLocked }),
          ...(tags && { tags }),
          updatedBy: userId.toString(),
          updatedAt: new Date(),
        },
      });
      
      return sheet;
    } catch (error) {
      console.error("Error updating forex sheet:", error);
      throw error;
    }
  },
  
  // Delete sheet (archive)
  deleteSheet: async (sheetId, userId) => {
    try {
      const sheet = await prisma.forexSheet.update({
        where: { id: sheetId },
        data: {
          status: 'ARCHIVED',
          updatedBy: userId.toString(),
          updatedAt: new Date(),
        },
      });
      
      return {
        message: "Forex sheet archived successfully",
        sheet,
      };
    } catch (error) {
      console.error("Error deleting forex sheet:", error);
      throw error;
    }
  },
  
  // Get sheet entries with filtering
  getSheetEntries: async (sheetId, { page = 1, limit = 50, search = "", startDate, endDate, category }) => {
    try {
      const skip = (page - 1) * limit;
      
      const where = {
        sheetId,
      };
      
      if (search) {
        where.OR = [
          { particulars: { contains: search, mode: 'insensitive' } },
          { reference: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
        ];
      }
      
      if (startDate && endDate) {
        where.date = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      }
      
      if (category) {
        where.category = category;
      }
      
      const [entries, total] = await Promise.all([
        prisma.forexEntry.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: [
            { date: 'desc' },
            { createdAt: 'desc' },
          ],
        }),
        prisma.forexEntry.count({ where }),
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
        date,
        particulars,
        reference,
        debitRMB,
        creditRMB,
        debitUSD,
        creditUSD,
        debitEUR,
        creditEUR,
        debitGBP,
        creditGBP,
        debitJPY,
        creditJPY,
        debitOther,
        creditOther,
        otherCurrencyCode,
        category,
        notes,
      } = entryData;
      
      if (!particulars || particulars.trim() === "") {
        throw new Error("Particulars are required");
      }
      
      // Calculate balances
      const rmbBalance = (debitRMB || 0) - (creditRMB || 0);
      const usdBalance = (debitUSD || 0) - (creditUSD || 0);
      const eurBalance = (debitEUR || 0) - (creditEUR || 0);
      const gbpBalance = (debitGBP || 0) - (creditGBP || 0);
      const jpyBalance = (debitJPY || 0) - (creditJPY || 0);
      const otherBalance = (debitOther || 0) - (creditOther || 0);
      
      const entry = await prisma.forexEntry.create({
        data: {
          sheetId,
          date: new Date(date),
          particulars: particulars.trim(),
          reference: reference || null,
          debitRMB: debitRMB ? parseFloat(debitRMB) : null,
          creditRMB: creditRMB ? parseFloat(creditRMB) : null,
          debitUSD: debitUSD ? parseFloat(debitUSD) : null,
          creditUSD: creditUSD ? parseFloat(creditUSD) : null,
          debitEUR: debitEUR ? parseFloat(debitEUR) : null,
          creditEUR: creditEUR ? parseFloat(creditEUR) : null,
          debitGBP: debitGBP ? parseFloat(debitGBP) : null,
          creditGBP: creditGBP ? parseFloat(creditGBP) : null,
          debitJPY: debitJPY ? parseFloat(debitJPY) : null,
          creditJPY: creditJPY ? parseFloat(creditJPY) : null,
          debitOther: debitOther ? parseFloat(debitOther) : null,
          creditOther: creditOther ? parseFloat(creditOther) : null,
          otherCurrencyCode: otherCurrencyCode || null,
          rmbBalance,
          usdBalance,
          eurBalance,
          gbpBalance,
          jpyBalance,
          otherBalance,
          category: category || null,
          notes: notes || null,
          createdBy: userId.toString(),
        },
      });
      
      return entry;
    } catch (error) {
      console.error("Error adding forex entry:", error);
      throw error;
    }
  },
  
  // Update entry
  updateEntry: async (entryId, entryData, userId) => {
    try {
      const {
        date,
        particulars,
        reference,
        debitRMB,
        creditRMB,
        debitUSD,
        creditUSD,
        debitEUR,
        creditEUR,
        debitGBP,
        creditGBP,
        debitJPY,
        creditJPY,
        debitOther,
        creditOther,
        otherCurrencyCode,
        category,
        notes,
      } = entryData;
      
      // Calculate balances if amounts changed
      let updateData = {};
      if (date) updateData.date = new Date(date);
      if (particulars) updateData.particulars = particulars.trim();
      if (reference !== undefined) updateData.reference = reference;
      if (category !== undefined) updateData.category = category;
      if (notes !== undefined) updateData.notes = notes;
      if (otherCurrencyCode !== undefined) updateData.otherCurrencyCode = otherCurrencyCode;
      
      // Update amounts if provided
      if (debitRMB !== undefined) updateData.debitRMB = debitRMB ? parseFloat(debitRMB) : null;
      if (creditRMB !== undefined) updateData.creditRMB = creditRMB ? parseFloat(creditRMB) : null;
      if (debitUSD !== undefined) updateData.debitUSD = debitUSD ? parseFloat(debitUSD) : null;
      if (creditUSD !== undefined) updateData.creditUSD = creditUSD ? parseFloat(creditUSD) : null;
      if (debitEUR !== undefined) updateData.debitEUR = debitEUR ? parseFloat(debitEUR) : null;
      if (creditEUR !== undefined) updateData.creditEUR = creditEUR ? parseFloat(creditEUR) : null;
      if (debitGBP !== undefined) updateData.debitGBP = debitGBP ? parseFloat(debitGBP) : null;
      if (creditGBP !== undefined) updateData.creditGBP = creditGBP ? parseFloat(creditGBP) : null;
      if (debitJPY !== undefined) updateData.debitJPY = debitJPY ? parseFloat(debitJPY) : null;
      if (creditJPY !== undefined) updateData.creditJPY = creditJPY ? parseFloat(creditJPY) : null;
      if (debitOther !== undefined) updateData.debitOther = debitOther ? parseFloat(debitOther) : null;
      if (creditOther !== undefined) updateData.creditOther = creditOther ? parseFloat(creditOther) : null;
      
      // Recalculate balances
      const entry = await prisma.forexEntry.findUnique({
        where: { id: entryId },
      });
      
      const finalDebitRMB = debitRMB !== undefined ? (debitRMB ? parseFloat(debitRMB) : 0) : (entry.debitRMB || 0);
      const finalCreditRMB = creditRMB !== undefined ? (creditRMB ? parseFloat(creditRMB) : 0) : (entry.creditRMB || 0);
      const finalDebitUSD = debitUSD !== undefined ? (debitUSD ? parseFloat(debitUSD) : 0) : (entry.debitUSD || 0);
      const finalCreditUSD = creditUSD !== undefined ? (creditUSD ? parseFloat(creditUSD) : 0) : (entry.creditUSD || 0);
      const finalDebitEUR = debitEUR !== undefined ? (debitEUR ? parseFloat(debitEUR) : 0) : (entry.debitEUR || 0);
      const finalCreditEUR = creditEUR !== undefined ? (creditEUR ? parseFloat(creditEUR) : 0) : (entry.creditEUR || 0);
      const finalDebitGBP = debitGBP !== undefined ? (debitGBP ? parseFloat(debitGBP) : 0) : (entry.debitGBP || 0);
      const finalCreditGBP = creditGBP !== undefined ? (creditGBP ? parseFloat(creditGBP) : 0) : (entry.creditGBP || 0);
      const finalDebitJPY = debitJPY !== undefined ? (debitJPY ? parseFloat(debitJPY) : 0) : (entry.debitJPY || 0);
      const finalCreditJPY = creditJPY !== undefined ? (creditJPY ? parseFloat(creditJPY) : 0) : (entry.creditJPY || 0);
      const finalDebitOther = debitOther !== undefined ? (debitOther ? parseFloat(debitOther) : 0) : (entry.debitOther || 0);
      const finalCreditOther = creditOther !== undefined ? (creditOther ? parseFloat(creditOther) : 0) : (entry.creditOther || 0);
      
      updateData.rmbBalance = finalDebitRMB - finalCreditRMB;
      updateData.usdBalance = finalDebitUSD - finalCreditUSD;
      updateData.eurBalance = finalDebitEUR - finalCreditEUR;
      updateData.gbpBalance = finalDebitGBP - finalCreditGBP;
      updateData.jpyBalance = finalDebitJPY - finalCreditJPY;
      updateData.otherBalance = finalDebitOther - finalCreditOther;
      
      updateData.updatedBy = userId.toString();
      updateData.updatedAt = new Date();
      
      const updatedEntry = await prisma.forexEntry.update({
        where: { id: entryId },
        data: updateData,
      });
      
      return updatedEntry;
    } catch (error) {
      console.error("Error updating forex entry:", error);
      throw error;
    }
  },
  
  // Delete entry
  deleteEntry: async (entryId, userId) => {
    try {
      await prisma.forexEntry.delete({
        where: { id: entryId },
      });
      
      return {
        message: "Entry deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting forex entry:", error);
      throw error;
    }
  },
  
  // Get sheet statistics
  getSheetStats: async (sheetId) => {
    try {
      const entries = await prisma.forexEntry.findMany({
        where: { sheetId },
        orderBy: { date: 'asc' },
      });
      
      // Calculate monthly breakdown
      const monthlyBreakdown = entries.reduce((acc, entry) => {
        const date = new Date(entry.date);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthYear]) {
          acc[monthYear] = {
            rmb: { debit: 0, credit: 0, balance: 0 },
            usd: { debit: 0, credit: 0, balance: 0 },
            eur: { debit: 0, credit: 0, balance: 0 },
            gbp: { debit: 0, credit: 0, balance: 0 },
            jpy: { debit: 0, credit: 0, balance: 0 },
            other: { debit: 0, credit: 0, balance: 0 },
            count: 0,
          };
        }
        
        acc[monthYear].rmb.debit += entry.debitRMB || 0;
        acc[monthYear].rmb.credit += entry.creditRMB || 0;
        acc[monthYear].rmb.balance += (entry.debitRMB || 0) - (entry.creditRMB || 0);
        
        acc[monthYear].usd.debit += entry.debitUSD || 0;
        acc[monthYear].usd.credit += entry.creditUSD || 0;
        acc[monthYear].usd.balance += (entry.debitUSD || 0) - (entry.creditUSD || 0);
        
        acc[monthYear].eur.debit += entry.debitEUR || 0;
        acc[monthYear].eur.credit += entry.creditEUR || 0;
        acc[monthYear].eur.balance += (entry.debitEUR || 0) - (entry.creditEUR || 0);
        
        acc[monthYear].gbp.debit += entry.debitGBP || 0;
        acc[monthYear].gbp.credit += entry.creditGBP || 0;
        acc[monthYear].gbp.balance += (entry.debitGBP || 0) - (entry.creditGBP || 0);
        
        acc[monthYear].jpy.debit += entry.debitJPY || 0;
        acc[monthYear].jpy.credit += entry.creditJPY || 0;
        acc[monthYear].jpy.balance += (entry.debitJPY || 0) - (entry.creditJPY || 0);
        
        acc[monthYear].other.debit += entry.debitOther || 0;
        acc[monthYear].other.credit += entry.creditOther || 0;
        acc[monthYear].other.balance += (entry.debitOther || 0) - (entry.creditOther || 0);
        
        acc[monthYear].count += 1;
        
        return acc;
      }, {});
      
      // Get top categories
      const categoryStats = await prisma.forexEntry.groupBy({
        by: ['category'],
        where: { sheetId, category: { not: null } },
        _sum: {
          debitRMB: true,
          creditRMB: true,
          debitUSD: true,
          creditUSD: true,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10,
      });
      
      return {
        monthlyBreakdown: Object.entries(monthlyBreakdown).map(([monthYear, data]) => ({
          monthYear,
          ...data,
        })),
        categories: categoryStats.map(stat => ({
          category: stat.category,
          rmb: {
            debit: stat._sum.debitRMB || 0,
            credit: stat._sum.creditRMB || 0,
            balance: (stat._sum.debitRMB || 0) - (stat._sum.creditRMB || 0),
          },
          usd: {
            debit: stat._sum.debitUSD || 0,
            credit: stat._sum.creditUSD || 0,
            balance: (stat._sum.debitUSD || 0) - (stat._sum.creditUSD || 0),
          },
          count: stat._count.id,
        })),
      };
    } catch (error) {
      console.error("Error getting sheet stats:", error);
      throw error;
    }
  },
  
  // Search sheet names for auto-suggest
  searchSheetNames: async (search = "", limit = 10) => {
    try {
      const sheets = await prisma.forexSheet.findMany({
        where: {
          name: { contains: search, mode: 'insensitive' },
          status: 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
          description: true,
          baseCurrency: true,
          tags: true,
          _count: {
            select: { entries: true },
          },
        },
        take: parseInt(limit),
        orderBy: { name: 'asc' },
      });
      
      return sheets;
    } catch (error) {
      console.error("Error searching sheet names:", error);
      throw error;
    }
  },
  
  // Export sheet to Excel
  exportSheetToExcel: async (sheetId) => {
    try {
      const sheet = await prisma.forexSheet.findUnique({
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
        "Date": new Date(entry.date).toLocaleDateString(),
        "Particulars": entry.particulars,
        "Reference": entry.reference || "",
        "Category": entry.category || "",
        "Debit RMB": entry.debitRMB || "",
        "Credit RMB": entry.creditRMB || "",
        "Balance RMB": entry.rmbBalance,
        "Debit USD": entry.debitUSD || "",
        "Credit USD": entry.creditUSD || "",
        "Balance USD": entry.usdBalance,
        "Debit EUR": entry.debitEUR || "",
        "Credit EUR": entry.creditEUR || "",
        "Balance EUR": entry.eurBalance,
        "Debit GBP": entry.debitGBP || "",
        "Credit GBP": entry.creditGBP || "",
        "Balance GBP": entry.gbpBalance,
        "Debit JPY": entry.debitJPY || "",
        "Credit JPY": entry.creditJPY || "",
        "Balance JPY": entry.jpyBalance,
        "Debit Other": entry.debitOther || "",
        "Credit Other": entry.creditOther || "",
        "Balance Other": entry.otherBalance,
        "Other Currency": entry.otherCurrencyCode || "",
        "Notes": entry.notes || "",
      }));
      
      return {
        sheet,
        entries: excelData,
      };
    } catch (error) {
      console.error("Error exporting sheet:", error);
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
        prisma.forexSheet.count(),
        prisma.forexSheet.count({ where: { status: 'ACTIVE' } }),
        prisma.forexEntry.count(),
        prisma.forexSheet.findMany({
          where: { status: 'ACTIVE' },
          orderBy: { updatedAt: 'desc' },
          take: 5,
          include: {
            _count: {
              select: { entries: true },
            },
          },
        }),
      ]);
      
      // Get currency distribution
      const currencyStats = await prisma.forexSheet.groupBy({
        by: ['baseCurrency'],
        _count: {
          id: true,
        },
      });
      
      return {
        totals: {
          totalSheets,
          activeSheets,
          totalEntries,
        },
        currencyDistribution: currencyStats.map(stat => ({
          currency: stat.baseCurrency,
          count: stat._count.id,
        })),
        recentSheets,
      };
    } catch (error) {
      console.error("Error getting dashboard overview:", error);
      throw error;
    }
  },
};

module.exports = forexService;