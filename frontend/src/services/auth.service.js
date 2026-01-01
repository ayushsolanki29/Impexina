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

        // Get time-based greeting
        const hour = new Date().getHours();
        let greeting = "Good Evening";
        if (hour < 12) {
          greeting = "Good Morning";
        } else if (hour < 17) {
          greeting = "Good Afternoon";
        }

        toast.success(`${greeting}, ${user.name}!`, {
          description: "Welcome back to your workspace",
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
