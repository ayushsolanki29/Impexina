"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Truck,
  ChevronLeft,
  Plus,
  ChevronDown,
  ChevronRight,
  Warehouse,
  Container,
  Calculator,
  DollarSign,
  Briefcase,
  FileSpreadsheet,
  BarChart3,
  UserCog,
  ClipboardCheck,
  Layers,
  CheckSquare,
  LogOut,
  Package,
  Loader2,
  DatabaseBackup,
  ListTodo,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import API from "@/lib/api";
import { toast } from "sonner";
import { clearAuthCookies } from "@/utils/auth-storage";
   
// Define all possible menu items with their module keys
const ALL_MENU_ITEMS = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: Home,
    path: "/dashboard",
    moduleKey: "DASHBOARD",
  },
  {
    key: "order-tracker",
    label: "Order Tracker",
    icon: ClipboardCheck,
    path: "/dashboard/client-order-tracker",
    moduleKey: "ORDER_TRACKER",
  },
  {
    key: "loading",
    label: "Loading Sheet",
    icon: Truck,
    path: "/dashboard/loading",
    moduleKey: "LOADING_SHEET",
  },
  {
    key: "bifurcation",
    label: "Bifurcation",
    icon: Layers,
    path: "/dashboard/bifurcation",
    moduleKey: "BIFURCATION",
  },
  {
    key: "packing",
    label: "Packing List",
    icon: Package,
    path: "/dashboard/packing",
    moduleKey: "PACKING_LIST",
  },
  {
    key: "invoice",
    label: "Invoice",
    icon: FileSpreadsheet,
    path: "/dashboard/invoice",
    moduleKey: "INVOICE",
  },
  {
    key: "containers",
    label: "Containers",
    icon: Container,
    path: "/dashboard/containers",
    moduleKey: "CONTAINERS",
    children: [
      {
        key: "container-summary",
        label: "Summary",
        path: "/dashboard/container-summary",
        moduleKey: "CONTAINER_SUMMARY",
      },
      {
        key: "containers-list",
        label: "All Containers",
        path: "/dashboard/containers",
        moduleKey: "CONTAINERS_LIST",
      },
    ],
  },
  {
    key: "warehouse",
    label: "Warehouse Plan",
    icon: Warehouse,
    path: "/dashboard/warehouse",
    moduleKey: "WAREHOUSE_PLAN",
  },
  {
    key: "accounts",
    label: "Accounts",
    icon: Calculator,
    path: "/dashboard/accounts",
    moduleKey: "ACCOUNTS",
  },
  {
    key: "clients",
    label: "Clients",
    icon: Briefcase,
    path: "/dashboard/clients",
    moduleKey: "CLIENTS",
  },
  {
    key: "expenses",
    label: "Expenses",
    icon: DollarSign,
    path: "/dashboard/expenses",
    moduleKey: "EXPENSES",
  },
  {
    key: "users",
    label: "User Management",
    icon: UserCog,
    path: "/dashboard/users",
    moduleKey: "USER_MANAGEMENT",
  },
  {
    key: "tasks",
    label: "Task Management",
    icon: CheckSquare,
    path: "/dashboard/tasks",
    moduleKey: "TASK_MANAGEMENT",
  },
  {
    key: "my-tasks",
    label: "My Tasks",
    icon: ListTodo,
    path: "/dashboard/my-tasks",
    moduleKey: "MY_TASK",
  },
  {
    key: "backups",
    label: "System Backups",
    icon: DatabaseBackup,
    path: "/dashboard/backups",
    moduleKey: "BACKUPS",
  },
];

function roleColor(role) {
  switch (role) {
    case "ADMIN":
      return {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
      };
    case "EMPLOYEE":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
      };
    case "NEW_JOINNER":
      return {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
      };
    case "mod":
      return {
        bg: "bg-amber-50",
        text: "text-amber-800",
        border: "border-amber-200",
      };
    case "accounts":
      return {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
      };
    default:
      return {
        bg: "bg-slate-50",
        text: "text-slate-700",
        border: "border-slate-200",
      };
  }
}

function SkeletonItem({ isOpen }) {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <div className="w-5 h-5 bg-slate-200 rounded animate-pulse" />
      {isOpen && (
        <>
          <div className="flex-1">
            <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse" />
          </div>
          <div className="h-4 bg-slate-200 rounded w-6 animate-pulse" />
        </>
      )}
    </div>
  );
}

function UserSkeleton({ isOpen }) {
  return (
    <div className="px-4 py-4 border-t border-slate-100 flex items-center gap-3">
      <div className="w-8 h-8 bg-slate-200 rounded-md animate-pulse" />
      {isOpen && (
        <div className="flex-1">
          <div className="h-4 bg-slate-200 rounded w-24 mb-2 animate-pulse" />
          <div className="h-3 bg-slate-200 rounded w-16 animate-pulse" />
        </div>
      )}
      <div className="w-6 h-6 bg-slate-200 rounded-md animate-pulse" />
    </div>
  );
}

