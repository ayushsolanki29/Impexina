"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  Download,
  MoreVertical,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Building,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Tag,
} from "lucide-react";
import {  toast } from "sonner";
import API from "@/lib/api";
// import ClientStatusBadge from "@/components/ClientStatusBadge";
// import ClientTypeBadge from "@/components/ClientTypeBadge";

export default function ClientsListPage() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    city: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  const [selectedClients, setSelectedClients] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [stats, setStats] = useState({
    totalClients: 0,
    totalLeads: 0,
    activeClients: 0,
    newClients: 0,
  });
  const [cities, setCities] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  // ClientStatusBadge
  const ClientStatusBadge = ({ status }) => {
    let colorClasses = "bg-gray-100 text-gray-800";
    switch (status) {
      case "ACTIVE":
        colorClasses = "bg-green-100 text-green-800";
        break;
      case "INACTIVE":
        colorClasses = "bg-red-100 text-red-800";
      case "NEW":
        colorClasses = "bg-blue-100 text-blue-800";
        break;
      case "CONTACTED":
        colorClasses = "bg-yellow-100 text-yellow-800";
        break;
      case "QUALIFIED":
        colorClasses = "bg-indigo-100 text-indigo-800";
        break;
      case "PROPOSAL":
        colorClasses = "bg-purple-100 text-purple-800";
        break;
      case "NEGOTIATION":
        colorClasses = "bg-pink-100 text-pink-800";
        break;
      case "LOST":
        colorClasses = "bg-red-200 text-red-900";
        break;
      default:
        colorClasses = "bg-gray-100 text-gray-800";
    }
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses}`}
      >
        {status}
      </span>
    );
  };

  // ClientTypeBadge
  const ClientTypeBadge = ({ type }) => {
    let colorClasses = "bg-gray-100 text-gray-800";
    switch (type) {
      case "LEAD":
        colorClasses = "bg-amber-100 text-amber-800";
        break;
      case "CLIENT":
        colorClasses = "bg-blue-100 text-blue-800";
        break;
      default:
        colorClasses = "bg-gray-100 text-gray-800";
    }
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses}`}
      >
        {type}
      </span>
    );
  };
  // Fetch clients
  const fetchClients = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search,
        type: filters.type,
        status: filters.status,
        city: filters.city,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
      };

      const response = await API.get("/clients", { params });

      if (response.data.success) {
        setClients(response.data.data.clients || []);
        setCurrentPage(response.data.data.pagination?.page || 1);
        setTotalPages(response.data.data.pagination?.totalPages || 1);
      } else {
        toast.error(response.data.message || "Failed to fetch clients");
      }
    } catch (error) {
      toast.error("Error loading clients");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      const response = await API.get("/clients/dashboard/stats");
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  // Fetch cities
  const fetchCities = async () => {
    try {
      const response = await API.get("/clients/cities");
      if (response.data.success) {
        setCities(response.data.data);
      }
    } catch (error) {
      console.error("Error loading cities:", error);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchStats();
    fetchCities();
  }, [search, filters, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSelectClient = (id) => {
    setSelectedClients((prev) =>
      prev.includes(id)
        ? prev.filter((clientId) => clientId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedClients.length === clients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(clients.map((client) => client.id));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedClients.length === 0) {
      toast.error("Please select an action and clients");
      return;
    }

    try {
      let response;

      switch (bulkAction) {
        case "delete":
          if (!confirm(`Delete ${selectedClients.length} selected clients?`))
            return;
          response = await Promise.all(
            selectedClients.map((id) => API.delete(`/clients/${id}`))
          );
          toast.success("Clients deleted successfully");
          break;

        case "convert":
          response = await Promise.all(
            selectedClients.map((id) => API.post(`/clients/${id}/convert`))
          );
          toast.success("Leads converted to clients");
          break;

        case "export":
          const exportParams = new URLSearchParams();
          if (filters.type) exportParams.append("type", filters.type);
          if (filters.status) exportParams.append("status", filters.status);
          if (filters.city) exportParams.append("city", filters.city);

          const exportResponse = await API.get(
            `/clients/export/excel?${exportParams.toString()}`,
            {
              responseType: "blob",
            }
          );

          const url = window.URL.createObjectURL(
            new Blob([exportResponse.data])
          );
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute(
            "download",
            `clients_${new Date().toISOString().split("T")[0]}.xlsx`
          );
          document.body.appendChild(link);
          link.click();
          link.remove();
          break;

        default:
          toast.error("Invalid action");
          return;
      }

      setSelectedClients([]);
      setBulkAction("");
      fetchClients();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed");
      console.error(error);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete client "${name}"?`)) return;

    try {
      await API.delete(`/clients/${id}`);
      toast.success("Client deleted successfully");
      fetchClients();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "INACTIVE":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "NEW":
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        !search ||
        client.name?.toLowerCase().includes(search.toLowerCase()) ||
        client.email?.toLowerCase().includes(search.toLowerCase()) ||
        client.phone?.toLowerCase().includes(search.toLowerCase()) ||
        client.companyName?.toLowerCase().includes(search.toLowerCase());

      const matchesType = !filters.type || client.type === filters.type;
      const matchesStatus = !filters.status || client.status === filters.status;
      const matchesCity = !filters.city || client.city === filters.city;

      return matchesSearch && matchesType && matchesStatus && matchesCity;
    });
  }, [clients, search, filters]);

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey)
      return (
        <ChevronDown className="w-4 h-4 opacity-0 group-hover:opacity-50" />
      );
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">


      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Clients & Leads
            </h1>
            <p className="text-slate-500 mt-1">
              Manage your clients and leads in one place
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard/clients/new")}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add New
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stats.totalClients || 0}
                </p>
              </div>
              <Users className="w-10 h-10 text-blue-500 bg-blue-50 p-2 rounded-lg" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Leads</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stats.totalLeads || 0}
                </p>
              </div>
              <UserPlus className="w-10 h-10 text-amber-500 bg-amber-50 p-2 rounded-lg" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Clients</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {(stats.totalClients || 0) - (stats.totalLeads || 0)}
                </p>
              </div>
              <UserCheck className="w-10 h-10 text-green-500 bg-green-50 p-2 rounded-lg" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Active</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stats.activeClients || 0}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-emerald-500 bg-emerald-50 p-2 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search clients by name, email, phone, company..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Filter className="w-5 h-5" />
            Filters
            {showFilters ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* Refresh */}
          <button
            onClick={() => fetchClients()}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={filters.type}
                  onChange={(e) =>
                    setFilters({ ...filters, type: e.target.value })
                  }
                >
                  <option value="">All Types</option>
                  <option value="LEAD">Lead</option>
                  <option value="CLIENT">Client</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                >
                  <option value="">All Status</option>
                  <option value="NEW">New</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="QUALIFIED">Qualified</option>
                  <option value="PROPOSAL">Proposal</option>
                  <option value="NEGOTIATION">Negotiation</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="LOST">Lost</option>
                </select>
              </div>

              {/* City Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  City
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={filters.city}
                  onChange={(e) =>
                    setFilters({ ...filters, city: e.target.value })
                  }
                >
                  <option value="">All Cities</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setFilters({ type: "", status: "", city: "" })}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Clear filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedClients.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">
                {selectedClients.length} client
                {selectedClients.length > 1 ? "s" : ""} selected
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
              >
                <option value="">Bulk Actions</option>
                <option value="convert">Convert to Client</option>
                <option value="delete">Delete</option>
                <option value="export">Export Selected</option>
              </select>

              <button
                onClick={handleBulkAction}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={!bulkAction}
              >
                Apply
              </button>

              <button
                onClick={() => setSelectedClients([])}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-slate-500">Loading clients...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No clients found
            </h3>
            <p className="text-slate-500 mb-4">
              {search || Object.values(filters).some((f) => f)
                ? "Try adjusting your search or filters"
                : "Get started by adding your first client"}
            </p>
            <button
              onClick={() => router.push("/dashboard/clients/new")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add New Client
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="w-12 px-6 py-3">
                      <input
                        type="checkbox"
                        checked={
                          selectedClients.length === clients.length &&
                          clients.length > 0
                        }
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-1">
                        Client
                        <SortIcon columnKey="name" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group"
                      onClick={() => handleSort("type")}
                    >
                      <div className="flex items-center gap-1">
                        Type
                        <SortIcon columnKey="type" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center gap-1">
                        Status
                        <SortIcon columnKey="status" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredClients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedClients.includes(client.id)}
                          onChange={() => handleSelectClient(client.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                              client.type === "CLIENT"
                                ? "bg-gradient-to-br from-blue-500 to-blue-600"
                                : "bg-gradient-to-br from-amber-400 to-amber-500"
                            }`}
                          >
                            {client.name?.charAt(0) || "?"}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">
                              {client.name}
                            </div>
                            {client.companyName && (
                              <div className="flex items-center gap-1 text-sm text-slate-500">
                                <Building className="w-3 h-3" />
                                {client.companyName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {client.contactPerson && (
                            <div className="text-sm font-medium text-slate-900">
                              {client.contactPerson}
                            </div>
                          )}
                          {client.email && (
                            <div className="flex items-center gap-1 text-sm text-slate-600">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[180px]">
                                {client.email}
                              </span>
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center gap-1 text-sm text-slate-600">
                              <Phone className="w-3 h-3" />
                              {client.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <ClientTypeBadge type={client.type} />
                      </td>
                      <td className="px-6 py-4">
                        <ClientStatusBadge status={client.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <MapPin className="w-3 h-3" />
                          {client.city || "N/A"}
                        </div>
                        {client.lastContactedAt && (
                          <div className="text-xs text-slate-400 mt-1">
                            Last contact:{" "}
                            {new Date(
                              client.lastContactedAt
                            ).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              router.push(`/dashboard/clients/${client.id}`)
                            }
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/clients/${client.id}/edit`
                              )
                            }
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(client.id, client.name)}
                            className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {client.type === "LEAD" && (
                            <button
                              onClick={async () => {
                                try {
                                  await API.post(
                                    `/clients/${client.id}/convert`
                                  );
                                  toast.success("Lead converted to client");
                                  fetchClients();
                                  fetchStats();
                                } catch (error) {
                                  toast.error("Conversion failed");
                                }
                              }}
                              className="p-1.5 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Convert to Client"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-sm text-slate-600">
                  Showing{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * limit + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * limit, filteredClients.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">{filteredClients.length}</span>{" "}
                  results
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchClients(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => fetchClients(pageNum)}
                          className={`w-8 h-8 rounded-lg ${
                            currentPage === pageNum
                              ? "bg-blue-600 text-white"
                              : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => fetchClients(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
