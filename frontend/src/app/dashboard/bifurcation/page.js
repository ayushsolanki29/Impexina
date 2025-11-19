"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Search,
  Filter,
  X,
  CheckCircle,
  Clock,
  Divide,
  Activity,
  User,
  PackageOpen,
  Lock,
  Unlock,
  Plus,
  Eye,
  Trash2,
  ChevronDown,
  Download,
  MoreVertical,
  Calendar,
  BarChart3,
  Users as UsersIcon,
  Warehouse,
  ArrowUpDown,
} from "lucide-react";

/* ------------------- mock data (SIMULATING PRISMA DATA) ------------------- */
const mockBifurcations = [
  {
    id: "BIF-001",
    name: "Q4'24 Client Allocation - East",
    description: "Initial stock distribution for major East coast clients.",
    status: "PENDING",
    isLocked: false,
    clientCount: 4,
    totalAllocatedUnits: 1200,
    lockedBy: null,
    createdAt: "2025-11-15T10:00:00Z",
    updatedAt: "2025-11-15T10:00:00Z",
  },
  {
    id: "BIF-002",
    name: "Container PSDH-87 - Emergency",
    description: "Urgent allocation for client C005 due to low stock.",
    status: "IN_PROGRESS",
    isLocked: true,
    clientCount: 1,
    totalAllocatedUnits: 350,
    lockedBy: "Alice Johnson",
    createdAt: "2025-11-18T14:30:00Z",
    updatedAt: "2025-11-19T09:00:00Z",
  },
  {
    id: "BIF-003",
    name: "Q1'25 Planning Draft",
    description: "Future planning draft, not executed.",
    status: "COMPLETED",
    isLocked: false,
    clientCount: 8,
    totalAllocatedUnits: 5000,
    lockedBy: null,
    createdAt: "2025-11-01T08:00:00Z",
    updatedAt: "2025-11-05T11:00:00Z",
  },
  {
    id: "BIF-004",
    name: "Draft Allocation - Rejected",
    description: "Allocation was canceled due to payment failure.",
    status: "CANCELLED",
    isLocked: false,
    clientCount: 2,
    totalAllocatedUnits: 150,
    lockedBy: null,
    createdAt: "2025-10-20T12:00:00Z",
    updatedAt: "2025-10-21T15:00:00Z",
  },
];

// Mock available warehouse stock for the creation modal
const mockAvailableStock = [
  { id: "WI-001", itemName: "FOOTREST Standard", availableQuantity: 500, mark: "BB-AMD" },
  { id: "WI-002", itemName: "TELESCOPIC SHELF Deluxe", availableQuantity: 900, mark: "BB-AMD" },
  { id: "WI-003", itemName: "TABLE RUNNER Pro", availableQuantity: 2016, mark: "SMWGC18" },
];

const mockClients = [
  { id: "C001", name: "Alpha Corp" },
  { id: "C002", name: "Beta Distributors" },
  { id: "C003", name: "Gamma Retail" },
];

/* ------------------- helpers ------------------- */
const formatDate = (d) => {
  try {
    return new Date(d).toLocaleDateString('en-IN');
  } catch {
    return "N/A";
  }
};

const mockUser = { name: "Warehouse Manager", id: "U-1234" };

