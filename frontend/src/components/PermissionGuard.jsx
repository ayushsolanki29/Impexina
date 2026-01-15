"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import API from "@/lib/api";
import { canAccessPath } from "@/lib/permissions";
import { getAuthToken } from "@/utils/auth-storage";
import { Loader2 } from "lucide-react";

/**
 * Permission Guard Component
 * Wraps page content and checks permissions before rendering
 */
export default function PermissionGuard({ children, requiredModule }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkPermission = async () => {
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

        // Only Super Admin has full access
        if (userData.isSuper) {
          setAllowed(true);
          setLoading(false);
          return;
        }

        // Get user permissions
        let userPermissions = [];

        if (userData.permissions) {
          userPermissions = userData.permissions;
        } else if (userData.id) {
          const permRes = await API.get(`/users/roles/permissions?userId=${userData.id}`);
          if (permRes.data.success) {
            userPermissions = permRes.data.data || [];
          }
        }

        // Check specific module if provided
        if (requiredModule) {
          const hasAccess = userPermissions.includes(requiredModule);
          if (!hasAccess) {
            router.replace(`/403?module=${requiredModule}`);
            return;
          }
          setAllowed(true);
        } else {
          // Check based on current path
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
        }

        setLoading(false);
      } catch (err) {
        console.error("Permission check failed:", err);

        if (err.response?.status === 401) {
          router.replace("/auth/login");
        } else {
          router.replace("/403");
        }
      }
    };

    checkPermission();
  }, [pathname, requiredModule, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-slate-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
