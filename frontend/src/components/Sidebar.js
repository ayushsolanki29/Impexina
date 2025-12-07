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
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * SidebarAdvanced.jsx
 * - Compact mode tooltips (floating preview)
 * - Animated active indicator bar
 * - Role-based highlights
 * - Multi-level menu (submodules)
 * - Uses next/navigation router; links are clickable
 *
 * Usage:
 * <SidebarAdvanced role="admin" currentPath={routerPath} />
 *
 * Notes:
 * - Provide counts prop to show badges: { loading: 12 }
 * - Subitems: each menu item may have `children: [{ key, label, path, icon }]`
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
    children: [
      {
        key: "bif_preview",
        label: "Preview",
        path: "/dashboard/bifurcation/preview",
      },
      {
        key: "bif_manage",
        label: "Manage Rules",
        path: "/dashboard/bifurcation/rules",
      },
    ],
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
  // role based color tokens
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

/* ----------------------------- Component ----------------------------- */
export default function SidebarAdvanced({
  role = "admin",
  currentPath = "/dashboard",
  counts = {}, // e.g. { loading: 12 }
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

  // expanded group state for multi-level items
  const [expandedMap, setExpandedMap] = useState({});
  useEffect(() => {
    // default expand groups if currentPath belongs to them
    const map = {};
    MENU.forEach((m) => {
      if (m.children && m.children.some((c) => currentPath.startsWith(c.path)))
        map[m.key] = true;
    });
    setExpandedMap(map);
  }, [currentPath]);

  const visible = useMemo(
    () => MENU.filter((m) => m.roles.includes(role)),
    [role]
  );

  // animated indicator bar ref & update
  const indicatorRef = useRef(null);
  const itemsRef = useRef({}); // map key -> element

  useEffect(() => {
    // position indicator to active item smoothly
    const activeKey = findActiveKey(visible, currentPath);
    const el = itemsRef.current[activeKey];
    const indicator = indicatorRef.current;
    if (el && indicator) {
      const r = el.getBoundingClientRect();
      const containerR = containerRef.current.getBoundingClientRect();
      const top = r.top - containerR.top;
      indicator.style.transform = `translateY(${top}px)`;
      indicator.style.height = `${r.height}px`;
      indicator.style.opacity = "1";
    } else if (indicator) {
      indicator.style.opacity = "0";
    }
  }, [currentPath, open, visible]);

  function findActiveKey(menu, path) {
    for (const m of menu) {
      if (path === m.path || path.startsWith(m.path + "/")) return m.key;
      if (m.children) {
        for (const c of m.children)
          if (path === c.path || path.startsWith(c.path + "/")) return m.key;
      }
    }
    return null;
  }

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
      } bg-white border-r`}
      aria-label="Main sidebar"
    >
      {/* Top area */}
      <div className="flex items-center justify-between px-4 py-4 border-b">
        <div className="flex items-center gap-3">
          <div
            className={`rounded-md flex items-center justify-center ${
              open ? "w-12 h-12" : "w-10 h-10"
            } bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold`}
          >
            IG
          </div>
          {open && (
            <div>
              <div className="text-sm font-semibold text-slate-900">
                IGPL — Impexina
              </div>
              <div className="text-xs text-slate-500">Import Logistics</div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            aria-label="toggle"
            onClick={() => setOpen((s) => !s)}
            className="p-1 rounded hover:bg-slate-100"
          >
            <ChevronLeft
              className={`w-5 h-5 text-slate-600 ${open ? "" : "rotate-180"}`}
            />
          </button>
        </div>
      </div>

      {/* indicator bar (animated) */}
      <div
        ref={indicatorRef}
        className="pointer-events-none absolute left-0 w-1 bg-blue-600 rounded transition-transform duration-300"
        style={{ top: 0, left: 0, height: 0, opacity: 0 }}
      />

      {/* Menu list */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {visible.map((item) => {
            const Icon = item.icon;
            const active = !!(
              currentPath === item.path ||
              currentPath.startsWith(item.path + "/") ||
              (item.children &&
                item.children.some((c) => currentPath.startsWith(c.path)))
            );
            return (
              <li key={item.key} className="relative">
                <div
                  ref={(el) => (itemsRef.current[item.key] = el)}
                  onMouseEnter={(e) =>
                    showCompactTooltip(e, renderTooltipContent(item))
                  }
                  onMouseLeave={hideCompactTooltip}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                    active ? "bg-blue-50" : "hover:bg-slate-50"
                  }`}
                >
                  <button
                    onClick={() => {
                      if (item.children) toggleGroup(item.key);
                      else navTo(item.path);
                    }}
                    className="flex items-center gap-3 w-full text-left"
                    aria-expanded={
                      item.children ? !!expandedMap[item.key] : undefined
                    }
                    title={!open ? item.label : undefined}
                  >
                    <div
                      className={`rounded p-2 ${
                        active ? "bg-white shadow-sm" : "bg-white/0"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          active ? "text-blue-600" : "text-slate-600"
                        }`}
                      />
                    </div>

                    {open && (
                      <>
                        <div className="flex-1 flex items-center justify-between">
                          <div className="text-sm text-slate-800">
                            {item.label}
                          </div>
                          <div className="flex items-center gap-2">
                            {/* role-based badge example */}
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
                  <ul className="mt-1 ml-8 space-y-1">
                    {item.children.map((c) => {
                      const childActive =
                        currentPath === c.path ||
                        currentPath.startsWith(c.path + "/");
                      return (
                        <li key={c.key}>
                          <button
                            onClick={() => navTo(c.path)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                              childActive
                                ? "bg-blue-50 text-blue-700 font-medium"
                                : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            {c.label}
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
          <div
            className={`${
              open ? "block" : "hidden"
            } text-xs text-slate-500 mb-2`}
          >
            Quick Actions
          </div>
          <div className="flex gap-2 flex-col">
            <Button
              onClick={() => navTo("/dashboard/loading/new")}
              className="w-full bg-blue-600 text-white"
            >
              <Plus className="w-4 h-4" /> {open && <span>New Loading</span>}
            </Button>
            <Button
              onClick={() => navTo("/dashboard/bifurcation/preview")}
              variant="outline"
              className="w-full"
            >
              <Eye className="w-4 h-4 text-blue-600" />{" "}
              {open && <span>Preview</span>}
            </Button>
          </div>
        </div>
      </nav>

      {/* footer */}
      <div className="px-4 py-4 border-t flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-semibold">
          {role?.[0]?.toUpperCase() || "U"}
        </div>

        {open && (
          <div className="flex-1">
            <div className="text-sm font-medium text-slate-800">
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

        <div>
          <button
            onClick={() => navTo("/logout")}
            className="p-2 rounded hover:bg-slate-50"
          >
            <LogOut className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* compact tooltip floating preview */}
      {!open && compactTooltip.show && (
        <div
          className="fixed z-50 p-3 w-64 bg-white border shadow-lg rounded text-sm"
          style={{
            left: compactTooltip.x,
            top: compactTooltip.y - 8,
            transform: "translateY(-4px)",
          }}
        >
          <div className="font-semibold text-slate-800 mb-1">
            {compactTooltip.content.title}
          </div>
          {compactTooltip.content.children ? (
            <div className="text-xs text-slate-500">
              {compactTooltip.content.children.map((ch) => (
                <div key={ch.key} className="py-1 border-b last:border-b-0">
                  <div className="flex items-center justify-between">
                    <div>{ch.label}</div>
                    <div className="text-xs text-slate-400">
                      {/* optional meta */}
                    </div>
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
