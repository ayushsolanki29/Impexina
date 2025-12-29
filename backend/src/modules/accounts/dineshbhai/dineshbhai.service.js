const { prisma } = require("../../../database/prisma");

const dineshbhaiService = {
  // Generate default title (e.g., "December 2025")
  generateDefaultTitle: () => {
    const now = new Date();
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  },

  // Get all sheets with pagination
  getAllSheets: async ({ page = 1, limit = 20, search = "", year, month, status }) => {
    try {
      const skip = (page - 1) * limit;
      
      const where = {};
      
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } },
        ];
      }
      
      if (year) {
        where.year = parseInt(year);
      }
      
      if (month) {
        where.month = parseInt(month);
      }
      
      if (status) {
        where.status = status;
      }
      
      const [sheets, total] = await Promise.all([
        prisma.dineshSheet.findMany({
          where,
          skip,
          take: parseInt(limit),
          include: {
            _count: {
              select: { entries: true },
            },
            entries: {
              select: {
                total: true,
                paid: true,
              },
              take: 1,
            },
          },
          orderBy: [
            { year: 'desc' },
            { month: 'desc' },
            { updatedAt: 'desc' },
          ],
        }),
        prisma.dineshSheet.count({ where }),
      ]);
      
      // Calculate summary for each sheet
      const sheetsWithSummary = sheets.map(sheet => {
        const entriesTotal = sheet.entries.reduce((sum, entry) => sum + (entry.total || 0), 0);
        const entriesPaid = sheet.entries.reduce((sum, entry) => sum + (entry.paid || 0), 0);
        
        return {
          ...sheet,
          summary: {
            totalPayable: entriesTotal,
            totalPaid: entriesPaid,
            balance: entriesTotal - entriesPaid,
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
      console.error("Error getting sheets:", error);
      throw error;
    }
  },
  
  // Get sheet by ID with entries
  getSheetById: async (sheetId) => {
    try {
      const sheet = await prisma.dineshSheet.findUnique({
        where: { id: sheetId },
        include: {
          entries: {
            orderBy: { paymentDate: 'desc' },
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
          totalPayable: acc.totalPayable + (entry.total || 0),
          totalPaid: acc.totalPaid + (entry.paid || 0),
          totalBalance: acc.totalBalance + (entry.balance || 0),
        }),
        { totalPayable: 0, totalPaid: 0, totalBalance: 0 }
      );
      
      return {
        ...sheet,
        totals,
      };
    } catch (error) {
      console.error("Error getting sheet:", error);
      throw error;
    }
  },
  
  // Create new sheet with default title
  createSheet: async (sheetData, userId) => {
    try {
      const { title, description, month, year, tags = [] } = sheetData;
      
      // Generate default title if not provided
      let finalTitle = title;
      if (!finalTitle) {
        finalTitle = dineshbhaiService.generateDefaultTitle();
      }
      
      // Check if title already exists
      const existingSheet = await prisma.dineshSheet.findUnique({
        where: { title: finalTitle },
      });
      
      if (existingSheet) {
        // Append number if title exists
        let counter = 1;
        let newTitle = `${finalTitle} (${counter})`;
        while (await prisma.dineshSheet.findUnique({ where: { title: newTitle } })) {
          counter++;
          newTitle = `${finalTitle} (${counter})`;
        }
        finalTitle = newTitle;
      }
      
      // Determine month and year from title or current date
      const now = new Date();
      const finalMonth = month || now.getMonth() + 1;
      const finalYear = year || now.getFullYear();
      
      const sheet = await prisma.dineshSheet.create({
        data: {
          title: finalTitle,
          description: description || null,
          month: finalMonth,
          year: finalYear,
          tags: tags || [],
          status: 'ACTIVE',
          createdBy: userId.toString(),
        },
      });
      
      return sheet;
    } catch (error) {
      console.error("Error creating sheet:", error);
      throw error;
    }
  },
  
  // Update sheet details
  updateSheet: async (sheetId, sheetData, userId) => {
    try {
      const { title, description, status, isLocked, tags } = sheetData;
      
      // If updating title, check uniqueness
      if (title) {
        const existingSheet = await prisma.dineshSheet.findFirst({
          where: {
            title,
            NOT: { id: sheetId },
          },
        });
        
        if (existingSheet) {
          throw new Error("Sheet with this title already exists");
        }
      }
      
      const sheet = await prisma.dineshSheet.update({
        where: { id: sheetId },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(status && { status }),
          ...(isLocked !== undefined && { isLocked }),
          ...(tags && { tags }),
          updatedBy: userId.toString(),
          updatedAt: new Date(),
        },
      });
      
      return sheet;
    } catch (error) {
      console.error("Error updating sheet:", error);
      throw error;
    }
  },
  
  // Delete sheet (soft delete by changing status to ARCHIVED)
  deleteSheet: async (sheetId, userId) => {
    try {
      // Instead of deleting, mark as archived
      const sheet = await prisma.dineshSheet.update({
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
      console.error("Error deleting sheet:", error);
      throw error;
    }
  },
  
  // Get sheet entries
  getSheetEntries: async (sheetId, { page = 1, limit = 50, search = "", supplier, isPaid }) => {
    try {
      const skip = (page - 1) * limit;
      
      const where = {
        sheetId,
      };
      
      if (search) {
        where.OR = [
          { supplier: { contains: search, mode: 'insensitive' } },
          { clientRef: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
        ];
      }
      
      if (supplier) {
        where.supplier = { contains: supplier, mode: 'insensitive' };
      }
      
      if (isPaid !== undefined) {
        where.isPaid = isPaid === 'true';
      }
      
      const [entries, total] = await Promise.all([
        prisma.dineshSheetEntry.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: [
            { paymentDate: 'desc' },
            { createdAt: 'desc' },
          ],
        }),
        prisma.dineshSheetEntry.count({ where }),
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
        supplier,
        paymentDate,
        amount,
        booking,
        rate,
        total,
        paid,
        clientRef,
        notes,
        priority,
      } = entryData;
      
      // Calculate total if not provided
      let finalTotal = total;
      if (!finalTotal && booking && rate) {
        finalTotal = parseFloat(booking) * parseFloat(rate);
      }
      
      // Calculate balance
      const balance = (finalTotal || 0) - (paid || 0);
      
      const entry = await prisma.dineshSheetEntry.create({
        data: {
          sheetId,
          supplier,
          paymentDate: new Date(paymentDate),
          amount: amount ? parseFloat(amount) : null,
          booking: booking ? parseFloat(booking) : null,
          rate: rate ? parseFloat(rate) : null,
          total: finalTotal || 0,
          paid: paid ? parseFloat(paid) : null,
          balance,
          clientRef: clientRef || null,
          notes: notes || null,
          priority: priority || null,
          isPaid: balance <= 0,
          createdBy: userId.toString(),
        },
      });
      
      return entry;
    } catch (error) {
      console.error("Error adding entry:", error);
      throw error;
    }
  },
  
  // Update entry
  updateEntry: async (entryId, entryData, userId) => {
    try {
      const {
        supplier,
        paymentDate,
        amount,
        booking,
        rate,
        total,
        paid,
        clientRef,
        notes,
        priority,
      } = entryData;
      
      // Calculate total if not provided but booking and rate are
      let finalTotal = total;
      if (!finalTotal && booking !== undefined && rate !== undefined) {
        const bookingVal = booking ? parseFloat(booking) : 0;
        const rateVal = rate ? parseFloat(rate) : 0;
        finalTotal = bookingVal * rateVal;
      }
      
      // Calculate balance
      const balance = (finalTotal || 0) - (paid || 0);
      
      const entry = await prisma.dineshSheetEntry.update({
        where: { id: entryId },
        data: {
          ...(supplier && { supplier }),
          ...(paymentDate && { paymentDate: new Date(paymentDate) }),
          ...(amount !== undefined && { amount: amount ? parseFloat(amount) : null }),
          ...(booking !== undefined && { booking: booking ? parseFloat(booking) : null }),
          ...(rate !== undefined && { rate: rate ? parseFloat(rate) : null }),
          ...(finalTotal !== undefined && { total: finalTotal || 0 }),
          ...(paid !== undefined && { paid: paid ? parseFloat(paid) : null }),
          ...(balance !== undefined && { balance }),
          ...(clientRef !== undefined && { clientRef }),
          ...(notes !== undefined && { notes }),
          ...(priority !== undefined && { priority }),
          ...(balance !== undefined && { isPaid: balance <= 0 }),
          updatedBy: userId.toString(),
          updatedAt: new Date(),
        },
      });
      
      return entry;
    } catch (error) {
      console.error("Error updating entry:", error);
      throw error;
    }
  },
  
  // Delete entry
  deleteEntry: async (entryId, userId) => {
    try {
      await prisma.dineshSheetEntry.delete({
        where: { id: entryId },
      });
      
      return {
        message: "Entry deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting entry:", error);
      throw error;
    }
  },
  
  // Bulk import entries
  importEntries: async (sheetId, entriesData, userId) => {
    try {
      const entries = await prisma.$transaction(
        entriesData.map(entryData => {
          const {
            supplier,
            paymentDate,
            amount,
            booking,
            rate,
            total,
            paid,
            clientRef,
            notes,
            priority,
          } = entryData;
          
          // Calculate total if not provided
          let finalTotal = total;
          if (!finalTotal && booking && rate) {
            finalTotal = parseFloat(booking) * parseFloat(rate);
          }
          
          // Calculate balance
          const balance = (finalTotal || 0) - (paid || 0);
          
          return prisma.dineshSheetEntry.create({
            data: {
              sheetId,
              supplier,
              paymentDate: new Date(paymentDate),
              amount: amount ? parseFloat(amount) : null,
              booking: booking ? parseFloat(booking) : null,
              rate: rate ? parseFloat(rate) : null,
              total: finalTotal || 0,
              paid: paid ? parseFloat(paid) : null,
              balance,
              clientRef: clientRef || null,
              notes: notes || null,
              priority: priority || null,
              isPaid: balance <= 0,
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
      console.error("Error importing entries:", error);
      throw error;
    }
  },
  
  // Get sheet statistics
  getSheetStats: async (sheetId) => {
    try {
      const entries = await prisma.dineshSheetEntry.findMany({
        where: { sheetId },
        select: {
          total: true,
          paid: true,
          balance: true,
          isPaid: true,
          paymentDate: true,
          supplier: true,
        },
      });
      
      // Calculate various stats
      const totalPayable = entries.reduce((sum, entry) => sum + (entry.total || 0), 0);
      const totalPaid = entries.reduce((sum, entry) => sum + (entry.paid || 0), 0);
      const totalBalance = entries.reduce((sum, entry) => sum + (entry.balance || 0), 0);
      const paidCount = entries.filter(entry => entry.isPaid).length;
      const pendingCount = entries.filter(entry => !entry.isPaid).length;
      
      // Monthly breakdown
      const monthlyBreakdown = entries.reduce((acc, entry) => {
        const date = new Date(entry.paymentDate);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthYear]) {
          acc[monthYear] = {
            total: 0,
            paid: 0,
            balance: 0,
            count: 0,
          };
        }
        
        acc[monthYear].total += entry.total || 0;
        acc[monthYear].paid += entry.paid || 0;
        acc[monthYear].balance += entry.balance || 0;
        acc[monthYear].count += 1;
        
        return acc;
      }, {});
      
      // Supplier breakdown
      const supplierStats = await prisma.dineshSheetEntry.groupBy({
        by: ['supplier'],
        where: { sheetId },
        _sum: {
          total: true,
          paid: true,
          balance: true,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _sum: {
            total: 'desc',
          },
        },
        take: 10,
      });
      
      return {
        totals: {
          totalPayable,
          totalPaid,
          totalBalance,
          entryCount: entries.length,
          paidCount,
          pendingCount,
        },
        monthlyBreakdown: Object.entries(monthlyBreakdown).map(([monthYear, data]) => ({
          monthYear,
          ...data,
        })),
        topSuppliers: supplierStats.map(stat => ({
          supplier: stat.supplier,
          total: stat._sum.total || 0,
          paid: stat._sum.paid || 0,
          balance: stat._sum.balance || 0,
          count: stat._count.id,
        })),
      };
    } catch (error) {
      console.error("Error getting sheet stats:", error);
      throw error;
    }
  },
  
  // Export sheet to Excel
  exportSheetToExcel: async (sheetId) => {
    try {
      const sheet = await prisma.dineshSheet.findUnique({
        where: { id: sheetId },
        include: {
          entries: {
            orderBy: { paymentDate: 'desc' },
          },
        },
      });
      
      if (!sheet) {
        throw new Error("Sheet not found");
      }
      
      // Prepare data for Excel
      const excelData = sheet.entries.map((entry, index) => ({
        "S.No": index + 1,
        "Supplier": entry.supplier,
        "Payment Date": new Date(entry.paymentDate).toLocaleDateString(),
        "Amount": entry.amount || "",
        "Booking": entry.booking || "",
        "Rate": entry.rate || "",
        "Total": entry.total,
        "Paid": entry.paid || "",
        "Balance": entry.balance,
        "Client Ref": entry.clientRef || "",
        "Notes": entry.notes || "",
        "Status": entry.isPaid ? "Paid" : "Pending",
        "Priority": entry.priority || "MEDIUM",
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
        archivedSheets,
        totalEntries,
        recentSheets,
      ] = await Promise.all([
        prisma.dineshSheet.count(),
        prisma.dineshSheet.count({ where: { status: 'ACTIVE' } }),
        prisma.dineshSheet.count({ where: { status: 'ARCHIVED' } }),
        prisma.dineshSheetEntry.count(),
        prisma.dineshSheet.findMany({
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
      
      // Get monthly sheets
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      const currentMonthSheet = await prisma.dineshSheet.findFirst({
        where: {
          year: currentYear,
          month: currentMonth,
          status: 'ACTIVE',
        },
        include: {
          entries: {
            select: {
              total: true,
              paid: true,
            },
          },
        },
      });
      
      let currentMonthTotal = 0;
      let currentMonthPaid = 0;
      
      if (currentMonthSheet) {
        currentMonthTotal = currentMonthSheet.entries.reduce((sum, entry) => sum + (entry.total || 0), 0);
        currentMonthPaid = currentMonthSheet.entries.reduce((sum, entry) => sum + (entry.paid || 0), 0);
      }
      
      return {
        totals: {
          totalSheets,
          activeSheets,
          archivedSheets,
          totalEntries,
        },
        currentMonth: {
          sheet: currentMonthSheet,
          total: currentMonthTotal,
          paid: currentMonthPaid,
          balance: currentMonthTotal - currentMonthPaid,
        },
        recentSheets,
      };
    } catch (error) {
      console.error("Error getting dashboard overview:", error);
      throw error;
    }
  },
};

module.exports = dineshbhaiService;