// Extended status map for Bifurcation statuses
const statusMap = {
  PENDING: { label: "Pending", classes: "bg-amber-50 text-amber-700 border border-amber-200", icon: Clock },
  IN_PROGRESS: { label: "In Progress", classes: "bg-blue-50 text-blue-700 border border-blue-200", icon: Activity },
  COMPLETED: { label: "Completed", classes: "bg-emerald-50 text-emerald-700 border border-emerald-200", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", classes: "bg-rose-50 text-rose-700 border border-rose-200", icon: X },
};

// Status Tag Component
const StatusTag = ({ status }) => {
  const meta = statusMap[status] || { label: status, classes: "bg-gray-100 text-gray-800", icon: Divide };
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${meta.classes}`}>
      <Icon className="w-3 h-3" />
      <span>{meta.label}</span>
    </span>
  );
};

// Reusable Dropdown Filter Component
const DropdownFilter = ({ icon: Icon, value, onChange, options }) => (
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="appearance-none pl-9 pr-8 py-2.5 border border-gray-200 rounded-lg bg-white text-sm font-medium text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
  </div>
);

// Stats Cards Component
const StatsOverview = ({ bifurcations }) => {
  const stats = [
    {
      label: "Total Bifurcations",
      value: bifurcations.length,
      icon: BarChart3,
      color: "blue",
    },
    {
      label: "In Progress",
      value: bifurcations.filter(b => b.status === "IN_PROGRESS").length,
      icon: Activity,
      color: "blue",
    },
    {
      label: "Pending Review",
      value: bifurcations.filter(b => b.status === "PENDING").length,
      icon: Clock,
      color: "amber",
    },
    {
      label: "Total Clients",
      value: bifurcations.reduce((sum, b) => sum + b.clientCount, 0),
      icon: UsersIcon,
      color: "emerald",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-lg bg-${stat.color}-50`}>
              <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ------------------- MAIN COMPONENT ------------------- */
export default function BifurcationManagement() {
  const user = mockUser;
  const authLoading = false;

  const [loading, setLoading] = useState(true);
  const [bifurcations, setBifurcations] = useState([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedBifurcation, setSelectedBifurcation] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError("");
      try {
        await new Promise((r) => setTimeout(r, 700));
        setBifurcations(mockBifurcations);
      } catch (err) {
        setError("Failed to load bifurcations. Try again.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetch();
    }
  }, []);

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const visibleBifurcations = useMemo(() => {
    let list = [...bifurcations];
    
    // Filtering
    if (statusFilter !== "ALL") {
      list = list.filter((b) => b.status === statusFilter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q)
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return list;
  }, [bifurcations, query, statusFilter, sortConfig]);

  const updateBifurcation = (id, updates) => {
    setBifurcations((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
  };

  const handleToggleLock = (bifurcation) => {
    const newLockStatus = !bifurcation.isLocked;
    const newLockedBy = newLockStatus ? user.name : null;

    updateBifurcation(bifurcation.id, {
      isLocked: newLockStatus,
      lockedBy: newLockedBy,
      updatedAt: new Date().toISOString()
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-700">Authenticating...</div>
      </div>
    );
  }

  // Bifurcation Card Component
  const BifurcationCard = ({ b }) => {
    const lockIcon = b.isLocked ? Lock : Unlock;
    const lockClass = b.isLocked
      ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 border-rose-200'
      : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200';

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{b.name}</h3>
              <StatusTag status={b.status} />
            </div>
            <p className="text-sm text-gray-600 mb-3">{b.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Created: {formatDate(b.createdAt)}
              </span>
              <span>•</span>
              <span className="font-mono text-xs bg-gray-50 px-2 py-1 rounded border">
                {b.id}
              </span>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-50 rounded-lg transition">
            <MoreVertical className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <UsersIcon className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">{b.clientCount}</p>
              <p className="text-xs text-gray-500">Clients</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <PackageOpen className="w-4 h-4 text-emerald-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">{b.totalAllocatedUnits}</p>
              <p className="text-xs text-gray-500">Total Units</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Warehouse className="w-4 h-4 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">{b.isLocked ? 'Locked' : 'Unlocked'}</p>
              <p className="text-xs text-gray-500">Status</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <User className="w-4 h-4 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-900 truncate">{b.lockedBy || 'Available'}</p>
              <p className="text-xs text-gray-500">Locked By</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleToggleLock(b)}
              disabled={b.isLocked && b.lockedBy !== user.name}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${lockClass} ${b.isLocked && b.lockedBy !== user.name ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium">{b.isLocked ? 'Unlock' : 'Lock'}</span>
            </button>

            <button
              onClick={() => setSelectedBifurcation(b)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
            >
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">View</span>
            </button>
          </div>

          <button className="p-2 text-gray-400 hover:text-gray-600 transition">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/30 font-sans">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow">
                  <Divide className="w-5 h-5" />
                </div>
                Bifurcation Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Allocate received warehouse stock to specific client orders
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setLoading(true) || setTimeout(() => setBifurcations(mockBifurcations) || setLoading(false), 500)}
                className="p-3 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition shadow-sm"
              >
                <RefreshCw className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setIsNewModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-200/50"
              >
                <Plus className="w-4 h-4" />
                New Bifurcation
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <StatsOverview bifurcations={bifurcations} />

        {/* CONTROLS */}
        <div className="mb-8 bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search bifurcations..."
                className="pl-11 pr-4 py-2.5 w-full rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Status Filter */}
              <DropdownFilter
                icon={Filter}
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: "ALL", label: "All Statuses" },
                  { value: "PENDING", label: "Pending" },
                  { value: "IN_PROGRESS", label: "In Progress" },
                  { value: "COMPLETED", label: "Completed" },
                  { value: "CANCELLED", label: "Cancelled" },
                ]}
              />

              {/* Sort Dropdown */}
              <DropdownFilter
                icon={ArrowUpDown}
                value={sortConfig.key}
                onChange={(key) => handleSort(key)}
                options={[
                  { value: "createdAt", label: "Sort by Date" },
                  { value: "name", label: "Sort by Name" },
                  { value: "totalAllocatedUnits", label: "Sort by Units" },
                ]}
              />
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <section>
          {loading ? (
            // Skeleton Loader
            <div className="space-y-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="animate-pulse bg-white rounded-xl p-6 border border-gray-100 h-48"
                >
                  <div className="flex gap-4 mb-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-6"></div>
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    {[1, 2, 3, 4].map((m) => (
                      <div key={m} className="h-12 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-gray-200 rounded w-24"></div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Bifurcation List
            <div className="space-y-6">
              {visibleBifurcations.length === 0 ? (
                <div className="bg-white p-12 rounded-xl border border-gray-100 shadow-sm text-center">
                  <Divide className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No bifurcations found</h3>
                  <p className="text-gray-500 mb-6">Try adjusting your search or filters</p>
                  <button
                    onClick={() => setIsNewModalOpen(true)}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                  >
                    Create New Bifurcation
                  </button>
                </div>
              ) : (
                <div className="grid gap-6">
                  {visibleBifurcations.map((b) => (
                    <BifurcationCard key={b.id} b={b} />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* MODALS */}
      {isNewModalOpen && (
        <NewBifurcationModal
          onClose={() => setIsNewModalOpen(false)}
          onSave={(newBif) => {
            setBifurcations(prev => [newBif, ...prev]);
            setIsNewModalOpen(false);
          }}
        />
      )}

      {selectedBifurcation && (
        <DetailBifurcationModal
          bifurcation={selectedBifurcation}
          onClose={() => setSelectedBifurcation(null)}
          onUpdate={updateBifurcation}
        />
      )}
    </div>
  );
}

// Detail View Modal
const DetailBifurcationModal = ({ bifurcation, onClose, onUpdate }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div>
            <h2 className="text-xl font-bold">Bifurcation Details</h2>
            <p className="text-blue-100 text-sm mt-1">{bifurcation.id}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-lg font-semibold text-gray-900 mt-1">{bifurcation.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-gray-700 mt-1">{bifurcation.description}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1"><StatusTag status={bifurcation.status} /></div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Locked</label>
                  <p className="text-gray-900 font-medium mt-1">{bifurcation.isLocked ? 'Yes' : 'No'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Clients</label>
                  <p className="text-gray-900 font-medium mt-1">{bifurcation.clientCount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Units</label>
                  <p className="text-gray-900 font-medium mt-1">{bifurcation.totalAllocatedUnits}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <button
              onClick={() => onUpdate(bifurcation.id, { status: 'COMPLETED' })}
              className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
            >
              Mark as Completed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// New Bifurcation Creation Modal (Simplified for brevity)
const NewBifurcationModal = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    if (!name.trim()) {
      alert("Please enter a bifurcation name");
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      const newBif = {
        id: `BIF-${Math.floor(Math.random() * 1000) + 1000}`,
        name: name,
        description: description,
        status: 'PENDING',
        isLocked: false,
        clientCount: 1,
        totalAllocatedUnits: 0,
        lockedBy: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onSave(newBif);
      setIsSaving(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <h2 className="text-xl font-bold">Create New Bifurcation</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Bifurcation Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Q1 Alpha Corp Allocation"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows="3"
                placeholder="Notes about this allocation..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
              className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Creating...' : 'Create Bifurcation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};