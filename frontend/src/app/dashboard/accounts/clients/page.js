"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";
import {
  Search,
  Plus,
  Users,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Filter,
  ArrowLeft,
} from "lucide-react";

// --- Mock Data for Initial Load ---
const DEMO_CLIENTS = [
  {
    id: "cl-1",
    name: "KAUSHIK - SURAT",
    location: "Surat",
    phone: "9876543210",
    totalExpense: 291868,
    totalPaid: 0,
    balance: 291868,
    lastActive: "2025-11-01",
  },
  {
    id: "cl-2",
    name: "CHARU",
    location: "Mumbai",
    phone: "9123456789",
    totalExpense: 270340,
    totalPaid: 0,
    balance: 270340,
    lastActive: "2025-12-08",
  },
  {
    id: "cl-3",
    name: "DAVID IMPEX",
    location: "Delhi",
    phone: "8888888888",
    totalExpense: 150000,
    totalPaid: 50000,
    balance: 100000,
    lastActive: "2025-10-15",
    type: "special", // For future logic
  },
];

export default function AccountsDirectory() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Client Form State
  const [newClient, setNewClient] = useState({
    name: "",
    location: "",
    phone: "",
  });

  // Load Data
  useEffect(() => {
    const t = setTimeout(() => {
      const raw = localStorage.getItem("igpl_clients");
      if (!raw) {
        localStorage.setItem("igpl_clients", JSON.stringify(DEMO_CLIENTS));
        setClients(DEMO_CLIENTS);
      } else {
        setClients(JSON.parse(raw));
      }
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, []);

  // Filter Logic
  const filteredClients = useMemo(() => {
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q.toLowerCase()) ||
        c.location?.toLowerCase().includes(q.toLowerCase())
    );
  }, [clients, q]);

  // Add Client Handler
  const handleAddClient = (e) => {
    e.preventDefault();
    if (!newClient.name) return toast.error("Client name is required");

    const newId = `cl-${Date.now()}`;
    const payload = {
      id: newId,
      ...newClient,
      totalExpense: 0,
      totalPaid: 0,
      balance: 0,
      lastActive: new Date().toISOString().split("T")[0],
    };

    const updated = [payload, ...clients];
    setClients(updated);
    localStorage.setItem("igpl_clients", JSON.stringify(updated));
    toast.success("Client added successfully");
    setIsAddModalOpen(false);
    setNewClient({ name: "", location: "", phone: "" });
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Toaster position="top-right" />

      {/* --- Header --- */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <button
              onClick={() => router.push("/dashboard/accounts")}
              className="hover:bg-gray-400 p-2 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="w-6 h-6 text-blue-600" />
              Accounts Module
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Manage client ledgers, expenses, and payments.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add New Client
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* --- Stats Overview --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-medium text-slate-500 uppercase">
              Total Receivables
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              ₹
              {clients
                .reduce((acc, c) => acc + (c.balance || 0), 0)
                .toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-medium text-slate-500 uppercase">
              Total Clients
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {clients.length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-medium text-slate-500 uppercase">
              Recently Active
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {
                clients.filter(
                  (c) =>
                    new Date(c.lastActive) >
                    new Date(Date.now() - 86400000 * 30)
                ).length
              }
            </div>
          </div>
        </div>

        {/* --- Filters --- */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by client name, location..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="h-6 w-px bg-slate-200"></div>
          <button className="text-slate-500 hover:text-slate-800 flex items-center gap-2 text-sm font-medium">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        {/* --- Client List Grid --- */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 bg-slate-100 animate-pulse rounded-xl"
              />
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900">
              No clients found
            </h3>
            <p className="text-slate-500 text-sm">
              Create a new client to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                onClick={() =>
                  router.push(`/dashboard/accounts/clients/${client.id}`)
                }
                className="group bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                      {client.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 leading-tight group-hover:text-blue-700 transition-colors">
                        {client.name}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        {client.location || "No Location"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
                </div>

                <div className="grid grid-cols-2 gap-4 py-3 border-t border-slate-50">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Total Expense
                    </div>
                    <div className="font-medium text-slate-700 flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3 text-red-500" />₹
                      {client.totalExpense?.toLocaleString() || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Paid
                    </div>
                    <div className="font-medium text-slate-700 flex items-center gap-1">
                      <ArrowDownLeft className="w-3 h-3 text-green-500" />₹
                      {client.totalPaid?.toLocaleString() || 0}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs text-slate-400">
                    Last active: {client.lastActive}
                  </span>
                  <div
                    className={`px-2.5 py-1 rounded text-xs font-bold ${
                      client.balance > 0
                        ? "bg-amber-50 text-amber-700"
                        : "bg-green-50 text-green-700"
                    }`}
                  >
                    Due: ₹{client.balance?.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Add Client Modal (Simple Overlay) --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Add New Client
            </h2>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Client Name *
                </label>
                <input
                  autoFocus
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Kaushik Traders"
                  value={newClient.name}
                  onChange={(e) =>
                    setNewClient({ ...newClient, name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">
                    Location
                  </label>
                  <input
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Surat"
                    value={newClient.location}
                    onChange={(e) =>
                      setNewClient({ ...newClient, location: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">
                    Phone
                  </label>
                  <input
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Optional"
                    value={newClient.phone}
                    onChange={(e) =>
                      setNewClient({ ...newClient, phone: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm"
                >
                  Create Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
