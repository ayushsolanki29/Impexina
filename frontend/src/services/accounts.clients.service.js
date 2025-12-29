const { default: API } = require("@/lib/api");

// Accounts API endpoints
const accountsAPI = {
  // Dashboard & Stats
  getDashboardStats: () => API.get("/accounts/clts/dashboard/stats"),
  searchSuggestions: (search, limit = 10) =>
    API.get(
      `/accounts/clts/search/suggestions?search=${search}&limit=${limit}`
    ),

  // Clients
  getClients: (params) => API.get("/accounts/clts/clients", { params }),
  getClient: (clientId) => API.get(`/accounts/clts/clients/${clientId}`),
  createClient: (data) => API.post("/accounts/clts/clients", data),
  updateClient: (clientId, data) =>
    API.put(`/accounts/clts/clients/${clientId}`, data),
  deleteClient: (clientId) => API.delete(`/accounts/clts/clients/${clientId}`),

  // Ledger & Transactions
  getClientLedger: (clientId, params) =>
    API.get(`/accounts/clts/clients/${clientId}/ledger`, { params }),
  addTransaction: (clientId, data) =>
    API.post(`/accounts/clts/clients/${clientId}/transactions`, data),
  updateTransaction: (transactionId, data) =>
    API.put(`/accounts/clts/transactions/${transactionId}`, data),
  deleteTransaction: (transactionId) =>
    API.delete(`/accounts/clts/transactions/${transactionId}`),
  exportLedger: (clientId, params) =>
    API.get(`/accounts/clts/clients/${clientId}/ledger/export`, {
      params,
      responseType: "blob",
    }),

  // Containers
  getContainerSuggestions: (search, limit = 10) =>
    API.get(
      `/accounts/clts/containers/suggestions?search=${search}&limit=${limit}`
    ),
  getClientContainers: (clientId) =>
    API.get(`/accounts/clts/clients/${clientId}/containers`),
  linkContainer: (clientId, data) =>
    API.post(`/accounts/clts/clients/${clientId}/containers`, data),
  unlinkContainer: (linkId) =>
    API.delete(`/accounts/clts/containers/links/${linkId}`),
};

export default accountsAPI;
