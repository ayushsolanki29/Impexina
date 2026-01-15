/**
 * Permission Configuration
 * Maps page paths to required module permissions
 */

// Module keys from seed file
export const MODULES = {
  DASHBOARD: "DASHBOARD",
  ORDER_TRACKER: "ORDER_TRACKER",
  LOADING_SHEET: "LOADING_SHEET",
  BIFURCATION: "BIFURCATION",
  PACKING_LIST: "PACKING_LIST",
  INVOICE: "INVOICE",
  CONTAINERS: "CONTAINERS",
  CONTAINER_SUMMARY: "CONTAINER_SUMMARY",
  CONTAINERS_LIST: "CONTAINERS_LIST",
  WAREHOUSE_PLAN: "WAREHOUSE_PLAN",
  ACCOUNTS: "ACCOUNTS",
  CLIENTS: "CLIENTS",
  EXPENSES: "EXPENSES",
  USER_MANAGEMENT: "USER_MANAGEMENT",
  TASK_MANAGEMENT: "TASK_MANAGEMENT",
  MY_TASK: "MY_TASK",
  BACKUPS: "BACKUPS",
  PROFILE: "PROFILE",
  SETTINGS: "SETTINGS",
};

// Path to permission mapping
// Paths are matched from most specific to least specific
export const PERMISSION_MAP = [
  // Dashboard
  { path: "/dashboard", exact: true, module: MODULES.DASHBOARD },
  
  // Order Tracker
  { path: "/dashboard/client-order-tracker", module: MODULES.ORDER_TRACKER },
  
  // Loading Sheet
  { path: "/dashboard/loading", module: MODULES.LOADING_SHEET },
  
  // Bifurcation
  { path: "/dashboard/bifurcation", module: MODULES.BIFURCATION },
  
  // Packing List
  { path: "/dashboard/packing", module: MODULES.PACKING_LIST },
  
  // Invoice
  { path: "/dashboard/invoice", module: MODULES.INVOICE },
  
  // Containers
  { path: "/dashboard/container-summary", module: MODULES.CONTAINER_SUMMARY },
  { path: "/dashboard/containers", module: MODULES.CONTAINERS_LIST },
  
  // Warehouse
  { path: "/dashboard/warehouse", module: MODULES.WAREHOUSE_PLAN },
  
  // Accounts (all sub-routes)
  { path: "/dashboard/accounts", module: MODULES.ACCOUNTS },
  
  // Clients
  { path: "/dashboard/clients", module: MODULES.CLIENTS },
  
  // Expenses
  { path: "/dashboard/expenses", module: MODULES.EXPENSES },
  
  // User Management
  { path: "/dashboard/users", module: MODULES.USER_MANAGEMENT },
  
  // Task Management
  { path: "/dashboard/tasks", module: MODULES.TASK_MANAGEMENT },
  
  // My Tasks
  { path: "/dashboard/my-tasks", module: MODULES.MY_TASK },
  
  // Backups
  { path: "/dashboard/backups", module: MODULES.BACKUPS },
  
  // Profile (usually accessible to all authenticated users)
  { path: "/dashboard/profile", module: MODULES.PROFILE, public: true },
  
  // Settings
  { path: "/dashboard/settings", module: MODULES.SETTINGS },
];

/**
 * Get required permission for a given path
 * @param {string} pathname - Current page path
 * @returns {object|null} - Permission config or null if no permission required
 */
export function getRequiredPermission(pathname) {
  // Normalize path
  const normalizedPath = pathname.endsWith("/") && pathname !== "/"
    ? pathname.slice(0, -1)
    : pathname;

  // First check for exact matches
  for (const config of PERMISSION_MAP) {
    if (config.exact && normalizedPath === config.path) {
      return config;
    }
  }

  // Then check for prefix matches (longest match first)
  const sortedByLength = [...PERMISSION_MAP]
    .filter(c => !c.exact)
    .sort((a, b) => b.path.length - a.path.length);

  for (const config of sortedByLength) {
    if (normalizedPath === config.path || normalizedPath.startsWith(config.path + "/")) {
      return config;
    }
  }

  return null;
}

/**
 * Check if user has permission for a module
 * @param {string[]} userPermissions - Array of user's module keys
 * @param {string} moduleKey - Required module key
 * @param {string} userRole - User's role
 * @returns {boolean}
 */
export function hasPermission(userPermissions, moduleKey, userRole) {
  // Admin has access to everything
  if (userRole === "ADMIN") {
    return true;
  }

  // Check if user has the specific permission
  return userPermissions?.includes(moduleKey) ?? false;
}

/**
 * Check if user can access a path
 * @param {string} pathname - Page path
 * @param {string[]} userPermissions - User's permissions
 * @param {string} userRole - User's role
 * @returns {{ allowed: boolean, module: string|null }}
 */
export function canAccessPath(pathname, userPermissions, userRole) {
  const permConfig = getRequiredPermission(pathname);

  // No permission config = allow access (public route)
  if (!permConfig) {
    return { allowed: true, module: null };
  }

  // Public routes within dashboard
  if (permConfig.public) {
    return { allowed: true, module: permConfig.module };
  }

  // Check permission
  const allowed = hasPermission(userPermissions, permConfig.module, userRole);
  return { allowed, module: permConfig.module };
}
