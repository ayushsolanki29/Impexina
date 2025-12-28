const { prisma } = require("../../database/prisma");
const containerSummaryService = require("./containerSummary.service");
const XLSX = require("xlsx");

const containerSummaryController = {
  // Create new summary
  createSummary: async (req, res) => {
    try {
      const data = req.body;
      const userId = req.user.id;
      const userName = req.user.name;

      const result = await containerSummaryService.createSummary(
        data,
        userId,
        userName
      );

      res.status(201).json({
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

  // Get all summaries
  getAllSummaries: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "", status } = req.query;
      const createdBy = req.user.name;

      const result = await containerSummaryService.getAllSummaries({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status: status || undefined,
        createdBy,
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

  // Get single summary
  getSummaryById: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await containerSummaryService.getSummaryById(id);

      res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Update summary
  updateSummary: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const userId = req.user.id;
      const userName = req.user.name;

      const result = await containerSummaryService.updateSummary(
        id,
        data,
        userId,
        userName
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

  // Delete summary
  deleteSummary: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await containerSummaryService.deleteSummary(id, userId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get statistics
  getStatistics: async (req, res) => {
    try {
      const createdBy = req.user.name;

      const stats = await containerSummaryService.getStatistics(createdBy);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Export summary to CSV
  exportToCSV: async (req, res) => {
    try {
      const { id } = req.params;

      const csvData = await containerSummaryService.exportToCSV(id);

      // Create CSV content
      const csvContent = [
        csvData.headers.join(","),
        ...csvData.rows.map((row) => row.join(",")),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${csvData.summary.month.replace(
          /\s+/g,
          "_"
        )}_summary_${new Date().toISOString().slice(0, 10)}.csv"`
      );

      res.send(csvContent);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Export all summaries to CSV
  exportAllToCSV: async (req, res) => {
    try {
      const createdBy = req.user.name;

      const csvData = await containerSummaryService.exportAllToCSV(createdBy);

      const csvContent = [
        csvData.headers.join(","),
        ...csvData.rows.map((row) => row.join(",")),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="all_summaries_${new Date()
          .toISOString()
          .slice(0, 10)}.csv"`
      );

      res.send(csvContent);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Export summary to Excel
  exportToExcel: async (req, res) => {
    try {
      const { id } = req.params;

      const csvData = await containerSummaryService.exportToCSV(id);

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Add main data sheet
      const worksheet = XLSX.utils.aoa_to_sheet([
        csvData.headers,
        ...csvData.rows,
      ]);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Summary");

      // Add summary sheet
      const summaryData = [
        ["Month", csvData.summary.month],
        ["Total Containers", csvData.summary.totalContainers],
        ["Total CTN", csvData.summary.totalCTN],
        ["Total Dollar", `$${csvData.summary.totalDollar.toFixed(2)}`],
        ["Total INR", `₹${csvData.summary.totalINR.toFixed(2)}`],
        ["Total Final Amount", `₹${csvData.summary.totalFinalAmount.toFixed(2)}`],
        ["Generated Date", new Date().toLocaleDateString()],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Statistics");

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
        `attachment; filename="${csvData.summary.month.replace(
          /\s+/g,
          "_"
        )}_summary_${new Date().toISOString().slice(0, 10)}.xlsx"`
      );

      res.send(excelBuffer);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Search summaries
  searchSummaries: async (req, res) => {
    try {
      const { q } = req.query;
      const createdBy = req.user.name;

      const summaries = await containerSummaryService.searchSummaries(
        q || "",
        createdBy
      );

      res.status(200).json({
        success: true,
        data: summaries,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get activities for a summary
  getSummaryActivities: async (req, res) => {
    try {
      const { id } = req.params;
      const { limit = 20 } = req.query;

      const activities = await prisma.summaryActivity.findMany({
        where: { summaryId: id },
        include: {
          user: {
            select: {
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: parseInt(limit),
      });

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
};

module.exports = containerSummaryController;