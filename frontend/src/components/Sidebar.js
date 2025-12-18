"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Box,
  ClipboardList,
  FileText,
  Users,
  LogOut,
  Package,
  Truck,
  ChevronLeft,
  Plus,
  Eye,
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
  Settings,
  Layers,
  FileBarChart,
  Shield,
  Target,
  CheckSquare,
  // ContainerIcon and PcCase removed as we have better alternatives
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * SidebarAdvanced.jsx
 * - Compact mode tooltips (floating preview)
 * - Animated active indicator bar
 * - Role-based highlights
 * - Multi-level menu (submodules)
 * - Improved, more relevant icons for all cases
 */

/* ----------------------------- Menu (with submodules) ----------------------------- */
const MENU = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: Home,
    path: "/dashboard",
    roles: ["admin", "mod", "employee", "newjoinner"],
    description: "Overview and analytics"
  },
  {
    key: "loading",
    label: "Loading Sheet",
    icon: Truck,
    path: "/dashboard/loading",
    roles: ["admin", "mod", "employee"],
    description: "Manage loading operations"
  },
  {
    key: "bifurcation",
    label: "Bifurcation",
    icon: Layers,
    path: "/dashboard/bifurcation",
    roles: ["admin", "mod"],
    description: "Split and categorize shipments"
  },
  {
    key: "packing",
    label: "Packing List",
    icon: Package,
    path: "/dashboard/packing",
    roles: ["admin", "mod", "employee"],
    description: "Create and manage packing lists"
  },
  {
    key: "invoice",
    label: "Invoice",
    icon: FileSpreadsheet,
    path: "/dashboard/invoice",
    roles: ["admin", "mod", "accounts"],
    description: "Generate and track invoices"
  },
  {
    key: "containers",
    label: "Containers",
    icon: Container,
    path: "/dashboard/containers",
    roles: ["admin", "mod", "accounts"],
    description: "Container management",
    children: [
      {
        key: "container-summary",
        label: "Summary",
        path: "/dashboard/container-summary",
        icon: BarChart3
      },
      {
        key: "containers-list",
        label: "All Containers",
        path: "/dashboard/containers",
        icon: Container
      },
    ],
  },
  {
    key: "warehouse",
    label: "Warehouse Plan",
    icon: Warehouse,
    path: "/dashboard/warehouse",
    roles: ["admin", "mod", "accounts"],
    description: "Warehouse layout and planning"
  },
  {
    key: "accounts",
    label: "Accounts",
    icon: Calculator,
    path: "/dashboard/accounts",
    roles: ["admin", "mod", "accounts"],
    description: "Financial accounts and ledgers"
  },
  {
    key: "clients",
    label: "Clients",
    icon: Briefcase,
    path: "/dashboard/clients",
    roles: ["admin", "mod", "accounts"],
    description: "Client management portal"
  },
  {
    key: "expenses",
    label: "Expenses",
    icon: DollarSign,
    path: "/dashboard/expenses",
    roles: ["admin", "mod", "accounts"],
    description: "Track and manage expenses"
  },
  {
    key: "users",
    label: "User Management",
    icon: UserCog,
    path: "/dashboard/users",
    roles: ["admin"],
    description: "Manage system users and permissions"
  },
  {
    key: "order-tracker",
    label: "Order Tracker",
    icon: ClipboardCheck,
    path: "/dashboard/order-tracker",
    roles: ["admin", "mod"],
    description: "Track order status and progress"
  },
  {
    key: "tasks",
    label: "Task Management",
    icon: CheckSquare,
    path: "/dashboard/tasks",
    roles: ["admin", "mod"],
    description: "Assign and track team tasks"
  },
  // {
  //   key: "reports",
  //   label: "Reports",
  //   icon: FileBarChart,
  //   path: "/dashboard/reports",
  //   roles: ["admin", "mod", "accounts"],
  //   description: "Generate system reports"
  // },
  // {
  //   key: "settings",
  //   label: "System Settings",
  //   icon: Settings,
  //   path: "/dashboard/settings",
  //   roles: ["admin"],
  //   description: "Configure system preferences"
  // },
];

