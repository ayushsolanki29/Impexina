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

export default API;
