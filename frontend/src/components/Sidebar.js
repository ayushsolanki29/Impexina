"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  Box,
  ClipboardList,
  FileText,
  Settings,
  Users,
  LogOut,
  DockIcon,
  ChevronLeft,
  Plus,
  Eye,
  ChevronDown,
  ChevronRight,
  Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * SidebarAdvanced.jsx
 * - Compact mode tooltips (floating preview)
 * - Animated active indicator bar
 * - Role-based highlights
 * - Multi-level menu (submodules)
 */

/* ----------------------------- Menu (with submodules) ----------------------------- */
const MENU = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: Home,
    path: "/dashboard",
    roles: ["admin", "mod", "employee", "newjoinner"],
  },
  {
    key: "loading",
    label: "Loading Sheet",
    icon: Box,
    path: "/dashboard/loading",
    roles: ["admin", "mod", "employee"],
    children: [
      {
        key: "loading_list",
        label: "All Loadings",
        path: "/dashboard/loading",
      },
      {
        key: "loading_new",
        label: "New Loading",
        path: "/dashboard/loading/new",
      },
      {
        key: "loading_bulk",
        label: "Bulk Import",
        path: "/dashboard/loading/import",
      },
    ],
  },
  {
    key: "bifurcation",
    label: "Bifurcation",
    icon: ClipboardList,
    path: "/dashboard/bifurcation",
    roles: ["admin", "mod"],
  },
  {
    key: "packing",
    label: "Packing List",
    icon: FileText,
    path: "/dashboard/packing",
    roles: ["admin", "mod", "employee"],
  },
  {
    key: "invoice",
    label: "Invoice",
    icon: DockIcon,
    path: "/dashboard/invoice",
    roles: ["admin", "mod", "accounts"],
  },
  {
    key: "warehouse",
    label: "Warehouse Plan",
    icon: Warehouse,
    path: "/dashboard/warehouse",
    roles: ["admin", "mod", "accounts"],
  },
  {
    key: "users",
    label: "User Management",
    icon: Users,
    path: "/dashboard/users",
    roles: ["admin"],
  },
  {
    key: "settings",
    label: "Settings",
    icon: Settings,
    path: "/dashboard/settings",
    roles: ["admin"],
  },
];

/* ----------------------------- Helpers ----------------------------- */
function roleColor(role) {
  switch (role) {
    case "admin":
      return { bg: "bg-red-50", text: "text-red-700", ring: "ring-red-100" };
    case "employee":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        ring: "ring-emerald-100",
      };
    case "mod":
      return {
        bg: "bg-amber-50",
        text: "text-amber-800",
        ring: "ring-amber-100",
      };
    default:
      return {
        bg: "bg-slate-50",
        text: "text-slate-700",
        ring: "ring-slate-100",
      };
  }
}