/* ----------------------------- Helpers ----------------------------- */
function roleColor(role) {
  switch (role) {
    case "admin":
      return { 
        bg: "bg-red-50", 
        text: "text-red-700", 
        border: "border-red-100",
        gradient: "from-red-50 to-rose-50"
      };
    case "employee":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-100",
        gradient: "from-emerald-50 to-green-50"
      };
    case "mod":
      return {
        bg: "bg-amber-50",
        text: "text-amber-800",
        border: "border-amber-100",
        gradient: "from-amber-50 to-orange-50"
      };
    case "accounts":
      return {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-100",
        gradient: "from-blue-50 to-cyan-50"
      };
    default:
      return {
        bg: "bg-slate-50",
        text: "text-slate-700",
        border: "border-slate-100",
        gradient: "from-slate-50 to-gray-50"
      };
  }
}

function Badge({ count, tone = "blue" }) {
  if (count === undefined || count === 0) return null;
  const disp = count > 999 ? "999+" : count;
  const toneClass = {
    blue: "bg-blue-50 text-blue-700 border border-blue-100",
    red: "bg-red-50 text-red-700 border border-red-100",
    green: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    amber: "bg-amber-50 text-amber-800 border border-amber-100",
    purple: "bg-purple-50 text-purple-700 border border-purple-100",
  }[tone];
  return (
    <span
      className={`ml-2 inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-semibold rounded-full ${toneClass}`}
    >
      {disp}
    </span>
  );
}

/**
 * IMPROVED MATCH LOGIC:
 * Finds the menu item with the longest matching path prefix.
 */
function getActiveInfo(currentPath, menuItems) {
  let activeKey = null;
  let activeChildPath = null;
  let maxMatchLength = 0;

  // Normalize path (remove trailing slash for comparison)
  const normalizedPath = currentPath.endsWith("/")
    ? currentPath.slice(0, -1)
    : currentPath;

  for (const item of menuItems) {
    // 1. Check Children First (most specific)
    if (item.children) {
      for (const child of item.children) {
        if (
          normalizedPath === child.path ||
          normalizedPath.startsWith(child.path + "/")
        ) {
          // Found a child match, this is definitely the one
          return { activeKey: item.key, activeChildPath: child.path };
        }
      }
    }

    // 2. Check Parent Path
    if (
      normalizedPath === item.path ||
      normalizedPath.startsWith(item.path + "/")
    ) {
      if (item.path.length > maxMatchLength) {
        maxMatchLength = item.path.length;
        activeKey = item.key;
        activeChildPath = null;
      }
    }
  }

  return { activeKey, activeChildPath };
}

