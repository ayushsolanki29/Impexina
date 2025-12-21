import API from "@/lib/api";
import { toast } from "sonner";
import { setAuthCookies, clearAuthCookies } from "@/utils/auth-storage";

const authService = {
  /* ===============================
     LOGIN
  ================================ */
  login: async (payload) => {
    try {
      const res = await API.post("/auth/login", payload);

      if (res.data.success) {
        const { token, user } = res.data.data;
        setAuthCookies(token, user);

        toast.success("Login successful", {
          description: `Welcome back, ${user.name}`,
        });
      }

      return res.data;
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";

      toast.error("Login failed", {
        description: message,
      });

      return {
        success: false,
        message,
      };
    }
  },

  /* ===============================
     CURRENT USER
  ================================ */
  me: async () => {
    try {
      const res = await API.get("/auth/me");
      return res.data;
    } catch (error) {
      return {
        success: false,
        message: "Unable to fetch user",
      };
    }
  },

  /* ===============================
     LOGOUT
  ================================ */
  logout: () => {
    clearAuthCookies();

    toast.info("Logged out", {
      description: "You have been logged out successfully",
    });

    window.location.href = "/login";
  },
};

export default authService;
