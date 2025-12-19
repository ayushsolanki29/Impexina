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
  Package, // Added missing import
} from "lucide-react";
import { Button } from "@/components/ui/button";

const MENU = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: Home,
    path: "/dashboard",
    roles: ["admin", "mod", "employee", "newjoinner"],
    description: "Overview and analytics",
  },
  {
    key: "order-tracker",
    label: "Order Tracker",
    icon: ClipboardCheck,
    path: "/dashboard/order-tracker",
    roles: ["admin", "mod"],
    description: "Track order status and progress",
  },
  {
    key: "loading",
    label: "Loading Sheet",
    icon: Truck,
    path: "/dashboard/loading",
    roles: ["admin", "mod", "employee"],
    description: "Manage loading operations",
  },
  {
    key: "bifurcation",
    label: "Bifurcation",
    icon: Layers,
    path: "/dashboard/bifurcation",
    roles: ["admin", "mod"],
    description: "Split and categorize shipments",
  },
  {
    key: "packing",
    label: "Packing List",
    icon: Package,
    path: "/dashboard/packing",
    roles: ["admin", "mod", "employee"],
    description: "Create and manage packing lists",
  },
  {
    key: "invoice",
    label: "Invoice",
    icon: FileSpreadsheet,
    path: "/dashboard/invoice",
    roles: ["admin", "mod", "accounts"],
    description: "Generate and track invoices",
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
        icon: BarChart3,
      },
      {
        key: "containers-list",
        label: "All Containers",
        path: "/dashboard/containers",
        icon: Container,
      },
    ],
  },
  {
    key: "warehouse",
    label: "Warehouse Plan",
    icon: Warehouse,
    path: "/dashboard/warehouse",
    roles: ["admin", "mod", "accounts"],
    description: "Warehouse layout and planning",
  },
  {
    key: "accounts",
    label: "Accounts",
    icon: Calculator,
    path: "/dashboard/accounts",
    roles: ["admin", "mod", "accounts"],
    description: "Financial accounts and ledgers",
  },
  {
    key: "clients",
    label: "Clients",
    icon: Briefcase,
    path: "/dashboard/clients",
    roles: ["admin", "mod", "accounts"],
    description: "Client management portal",
  },
  {
    key: "expenses",
    label: "Expenses",
    icon: DollarSign,
    path: "/dashboard/expenses",
    roles: ["admin", "mod", "accounts"],
    description: "Track and manage expenses",
  },
  {
    key: "users",
    label: "User Management",
    icon: UserCog,
    path: "/dashboard/users",
    roles: ["admin"],
    description: "Manage system users and permissions",
  },

  {
    key: "tasks",
    label: "Task Management",
    icon: CheckSquare,
    path: "/dashboard/tasks",
    roles: ["admin", "mod"],
    description: "Assign and track team tasks",
  },
];

