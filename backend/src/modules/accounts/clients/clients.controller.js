const accountsService = require("./clients.service");

const accountsController = {
  // Get all clients
  getAllClients: async (req, res) => {
    try {
      const { page = 1, limit = 20, search = "", location = "" } = req.query;
      
      const result = await accountsService.getAllClients({
        page,
        limit,
        search,
        location,
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
  
  // Get client by ID
  getClientById: async (req, res) => {
    try {
      const { clientId } = req.params;
      
      const client = await accountsService.getClientById(clientId);
      
      res.status(200).json({
        success: true,
        data: client,
      });
    } catch (error) {
      if (error.message === "Client not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Create new client
  createClient: async (req, res) => {
    try {
      const clientData = req.body;
      const userId = req.user.id;
      
      const client = await accountsService.createClient(clientData, userId);
      
      res.status(201).json({
        success: true,
        message: "Client created successfully",
        data: client,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Update client
  updateClient: async (req, res) => {
    try {
      const { clientId } = req.params;
      const clientData = req.body;
      const userId = req.user.id;
      
      const client = await accountsService.updateClient(clientId, clientData, userId);
      
      res.status(200).json({
        success: true,
        message: "Client updated successfully",
        data: client,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Delete client
  deleteClient: async (req, res) => {
    try {
      const { clientId } = req.params;
      const userId = req.user.id;
      
      const result = await accountsService.deleteClient(clientId, userId);
      
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
  
  // Get client ledger
  getClientLedger: async (req, res) => {
    try {
      const { clientId } = req.params;
      const { startDate, endDate, page = 1, limit = 50 } = req.query;
      
      const ledger = await accountsService.getClientLedger(clientId, {
        startDate,
        endDate,
        page,
        limit,
      });
      
      res.status(200).json({
        success: true,
        data: ledger,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Add transaction
  addTransaction: async (req, res) => {
    try {
      const { clientId } = req.params;
      const transactionData = req.body;
      const userId = req.user.id;
      
      const transaction = await accountsService.addTransaction(
        clientId,
        transactionData,
        userId
      );
      
      res.status(201).json({
        success: true,
        message: "Transaction added successfully",
        data: transaction,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Update transaction
  updateTransaction: async (req, res) => {
    try {
      const { transactionId } = req.params;
      const transactionData = req.body;
      const userId = req.user.id;
      
      const transaction = await accountsService.updateTransaction(
        transactionId,
        transactionData,
        userId
      );
      
      res.status(200).json({
        success: true,
        message: "Transaction updated successfully",
        data: transaction,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Delete transaction
  deleteTransaction: async (req, res) => {
    try {
      const { transactionId } = req.params;
      const userId = req.user.id;
      
      const result = await accountsService.deleteTransaction(transactionId, userId);
      
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
  
  // Get container suggestions
  getContainerSuggestions: async (req, res) => {
    try {
      const { search = "", limit = 10 } = req.query;
      
      const suggestions = await accountsService.getContainerSuggestions(search, limit);
      
      res.status(200).json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Get client containers
  getClientContainers: async (req, res) => {
    try {
      const { clientId } = req.params;
      
      const containers = await accountsService.getClientContainers(clientId);
      
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
  
  // Link container to client
  linkContainerToClient: async (req, res) => {
    try {
      const { clientId } = req.params;
      const containerData = req.body;
      const userId = req.user.id;
      
      const link = await accountsService.linkContainerToClient(
        clientId,
        containerData,
        userId
      );
      
      res.status(201).json({
        success: true,
        message: "Container linked successfully",
        data: link,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Unlink container from client
  unlinkContainerFromClient: async (req, res) => {
    try {
      const { linkId } = req.params;
      const userId = req.user.id;
      
      const result = await accountsService.unlinkContainerFromClient(linkId, userId);
      
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
  
  // Get dashboard statistics
  getDashboardStats: async (req, res) => {
    try {
      const stats = await accountsService.getDashboardStats();
      
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
  
  // Search suggestions
  searchSuggestions: async (req, res) => {
    try {
      const { search = "", limit = 10 } = req.query;
      
      const suggestions = await accountsService.searchSuggestions(search, limit);
      
      res.status(200).json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Export client ledger to Excel
  exportClientLedger: async (req, res) => {
    try {
      const { clientId } = req.params;
      const { startDate, endDate } = req.query;
      
      const XLSX = require("xlsx");
      
      // Get ledger data
      const ledger = await accountsService.getClientLedger(clientId, {
        startDate,
        endDate,
        page: 1,
        limit: 10000, // Large limit for export
      });
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Transactions sheet
      const transactionsData = ledger.transactions.map((t, index) => ({
        "S.No": index + 1,
        "Date": new Date(t.transactionDate).toLocaleDateString(),
        "Container": t.containerCode || "",
        "Mark": t.containerMark || "",
        "Particulars": t.particulars,
        "Type": t.type,
        "Billing Type": t.billingType || "",
        "Quantity": t.quantity || "",
        "Rate": t.rate || "",
        "Amount": t.amount,
        "Paid": t.paid || 0,
        "Balance": t.balance,
        "Payment Mode": t.paymentMode || "",
        "Payment Date": t.paymentDate ? new Date(t.paymentDate).toLocaleDateString() : "",
        "Payment Ref": t.paymentRef || "",
        "From Account": t.fromAccount,
        "To Account": t.toAccount,
        "Notes": t.notes || "",
        "Created": new Date(t.createdAt).toLocaleString(),
      }));
      
      const transactionsSheet = XLSX.utils.json_to_sheet(transactionsData);
      XLSX.utils.book_append_sheet(workbook, transactionsSheet, "Transactions");
      
      // Summary sheet
      const summaryData = [
        {
          "Client Name": ledger.client.name,
          "Location": ledger.client.location || "",
          "Period": `${startDate || "All"} to ${endDate || "Now"}`,
          "Total Expense": ledger.summary.totalExpense,
          "Total Paid": ledger.summary.totalPaid,
          "Balance Due": ledger.summary.balance,
          "Total Transactions": ledger.summary.totalTransactions,
          "Generated Date": new Date().toLocaleDateString(),
        },
      ];
      
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
      
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
        `attachment; filename=${ledger.client.name.replace(/\s+/g, "_")}_ledger_${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`
      );
      
      res.send(excelBuffer);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = accountsController;