import API from "@/lib/api";

// Add to your existing API helper
export const dineshbhaiAPI = {
  // Dashboard
  getDashboardOverview: () => API.get('/accounts/dineshbhai/dashboard/overview'),
  generateDefaultTitle: () => API.get('/accounts/dineshbhai/generate-title'),
  
  // Sheets
  getSheets: (params) => API.get('/accounts/dineshbhai', { params }),
  getSheet: (sheetId) => API.get(`/accounts/dineshbhai/${sheetId}`),
  createSheet: (data) => API.post('/accounts/dineshbhai', data),
  updateSheet: (sheetId, data) => API.put(`/accounts/dineshbhai/${sheetId}`, data),
  deleteSheet: (sheetId) => API.delete(`/accounts/dineshbhai/${sheetId}`),
  
  // Entries
  getSheetEntries: (sheetId, params) => API.get(`/accounts/dineshbhai/${sheetId}/entries`, { params }),
  addEntry: (sheetId, data) => API.post(`/accounts/dineshbhai/${sheetId}/entries`, data),
  updateEntry: (entryId, data) => API.put(`/accounts/dineshbhai/entries/${entryId}`, data),
  deleteEntry: (entryId) => API.delete(`/accounts/dineshbhai/entries/${entryId}`),
  importEntries: (sheetId, data) => API.post(`/accounts/dineshbhai/${sheetId}/import`, data),
  
  // Stats & Export
  getSheetStats: (sheetId) => API.get(`/accounts/dineshbhai/${sheetId}/stats`),
  exportSheet: (sheetId) => API.get(`/accounts/dineshbhai/${sheetId}/export`, { responseType: 'blob' }),
};