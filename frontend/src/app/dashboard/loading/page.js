"use client";
import React, { useEffect, useMemo, useState } from "react";
// Removed Next.js routing and relative imports to make the component standalone
// import { useRouter } from "next/navigation"; 
// import { useAuth } from "../../../contexts/AuthContext";
// import API from "../../../lib/api"; 
import {
  Eye,
  RefreshCw,
  Search,
  Filter,
  X,
  CheckCircle,
  Truck,
  Box,
  Calendar,
  ChevronDown,
  ChevronUp,
  CreditCard, 
  MapPin, 
  PackageOpen, 
  Scale, // Using Scale for Weight
  Ship, // Using Ship for loading date context
} from "lucide-react";
import Link from "next/link";

/* ------------------- mock data (keep for demo) ------------------- */
const mockLoadingSheets = [
  { id: "1", shippingCode: "PSDH-86", shippingMark: "BB-AMD", supplier: "YIWU ZHOULAI TRADING", status: "WAREHOUSE", loadingDate: "2024-01-10", arrivalDate: "2024-01-15", totalCBM: 67.85, totalWeight: 11984, totalItems: 27, items: [{ id: "1", itemName: "FOOTREST", ctn: 5, pcs: 500, cbm: 0.417, weight: 35 }, { id: "2", itemName: "TELESCOPIC SHELF", ctn: 12, pcs: 300, cbm: 1.356, weight: 204 }] },
  { id: "2", shippingCode: "PSDH-87", shippingMark: "SMWGC18", supplier: "MELISSAYU EXPORTS", status: "IN_TRANSIT", loadingDate: "2024-01-12", arrivalDate: "2024-01-18", totalCBM: 45.2, totalWeight: 8560, totalItems: 41, items: [{ id: "3", itemName: "TABLE RUNNER", ctn: 21, pcs: 2016, cbm: 0.861, weight: 378 }, { id: "4", itemName: "DOOR SEALING TAPE", ctn: 20, pcs: 600, cbm: 1.02, weight: 326 }] },
  { id: "3", shippingCode: "PSDH-85", shippingMark: "RMSZ-M", supplier: "BRAVEMAN TEXTILES", status: "COMPLETED", loadingDate: "2024-01-05", arrivalDate: "2024-01-12", totalCBM: 89.3, totalWeight: 15200, totalItems: 55, items: [{ id: "5", itemName: "MIRROR", ctn: 25, pcs: 2400, cbm: 3.15, weight: 527 }, { id: "6", itemName: "FOLDING CHAIR", ctn: 20, pcs: 400, cbm: 3.72, weight: 760 }] },
  { id: "4", shippingCode: "PSDH-88", shippingMark: "GZ-SHP-22", supplier: "QUICKTRADE LTD", status: "ARRIVED", loadingDate: "2024-02-01", arrivalDate: "2024-02-15", totalCBM: 30.1, totalWeight: 4500, totalItems: 12, items: [{ id: "7", itemName: "LED LIGHTS", ctn: 10, pcs: 1000, cbm: 0.5, weight: 50 }] },
  { id: "5", shippingCode: "PSDH-89", shippingMark: "FOSHAN-B", supplier: "SUNNY FURNITURE", status: "IN_TRANSIT", loadingDate: "2024-02-10", arrivalDate: "2024-02-28", totalCBM: 55.7, totalWeight: 9800, totalItems: 33, items: [{ id: "8", itemName: "SOFA COVER", ctn: 15, pcs: 450, cbm: 1.1, weight: 150 }] },
  { id: "6", shippingCode: "PSDH-90", shippingMark: "BB-AMD", supplier: "YIWU ZHOULAI TRADING", status: "WAREHOUSE", loadingDate: "2024-02-15", arrivalDate: "2024-02-20", totalCBM: 72.0, totalWeight: 13500, totalItems: 60, items: [{ id: "9", itemName: "LAMP SHADE", ctn: 25, pcs: 750, cbm: 2.0, weight: 300 }] },
];

/* ------------------- helpers ------------------- */
const formatDate = (d) => {
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return "N/A";
  }
};

const statusMap = {
  COMPLETED: {
    label: "Completed",
    classes: "bg-emerald-100 text-emerald-700 border border-emerald-300",
    icon: CheckCircle,
  },
  WAREHOUSE: {
    label: "In Warehouse",
    classes: "bg-blue-100 text-blue-700 border border-blue-300",
    icon: Box,
  },
  IN_TRANSIT: {
    label: "In Transit",
    classes: "bg-amber-100 text-amber-700 border border-amber-300",
    icon: Truck,
  },
  ARRIVED: {
    label: "Arrived",
    classes: "bg-rose-100 text-rose-700 border border-rose-300",
    icon: Truck,
  },
};

