"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { canAccessPath } from "@/lib/permissions";
import { clearAuthCookies, getAuthToken } from "@/utils/auth-storage";
import API from "@/lib/api";
import { Loader2, LogOut, RefreshCw } from "lucide-react";


export default function LayoutShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const handleLogout = () => {
    clearAuthCookies();
    // Brute force clear all cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/auth/login";
  };

  const handleReload = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = window.location.pathname;
  };

  // Hide sidebar on auth pages
  const hideSidebar =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/auth");

  // Skip permission check for non-dashboard routes
  const skipCheck =
    hideSidebar ||
    pathname === "/" ||
    pathname.startsWith("/403") ||
    pathname.startsWith("/404");

  useEffect(() => {
    const checkPermissions = async () => {
      // Skip check for auth pages and error pages
      if (skipCheck) {
        setAllowed(true);
        setChecking(false);
        return;
      }

      const token = getAuthToken();

      if (!token) {
        router.replace("/auth/login");
        return;
      }

      try {
        // Get current user
        const userRes = await API.get("/auth/me");

        if (!userRes.data.success) {
          router.replace("/auth/login");
          return;
        }

        const userData = userRes.data.data;

        // Only Super Admin has full access to all pages
        if (userData.isSuper) {
          setAllowed(true);
          setChecking(false);
          return;
        }

        // Get user permissions
        let userPermissions = [];

        if (userData.permissions) {
          userPermissions = userData.permissions;
        } else if (userData.id) {
          try {
            const permRes = await API.get(
              `/users/roles/permissions?userId=${userData.id}`
            );
            if (permRes.data.success) {
              userPermissions = permRes.data.data || [];
            }
          } catch (e) {
            console.error("Failed to fetch permissions:", e);
          }
        }

        // Check access for current path
        const { allowed: pathAllowed, module } = canAccessPath(
          pathname,
          userPermissions,
          userData.role,
          userData.isSuper
        );

        if (!pathAllowed) {
          router.replace(`/403?module=${module || "unknown"}`);
          return;
        }

        setAllowed(true);
        setChecking(false);
      } catch (err) {
        console.error("Permission check failed:", err);

        if (err.response?.status === 401) {
          router.replace("/auth/login");
        } else {
          // Allow access on error to prevent lockout
          setAllowed(true);
          setChecking(false);
        }
      }
    };

    checkPermissions();
  }, [pathname, router, skipCheck]);

  // Show loading while checking permissions for dashboard routes
  if (!skipCheck && checking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <p className="text-sm font-medium text-slate-600 tracking-wide animate-pulse">Verifying access...</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReload}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm"
              title="If stuck, try a force reload"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Cache & Reload
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              Full Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not allowed (redirect will happen)
  if (!skipCheck && !allowed) {
    return null;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {!hideSidebar && <Sidebar />}
      <main className="flex-1 overflow-y-auto bg-gray-50">{children}


      </main>
    </div>
  );
}
