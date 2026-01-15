import API from "@/lib/api";

export const tukaramAPI = {
  // Dashboard
  getDashboardOverview: () => API.get('/accounts/tukaram/dashboard/overview'),
  generateDefaultTitle: () => API.get('/accounts/tukaram/generate-title'),
  
  // Sheets
  getSheets: (params) => API.get('/accounts/tukaram', { params }),
  getSheet: (sheetId) => API.get(`/accounts/tukaram/${sheetId}`),
  createSheet: (data) => API.post('/accounts/tukaram', data),
  updateSheet: (sheetId, data) => API.put(`/accounts/tukaram/${sheetId}`, data),
  deleteSheet: (sheetId) => API.delete(`/accounts/tukaram/${sheetId}`),
  
  // Entries
  getSheetEntries: (sheetId, params) => API.get(`/accounts/tukaram/${sheetId}/entries`, { params }),
  addEntry: (sheetId, data) => API.post(`/accounts/tukaram/${sheetId}/entries`, data),
  updateEntry: (entryId, data) => API.put(`/accounts/tukaram/entries/${entryId}`, data),
  deleteEntry: (entryId) => API.delete(`/accounts/tukaram/entries/${entryId}`),
  importEntries: (sheetId, data) => API.post(`/accounts/tukaram/${sheetId}/import`, data),
  
  // Stats & Export
  getSheetStats: (sheetId) => API.get(`/accounts/tukaram/${sheetId}/stats`),
  exportSheet: (sheetId) => API.get(`/accounts/tukaram/${sheetId}/export`, { responseType: 'blob' }),
};
