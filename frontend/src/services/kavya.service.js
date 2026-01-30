import API from "@/lib/api";

export const kavyaAPI = {
  // Dashboard
  getDashboardOverview: () => API.get('/accounts/kavya/dashboard/overview'),
  generateDefaultTitle: () => API.get('/accounts/kavya/generate-title'),
  
  // Sheets
  getSheets: (params) => API.get('/accounts/kavya', { params }),
  getSheet: (sheetId) => API.get(`/accounts/kavya/${sheetId}`),
  createSheet: (data) => API.post('/accounts/kavya', data),
  updateSheet: (sheetId, data) => API.put(`/accounts/kavya/${sheetId}`, data),
  deleteSheet: (sheetId) => API.delete(`/accounts/kavya/${sheetId}`),
  
  // Entries
  getSheetEntries: (sheetId, params) => API.get(`/accounts/kavya/${sheetId}/entries`, { params }),
  addEntry: (sheetId, data) => API.post(`/accounts/kavya/${sheetId}/entries`, data),
  updateEntry: (entryId, data) => API.put(`/accounts/kavya/entries/${entryId}`, data),
  deleteEntry: (entryId) => API.delete(`/accounts/kavya/entries/${entryId}`),
  importEntries: (sheetId, data) => API.post(`/accounts/kavya/${sheetId}/import`, data),
  
  // Stats & Export
  getSheetStats: (sheetId) => API.get(`/accounts/kavya/${sheetId}/stats`),
  exportSheet: (sheetId) => API.get(`/accounts/kavya/${sheetId}/export`, { responseType: 'blob' }),
};