function Badge({ count, tone = "blue" }) {
  if (count === undefined) return null;
  const disp = count > 999 ? "999+" : count;
  const toneClass = {
    blue: "bg-blue-50 text-blue-700",
    red: "bg-red-50 text-red-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-800",
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
 * Active match logic:
 * - chooses the MOST SPECIFIC matching path (longest)
 * - checks children as well
 * - e.g.:
 *   - "/dashboard/loading" -> "loading"
 *   - "/dashboard/loading/new" -> "loading" + child "/dashboard/loading/new"
 */
function getActiveInfo(path) {
  let bestMatch = { key: null, childPath: null, score: -1 };

  // Helper to score matches
  function scoreMatch(itemPath, isExact = false) {
    if (isExact) return 1000 + itemPath.length;
    return itemPath.length;
  }

  for (const item of MENU) {
    // Check exact match with parent item
    if (item.path === path) {
      return { activeKey: item.key, activeChildPath: null };
    }

    // Check if current path starts with item path (for parent routes)
    if (path.startsWith(item.path + "/") && item.path !== "/dashboard") {
      const score = scoreMatch(item.path);
      if (score > bestMatch.score) {
        bestMatch = { key: item.key, childPath: null, score };
      }
    }

    // Check children
    if (item.children) {
      for (const child of item.children) {
        // Exact match with child
        if (child.path === path) {
          return { activeKey: item.key, activeChildPath: child.path };
        }

        // Path starts with child path (for deeper nested routes)
        if (path.startsWith(child.path + "/")) {
          const score = scoreMatch(child.path);
          if (score > bestMatch.score) {
            bestMatch = { key: item.key, childPath: child.path, score };
          }
        }
      }
    }
  }

  // If we found a best match, return it
  if (bestMatch.key) {
    return { activeKey: bestMatch.key, activeChildPath: bestMatch.childPath };
  }

  // Default to dashboard only if we're exactly on /dashboard or no other match
  if (path === "/dashboard" || path.startsWith("/dashboard")) {
    return { activeKey: "dashboard", activeChildPath: null };
  }

  return { activeKey: null, activeChildPath: null };
}

/* ----------------------------- Component ----------------------------- */
export default function SidebarAdvanced({
  role = "admin",
  currentPath = "/dashboard/",
  counts = {},
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true); // expanded
  const [compactTooltip, setCompactTooltip] = useState({
    show: false,
    x: 0,
    y: 0,
    content: "",
  });
  const containerRef = useRef(null);

  const [expandedMap, setExpandedMap] = useState({});

  // Expand submenus based on current path
  useEffect(() => {
    const map = {};
    MENU.forEach((m) => {
      if (m.children) {
        // Check if current path matches any child
        const hasActiveChild = m.children.some(
          (c) => currentPath === c.path || currentPath.startsWith(c.path + "/")
        );
        // Check if current path matches the parent itself
        const isParentActive =
          currentPath === m.path || currentPath.startsWith(m.path + "/");

        if (hasActiveChild || isParentActive) {
          map[m.key] = true;
        }
      }
    });
    setExpandedMap(map);
  }, [currentPath]);

  // Filter menu based on user role
  const visible = useMemo(
    () => MENU.filter((m) => m.roles.includes(role)),
    [role]
  );

  // Get active menu item
  const { activeKey, activeChildPath } = useMemo(
    () => getActiveInfo(currentPath),
    [currentPath]
  );

  // animated indicator bar
  const indicatorRef = useRef(null);
  const itemsRef = useRef({}); // key -> element

  // Update indicator position - FIXED: removed 'visible' from dependencies
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
  }, [activeKey, open]); // Removed 'visible' from dependencies

  function navTo(p) {
    if (!p) return;
    router.push(p);
  }

  function toggleGroup(key) {
    setExpandedMap((s) => ({ ...s, [key]: !s[key] }));
  }

  // compact tooltip handlers
  function showCompactTooltip(e, content) {
    if (open) return;
    const rect = containerRef.current.getBoundingClientRect();
    setCompactTooltip({
      show: true,
      x: rect.right + 12,
      y: e.currentTarget.getBoundingClientRect().top + window.scrollY,
      content,
    });
  }

  function hideCompactTooltip() {
    setCompactTooltip({ show: false, x: 0, y: 0, content: "" });
  }

  return (
    <aside
      ref={containerRef}
      className={`relative flex flex-col h-screen transition-all duration-200 ${
        open ? "w-64" : "w-20"
      } bg-white/95 border-r border-slate-200 shadow-sm`}
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
            IG
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
          className="p-1.5 rounded-full hover:bg-slate-100 border border-slate-200"
        >
          <ChevronLeft
            className={`w-4 h-4 text-slate-600 transition-transform ${
              open ? "" : "rotate-180"
            }`}
          />
        </button>
      </div>

      {/* active indicator bar */}
      <div
        ref={indicatorRef}
        className="pointer-events-none absolute left-0 w-1 bg-sky-600 rounded-full transition-transform duration-300"
        style={{ top: 0, left: 0, height: 0, opacity: 0 }}
      />

      {/* Menu list */}
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-1 px-2">
          {visible.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === activeKey;

            return (
              <li key={item.key} className="relative">
                <div
                  ref={(el) => (itemsRef.current[item.key] = el)}
                  onMouseEnter={(e) =>
                    showCompactTooltip(e, renderTooltipContent(item))
                  }
                  onMouseLeave={hideCompactTooltip}
                  className={`flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    isActive
                      ? "bg-sky-50/90 text-sky-900"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <button
                    onClick={() => {
                      if (item.children) {
                        toggleGroup(item.key);
                      } else {
                        navTo(item.path);
                      }
                    }}
                    className="flex items-center gap-3 w-full text-left"
                    aria-expanded={
                      item.children ? !!expandedMap[item.key] : undefined
                    }
                    title={!open ? item.label : undefined}
                  >
                    <div
                      className={`rounded-lg p-2 shrink-0 ${
                        isActive
                          ? "bg-white shadow-sm border border-sky-100"
                          : "bg-white/0"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          isActive ? "text-sky-600" : "text-slate-600"
                        }`}
                      />
                    </div>

                    {open && (
                      <>
                        <div className="flex-1 flex items-center justify-between">
                          <span
                            className={`text-sm ${
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
                            {item.children && (
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
                {item.children && open && expandedMap[item.key] && (
                  <ul className="mt-1 ml-10 space-y-0.5 border-l border-slate-100">
                    {item.children.map((c) => {
                      const isChildActive = activeChildPath === c.path;
                      return (
                        <li key={c.key}>
                          <button
                            onClick={() => navTo(c.path)}
                            className={`w-full text-left px-3 py-1.5 rounded-md text-xs flex items-center justify-between ${
                              isChildActive
                                ? "bg-sky-50 text-sky-800 font-semibold border border-sky-100"
                                : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
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
              className="w-full bg-sky-600 text-white hover:bg-sky-700"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              {open && <span>New Loading</span>}
            </Button>
            <Button
              onClick={() => navTo("/dashboard/bifurcation")}
              variant="outline"
              className="w-full border-sky-100 hover:bg-sky-50"
              size="sm"
            >
              <Eye className="w-4 h-4 mr-1 text-sky-600" />
              {open && <span>Bifurcation</span>}
            </Button>
          </div>
        </div>
      </nav>

      {/* footer */}
      <div className="px-4 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold ${
            roleColor(role).bg
          } ${roleColor(role).text}`}
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
              <span className={`${roleColor(role).text} font-medium`}>
                {role}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={() => navTo("/logout")}
          className="p-2 rounded-full hover:bg-slate-100"
        >
          <LogOut className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {/* compact tooltip floating preview */}
      {!open && compactTooltip.show && (
        <div
          className="fixed z-50 p-3 w-64 bg-white border border-slate-200 shadow-lg rounded-lg text-sm"
          style={{
            left: compactTooltip.x,
            top: compactTooltip.y - 8,
            transform: "translateY(-4px)",
          }}
        >
          <div className="font-semibold text-slate-900 mb-1">
            {compactTooltip.content.title}
          </div>
          {compactTooltip.content.children ? (
            <div className="text-xs text-slate-500">
              {compactTooltip.content.children.map((ch) => (
                <div
                  key={ch.key}
                  className="py-1 border-b last:border-b-0 border-slate-100"
                >
                  <div className="flex items-center justify-between">
                    <div>{ch.label}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500">
              {compactTooltip.content.desc}
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
    return { title: item.label, desc: "Click to open " + item.label };
  }
}
