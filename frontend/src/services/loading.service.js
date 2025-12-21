import API from "@/lib/api";
import { toast } from "sonner";

const loadingService = {
  /* ===============================
     CREATE LOADING SHEET
  ================================ */
  createLoadingSheet: async (payload) => {
    try {
      const res = await API.post("/loading", payload);

      if (res.data.success) {
        toast.success("Loading sheet created successfully", {
          description: `Container: ${payload.containerCode}`,
        });
      }

      return res.data;
    } catch (error) {
      const message = error.response?.data?.message || "Failed to create loading sheet";

      toast.error("Creation failed", {
        description: message,
      });

      return {
        success: false,
        message,
      };
    }
  },

  /* ===============================
     GET ALL LOADING SHEETS
  ================================ */
  getLoadingSheets: async (params = {}) => {
    try {
      const res = await API.get("/loading", { params });
      return res.data;
    } catch (error) {
      const message = error.response?.data?.message || "Failed to fetch loading sheets";
      
      toast.error("Fetch failed", {
        description: message,
      });

      return {
        success: false,
        message,
        data: [],
        meta: {},
      };
    }
  },

  /* ===============================
     GET LOADING SHEET BY ID
  ================================ */
  getLoadingSheetById: async (id) => {
    try {
      const res = await API.get(`/loading/${id}`);
      return res.data;
    } catch (error) {
      const message = error.response?.data?.message || "Failed to fetch loading sheet";
      
      return {
        success: false,
        message,
      };
    }
  },

  /* ===============================
     UPDATE LOADING SHEET
  ================================ */
  updateLoadingSheet: async (id, payload) => {
    try {
      const res = await API.put(`/loading/${id}`, payload);

      if (res.data.success) {
        toast.success("Loading sheet updated successfully");
      }

      return res.data;
    } catch (error) {
      const message = error.response?.data?.message || "Failed to update loading sheet";

      toast.error("Update failed", {
        description: message,
      });

      return {
        success: false,
        message,
      };
    }
  },

  /* ===============================
     DELETE LOADING SHEET
  ================================ */
  deleteLoadingSheet: async (id) => {
    try {
      const res = await API.delete(`/loading/${id}`);

      if (res.data.success) {
        toast.success("Loading sheet deleted successfully");
      }

      return res.data;
    } catch (error) {
      const message = error.response?.data?.message || "Failed to delete loading sheet";

      toast.error("Deletion failed", {
        description: message,
      });

      return {
        success: false,
        message,
      };
    }
  },

  /* ===============================
     GET SHIPPING MARKS
  ================================ */
  getShippingMarks: async (search = "") => {
    try {
      const res = await API.get("/loading/shipping-marks/all", {
        params: { search },
      });
      return res.data;
    } catch (error) {
      console.error("Error fetching shipping marks:", error);
      return {
        success: false,
        message: "Failed to fetch shipping marks",
        data: [],
      };
    }
  },

  /* ===============================
     GET CTN MARKS
  ================================ */
  getCtnMarks: async (search = "") => {
    try {
      const res = await API.get("/loading/ctn-marks/all", {
        params: { search },
      });
      return res.data;
    } catch (error) {
      console.error("Error fetching CTN marks:", error);
      return {
        success: false,
        message: "Failed to fetch CTN marks",
        data: [],
      };
    }
  },

  /* ===============================
     UPLOAD PHOTO
  ================================ */
  uploadPhoto: async (containerCode, file) => {
    try {
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("containerCode", containerCode);

      const res = await API.post("/loading/upload-photo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success) {
        toast.success("Photo uploaded successfully");
      }

      return res.data;
    } catch (error) {
      const message = error.response?.data?.message || "Failed to upload photo";

      toast.error("Upload failed", {
        description: message,
      });

      return {
        success: false,
        message,
      };
    }
  },

  /* ===============================
     GET CONTAINER STATS
  ================================ */
  getContainerStats: async () => {
    try {
      const res = await API.get("/loading/stats/containers");
      return res.data;
    } catch (error) {
      console.error("Error fetching container stats:", error);
      return {
        success: false,
        message: "Failed to fetch container stats",
        data: [],
      };
    }
  },

  /* ===============================
     VALIDATE CONTAINER
  ================================ */
  validateContainer: async (containerCode) => {
    try {
      // Check if container exists in loading sheets
      const res = await API.get("/loading", {
        params: { containerCode, limit: 1 },
      });
      
      if (res.data.data?.length > 0) {
        return {
          exists: true,
          data: res.data.data[0],
        };
      }
      
      return { exists: false };
    } catch (error) {
      console.error("Error validating container:", error);
      return { exists: false };
    }
  },
};

export default loadingService;