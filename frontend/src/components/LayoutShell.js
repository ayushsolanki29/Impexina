"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { canAccessPath } from "@/lib/permissions";
import { getAuthToken } from "@/utils/auth-storage";
import API from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function LayoutShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

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
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-slate-600">Verifying access...</p>
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
      <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
    </div>
  );
}
