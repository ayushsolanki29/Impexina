// warehouse.api.js
import API from "@/lib/api";

export const warehouseApi = {
  // Get warehouse plan
  getWarehousePlan: (containerCode) => 
    API.get(`/warehouse/${containerCode}`),

  // Initialize warehouse plan
  initializeWarehousePlan: (containerCode) =>
    API.post(`/warehouse/initialize/${containerCode}`),

  // Add mark
  addMark: (containerCode, data) =>
    API.post(`/warehouse/${containerCode}/marks`, data),

  // Update mark
  updateMark: (containerCode, markId, data) =>
    API.patch(`/warehouse/${containerCode}/marks/${markId}`, data),

  // Delete mark
  deleteMark: (containerCode, markId) =>
    API.delete(`/warehouse/${containerCode}/marks/${markId}`),

  // Search warehouse plan
  searchWarehousePlan: (containerCode, filters) =>
    API.get(`/warehouse/${containerCode}/search`, { params: filters }),

  // Export to Excel
  exportToExcel: (containerCode) =>
    API.get(`/warehouse/${containerCode}/export/excel`, {
      responseType: 'blob'
    }),

  // Get unique transporters
  getUniqueTransporters: (containerCode) =>
    API.get(`/warehouse/${containerCode}/transporters`),

  // Get activities
  getActivities: (containerCode, limit = 20) =>
    API.get(`/warehouse/${containerCode}/activities`, {
      params: { limit }
    }),

  // Update warehouse plan status
  updateWarehousePlanStatus: (containerCode, status) =>
    API.patch(`/warehouse/${containerCode}/status`, { status }),

  // Import from Excel
  importFromExcel: (containerCode, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return API.post(`/warehouse/${containerCode}/import`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};