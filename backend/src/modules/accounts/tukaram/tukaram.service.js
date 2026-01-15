const { prisma } = require("../../../database/prisma");

const tukaramService = {
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
        prisma.tukaramSheet.findMany({
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
        prisma.tukaramSheet.count({ where }),
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
      const sheet = await prisma.tukaramSheet.findUnique({
        where: { id: sheetId },
        include: {
          entries: {
            orderBy: { loadingDate: 'desc' },
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
          totalCharges: acc.totalCharges + (entry.charges || 0),
          totalScanning: acc.totalScanning + (entry.scanning || 0),
          totalDc: acc.totalDc + (entry.dc || 0),
          totalPayable: acc.totalPayable + (entry.total || 0),
          totalPaid: acc.totalPaid + (entry.paid || 0),
          totalBalance: acc.totalBalance + (entry.balance || 0),
        }),
        { totalCharges: 0, totalScanning: 0, totalDc: 0, totalPayable: 0, totalPaid: 0, totalBalance: 0 }
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
      const { title, description, month, year, tags = [], openingBalance = 0 } = sheetData;
      
      // Generate default title if not provided
      let finalTitle = title;
      if (!finalTitle) {
        finalTitle = tukaramService.generateDefaultTitle();
      }
      
      // Check if title already exists
      const existingSheet = await prisma.tukaramSheet.findUnique({
        where: { title: finalTitle },
      });
      
      if (existingSheet) {
        // Append number if title exists
        let counter = 1;
        let newTitle = `${finalTitle} (${counter})`;
        while (await prisma.tukaramSheet.findUnique({ where: { title: newTitle } })) {
          counter++;
          newTitle = `${finalTitle} (${counter})`;
        }
        finalTitle = newTitle;
      }
      
      // Determine month and year from title or current date
      const now = new Date();
      const finalMonth = month || now.getMonth() + 1;
      const finalYear = year || now.getFullYear();
      
      const sheet = await prisma.tukaramSheet.create({
        data: {
          title: finalTitle,
          description: description || null,
          month: finalMonth,
          year: finalYear,
          tags: tags || [],
          openingBalance: parseFloat(openingBalance) || 0,
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
      const { title, description, status, isLocked, tags, openingBalance } = sheetData;
      
      // If updating title, check uniqueness
      if (title) {
        const existingSheet = await prisma.tukaramSheet.findFirst({
          where: {
            title,
            id: { not: sheetId },
          },
        });
        
        if (existingSheet) {
          throw new Error("Title already exists");
        }
      }
      
      const updateData = {
        ...(title && { title }),
        ...(description !== undefined && { description: description || null }),
        ...(status && { status }),
        ...(isLocked !== undefined && { isLocked }),
        ...(tags && { tags }),
        ...(openingBalance !== undefined && { openingBalance: parseFloat(openingBalance) || 0 }),
        updatedBy: userId.toString(),
        updatedAt: new Date(),
      };
      
      const sheet = await prisma.tukaramSheet.update({
        where: { id: sheetId },
        data: updateData,
      });
      
      return sheet;
    } catch (error) {
      console.error("Error updating sheet:", error);
      throw error;
    }
  },
  
  // Delete sheet (archive)
  deleteSheet: async (sheetId, userId) => {
    try {
      const sheet = await prisma.tukaramSheet.update({
        where: { id: sheetId },
        data: {
          status: 'ARCHIVED',
          updatedBy: userId.toString(),
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
  getSheetEntries: async (sheetId, { page = 1, limit = 50, search = "", containerCode }) => {
    try {
      const skip = (page - 1) * limit;
      
      const where = {
        sheetId,
      };
      
      if (search) {
        where.OR = [
          { containerCode: { contains: search, mode: 'insensitive' } },
          { particular: { contains: search, mode: 'insensitive' } },
          { note: { contains: search, mode: 'insensitive' } },
        ];
      }
      
      if (containerCode) {
        where.containerCode = { contains: containerCode, mode: 'insensitive' };
      }
      
      const [entries, total] = await Promise.all([
        prisma.tukaramSheetEntry.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: [
            { loadingDate: 'desc' },
            { createdAt: 'desc' },
          ],
        }),
        prisma.tukaramSheetEntry.count({ where }),
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
        containerCode,
        totalCtn,
        loadingDate,
        deliveryDate,
        particular,
        charges,
        scanning,
        dc,
        total,
        paid,
        paymentDate,
        note,
      } = entryData;
      
      // Calculate total if not provided
      let finalTotal = total;
      if (!finalTotal) {
        finalTotal = (parseFloat(charges) || 0) + (parseFloat(scanning) || 0) + (parseFloat(dc) || 0);
      }
      
      // Calculate balance
      const balance = (finalTotal || 0) - (paid || 0);
      
      const entry = await prisma.tukaramSheetEntry.create({
        data: {
          sheetId,
          containerCode: containerCode || "",
          totalCtn: parseInt(totalCtn) || 0,
          loadingDate: loadingDate ? new Date(loadingDate) : null,
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
          particular: particular || null,
          charges: parseFloat(charges) || 0,
          scanning: parseFloat(scanning) || 0,
          dc: parseFloat(dc) || 0,
          total: finalTotal || 0,
          paid: parseFloat(paid) || 0,
          paymentDate: paymentDate ? new Date(paymentDate) : null,
          note: note || null,
          balance,
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
        containerCode,
        totalCtn,
        loadingDate,
        deliveryDate,
        particular,
        charges,
        scanning,
        dc,
        total,
        paid,
        paymentDate,
        note,
      } = entryData;
      
      // Calculate total if not provided
      let finalTotal = total;
      if (finalTotal === undefined) {
        const chargesVal = charges !== undefined ? parseFloat(charges) || 0 : 0;
        const scanningVal = scanning !== undefined ? parseFloat(scanning) || 0 : 0;
        const dcVal = dc !== undefined ? parseFloat(dc) || 0 : 0;
        finalTotal = chargesVal + scanningVal + dcVal;
      }
      
      // Calculate balance
      const balance = (finalTotal || 0) - (paid || 0);
      
      const updateData = {};
      if (containerCode !== undefined) updateData.containerCode = containerCode;
      if (totalCtn !== undefined) updateData.totalCtn = parseInt(totalCtn) || 0;
      if (loadingDate !== undefined) updateData.loadingDate = loadingDate ? new Date(loadingDate) : null;
      if (deliveryDate !== undefined) updateData.deliveryDate = deliveryDate ? new Date(deliveryDate) : null;
      if (particular !== undefined) updateData.particular = particular || null;
      if (charges !== undefined) updateData.charges = parseFloat(charges) || 0;
      if (scanning !== undefined) updateData.scanning = parseFloat(scanning) || 0;
      if (dc !== undefined) updateData.dc = parseFloat(dc) || 0;
      if (finalTotal !== undefined) updateData.total = finalTotal || 0;
      if (paid !== undefined) updateData.paid = parseFloat(paid) || 0;
      if (paymentDate !== undefined) updateData.paymentDate = paymentDate ? new Date(paymentDate) : null;
      if (note !== undefined) updateData.note = note || null;
      if (balance !== undefined) updateData.balance = balance;
      
      updateData.updatedBy = userId.toString();
      updateData.updatedAt = new Date();
      
      const entry = await prisma.tukaramSheetEntry.update({
        where: { id: entryId },
        data: updateData,
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
      await prisma.tukaramSheetEntry.delete({
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
            containerCode,
            totalCtn,
            loadingDate,
            deliveryDate,
            particular,
            charges,
            scanning,
            dc,
            total,
            paid,
            paymentDate,
            note,
          } = entryData;
          
          // Calculate total if not provided
          let finalTotal = total;
          if (!finalTotal) {
            finalTotal = (parseFloat(charges) || 0) + (parseFloat(scanning) || 0) + (parseFloat(dc) || 0);
          }
          
          // Calculate balance
          const balance = (finalTotal || 0) - (paid || 0);
          
          return prisma.tukaramSheetEntry.create({
            data: {
              sheetId,
              containerCode: containerCode || "",
              totalCtn: parseInt(totalCtn) || 0,
              loadingDate: loadingDate ? new Date(loadingDate) : null,
              deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
              particular: particular || null,
              charges: parseFloat(charges) || 0,
              scanning: parseFloat(scanning) || 0,
              dc: parseFloat(dc) || 0,
              total: finalTotal || 0,
              paid: parseFloat(paid) || 0,
              paymentDate: paymentDate ? new Date(paymentDate) : null,
              note: note || null,
              balance,
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
      const sheet = await prisma.tukaramSheet.findUnique({
        where: { id: sheetId },
        include: {
          entries: true,
        },
      });
      
      if (!sheet) {
        throw new Error("Sheet not found");
      }
      
      const entries = sheet.entries;
      
      // Calculate various stats
      const totalCharges = entries.reduce((sum, entry) => sum + (entry.charges || 0), 0);
      const totalScanning = entries.reduce((sum, entry) => sum + (entry.scanning || 0), 0);
      const totalDc = entries.reduce((sum, entry) => sum + (entry.dc || 0), 0);
      const totalPayable = entries.reduce((sum, entry) => sum + (entry.total || 0), 0);
      const totalPaid = entries.reduce((sum, entry) => sum + (entry.paid || 0), 0);
      const totalBalance = entries.reduce((sum, entry) => sum + (entry.balance || 0), 0);
      
      // Container breakdown
      const containerStats = await prisma.tukaramSheetEntry.groupBy({
        by: ['containerCode'],
        where: { sheetId },
        _sum: {
          total: true,
          paid: true,
          balance: true,
          totalCtn: true,
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
          openingBalance: sheet.openingBalance,
          totalCharges,
          totalScanning,
          totalDc,
          totalPayable,
          totalPaid,
          totalBalance,
          finalBalance: sheet.openingBalance + totalBalance,
          entryCount: entries.length,
        },
        topContainers: containerStats.map(stat => ({
          containerCode: stat.containerCode,
          total: stat._sum.total || 0,
          paid: stat._sum.paid || 0,
          balance: stat._sum.balance || 0,
          totalCtn: stat._sum.totalCtn || 0,
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
      const sheet = await prisma.tukaramSheet.findUnique({
        where: { id: sheetId },
        include: {
          entries: {
            orderBy: { loadingDate: 'desc' },
          },
        },
      });
      
      if (!sheet) {
        throw new Error("Sheet not found");
      }
      
      // Prepare data for Excel matching the image format
      const excelData = [
        {
          "SR NO.": "",
          "CONT CODE": "",
          "TOTAL CTN": "",
          "LOADING DATE": "",
          "DLY DATE": "",
          "PARTICULAR": "",
          "CHARGES": "",
          "SCANNING": "",
          "DC": "",
          "TOTAL": "",
          "PAID": "",
          "DATE": "",
          "NOTE": ""
        },
        {
          "SR NO.": "",
          "CONT CODE": "OPENING BALANCE",
          "TOTAL CTN": "",
          "LOADING DATE": "",
          "DLY DATE": "",
          "PARTICULAR": "",
          "CHARGES": "",
          "SCANNING": "",
          "DC": "",
          "TOTAL": "",
          "PAID": sheet.openingBalance || 0,
          "DATE": "",
          "NOTE": ""
        },
        ...sheet.entries.map((entry, index) => ({
          "SR NO.": index + 1,
          "CONT CODE": entry.containerCode,
          "TOTAL CTN": entry.totalCtn,
          "LOADING DATE": entry.loadingDate ? new Date(entry.loadingDate).toLocaleDateString('en-GB') : "",
          "DLY DATE": entry.deliveryDate ? new Date(entry.deliveryDate).toLocaleDateString('en-GB') : "",
          "PARTICULAR": entry.particular || "",
          "CHARGES": entry.charges || 0,
          "SCANNING": entry.scanning || 0,
          "DC": entry.dc || 0,
          "TOTAL": entry.total || 0,
          "PAID": entry.paid || 0,
          "DATE": entry.paymentDate ? new Date(entry.paymentDate).toLocaleDateString('en-GB') : "",
          "NOTE": entry.note || ""
        }))
      ];
      
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
        prisma.tukaramSheet.count(),
        prisma.tukaramSheet.count({ where: { status: 'ACTIVE' } }),
        prisma.tukaramSheet.count({ where: { status: 'ARCHIVED' } }),
        prisma.tukaramSheetEntry.count(),
        prisma.tukaramSheet.findMany({
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
      
      const currentMonthSheet = await prisma.tukaramSheet.findFirst({
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

module.exports = tukaramService;
