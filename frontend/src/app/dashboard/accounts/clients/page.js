"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {  toast } from "sonner";
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
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  X
} from "lucide-react";
import accountsAPI from "@/services/accounts.clients.service";


export default function AccountsDirectory() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [locations, setLocations] = useState([]);

  // New Client Form State
  const [newClient, setNewClient] = useState({
    name: "",
    location: "",
    phone: "",
    email: "",
    gst: "",
    pan: "",
  });

  // Load Data
  useEffect(() => {
    loadClients();
    loadStats();
    loadLocations();
  }, [search, locationFilter]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const params = {
        search,
        location: locationFilter,
        page: 1,
        limit: 100,
      };
      const data = await accountsAPI.getClients(params);
      setClients(data.data.data.clients || []);
    } catch (error) {
      toast.error(error.message || "Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await accountsAPI.getDashboardStats();
      setStats(data.data.data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const loadLocations = async () => {
    try {
      const response = await accountsAPI.getClients({ limit: 1000 });
      const uniqueLocations = [
        ...new Set(
          response.data.data.clients
            .map(c => c.location)
            .filter(Boolean)
        ),
      ].sort();
      setLocations(uniqueLocations);
    } catch (error) {
      console.error("Failed to load locations:", error);
    }
  };

  // Handle Add Client
  const handleAddClient = async (e) => {
    e.preventDefault();
    if (!newClient.name) {
      return toast.error("Client name is required");
    }

    try {
      await accountsAPI.createClient(newClient);
      toast.success("Client added successfully");
      setIsAddModalOpen(false);
      setNewClient({ name: "", location: "", phone: "", email: "", gst: "", pan: "" });
      loadClients();
      loadStats();
      loadLocations();
    } catch (error) {
      toast.error(error.message || "Failed to add client");
    }
  };

  // Handle Delete Client
  const handleDeleteClient = async (clientId, clientName) => {
    if (!confirm(`Are you sure you want to delete ${clientName}?`)) return;
    
    try {
      await accountsAPI.deleteClient(clientId);
      toast.success("Client deleted successfully");
      loadClients();
      loadStats();
    } catch (error) {
      toast.error(error.message || "Failed to delete client");
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-white to-slate-50">


      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <button
              onClick={() => router.push("/dashboard")}
              className="mb-4 text-slate-600 hover:text-slate-900 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="w-6 h-6 text-blue-600" />
              Accounts Directory
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Manage client ledgers, expenses, and payments
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadClients}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add New Client
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase">Total Receivables</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
                    ₹{stats.totalReceivables?.toLocaleString()}
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-amber-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase">Total Clients</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
                    {stats.totalClients}
                  </div>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase">Active Clients</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
                    {stats.activeClients}
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase">Recent Transactions</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
                    {stats.recentTransactions}
                  </div>
                </div>
                <Wallet className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by client name, phone, email..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select
                className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <option value="">All Locations</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              <button className="px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                More Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Client Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900">No clients found</h3>
            <p className="text-slate-500 text-sm mb-4">Create your first client to get started</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Add Client
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => (
              <div
                key={client.id}
                className="group bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      {client.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 group-hover:text-blue-700">
                        {client.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {client.location || "No Location"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => router.push(`/dashboard/accounts/clients/${client.id}`)}
                      className="p-1 text-slate-400 hover:text-blue-600"
                      title="View Ledger"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client.id, client.name)}
                      className="p-1 text-slate-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-3 border-t border-slate-100">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Expense</div>
                    <div className="font-medium text-slate-700 flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3 text-red-500" />
                      ₹{client.totalExpense?.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Paid</div>
                    <div className="font-medium text-slate-700 flex items-center gap-1">
                      <ArrowDownLeft className="w-3 h-3 text-green-500" />
                      ₹{client.totalPaid?.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">
                      {client._count?.transactions || 0} transactions
                    </span>
                    <div
                      className={`px-3 py-1 rounded text-sm font-bold ${
                        client.balance > 0
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-green-50 text-green-700 border border-green-200"
                      }`}
                    >
                      ₹{client.balance?.toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/dashboard/accounts/clients/${client.id}`)}
                    className="w-full mt-3 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1"
                  >
                    View Ledger
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900">Add New Client</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Client Name *
                </label>
                <input
                  autoFocus
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Kaushik Traders"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Location</label>
                  <input
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Surat"
                    value={newClient.location}
                    onChange={(e) => setNewClient({ ...newClient, location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Phone</label>
                  <input
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="9876543210"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="client@example.com"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">GST No.</label>
                  <input
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="27AAAAA0000A1Z5"
                    value={newClient.gst}
                    onChange={(e) => setNewClient({ ...newClient, gst: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">PAN No.</label>
                  <input
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="ABCDE1234F"
                    value={newClient.pan}
                    onChange={(e) => setNewClient({ ...newClient, pan: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
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