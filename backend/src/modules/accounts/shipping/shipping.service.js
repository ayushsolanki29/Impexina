const { prisma } = require("../../../database/prisma");
const XLSX = require("xlsx");

const shippingService = {
  // Generate default sheet name
  generateDefaultName: () => {
    const now = new Date();
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `Shipping Ledger - ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
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
        prisma.shippingSheet.findMany({
          where,
          skip,
          take: parseInt(limit),
          include: {
            _count: {
              select: { entries: true },
            },
            entries: {
              select: {
                freightINR: true,
                localCharges: true,
                totalAmount: true,
              },
              take: 5, // Just for summary calculation
            },
          },
          orderBy: [
            { updatedAt: 'desc' },
          ],
        }),
        prisma.shippingSheet.count({ where }),
      ]);
      
      // Calculate summary for each sheet
      const sheetsWithSummary = sheets.map(sheet => {
        const totals = sheet.entries.reduce(
          (acc, entry) => ({
            totalFreightINR: acc.totalFreightINR + (entry.freightINR || 0),
            totalLocalCharges: acc.totalLocalCharges + (entry.localCharges || 0),
            totalAmount: acc.totalAmount + (entry.totalAmount || 0),
          }),
          { totalFreightINR: 0, totalLocalCharges: 0, totalAmount: 0 }
        );
        
        return {
          ...sheet,
          summary: {
            ...totals,
            entryCount: sheet._count.entries,
            containerCount: sheet.entries.length,
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
      console.error("Error getting shipping sheets:", error);
      throw error;
    }
  },
  
  // Get sheet by ID with entries
  getSheetById: async (sheetId) => {
    try {
      const sheet = await prisma.shippingSheet.findUnique({
        where: { id: sheetId },
        include: {
          entries: {
            orderBy: [
              { loadingDate: 'desc' },
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
      
      // Calculate totals from entries (for verification)
      const calculatedTotals = sheet.entries.reduce(
        (acc, entry) => ({
          totalFreightINR: acc.totalFreightINR + (entry.freightINR || 0),
          totalLocalCharges: acc.totalLocalCharges + (entry.localCharges || 0),
          totalAmount: acc.totalAmount + (entry.totalAmount || 0),
        }),
        { totalFreightINR: 0, totalLocalCharges: 0, totalAmount: 0 }
      );
      
      // Status breakdown
      const statusStats = sheet.entries.reduce((acc, entry) => {
        acc[entry.deliveryStatus] = (acc[entry.deliveryStatus] || 0) + 1;
        return acc;
      }, {});
      
      return {
        ...sheet,
        calculatedTotals,
        stats: {
          ...statusStats,
          entryCount: sheet._count.entries,
        },
      };
    } catch (error) {
      console.error("Error getting shipping sheet:", error);
      throw error;
    }
  },
  
  // Create new sheet
  createSheet: async (sheetData, userId) => {
    try {
      const { name, description, fiscalYear, tags = [] } = sheetData;
      
      // Generate default name if not provided
      let finalName = name;
      if (!finalName) {
        finalName = shippingService.generateDefaultName();
      }
      
      // Check if name already exists
      const existingSheet = await prisma.shippingSheet.findUnique({
        where: { name: finalName },
      });
      
      if (existingSheet) {
        // Append number if name exists
        let counter = 1;
        let newName = `${finalName} (${counter})`;
        while (await prisma.shippingSheet.findUnique({ where: { name: newName } })) {
          counter++;
          newName = `${finalName} (${counter})`;
        }
        finalName = newName;
      }
      
      // Determine fiscal year if not provided
      const currentYear = new Date().getFullYear();
      const finalFiscalYear = fiscalYear || `${currentYear}-${currentYear + 1}`;
      
      const sheet = await prisma.shippingSheet.create({
        data: {
          name: finalName,
          description: description || null,
          fiscalYear: finalFiscalYear,
          tags: tags || [],
          status: 'PLANNED',
          createdBy: userId.toString(),
        },
      });
      
      return sheet;
    } catch (error) {
      console.error("Error creating shipping sheet:", error);
      throw error;
    }
  },
  
  // Update sheet details
  updateSheet: async (sheetId, sheetData, userId) => {
    try {
      const { name, description, status, isLocked, tags, fiscalYear } = sheetData;
      
      // If updating name, check uniqueness
      if (name) {
        const existingSheet = await prisma.shippingSheet.findFirst({
          where: {
            name,
            NOT: { id: sheetId },
          },
        });
        
        if (existingSheet) {
          throw new Error("Sheet with this name already exists");
        }
      }
      
      const sheet = await prisma.shippingSheet.update({
        where: { id: sheetId },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(status && { status }),
          ...(isLocked !== undefined && { isLocked }),
          ...(tags && { tags }),
          ...(fiscalYear && { fiscalYear }),
          updatedBy: userId.toString(),
          updatedAt: new Date(),
        },
      });
      
      return sheet;
    } catch (error) {
      console.error("Error updating shipping sheet:", error);
      throw error;
    }
  },
  
  // Delete sheet (soft delete by changing status)
  deleteSheet: async (sheetId, userId) => {
    try {
      const sheet = await prisma.shippingSheet.update({
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
      console.error("Error deleting shipping sheet:", error);
      throw error;
    }
  },
  
  // Get sheet entries
  getSheetEntries: async (sheetId, { page = 1, limit = 50, search = "", status }) => {
    try {
      const skip = (page - 1) * limit;
      
      const where = {
        sheetId,
      };
      
      if (search) {
        where.OR = [
          { containerCode: { contains: search, mode: 'insensitive' } },
          { loadingFrom: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
        ];
      }
      
      if (status) {
        where.deliveryStatus = status;
      }
      
      const [entries, total] = await Promise.all([
        prisma.shippingEntry.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: [
            { loadingDate: 'desc' },
            { createdAt: 'desc' },
          ],
        }),
        prisma.shippingEntry.count({ where }),
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
        loadingFrom = "YIWU / GUANGZHOU / FULL",
        ctn = 0,
        loadingDate,
        deliveryDate,
        freightUSD = 0,
        freightINR = 0,
        cha = 0,
        fobTerms = 0,
        cfsDoYard = 0,
        scanning = 0,
        simsPims = 0,
        duty = 0,
        penalty = 0,
        trucking = 0,
        loadingUnloading = 0,
        notes,
        shippingLine,
        blNumber,
        deliveryStatus = "PENDING",
      } = entryData;
      
      // Calculate local charges
      const localCharges = (cha || 0) + (fobTerms || 0) + (cfsDoYard || 0) + 
                          (scanning || 0) + (simsPims || 0) + (duty || 0) + 
                          (penalty || 0) + (trucking || 0) + (loadingUnloading || 0);
      
      // Calculate total amount
      const totalAmount = (freightINR || 0) + localCharges;
      
      const entry = await prisma.shippingEntry.create({
        data: {
          sheetId,
          containerCode: containerCode || "",
          loadingFrom,
          ctn: parseInt(ctn) || 0,
          loadingDate: loadingDate ? new Date(loadingDate) : new Date(),
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
          freightUSD: parseFloat(freightUSD) || 0,
          freightINR: parseFloat(freightINR) || 0,
          cha: parseFloat(cha) || 0,
          fobTerms: parseFloat(fobTerms) || 0,
          cfsDoYard: parseFloat(cfsDoYard) || 0,
          scanning: parseFloat(scanning) || 0,
          simsPims: parseFloat(simsPims) || 0,
          duty: parseFloat(duty) || 0,
          penalty: parseFloat(penalty) || 0,
          trucking: parseFloat(trucking) || 0,
          loadingUnloading: parseFloat(loadingUnloading) || 0,
          localCharges,
          totalAmount,
          notes: notes || null,
          shippingLine: shippingLine || null,
          blNumber: blNumber || null,
          deliveryStatus,
          createdBy: userId.toString(),
        },
      });
      
      // Update sheet totals
      await shippingService.updateSheetTotals(sheetId);
      
      return entry;
    } catch (error) {
      console.error("Error adding shipping entry:", error);
      throw error;
    }
  },
  
  // Update entry
  updateEntry: async (entryId, entryData, userId) => {
    try {
      const {
        containerCode,
        loadingFrom,
        ctn,
        loadingDate,
        deliveryDate,
        freightUSD,
        freightINR,
        cha,
        fobTerms,
        cfsDoYard,
        scanning,
        simsPims,
        duty,
        penalty,
        trucking,
        loadingUnloading,
        notes,
        shippingLine,
        blNumber,
        deliveryStatus,
      } = entryData;
      
      // Get current entry to know sheetId
      const currentEntry = await prisma.shippingEntry.findUnique({
        where: { id: entryId },
        select: { sheetId: true },
      });
      
      if (!currentEntry) {
        throw new Error("Entry not found");
      }
      
      // Calculate local charges and total if any charge field changed
      let localCharges;
      let totalAmount;
      
      const chargeFields = ['cha', 'fobTerms', 'cfsDoYard', 'scanning', 'simsPims', 'duty', 'penalty', 'trucking', 'loadingUnloading'];
      const hasChargeChange = chargeFields.some(field => entryData[field] !== undefined);
      
      if (hasChargeChange || freightINR !== undefined) {
        const entry = await prisma.shippingEntry.findUnique({
          where: { id: entryId },
          select: {
            freightINR: true,
            cha: true,
            fobTerms: true,
            cfsDoYard: true,
            scanning: true,
            simsPims: true,
            duty: true,
            penalty: true,
            trucking: true,
            loadingUnloading: true,
          },
        });
        
        const finalFreightINR = freightINR !== undefined ? parseFloat(freightINR) || 0 : entry.freightINR;
        const finalCha = cha !== undefined ? parseFloat(cha) || 0 : entry.cha;
        const finalFobTerms = fobTerms !== undefined ? parseFloat(fobTerms) || 0 : entry.fobTerms;
        const finalCfsDoYard = cfsDoYard !== undefined ? parseFloat(cfsDoYard) || 0 : entry.cfsDoYard;
        const finalScanning = scanning !== undefined ? parseFloat(scanning) || 0 : entry.scanning;
        const finalSimsPims = simsPims !== undefined ? parseFloat(simsPims) || 0 : entry.simsPims;
        const finalDuty = duty !== undefined ? parseFloat(duty) || 0 : entry.duty;
        const finalPenalty = penalty !== undefined ? parseFloat(penalty) || 0 : entry.penalty;
        const finalTrucking = trucking !== undefined ? parseFloat(trucking) || 0 : entry.trucking;
        const finalLoadingUnloading = loadingUnloading !== undefined ? parseFloat(loadingUnloading) || 0 : entry.loadingUnloading;
        
        localCharges = finalCha + finalFobTerms + finalCfsDoYard + finalScanning + 
                      finalSimsPims + finalDuty + finalPenalty + finalTrucking + finalLoadingUnloading;
        totalAmount = finalFreightINR + localCharges;
      }
      
      const updateData = {
        ...(containerCode !== undefined && { containerCode }),
        ...(loadingFrom !== undefined && { loadingFrom }),
        ...(ctn !== undefined && { ctn: parseInt(ctn) || 0 }),
        ...(loadingDate !== undefined && { loadingDate: loadingDate ? new Date(loadingDate) : new Date() }),
        ...(deliveryDate !== undefined && { deliveryDate: deliveryDate ? new Date(deliveryDate) : null }),
        ...(freightUSD !== undefined && { freightUSD: parseFloat(freightUSD) || 0 }),
        ...(freightINR !== undefined && { freightINR: parseFloat(freightINR) || 0 }),
        ...(cha !== undefined && { cha: parseFloat(cha) || 0 }),
        ...(fobTerms !== undefined && { fobTerms: parseFloat(fobTerms) || 0 }),
        ...(cfsDoYard !== undefined && { cfsDoYard: parseFloat(cfsDoYard) || 0 }),
        ...(scanning !== undefined && { scanning: parseFloat(scanning) || 0 }),
        ...(simsPims !== undefined && { simsPims: parseFloat(simsPims) || 0 }),
        ...(duty !== undefined && { duty: parseFloat(duty) || 0 }),
        ...(penalty !== undefined && { penalty: parseFloat(penalty) || 0 }),
        ...(trucking !== undefined && { trucking: parseFloat(trucking) || 0 }),
        ...(loadingUnloading !== undefined && { loadingUnloading: parseFloat(loadingUnloading) || 0 }),
        ...(notes !== undefined && { notes }),
        ...(shippingLine !== undefined && { shippingLine }),
        ...(blNumber !== undefined && { blNumber }),
        ...(deliveryStatus !== undefined && { deliveryStatus }),
        ...(localCharges !== undefined && { localCharges }),
        ...(totalAmount !== undefined && { totalAmount }),
        updatedBy: userId.toString(),
        updatedAt: new Date(),
      };
      
      const entry = await prisma.shippingEntry.update({
        where: { id: entryId },
        data: updateData,
      });
      
      // Update sheet totals
      await shippingService.updateSheetTotals(currentEntry.sheetId);
      
      return entry;
    } catch (error) {
      console.error("Error updating shipping entry:", error);
      throw error;
    }
  },
  
  // Delete entry
  deleteEntry: async (entryId, userId) => {
    try {
      const entry = await prisma.shippingEntry.findUnique({
        where: { id: entryId },
        select: { sheetId: true },
      });
      
      if (!entry) {
        throw new Error("Entry not found");
      }
      
      await prisma.shippingEntry.delete({
        where: { id: entryId },
      });
      
      // Update sheet totals
      await shippingService.updateSheetTotals(entry.sheetId);
      
      return {
        message: "Entry deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting shipping entry:", error);
      throw error;
    }
  },
  
  // Bulk update entries (for saving entire sheet)
  bulkUpdateEntries: async (sheetId, entriesData, userId) => {
    try {
      // First, delete all existing entries
      await prisma.shippingEntry.deleteMany({
        where: { sheetId },
      });
      
      // Then create new entries
      const entries = await prisma.$transaction(
        entriesData.map(entryData => {
          const {
            containerCode,
            loadingFrom = "YIWU / GUANGZHOU / FULL",
            ctn = 0,
            loadingDate,
            deliveryDate,
            freightUSD = 0,
            freightINR = 0,
            cha = 0,
            fobTerms = 0,
            cfsDoYard = 0,
            scanning = 0,
            simsPims = 0,
            duty = 0,
            penalty = 0,
            trucking = 0,
            loadingUnloading = 0,
            notes,
            shippingLine,
            blNumber,
            deliveryStatus = "PENDING",
          } = entryData;
          
          // Calculate local charges
          const localCharges = (cha || 0) + (fobTerms || 0) + (cfsDoYard || 0) + 
                              (scanning || 0) + (simsPims || 0) + (duty || 0) + 
                              (penalty || 0) + (trucking || 0) + (loadingUnloading || 0);
          
          // Calculate total amount
          const totalAmount = (freightINR || 0) + localCharges;
          
          return prisma.shippingEntry.create({
            data: {
              sheetId,
              containerCode: containerCode || "",
              loadingFrom,
              ctn: parseInt(ctn) || 0,
              loadingDate: loadingDate ? new Date(loadingDate) : new Date(),
              deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
              freightUSD: parseFloat(freightUSD) || 0,
              freightINR: parseFloat(freightINR) || 0,
              cha: parseFloat(cha) || 0,
              fobTerms: parseFloat(fobTerms) || 0,
              cfsDoYard: parseFloat(cfsDoYard) || 0,
              scanning: parseFloat(scanning) || 0,
              simsPims: parseFloat(simsPims) || 0,
              duty: parseFloat(duty) || 0,
              penalty: parseFloat(penalty) || 0,
              trucking: parseFloat(trucking) || 0,
              loadingUnloading: parseFloat(loadingUnloading) || 0,
              localCharges,
              totalAmount,
              notes: notes || null,
              shippingLine: shippingLine || null,
              blNumber: blNumber || null,
              deliveryStatus,
              createdBy: userId.toString(),
            },
          });
        })
      );
      
      // Update sheet totals
      await shippingService.updateSheetTotals(sheetId);
      
      return {
        message: `${entries.length} entries updated successfully`,
        entries,
      };
    } catch (error) {
      console.error("Error bulk updating shipping entries:", error);
      throw error;
    }
  },
  
  // Helper: Update sheet totals
  updateSheetTotals: async (sheetId) => {
    try {
      const entries = await prisma.shippingEntry.findMany({
        where: { sheetId },
        select: {
          freightUSD: true,
          freightINR: true,
          cha: true,
          fobTerms: true,
          cfsDoYard: true,
          scanning: true,
          simsPims: true,
          duty: true,
          penalty: true,
          trucking: true,
          loadingUnloading: true,
          localCharges: true,
          totalAmount: true,
        },
      });
      
      const totals = entries.reduce(
        (acc, entry) => ({
          totalFreightUSD: acc.totalFreightUSD + (entry.freightUSD || 0),
          totalFreightINR: acc.totalFreightINR + (entry.freightINR || 0),
          totalCHA: acc.totalCHA + (entry.cha || 0),
          totalFobTerms: acc.totalFobTerms + (entry.fobTerms || 0),
          totalCfsDoYard: acc.totalCfsDoYard + (entry.cfsDoYard || 0),
          totalScanning: acc.totalScanning + (entry.scanning || 0),
          totalSimsPims: acc.totalSimsPims + (entry.simsPims || 0),
          totalDuty: acc.totalDuty + (entry.duty || 0),
          totalPenalty: acc.totalPenalty + (entry.penalty || 0),
          totalTrucking: acc.totalTrucking + (entry.trucking || 0),
          totalLoadingUnloading: acc.totalLoadingUnloading + (entry.loadingUnloading || 0),
          totalLocalCharges: acc.totalLocalCharges + (entry.localCharges || 0),
          grandTotal: acc.grandTotal + (entry.totalAmount || 0),
        }),
        {
          totalFreightUSD: 0,
          totalFreightINR: 0,
          totalCHA: 0,
          totalFobTerms: 0,
          totalCfsDoYard: 0,
          totalScanning: 0,
          totalSimsPims: 0,
          totalDuty: 0,
          totalPenalty: 0,
          totalTrucking: 0,
          totalLoadingUnloading: 0,
          totalLocalCharges: 0,
          grandTotal: 0,
        }
      );
      
      await prisma.shippingSheet.update({
        where: { id: sheetId },
        data: totals,
      });
      
      return totals;
    } catch (error) {
      console.error("Error updating shipping sheet totals:", error);
      throw error;
    }
  },
  
  // Get sheet statistics
  getSheetStats: async (sheetId) => {
    try {
      const sheet = await prisma.shippingSheet.findUnique({
        where: { id: sheetId },
        include: {
          entries: {
            select: {
              freightINR: true,
              localCharges: true,
              totalAmount: true,
              deliveryStatus: true,
              loadingDate: true,
              deliveryDate: true,
              ctn: true,
            },
          },
        },
      });
      
      if (!sheet) {
        throw new Error("Sheet not found");
      }
      
      // Calculate status statistics
      const statusStats = sheet.entries.reduce((acc, entry) => {
        acc[entry.deliveryStatus] = (acc[entry.deliveryStatus] || 0) + 1;
        return acc;
      }, {});
      
      // Calculate monthly breakdown
      const monthlyBreakdown = sheet.entries.reduce((acc, entry) => {
        const date = new Date(entry.loadingDate);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthYear]) {
          acc[monthYear] = {
            freightINR: 0,
            localCharges: 0,
            totalAmount: 0,
            containerCount: 0,
            ctnCount: 0,
          };
        }
        
        acc[monthYear].freightINR += entry.freightINR || 0;
        acc[monthYear].localCharges += entry.localCharges || 0;
        acc[monthYear].totalAmount += entry.totalAmount || 0;
        acc[monthYear].containerCount += 1;
        acc[monthYear].ctnCount += entry.ctn || 0;
        
        return acc;
      }, {});
      
      // Calculate average values
      const avgFreightINR = sheet.entries.length > 0 ? 
        sheet.entries.reduce((sum, entry) => sum + (entry.freightINR || 0), 0) / sheet.entries.length : 0;
      
      const avgLocalCharges = sheet.entries.length > 0 ? 
        sheet.entries.reduce((sum, entry) => sum + (entry.localCharges || 0), 0) / sheet.entries.length : 0;
      
      const avgTotal = sheet.entries.length > 0 ? 
        sheet.entries.reduce((sum, entry) => sum + (entry.totalAmount || 0), 0) / sheet.entries.length : 0;
      
      return {
        totals: {
          totalFreightINR: sheet.totalFreightINR,
          totalLocalCharges: sheet.totalLocalCharges,
          grandTotal: sheet.grandTotal,
          containerCount: sheet.entries.length,
          totalCTN: sheet.entries.reduce((sum, entry) => sum + (entry.ctn || 0), 0),
        },
        averages: {
          avgFreightINR,
          avgLocalCharges,
          avgTotal,
        },
        statusStats,
        monthlyBreakdown: Object.entries(monthlyBreakdown).map(([monthYear, data]) => ({
          monthYear,
          ...data,
        })),
      };
    } catch (error) {
      console.error("Error getting shipping sheet stats:", error);
      throw error;
    }
  },
  
  // Export sheet to Excel
  exportSheetToExcel: async (sheetId) => {
    try {
      const sheet = await prisma.shippingSheet.findUnique({
        where: { id: sheetId },
        include: {
          entries: {
            orderBy: [
              { loadingDate: 'desc' },
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
        "Container Code": entry.containerCode,
        "Loading From": entry.loadingFrom,
        "CTN Count": entry.ctn || 0,
        "Loading Date": entry.loadingDate ? new Date(entry.loadingDate).toLocaleDateString() : "",
        "Delivery Date": entry.deliveryDate ? new Date(entry.deliveryDate).toLocaleDateString() : "",
        "Freight (USD)": entry.freightUSD || 0,
        "Freight (INR)": entry.freightINR || 0,
        "CHA": entry.cha || 0,
        "FOB Terms": entry.fobTerms || 0,
        "CFS/DO/YARD": entry.cfsDoYard || 0,
        "Scanning": entry.scanning || 0,
        "SIMS & PIMS": entry.simsPims || 0,
        "Duty": entry.duty || 0,
        "Penalty": entry.penalty || 0,
        "Trucking": entry.trucking || 0,
        "Loading/Unloading": entry.loadingUnloading || 0,
        "Local Charges": entry.localCharges || 0,
        "Total Amount": entry.totalAmount || 0,
        "Status": entry.deliveryStatus,
        "Shipping Line": entry.shippingLine || "",
        "BL Number": entry.blNumber || "",
        "Notes": entry.notes || "",
      }));
      
      return {
        sheet,
        entries: excelData,
      };
    } catch (error) {
      console.error("Error exporting shipping sheet:", error);
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
        prisma.shippingSheet.count(),
        prisma.shippingSheet.count({ where: { status: { not: 'CANCELLED' } } }),
        prisma.shippingEntry.count(),
        prisma.shippingSheet.findMany({
          where: { status: { not: 'CANCELLED' } },
          orderBy: { updatedAt: 'desc' },
          take: 5,
          include: {
            _count: {
              select: { entries: true },
            },
            entries: {
              select: {
                freightINR: true,
                localCharges: true,
                totalAmount: true,
              },
              take: 10,
            },
          },
        }),
      ]);
      
      // Calculate overall totals from all sheets
      const allSheets = await prisma.shippingSheet.findMany({
        select: {
          totalFreightINR: true,
          totalLocalCharges: true,
          grandTotal: true,
        },
      });
      
      const overallTotals = allSheets.reduce(
        (acc, sheet) => ({
          totalFreightINR: acc.totalFreightINR + (sheet.totalFreightINR || 0),
          totalLocalCharges: acc.totalLocalCharges + (sheet.totalLocalCharges || 0),
          grandTotal: acc.grandTotal + (sheet.grandTotal || 0),
        }),
        { totalFreightINR: 0, totalLocalCharges: 0, grandTotal: 0 }
      );
      
      // Calculate summary for recent sheets
      const recentSheetsWithSummary = recentSheets.map(sheet => {
        const totals = sheet.entries.reduce(
          (acc, entry) => ({
            totalFreightINR: acc.totalFreightINR + (entry.freightINR || 0),
            totalLocalCharges: acc.totalLocalCharges + (entry.localCharges || 0),
            totalAmount: acc.totalAmount + (entry.totalAmount || 0),
          }),
          { totalFreightINR: 0, totalLocalCharges: 0, totalAmount: 0 }
        );
        
        return {
          ...sheet,
          summary: {
            ...totals,
            containerCount: sheet._count.entries,
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
      console.error("Error getting shipping dashboard overview:", error);
      throw error;
    }
  },
};

module.exports = shippingService;