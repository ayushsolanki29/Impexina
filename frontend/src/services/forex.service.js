import API from "@/lib/api";

// Add to your existing API helper (lib/api.js)
export const forexAPI = {
  // Dashboard
  getDashboardOverview: () => API.get("/accounts/forex/dashboard/overview"),
  searchSheetNames: (search, limit = 10) =>
    API.get(`/accounts/forex/search/sheets?search=${search}&limit=${limit}`),

  // Sheets
  getSheets: (params) => API.get("/accounts/forex", { params }),
  getSheet: (sheetId) => API.get(`/accounts/forex/${sheetId}`),
  createSheet: (data) => API.post("/accounts/forex", data),
  updateSheet: (sheetId, data) => API.put(`/accounts/forex/${sheetId}`, data),
  deleteSheet: (sheetId) => API.delete(`/accounts/forex/${sheetId}`),

  // Entries
  getSheetEntries: (sheetId, params) =>
    API.get(`/accounts/forex/${sheetId}/entries`, { params }),
  addEntry: (sheetId, data) => API.post(`/accounts/forex/${sheetId}/entries`, data),
  updateEntry: (entryId, data) => API.put(`/accounts/forex/entries/${entryId}`, data),
  deleteEntry: (entryId) => API.delete(`/accounts/forex/entries/${entryId}`),

  // Stats & Export
  getSheetStats: (sheetId) => API.get(`/accounts/forex/${sheetId}/stats`),
  exportSheet: (sheetId) =>
    API.get(`/accounts/forex/${sheetId}/export`, { responseType: "blob" }),
};
