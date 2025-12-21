const XLSX = require('xlsx');
const loadingService = require("./loading.service");

const loadingController = {
  // Create or update loading sheet
  createOrUpdate: async (req, res) => {
    try {
      const userId = req.user.id; // From auth middleware
      const result = await loadingService.createOrUpdateLoadingSheet(
        req.body,
        userId
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get all loading sheets with pagination
  getAll: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "", status } = req.query;
      const result = await loadingService.getAllLoadingSheets({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get single loading sheet
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const loadingSheet = await loadingService.getLoadingSheetById(id);

      if (!loadingSheet) {
        return res.status(404).json({
          success: false,
          message: "Loading sheet not found",
        });
      }

      res.status(200).json({
        success: true,
        data: loadingSheet,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get containers list for suggestions
  getContainers: async (req, res) => {
    try {
      const { search = "" } = req.query;
      const containers = await loadingService.getContainerSuggestions(search);

      res.status(200).json({
        success: true,
        data: containers,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get shipping marks list for suggestions
  getShippingMarks: async (req, res) => {
    try {
      const { search = "" } = req.query;
      const shippingMarks = await loadingService.getShippingMarkSuggestions(
        search
      );

      res.status(200).json({
        success: true,
        data: shippingMarks,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Update loading sheet status
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      const result = await loadingService.updateLoadingSheetStatus(
        id,
        status,
        userId
      );

      res.status(200).json({
        success: true,
        message: "Status updated successfully",
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Delete loading sheet
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await loadingService.deleteLoadingSheet(id, userId);

      res.status(200).json({
        success: true,
        message: "Loading sheet deleted successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Upload photo for item
  uploadPhoto: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const { containerCode } = req.query;

      if (!containerCode) {
        return res.status(400).json({
          success: false,
          message: "Container code is required for photo upload",
        });
      }

      const photoPath = await loadingService.uploadPhoto(
        req.file,
        containerCode
      );

      res.status(200).json({
        success: true,
        message: "Photo uploaded successfully",
        data: { photo: photoPath },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to upload photo",
      });
    }
  },

  // Get all containers with filters
  getAllContainers: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 12,
        search = "",
        origin = "",
        status = "",
        dateFrom = "",
        dateTo = "",
      } = req.query;

      const result = await loadingService.getAllContainers({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        origin,
        status,
        dateFrom,
        dateTo,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Get containers error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get loading activities
  getActivities: async (req, res) => {
    try {
      const { id } = req.params;
      const activities = await loadingService.getLoadingSheetActivities(id);

      res.status(200).json({
        success: true,
        data: activities,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
  // Get all containers with filters
  getAllContainers: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 12,
        search = "",
        origin = "",
        status = "",
        dateFrom = "",
        dateTo = "",
      } = req.query;

      const result = await loadingService.getAllContainers({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        origin,
        status,
        dateFrom,
        dateTo,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get single container details
  getContainerDetails: async (req, res) => {
    try {
      const { containerCode } = req.params;
      const container = await loadingService.getContainerDetails(containerCode);

      res.status(200).json({
        success: true,
        data: container,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Update container status
  updateContainerStatus: async (req, res) => {
    try {
      const { containerCode } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      if (!["DRAFT", "CONFIRMED"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be either DRAFT or CONFIRMED",
        });
      }

      const result = await loadingService.updateContainerStatus(
        containerCode,
        status,
        userId
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Export containers to Excel
  exportContainers: async (req, res) => {
    try {
      const {
        search = "",
        origin = "",
        status = "",
        dateFrom = "",
        dateTo = "",
      } = req.query;

      const userId = req.user.id;

      // Log export activity
      await loadingService.logExportActivity(userId, {
        search,
        origin,
        status,
        dateFrom,
        dateTo,
      });

      const excelData = await loadingService.exportContainersToExcel({
        search,
        origin,
        status,
        dateFrom,
        dateTo,
      });

      // Create CSV
      const headers = [
        "Container Code",
        "Origin",
        "Status",
        "Last Loading Date",
        "Total CTN",
        "Total PCS",
        "Total CBM",
        "Total Weight (KG)",
        "Client Count",
        "Clients",
        "Loading Sheets Count",
        "Created Date",
      ];

      const csvRows = [
        headers.join(","),
        ...excelData.map((row) =>
          headers
            .map((header) => {
              const value = row[header];
              // Handle values that might contain commas
              return typeof value === "string" && value.includes(",")
                ? `"${value}"`
                : value;
            })
            .join(",")
        ),
      ];

      const csvContent = csvRows.join("\n");

      // Set response headers for file download
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=containers_${new Date()
          .toISOString()
          .slice(0, 10)}.csv`
      );
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Pragma", "no-cache");

      res.send(csvContent);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get container details with items
  getContainerDetails: async (req, res) => {
    try {
      const { containerCode } = req.params;
      const filters = {
        search: req.query.search || "",
        status: req.query.status || "",
        dateFrom: req.query.dateFrom || "",
        dateTo: req.query.dateTo || "",
        sortBy: req.query.sortBy || "client",
        ...(req.query.minCTN && {
          ctnRange: {
            min: parseFloat(req.query.minCTN),
            max: req.query.maxCTN ? parseFloat(req.query.maxCTN) : 999999,
          },
        }),
        ...(req.query.minWeight && {
          weightRange: {
            min: parseFloat(req.query.minWeight),
            max: req.query.maxWeight ? parseFloat(req.query.maxWeight) : 999999,
          },
        }),
        ...(req.query.minCBM && {
          cbmRange: {
            min: parseFloat(req.query.minCBM),
            max: req.query.maxCBM ? parseFloat(req.query.maxCBM) : 999999,
          },
        }),
      };

      const result = await loadingService.getContainerDetailsWithItems(
        containerCode,
        filters
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Export container to Excel
  exportContainerExcel: async (req, res) => {
    try {
      const { containerCode } = req.params;
      const { clients } = req.body; // Array of selected clients

      const filters = {
        search: req.query.search || "",
        status: req.query.status || "",
        dateFrom: req.query.dateFrom || "",
        dateTo: req.query.dateTo || "",
      };

      const excelData = await loadingService.exportContainerToExcel(
        containerCode,
        clients || [],
        filters
      );

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Add summary sheet
      const summarySheet = XLSX.utils.json_to_sheet(excelData.summary);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // Add items sheet
      const itemsSheet = XLSX.utils.json_to_sheet(excelData.items);
      XLSX.utils.book_append_sheet(workbook, itemsSheet, "Items");

      // Add totals sheet
      const totalsSheet = XLSX.utils.json_to_sheet(excelData.totals);
      XLSX.utils.book_append_sheet(workbook, totalsSheet, "Totals");

      // Write to buffer
      const excelBuffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
      });

      // Set response headers
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${containerCode}_report_${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`
      );

      // Send file
      res.send(excelBuffer);

      // Log export activity
      const userId = req.user.id;
      await loadingService.logExportActivity(userId, {
        type: "CONTAINER_EXCEL",
        containerCode,
        selectedClients: clients || "all",
        filters,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Export container to PDF
  exportContainerPDF: async (req, res) => {
    try {
      const { containerCode } = req.params;
      const { clients } = req.body;

      const filters = {
        search: req.query.search || "",
        status: req.query.status || "",
        dateFrom: req.query.dateFrom || "",
        dateTo: req.query.dateTo || "",
      };

      const pdfData = await loadingService.generateContainerImageData(
        containerCode,
        clients || [],
        filters
      );

      // For now, return JSON. You can integrate with PDF generation library like pdfkit
      res.status(200).json({
        success: true,
        data: pdfData,
        message:
          "PDF data generated. Use frontend PDF generation or integrate with PDF library.",
      });

      // Log export activity
      const userId = req.user.id;
      await loadingService.logExportActivity(userId, {
        type: "CONTAINER_PDF",
        containerCode,
        selectedClients: clients || "all",
        filters,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Update container status
  updateContainerStatus: async (req, res) => {
    try {
      const { containerCode } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      if (!["DRAFT", "CONFIRMED", "COMPLETED"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be DRAFT, CONFIRMED, or COMPLETED",
        });
      }

      const result = await loadingService.updateContainerStatus(
        containerCode,
        status,
        userId
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Search items in container
  searchContainerItems: async (req, res) => {
    try {
      const { containerCode } = req.params;
      const { q, page = 1, limit = 50 } = req.query;

      const result = await loadingService.searchContainerItems(
        containerCode,
        q,
        parseInt(page),
        parseInt(limit)
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get client summary
  getClientSummary: async (req, res) => {
    try {
      const { containerCode, clientName } = req.params;

      const containerData = await loadingService.getContainerDetailsWithItems(
        containerCode
      );

      const clientGroup = containerData.clientGroups.find(
        (group) => group.client === clientName
      );

      if (!clientGroup) {
        return res.status(404).json({
          success: false,
          message: "Client not found in container",
        });
      }

      res.status(200).json({
        success: true,
        data: {
          client: clientGroup.client,
          summary: `Client: ${clientGroup.client}
Total CTN: ${clientGroup.totals.ctn}
Total PCS: ${clientGroup.totals.pcs}
Total T.PCS: ${clientGroup.totals.tpcs}
Total CBM: ${clientGroup.totals.tcbm.toFixed(3)}
Total Weight: ${clientGroup.totals.twt.toFixed(2)} kg
Items: ${clientGroup.totals.itemCount}
Loading Date: ${new Date(clientGroup.loadingDate).toLocaleDateString()}
Status: ${clientGroup.status}`,
          totals: clientGroup.totals,
          items: clientGroup.items,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
  // Generate and download image for container
exportContainerImage: async (req, res) => {
  try {
    const { containerCode } = req.params;
    const { clients } = req.body;

    const filters = {
      search: req.query.search || '',
      status: req.query.status || '',
      dateFrom: req.query.dateFrom || '',
      dateTo: req.query.dateTo || ''
    };

    const containerData = await loadingService.getContainerDetailsWithItems(
      containerCode, 
      filters
    );

    // Filter by selected clients
    let filteredGroups = containerData.clientGroups;
    if (clients && clients.length > 0) {
      filteredGroups = containerData.clientGroups.filter(group => 
        clients.includes(group.client)
      );
    }

    // Return data for frontend to generate image
    res.status(200).json({
      success: true,
      data: {
        container: containerData.container,
        clientGroups: filteredGroups,
        overallTotals: containerData.overallTotals,
        filters,
        selectedClients: clients || [],
        generatedAt: new Date().toISOString()
      }
    });

    // Log export activity
    const userId = req.user.id;
    await loadingService.logExportActivity(userId, {
      type: 'CONTAINER_IMAGE',
      containerCode,
      selectedClients: clients || 'all',
      filters
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
},

// Generate client-specific preview data
getClientPreview: async (req, res) => {
  try {
    const { containerCode, clientName } = req.params;
    const { includeImages = 'true' } = req.query;

    const containerData = await loadingService.getContainerDetailsWithItems(containerCode);
    
    const clientGroup = containerData.clientGroups.find(group => 
      group.client === clientName
    );

    if (!clientGroup) {
      return res.status(404).json({
        success: false,
        message: "Client not found in container",
      });
    }

    const previewData = {
      container: containerData.container,
      client: clientGroup,
      includeImages: includeImages === 'true',
      generatedAt: new Date()
    };

    res.status(200).json({
      success: true,
      data: previewData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
},
};

module.exports = loadingController;