// --- NEW HELPER COMPONENT: Metric Pill for Clarity ---
const MetricPill = ({ icon: Icon, label, value, color }) => (
    <div className="flex items-center space-x-1.5 text-xs">
        <Icon className={`w-3 h-3 ${color}`} />
        <span className="font-medium text-gray-500">{label}:</span>
        <span className="font-semibold text-gray-800">{value}</span>
    </div>
);

// Mock user data since useAuth is removed
const mockUser = { name: "Admin User", id: "U-1234" };

export default function LoadingSheets() {
  const user = mockUser;
  const authLoading = false; 

  const [loading, setLoading] = useState(true);
  const [sheets, setSheets] = useState([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("loadingDate"); 
  const [selected, setSelected] = useState(null); 
  const [expandedRows, setExpandedRows] = useState({}); 

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError("");
      try {
        await new Promise((r) => setTimeout(r, 700));
        setSheets(mockLoadingSheets);
      } catch (err) {
        setError("Failed to load loading sheets. Try again.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetch();
    }
  }, []); 

  const visibleSheets = useMemo(() => {
    let list = [...sheets];
    if (statusFilter !== "ALL") {
      list = list.filter((s) => s.status === statusFilter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (s) =>
          s.shippingCode.toLowerCase().includes(q) ||
          s.shippingMark.toLowerCase().includes(q) ||
          s.supplier.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const ad = new Date(a[sortBy]).getTime();
      const bd = new Date(b[sortBy]).getTime();
      return bd - ad; 
    });
    return list;
  }, [sheets, query, statusFilter, sortBy]);

  const toggleRow = (id) => {
    setExpandedRows((p) => ({ ...p, [id]: !p[id] }));
  };

  const changeStatus = (sheetId, nextStatus) => {
    setSheets((prev) =>
      prev.map((s) => (s.id === sheetId ? { ...s, status: nextStatus } : s))
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-700">Authenticating...</div>
      </div>
    );
  }

  // --- Component: SheetRowCard ---
  const SheetRowCard = ({ s, meta }) => {
    const isExpanded = expandedRows[s.id];
    
    // Total weight adjusted for display clarity
    const displayWeight = s.totalWeight >= 1000 ? `${(s.totalWeight / 1000).toFixed(1)} T` : `${s.totalWeight} kg`;

    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm transition hover:shadow-lg hover:border-blue-400">
        <div 
          className="p-4 grid items-center gap-4 cursor-pointer"
          // --- UPDATED GRID STRUCTURE for Clarity ---
          style={{ gridTemplateColumns: 'minmax(100px, 1fr) minmax(200px, 1.5fr) minmax(130px, 1fr) minmax(130px, 1fr) minmax(120px, 0.8fr) minmax(100px, 0.5fr)' }}
          onClick={() => setSelected(s)} 
          // Removed responsive classes for clarity on the desktop-focused grid, 
          // but the content naturally wraps well on mobile.
        >
          {/* Column 1: ID & Mark (Primary Identifier) */}
          <div className="min-w-0 pr-2">
            <div className="text-base font-bold text-blue-700 truncate">{s.shippingCode}</div>
            <p className="text-xs text-gray-500 truncate mt-0.5">{s.shippingMark}</p>
          </div>
          
          {/* Column 2: Supplier & Item Count */}
          <div className="min-w-0 pr-2">
            <div className="flex items-center text-sm font-semibold text-gray-800 truncate">
              <MapPin className="w-3.5 h-3.5 text-gray-400 mr-1" />
              {s.supplier}
            </div>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center">
              <PackageOpen className="w-3 h-3 text-gray-400 mr-1" />
              <span className="font-semibold text-gray-700">{s.totalItems}</span> Unique Items
            </p>
          </div>

          {/* Column 3: Dates (Load and Arrival) - Now Dedicated */}
          <div className="flex flex-col space-y-1 text-sm text-gray-600">
             <MetricPill icon={Ship} label="Load" value={formatDate(s.loadingDate)} color="text-blue-500" />
             <MetricPill icon={Calendar} label="Arrival" value={formatDate(s.arrivalDate)} color="text-rose-500" />
          </div>

          {/* Column 4: Volume & Weight - Now Dedicated */}
          <div className="flex flex-col space-y-1 text-sm text-gray-600">
             <MetricPill icon={CreditCard} label="CBM" value={`${s.totalCBM.toFixed(2)} m³`} color="text-teal-600" />
             <MetricPill icon={Scale} label="Weight" value={displayWeight} color="text-orange-600" />
          </div>

          {/* Column 5: Status Tag */}
          <div className="flex justify-center">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${meta.classes}`}
            >
              <meta.icon className="w-3 h-3" />
              <span>{meta.label}</span>
            </span>
          </div>
          
          {/* Column 6: Actions */}
          <div className="flex justify-end gap-2">
            <button
              title="Quick Status"
              onClick={(e) => { e.stopPropagation(); toggleRow(s.id); }}
              className="p-2 rounded-full hover:bg-gray-100 border border-gray-300 transition"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              )}
            </button>
            <button
              title="Open Sheet"
              onClick={(e) => { e.stopPropagation(); setSelected(s); }}
              className="p-2 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Expanded Quick Actions Panel */}
        {isExpanded && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
            <span className="text-xs font-medium text-gray-500 mr-3">Change Status:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.keys(statusMap)
                .filter((key) => key !== s.status)
                .map((nextStatus) => (
                  <button
                    key={nextStatus}
                    onClick={() => {
                      changeStatus(s.id, nextStatus);
                      toggleRow(s.id); 
                    }}
                    className="px-3 py-1.5 text-xs font-medium rounded-full bg-white border border-gray-300 text-gray-700 hover:bg-blue-100 hover:border-blue-500 transition"
                  >
                    Mark {statusMap[nextStatus].label}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };
  // --- End SheetRowCard ---

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Loading Sheets</h1>
            <p className="text-sm text-gray-500 mt-1">
              Real-time shipment tracking and actions ({visibleSheets.length} active)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setLoading(true);
                setTimeout(() => {
                  setSheets(mockLoadingSheets);
                  setLoading(false);
                }, 500);
              }}
              title="Refresh Data"
              className="p-3 rounded-full bg-white border border-gray-200 hover:bg-gray-100 transition shadow-sm"
            >
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </button>
            <Link href={"/dashboard/loading/new"}>
            <button
            
            className="px-5 py-2.5 bg-blue-600 text-white rounded-full text-sm font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200/50"
            >
              + New Sheet
            </button>
              </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* CONTROLS (Unified Filter Bar) */}
        <div className="mb-6 bg-white p-4 rounded-xl shadow-lg border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by code, mark, or supplier..."
                className="pl-10 pr-4 py-2 w-full rounded-full border border-gray-300 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
              />
            </div>

            {/* Filters and Sort */}
            <div className="flex gap-3">
              {/* Status Filter Dropdown */}
              <DropdownFilter 
                icon={Filter} 
                value={statusFilter} 
                onChange={setStatusFilter}
                options={[
                  { value: "ALL", label: "All Statuses" },
                  ...Object.keys(statusMap).map(key => ({ value: key, label: statusMap[key].label }))
                ]}
              />

              {/* Sort Dropdown */}
              <DropdownFilter 
                icon={Calendar} 
                value={sortBy} 
                onChange={setSortBy}
                options={[
                  { value: "loadingDate", label: "Sort: Loading Date" },
                  { value: "arrivalDate", label: "Sort: Arrival Date" },
                ]}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 text-sm text-red-700 bg-red-100 border border-red-300 px-4 py-3 rounded-lg font-medium">
            {error}
          </div>
        )}

        {/* CONTENT */}
        <section>
          {loading ? (
            // Skeleton Loader
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className="animate-pulse bg-white rounded-xl p-6 border border-gray-100 shadow-md h-24"
                />
              ))}
            </div>
          ) : (
            // Sheet List
            <div className="space-y-4">
               {/* Desktop Table Header (visible only on large screens) */}
              <div 
                className="hidden lg:grid text-xs font-semibold uppercase text-gray-500 px-4 pb-2"
                style={{ gridTemplateColumns: 'minmax(100px, 1fr) minmax(200px, 1.5fr) minmax(130px, 1fr) minmax(130px, 1fr) minmax(120px, 0.8fr) minmax(100px, 0.5fr)' }}
              >
                <div>Sheet ID / Mark</div>
                <div>Supplier / Items</div>
                <div>Dates (Load/Arrival)</div>
                <div>Volume / Weight</div>
                <div className="text-center">Status</div>
                <div className="text-right">Actions</div>
              </div>

              {visibleSheets.length === 0 ? (
                <div className="bg-white p-10 rounded-xl border border-gray-100 shadow-lg text-center text-base text-gray-500">
                  <Truck className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  No loading sheets match your criteria.
                </div>
              ) : (
                <div className="grid gap-3">
                  {visibleSheets.map((s) => {
                    const meta = statusMap[s.status] || {
                      label: s.status,
                      classes: "bg-gray-100 text-gray-800 border border-gray-200",
                    };
                    return (
                      <SheetRowCard key={s.id} s={s} meta={meta} />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* SHEET DETAILS MODAL - Enhanced Visuals */}
      {selected && (
        <Modal 
          selected={selected} 
          setSelected={setSelected} 
          changeStatus={changeStatus} 
        />
      )}
      
      {/* Helper components for React Single File Mandate */}
      <StatBoxComponent />
      <StatusTagComponent />
    </div>
  );
}

// --- Helper Components for Clean Code Structure ---

// Dropdown Filter Component
const DropdownFilter = ({ icon: Icon, value, onChange, options }) => (
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="appearance-none pl-9 pr-8 py-2 border border-gray-300 rounded-full bg-white text-sm font-medium text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
  </div>
);

// Status Tag Component
const StatusTag = ({ status }) => {
    const meta = statusMap[status] || {
        label: status,
        classes: "bg-gray-100 text-gray-800 border border-gray-200",
        icon: Box,
    };
    const Icon = meta.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${meta.classes}`}>
            <Icon className="w-3 h-3" />
            <span>{meta.label}</span>
        </span>
    );
};

