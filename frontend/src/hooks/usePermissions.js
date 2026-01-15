"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import API from "@/lib/api";
import { canAccessPath, getRequiredPermission } from "@/lib/permissions";
import { getAuthToken } from "@/utils/auth-storage";

/**
 * Hook to check and manage user permissions
 */
export function usePermissions() {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  // Fetch user and permissions
  const fetchPermissions = useCallback(async () => {
    const token = getAuthToken();
    
    if (!token) {
      setLoading(false);
      router.replace("/auth/login");
      return;
    }

    try {
      // Get current user
      const userRes = await API.get("/auth/me");
      
      if (!userRes.data.success) {
        throw new Error("Failed to fetch user");
      }

      const userData = userRes.data.data;
      setUser(userData);

      // Get permissions
      let userPermissions = [];
      
      if (userData.permissions) {
        userPermissions = userData.permissions;
      } else if (userData.id) {
        const permRes = await API.get(`/users/roles/permissions?userId=${userData.id}`);
        if (permRes.data.success) {
          userPermissions = permRes.data.data || [];
        }
      }

      setPermissions(userPermissions);
      setLoading(false);

      // Check access for current path
      const { allowed, module } = canAccessPath(pathname, userPermissions, userData.role);
      
      if (!allowed) {
        router.replace(`/403?module=${module || "unknown"}`);
      }

    } catch (err) {
      console.error("Permission check failed:", err);
      setError(err.message);
      setLoading(false);
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401) {
        router.replace("/auth/login");
      }
    }
  }, [pathname, router]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Check if user has a specific permission
  const hasPermission = useCallback((moduleKey) => {
    if (!user) return false;
    if (user.role === "ADMIN") return true;
    return permissions.includes(moduleKey);
  }, [user, permissions]);

  // Check if user can access a path
  const canAccess = useCallback((path) => {
    if (!user) return false;
    const { allowed } = canAccessPath(path, permissions, user.role);
    return allowed;
  }, [user, permissions]);

  return {
    user,
    permissions,
    loading,
    error,
    hasPermission,
    canAccess,
    refetch: fetchPermissions,
  };
}

/**
 * Hook for quick permission check on page load
 * Use this in page components for protection
 */
export function useRequirePermission(moduleKey) {
  const { user, permissions, loading, hasPermission } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (!hasPermission(moduleKey)) {
        router.replace(`/403?module=${moduleKey}`);
      }
    }
  }, [loading, user, moduleKey, hasPermission, router]);

  return { loading, allowed: hasPermission(moduleKey) };
}
