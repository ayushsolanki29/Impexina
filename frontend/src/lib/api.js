import axios from "axios";
import { getAuthToken, clearAuthCookies } from "@/utils/auth-storage";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api",
  withCredentials: false,
});

/* ===============================
   REQUEST INTERCEPTOR
================================ */
API.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ===============================
   RESPONSE INTERCEPTOR
================================ */
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthCookies();
    }
    return Promise.reject(error);
  }
);

export const get = async (url, config = {}) => {
  const response = await API.get(url, config);
  return response.data;
};

export const post = async (url, data, config = {}) => {
  const response = await API.post(url, data, config);
  return response.data;
};

export const put = async (url, data, config = {}) => {
  const response = await API.put(url, data, config);
  return response.data;
};

export const del = async (url, config = {}) => {
  const response = await API.delete(url, config);
  return response.data;
};

// Download helper
API.download = async (url, data = {}, fileName = "download") => {
  const isPost = Object.keys(data).length > 0;
  const config = { responseType: "blob" };

  const response = isPost
    ? await API.post(url, data, config)
    : await API.get(url, config);

  const blob = new Blob([response.data], { type: response.headers["content-type"] });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
  return response;
};

export const download = API.download;

export default API;