export default function SidebarAdvanced({ 
  role: propRole, 
  currentPath: propPath,
  initialPermissions = [] 
}) {
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = propPath || pathname || "";

  const [open, setOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState(initialPermissions);
  const [expandedMap, setExpandedMap] = useState({});
  const containerRef = useRef(null);
  const indicatorRef = useRef(null);
  const itemsRef = useRef({});

  // Filter menu items based on user permissions
  const visibleMenuItems = useMemo(() => {
    // If user has admin role, show all menu items
    if (user?.role === 'ADMIN') {
      return ALL_MENU_ITEMS;
    }

    // Filter based on permissions
    return ALL_MENU_ITEMS.filter(menuItem => {
      // Check if user has permission for this menu item
      const hasPermission = userPermissions.includes(menuItem.moduleKey);
      
      // For parent items with children, check if user has permission for any child
      if (menuItem.children) {
        const hasChildPermission = menuItem.children.some(child => 
          userPermissions.includes(child.moduleKey)
        );
        return hasPermission || hasChildPermission;
      }
      
      return hasPermission;
    });
  }, [user, userPermissions]);

  const activeKey = useMemo(() => {
    let activeKey = null;
    let maxMatchLength = 0;

    const normalizedPath = currentPath.endsWith("/") 
      ? currentPath.slice(0, -1) 
      : currentPath;

    for (const item of ALL_MENU_ITEMS) {
      if (item.children) {
        for (const child of item.children) {
          if (normalizedPath === child.path || normalizedPath.startsWith(child.path + "/")) {
            return item.key;
          }
        }
      }

      if (normalizedPath === item.path || normalizedPath.startsWith(item.path + "/")) {
        if (item.path.length > maxMatchLength) {
          maxMatchLength = item.path.length;
          activeKey = item.key;
        }
      }
    }

    return activeKey;
  }, [currentPath]);

  useEffect(() => {
    if (activeKey && ALL_MENU_ITEMS.find((m) => m.key === activeKey)?.children) {
      setExpandedMap((prev) => ({ ...prev, [activeKey]: true }));
    }
  }, [activeKey]);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    const el = itemsRef.current[activeKey];
    const indicator = indicatorRef.current;
    if (el && indicator && containerRef.current) {
      const r = el.getBoundingClientRect();
      const containerR = containerRef.current.getBoundingClientRect();
      const top = r.top - containerR.top;
      indicator.style.transform = `translateY(${top}px)`;
      indicator.style.height = `${r.height}px`;
      indicator.style.opacity = "1";
    } else if (indicator) {
      indicator.style.opacity = "0";
    }
  }, [activeKey, open, visibleMenuItems]);

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      // Fetch user data
      const userRes = await API.get("/auth/me");
      if (userRes.data.success) {
        const userData = userRes.data.data;
        setUser(userData);
        
        // If user has permissions in response, use them
        if (userData.permissions) {
          setUserPermissions(userData.permissions);
        } else if (userData.id) {
          // Otherwise fetch permissions separately
          try {
            const permRes = await API.get(`/users/roles/permissions?userId=${userData.id}`);
            if (permRes.data.success) {
              setUserPermissions(permRes.data.data);
            }
          } catch (permError) {
            console.error("Failed to fetch permissions:", permError);
            // If user is admin, set all permissions
            if (userData.role === 'ADMIN') {
              setUserPermissions(ALL_MENU_ITEMS.map(item => item.moduleKey));
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
      toast.error("Failed to load user data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthCookies();
    toast.info("Logged out successfully");
    router.push("/auth/login");
  };

  const navTo = (path) => {
    if (!path) return;
    router.push(path);
  };

  const toggleGroup = (key) => {
    setExpandedMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const currentUser = user || { 
    name: "Ayush Solanki", 
    role: propRole || "ADMIN" 
  };

  // Helper function to check if user has specific permission
  const hasPermission = (moduleKey) => {
    if (currentUser.role === 'ADMIN') return true;
    return userPermissions.includes(moduleKey);
  };

  return (
    <aside
      ref={containerRef}
      className={`relative flex flex-col h-screen transition-all duration-200 ${
        open ? "w-64" : "w-20"
      } bg-white border-r border-slate-200`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200">
        <div className={`flex items-center transition-all duration-300 ${
          open ? "justify-start" : "justify-center w-full"
        }`}>
          <div className={`flex items-center justify-center rounded-xl overflow-hidden transition-all duration-300 ${
            open ? "w-44 h-14" : "w-14 h-14"
          }`}>
            <Image
              src="/LOGO.jpeg"
              alt="Logo"
              width={open ? 170 : 48}
              height={48}
              className="object-contain"
              priority
            />
          </div>
        </div>

        <button
          onClick={() => setOpen((s) => !s)}
          className={`p-1.5 rounded-full hover:bg-slate-100 border border-slate-200 transition-all ${
            open ? "ml-2" : "absolute right-3"
          }`}
        >
          <ChevronLeft className={`w-4 h-4 text-slate-600 transition-transform duration-200 ${
            open ? "" : "rotate-180"
          }`} />
        </button>
      </div>

      {/* Active Indicator */}
      <div
        ref={indicatorRef}
        className="pointer-events-none absolute left-0 w-[3px] bg-blue-600 rounded-r-md transition-all duration-300"
        style={{ top: 0, height: 0, opacity: 0 }}
      />

      {/* Menu Content */}
      <nav className="flex-1 overflow-y-auto py-4">
        {isLoading ? (
          <div className="space-y-0.5 px-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonItem key={i} isOpen={open} />
            ))}
          </div>
        ) : (
          <ul className="space-y-0.5 px-3">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === activeKey;
              const hasChildren = item.children && item.children.length > 0;
              
              // Filter children based on permissions
              const visibleChildren = hasChildren 
                ? item.children.filter(child => hasPermission(child.moduleKey))
                : [];

              // Don't show parent if no children are visible (unless parent itself has permission)
              if (hasChildren && visibleChildren.length === 0 && !hasPermission(item.moduleKey)) {
                return null;
              }

              return (
                <li key={item.key} className="relative">
                  <div
                    ref={(el) => (itemsRef.current[item.key] = el)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all duration-150 ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <button
                      onClick={() => {
                        if (hasChildren && visibleChildren.length > 0) {
                          toggleGroup(item.key);
                        } else if (item.path) {
                          navTo(item.path);
                        }
                      }}
                      className="flex items-center gap-3 w-full text-left group outline-none"
                      disabled={!item.path && !hasChildren}
                    >
                      <Icon
                        className={`w-5 h-5 shrink-0 transition-colors ${
                          isActive
                            ? "text-blue-600"
                            : "text-slate-400 group-hover:text-slate-600"
                        } ${(!item.path && !hasChildren) ? "opacity-50" : ""}`}
                      />

                      {open && (
                        <>
                          <div className="flex-1 flex items-center justify-between overflow-hidden">
                            <span className={`text-sm truncate ${
                              isActive ? "font-semibold" : "font-medium"
                            } ${(!item.path && !hasChildren) ? "opacity-50" : ""}`}>
                              {item.label}
                            </span>
                            <div className="flex items-center gap-2">
                              {hasChildren && visibleChildren.length > 0 && (
                                <span className="text-slate-400">
                                  {expandedMap[item.key] ? (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Submenu */}
                  {hasChildren && open && expandedMap[item.key] && visibleChildren.length > 0 && (
                    <ul className="mt-1 ml-4 space-y-0.5 pl-3 border-l border-slate-100">
                      {visibleChildren.map((child) => {
                        const isChildActive = currentPath.startsWith(child.path);
                        return (
                          <li key={child.key}>
                            <button
                              onClick={() => navTo(child.path)}
                              className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2 ${
                                isChildActive
                                  ? "bg-slate-100 text-slate-900 font-medium"
                                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isChildActive ? "bg-blue-500" : "bg-slate-300"
                                }`}
                              />
                              <span>{child.label}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* Quick Actions - Only show if user has permission */}
        {hasPermission('loading_sheet') || hasPermission('invoice') ? (
          <div className="mt-6 px-4">
            {open && (
              <div className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
                Quick Actions
              </div>
            )}
            <div className="flex gap-2 flex-col">
              {hasPermission('loading_sheet') && (
                <Button
                  onClick={() => navTo("/dashboard/loading/new")}
                  className="w-full bg-slate-900 text-white hover:bg-slate-800"
                  size="sm"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1" />
                      {open && "New Loading Sheet"}
                    </>
                  )}
                </Button>
              )}
              {hasPermission('invoice') && (
                <Button
                  onClick={() => navTo("/dashboard/invoice/new")}
                  variant="outline"
                  className="w-full border-slate-200 text-slate-700 hover:bg-slate-50"
                  size="sm"
                  disabled={isLoading}
                >
                  <FileSpreadsheet className="w-4 h-4 mr-1" />
                  {open && "Create Invoice"}
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </nav>

      {/* Footer - User Info */}
      {isLoading ? (
        <UserSkeleton isOpen={open} />
      ) : (
        <div className="px-4 py-4 border-t border-slate-100 flex items-center gap-3">
          <button
            onClick={() => navTo("/dashboard/profile")}
            className="flex-1 flex items-center gap-3 text-left p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors group"
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold border ${
                roleColor(currentUser.role).border
              } ${roleColor(currentUser.role).bg} ${
                roleColor(currentUser.role).text
              }`}
            >
              {currentUser.name?.[0]?.toUpperCase() || "U"}
            </div>

            {open && (
              <div className="flex-1 min-w-0 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-700 truncate group-hover:text-slate-900">
                    {currentUser.name}
                  </div>
                  <div className="text-xs text-slate-500 truncate capitalize">
                    {currentUser.role?.toLowerCase().replace("_", " ")}
                  </div>
                </div>
                <Settings className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </button>

          <button
            onClick={handleLogout}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  );
}