// Modal Stat Box
const StatBox = ({ label, value, icon: Icon }) => (
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 shadow-sm">
        <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
        <div className="flex items-center mt-1">
            {Icon && <Icon className="w-4 h-4 text-blue-600 mr-2" />}
            <p className="text-base font-semibold text-gray-900">{value}</p>
        </div>
    </div>
);

// Modal Component
const Modal = ({ selected, setSelected, changeStatus }) => {
    // Total weight adjusted for display clarity
    const displayWeight = selected.totalWeight >= 1000 ? `${(selected.totalWeight / 1000).toFixed(1)} T` : `${selected.totalWeight} kg`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition"
            onClick={() => setSelected(null)}
          />
          <div className="relative max-w-4xl w-full bg-white rounded-2xl shadow-2xl transform transition-all duration-300 scale-100 overflow-hidden max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {selected.shippingCode} Details
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  <span className="font-medium">{selected.shippingMark}</span> · Supplier: {selected.supplier}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-3 rounded-full hover:bg-gray-100 text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 border-b pb-4">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase">Current Status</p>
                    <div className="mt-1"><StatusTag status={selected.status} /></div>
                </div>
                <StatBox label="Loading Date" value={formatDate(selected.loadingDate)} icon={Ship} />
                <StatBox label="Arrival Date" value={formatDate(selected.arrivalDate)} icon={Calendar} />
                <StatBox label="Total Items" value={`${selected.totalItems} unique`} icon={PackageOpen} />
                <StatBox label="Total CBM" value={`${selected.totalCBM.toFixed(2)} m³`} icon={CreditCard} />
                <StatBox label="Total Weight" value={displayWeight} icon={Scale} />
              </div>

              {/* Items Table */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Container Contents
                </h3>
                <div className="overflow-x-auto">
                    <div className="min-w-full divide-y divide-gray-200 border rounded-xl shadow-md">
                        {/* Table Header */}
                        <div className="bg-gray-100 grid grid-cols-5 text-xs font-semibold uppercase text-gray-600 tracking-wider rounded-t-xl">
                            <div className="px-4 py-3 col-span-2">Item Name</div>
                            <div className="px-4 py-3 text-center">Cartons (CTN)</div>
                            <div className="px-4 py-3 text-center">CBM</div>
                            <div className="px-4 py-3 text-center">Weight (kg)</div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-gray-100">
                            {selected.items.map((it) => (
                                <div key={it.id} className="grid grid-cols-5 text-sm hover:bg-gray-50 transition">
                                    <div className="px-4 py-3 font-medium text-gray-900 col-span-2">{it.itemName}</div>
                                    <div className="px-4 py-3 text-center text-gray-600">{it.ctn} ({it.pcs} Pcs)</div>
                                    <div className="px-4 py-3 text-center text-gray-600">{it.cbm}</div>
                                    <div className="px-4 py-3 text-center text-gray-600">{it.weight}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setSelected(null)}
                  className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    changeStatus(selected.id, "COMPLETED");
                    setSelected(null);
                  }}
                  className="px-4 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                >
                  Mark Completed
                </button>
              </div>
            </div>
          </div>
        </div>
    );
}

// Placeholder component to satisfy React Single File Mandate
const StatBoxComponent = () => null; 
const StatusTagComponent = () => null;