/* ----------------------------- Helpers ----------------------------- */
function roleColor(role) {
  switch (role) {
    case "admin":
      return {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200", // Darker border, no shadow
      };
    case "employee":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
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

function Badge({ count, tone = "blue" }) {
  if (count === undefined || count === 0) return null;
  const disp = count > 999 ? "999+" : count;
  const toneClass = {
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-800",
    purple: "bg-purple-100 text-purple-700",
  }[tone];
  return (
    <span
      className={`ml-2 inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold rounded-full ${toneClass}`}
    >
      {disp}
    </span>
  );
}

function getActiveInfo(currentPath, menuItems) {
  let activeKey = null;
  let activeChildPath = null;
  let maxMatchLength = 0;

  const normalizedPath = currentPath.endsWith("/")
    ? currentPath.slice(0, -1)
    : currentPath;

  for (const item of menuItems) {
    if (item.children) {
      for (const child of item.children) {
        if (
          normalizedPath === child.path ||
          normalizedPath.startsWith(child.path + "/")
        ) {
          return { activeKey: item.key, activeChildPath: child.path };
        }
      }
    }

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

  const visible = useMemo(
    () => MENU.filter((m) => m.roles.includes(role)),
    [role]
  );

  const { activeKey, activeChildPath } = useMemo(
    () => getActiveInfo(currentPath, MENU),
    [currentPath]
  );

  useEffect(() => {
    if (activeKey && MENU.find((m) => m.key === activeKey)?.children) {
      setExpandedMap((prev) => ({ ...prev, [activeKey]: true }));
    }
  }, [activeKey]);

  // Animated indicator bar
  const indicatorRef = useRef(null);
  const itemsRef = useRef({});

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
      // REMOVED: shadow-sm
      className={`relative flex flex-col h-screen transition-all duration-200 ${
        open ? "w-64" : "w-20"
      } bg-white border-r border-slate-200`}
      aria-label="Main sidebar"
    >
      {/* Top brand */}
      {/* REMOVED: shadow-sm from icon and container */}

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

      {/* Active indicator bar - Kept minimal */}
      <div
        ref={indicatorRef}
        className="pointer-events-none absolute left-0 w-[3px] bg-blue-600 rounded-r-md transition-all duration-300 ease-in-out"
        style={{ top: 0, left: 0, height: 0, opacity: 0 }}
      />

      {/* Menu list */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-0.5 px-3">
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
                  // CHANGED: Removed gradient and shadow. Used flat bg-blue-50 for active.
                  className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all duration-150 ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
                    className="flex items-center gap-3 w-full text-left group outline-none"
                    aria-expanded={
                      hasChildren ? !!expandedMap[item.key] : undefined
                    }
                  >
                    {/* CHANGED: Removed white box background/border around icon. Icon sits directly on row. */}
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-colors ${
                        isActive
                          ? "text-blue-600"
                          : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    />

                    {open && (
                      <>
                        <div className="flex-1 flex items-center justify-between overflow-hidden">
                          <span
                            className={`text-sm truncate ${
                              isActive ? "font-semibold" : "font-medium"
                            }`}
                          >
                            {item.label}
                          </span>
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
                {hasChildren && open && expandedMap[item.key] && (
                  <ul className="mt-1 ml-4 space-y-0.5 pl-3 border-l border-slate-100">
                    {item.children.map((c) => {
                      const isChildActive = activeChildPath === c.path;
                      return (
                        <li key={c.key}>
                          <button
                            onClick={() => navTo(c.path)}
                            // CHANGED: Flat design for subitems
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
                            ></span>
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

        {/* Quick actions */}
        <div className="mt-6 px-4">
          {open && (
            <div className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-wider">
              Quick Actions
            </div>
          )}
          <div className="flex gap-2 flex-col">
            <Button
              onClick={() => navTo("/dashboard/loading/new")}
              // CHANGED: Removed shadow-sm, simplified colors
              className="w-full bg-slate-900 text-white hover:bg-slate-800"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              {open && <span>New Loading Sheet</span>}
            </Button>
            <Button
              onClick={() => navTo("/dashboard/invoice/new")}
              variant="outline"
              // CHANGED: Minimal border, no fancy effects
              className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              size="sm"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1" />
              {open && <span>Create Invoice</span>}
            </Button>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-100 bg-white flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold border ${
            roleColor(role).border
          } ${roleColor(role).bg} ${roleColor(role).text}`}
        >
          {role?.[0]?.toUpperCase() || "U"}
        </div>

        {open && (
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-900 truncate">
              Ayush Solanki
            </div>
            <div className="text-xs text-slate-500 truncate capitalize">
              {role}
            </div>
          </div>
        )}

        <button
          onClick={() => navTo("/logout")}
          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Compact tooltip */}
      {!open && compactTooltip.show && compactTooltip.item && (
        <div
          // CHANGED: Reduced shadow-xl to shadow-md
          className="fixed z-50 p-3 w-56 bg-white border border-slate-200 shadow-md rounded-md text-sm"
          style={{
            left: compactTooltip.x,
            top: compactTooltip.y - 8,
            transform: "translateY(-4px)",
          }}
          onMouseEnter={() =>
            setCompactTooltip((prev) => ({ ...prev, show: true }))
          }
          onMouseLeave={hideCompactTooltip}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="font-semibold text-slate-900">
              {compactTooltip.item.label}
            </div>
          </div>

          {compactTooltip.item.children ? (
            <div className="pt-2 mt-2 border-t border-slate-100">
              {compactTooltip.item.children.map((ch) => (
                <div
                  key={ch.key}
                  className="py-1 px-2 text-xs text-slate-600 rounded hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                >
                  {ch.label}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500">
              {compactTooltip.item.description}
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
    return {
      title: item.label,
      desc: item.description || `Open ${item.label}`,
    };
  }
}