/* ----------------------------- Component ----------------------------- */
export default function SidebarAdvanced({
  role = "admin",
  currentPath: propPath,
  counts = {},
}) {
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = propPath || pathname || "";

  const [open, setOpen] = useState(true);
  const [compactTooltip, setCompactTooltip] = useState({
    show: false,
    x: 0,
    y: 0,
    content: null,
    item: null,
  });
  const containerRef = useRef(null);

  const [expandedMap, setExpandedMap] = useState({});

  // Filter menu based on user role
  const visible = useMemo(
    () => MENU.filter((m) => m.roles.includes(role)),
    [role]
  );

  // Get active menu item using the improved logic
  const { activeKey, activeChildPath } = useMemo(
    () => getActiveInfo(currentPath, MENU),
    [currentPath]
  );

  // Expand submenus based on active state
  useEffect(() => {
    if (activeKey && MENU.find((m) => m.key === activeKey)?.children) {
      setExpandedMap((prev) => ({ ...prev, [activeKey]: true }));
    }
  }, [activeKey]);

  // animated indicator bar
  const indicatorRef = useRef(null);
  const itemsRef = useRef({});

  // Update indicator position
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
  }, [activeKey, open, visible]);

  function navTo(p) {
    if (!p) return;
    router.push(p);
  }

  function toggleGroup(key) {
    setExpandedMap((s) => ({ ...s, [key]: !s[key] }));
  }

  // compact tooltip handlers
  function showCompactTooltip(e, item) {
    if (open) return;
    const rect = containerRef.current.getBoundingClientRect();
    setCompactTooltip({
      show: true,
      x: rect.right + 12,
      y: e.currentTarget.getBoundingClientRect().top + window.scrollY,
      content: renderTooltipContent(item),
      item,
    });
  }

  function hideCompactTooltip() {
    setCompactTooltip({ show: false, x: 0, y: 0, content: null, item: null });
  }

  return (
    <aside
      ref={containerRef}
      className={`relative flex flex-col h-screen transition-all duration-200 ${
        open ? "w-64" : "w-20"
      } bg-white/95 border-r border-slate-200 shadow-sm backdrop-blur-sm`}
      aria-label="Main sidebar"
    >
      {/* Top brand */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-sky-50/60">
        <div className="flex items-center gap-3">
          <div
            className={`rounded-xl flex items-center justify-center ${
              open ? "w-11 h-11" : "w-10 h-10"
            } bg-gradient-to-br from-sky-600 to-blue-600 text-white font-semibold shadow-sm`}
          >
            <Truck className="w-5 h-5" />
          </div>
          {open && (
            <div>
              <div className="text-sm font-semibold text-slate-900">
                IGPL — Impexina
              </div>
              <div className="text-xs text-slate-500">
                Import &amp; Logistics Suite
              </div>
            </div>
          )}
        </div>

        <button
          aria-label="Toggle sidebar"
          onClick={() => setOpen((s) => !s)}
          className="p-1.5 rounded-full hover:bg-slate-100 border border-slate-200 transition-colors"
        >
          <ChevronLeft
            className={`w-4 h-4 text-slate-600 transition-transform duration-200 ${
              open ? "" : "rotate-180"
            }`}
          />
        </button>
      </div>

      {/* active indicator bar */}
      <div
        ref={indicatorRef}
        className="pointer-events-none absolute left-0 w-1 bg-gradient-to-b from-sky-500 to-blue-600 rounded-full transition-all duration-300 ease-in-out"
        style={{ top: 0, left: 0, height: 0, opacity: 0 }}
      />

      {/* Menu list */}
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-1 px-2">
          {visible.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === activeKey;
            const hasChildren = item.children && item.children.length > 0;

            return (
              <li key={item.key} className="relative">
                <div
                  ref={(el) => (itemsRef.current[item.key] = el)}
                  onMouseEnter={(e) => showCompactTooltip(e, item)}
                  onMouseLeave={hideCompactTooltip}
                  className={`flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-150 ${
                    isActive
                      ? "bg-gradient-to-r from-sky-50/90 to-blue-50/70 text-sky-900 shadow-sm"
                      : "hover:bg-slate-50/80 text-slate-700 hover:text-slate-900"
                  }`}
                >
                  <button
                    onClick={() => {
                      if (hasChildren) {
                        toggleGroup(item.key);
                      } else {
                        navTo(item.path);
                      }
                    }}
                    className="flex items-center gap-3 w-full text-left group"
                    aria-expanded={
                      hasChildren ? !!expandedMap[item.key] : undefined
                    }
                    title={!open ? item.label : undefined}
                  >
                    <div
                      className={`rounded-lg p-2 shrink-0 transition-all duration-150 ${
                        isActive
                          ? "bg-white shadow-sm border border-sky-100"
                          : "bg-white/0 group-hover:bg-white/50 group-hover:shadow-xs"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 transition-colors ${
                          isActive ? "text-sky-600" : "text-slate-600 group-hover:text-slate-800"
                        }`}
                      />
                    </div>

                    {open && (
                      <>
                        <div className="flex-1 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span
                              className={`text-sm ${
                                isActive ? "font-semibold" : "font-medium"
                              }`}
                            >
                              {item.label}
                            </span>
                            {/* {item.description && (
                              <span className="text-xs text-slate-500 mt-0.5">
                                {item.description}
                              </span>
                            )} */}
                          </div>
                          <div className="flex items-center gap-2">
                            {item.key === "loading" &&
                              counts.loading !== undefined && (
                                <Badge count={counts.loading} tone="blue" />
                              )}
                            {item.key === "tasks" &&
                              counts.tasks !== undefined && (
                                <Badge count={counts.tasks} tone="amber" />
                              )}
                            {item.key === "order-tracker" &&
                              counts.orders !== undefined && (
                                <Badge count={counts.orders} tone="green" />
                              )}
                            {hasChildren && (
                              <span className="text-slate-400">
                                {expandedMap[item.key] ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </button>
                </div>

                {/* children (multi-level) */}
                {hasChildren && open && expandedMap[item.key] && (
                  <ul className="mt-1 ml-10 space-y-0.5 border-l border-slate-100">
                    {item.children.map((c) => {
                      const ChildIcon = c.icon || item.icon;
                      const isChildActive = activeChildPath === c.path;
                      return (
                        <li key={c.key}>
                          <button
                            onClick={() => navTo(c.path)}
                            className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2 transition-colors ${
                              isChildActive
                                ? "bg-gradient-to-r from-sky-50/80 to-blue-50/60 text-sky-800 font-semibold border border-sky-100"
                                : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <ChildIcon className="w-3.5 h-3.5" />
                            <span>{c.label}</span>
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

        {/* quick actions */}
        <div className="mt-6 px-3">
          {open && (
            <div className="text-[11px] font-semibold text-slate-500 mb-2 uppercase tracking-wide">
              Quick Actions
            </div>
          )}
          <div className="flex gap-2 flex-col">
            <Button
              onClick={() => navTo("/dashboard/loading/new")}
              className="w-full bg-gradient-to-r from-sky-600 to-blue-600 text-white hover:from-sky-700 hover:to-blue-700 shadow-sm"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              {open && <span>New Loading Sheet</span>}
            </Button>
            <Button
              onClick={() => navTo("/dashboard/invoice/new")}
              variant="outline"
              className="w-full border-sky-100 hover:bg-sky-50 hover:border-sky-200"
              size="sm"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1 text-sky-600" />
              {open && <span>Create Invoice</span>}
            </Button>
          </div>
        </div>
      </nav>

      {/* footer */}
      <div className="px-4 py-4 border-t border-slate-200 bg-gradient-to-r from-slate-50/80 to-gray-50/80 flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold border ${
            roleColor(role).border
          } ${roleColor(role).bg} ${roleColor(role).text}`}
        >
          {role?.[0]?.toUpperCase() || "U"}
        </div>

        {open && (
          <div className="flex-1">
            <div className="text-sm font-medium text-slate-900">
              Ayush Solanki
            </div>
            <div className="text-xs text-slate-500">
              Role:{" "}
              <span className={`${roleColor(role).text} font-medium px-1.5 py-0.5 rounded bg-white/50`}>
                {role}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={() => navTo("/logout")}
          className="p-2 rounded-full hover:bg-slate-100 transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {/* compact tooltip floating preview */}
      {!open && compactTooltip.show && compactTooltip.item && (
        <div
          className="fixed z-50 p-3 w-64 bg-white border border-slate-200 shadow-xl rounded-lg text-sm backdrop-blur-sm"
          style={{
            left: compactTooltip.x,
            top: compactTooltip.y - 8,
            transform: "translateY(-4px)",
          }}
          onMouseEnter={() => setCompactTooltip(prev => ({...prev, show: true}))}
          onMouseLeave={hideCompactTooltip}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-sky-50 rounded">
              {React.createElement(compactTooltip.item.icon, { 
                className: "w-4 h-4 text-sky-600" 
              })}
            </div>
            <div className="font-semibold text-slate-900">
              {compactTooltip.item.label}
            </div>
          </div>
          
          {compactTooltip.item.description && (
            <div className="text-xs text-slate-600 mb-2">
              {compactTooltip.item.description}
            </div>
          )}
          
          {compactTooltip.item.children ? (
            <div className="text-xs text-slate-500 border-t border-slate-100 pt-2">
              <div className="font-medium text-slate-700 mb-1">Submodules:</div>
              {compactTooltip.item.children.map((ch) => {
                const ChildIcon = ch.icon || compactTooltip.item.icon;
                return (
                  <div
                    key={ch.key}
                    className="py-1.5 border-b last:border-b-0 border-slate-100 hover:bg-slate-50 px-1 rounded"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ChildIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>{ch.label}</span>
                      </div>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic">
              Click to open
            </div>
          )}
        </div>
      )}
    </aside>
  );

  /* ----------------- helpers ----------------- */
  function renderTooltipContent(item) {
    if (item.children) {
      return { title: item.label, children: item.children };
    }
    return { title: item.label, desc: item.description || `Open ${item.label}` };
  }
}