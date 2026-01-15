const clientsService = require("./clients.service");

// Get all clients (paginated, search)
const getClients = async (req, res) => {
  try {
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      location: req.query.location // Optional location filter
    };
    const result = await clientsService.getAllClients(filters);
    res.json({ success: true, data: result.clients, pagination: result.pagination });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get client ledger details
const getClientLedger = async (req, res) => {
  try {
    const { containerCode, sheetName } = req.query;
    const result = await clientsService.getClientLedger(req.params.id, containerCode, sheetName);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(404).json({ success: false, message: error.message });
  }
};

// Add transaction to client ledger
const addTransaction = async (req, res) => {
  try {
    const result = await clientsService.addTransaction(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update transaction
const updateTransaction = async (req, res) => {
  try {
    const result = await clientsService.updateTransaction(req.params.txnId, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete transaction
const deleteTransaction = async (req, res) => {
  try {
    await clientsService.deleteTransaction(req.params.txnId);
    res.json({ success: true, message: "Transaction deleted" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get container suggestions
const getContainerSuggestions = async (req, res) => {
  try {
    const result = await clientsService.getContainerSuggestions(req.query.q);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get client containers
const getClientContainers = async (req, res) => {
  try {
    const result = await clientsService.getClientContainers(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Rename Sheet
const renameSheet = async (req, res) => {
  try {
    const { oldSheetName, newSheetName } = req.body;
    const result = await clientsService.renameSheet(req.params.id, oldSheetName, newSheetName);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getClients,
  getClientLedger,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getContainerSuggestions,
  getClientContainers,
  renameSheet
};
