"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Search, Loader2, ArrowLeft, Users, MapPin, Package, ChevronRight, ChevronLeft, X, FileEdit, Truck, PackageCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { get } from "@/lib/api";

export default function AccountClientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [pagination, setPagination] = useState({ totalPages: 1, totalItems: 0 });
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "ALL");
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get("status") || "ALL");

  const STATUS_CONFIG = {
    ALL:       { label: 'All',       icon: null,         cls: 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50', activeCls: 'bg-slate-900 text-white border-slate-900' },
    OPEN:      { label: 'Open',      icon: FileEdit,     cls: 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100', activeCls: 'bg-amber-500 text-white border-amber-500' },
    LOADED:    { label: 'Loaded',    icon: Truck,        cls: 'border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100', activeCls: 'bg-blue-500 text-white border-blue-500' },
    DELIVERED: { label: 'Delivered', icon: PackageCheck, cls: 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100', activeCls: 'bg-green-500 text-white border-green-500' },
  };

  const syncURL = (s, p, city, status) => {
    const params = new URLSearchParams();
    if (s) params.set("search", s);
    if (p > 1) params.set("page", p);
    if (city && city !== "ALL") params.set("city", city);
    if (status && status !== "ALL") params.set("status", status);
    window.history.replaceState(null, "", params.toString() ? `?${params}` : window.location.pathname);
  };

  useEffect(() => {
    fetchClients();
  }, [page, search, selectedStatus]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const statusParam = selectedStatus !== "ALL" ? `&status=${selectedStatus}` : "";
      const res = await get(`/accounts/clts?page=${page}&limit=20&search=${search}&type=CLIENT${statusParam}`);
      if (res.success) {
        setClients(res.data);
        setPagination(res.pagination);
      }
    } catch {
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = useMemo(() =>
    selectedCity === "ALL" ? clients : clients.filter(c => c.city === selectedCity),
    [clients, selectedCity]
  );

  const cities = useMemo(() =>
    ["ALL", ...new Set(clients.map(c => c.city).filter(Boolean))],
    [clients]
  );

  const hasFilters = search || selectedCity !== "ALL" || selectedStatus !== "ALL";

  const clearFilters = () => {
    setSearch(""); setSelectedCity("ALL"); setSelectedStatus("ALL"); setPage(1);
    window.history.replaceState(null, "", window.location.pathname);
  };

  const handleSearch = (val) => {
    setSearch(val); setPage(1);
    syncURL(val, 1, selectedCity, selectedStatus);
  };

  const handleCity = (city) => {
    setSelectedCity(city);
    syncURL(search, page, city, selectedStatus);
  };

  const handleStatus = (status) => {
    setSelectedStatus(status);
    setPage(1);
    syncURL(search, 1, selectedCity, status);
  };

  const handlePage = (p) => {
    setPage(p);
    syncURL(search, p, selectedCity, selectedStatus);
  };

  return (
    <div className="p-4 bg-white min-h-screen font-sans antialiased text-slate-800">
      <div className="max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/accounts")}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clients</h1>
                <span className="text-[10px] text-slate-400 font-bold border rounded px-1.5 py-0.5 uppercase">
                  {pagination.totalItems || 0}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Ledger & container tracking</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search client, company, city..."
                value={search}
                onChange={e => handleSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-all text-sm w-64"
              />
            </div>

            {/* City filter pills */}
            <div className="flex items-center gap-1.5 flex-wrap border-r pr-4 mr-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mr-1">City:</span>
              {cities.map(city => (
                <button
                  key={city}
                  onClick={() => handleCity(city)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border whitespace-nowrap ${
                    selectedCity === city
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>

            {/* Status filter pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mr-1">Status:</span>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                const isActive = selectedStatus === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleStatus(key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
                      isActive ? cfg.activeCls : cfg.cls
                    }`}
                  >
                    {Icon && <Icon className="w-3 h-3" />}
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Clear filters"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_3fr_80px] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <div>Client</div>
            <div>City</div>
            <div>Containers</div>
            <div></div>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                <span className="text-xs text-slate-400 font-semibold animate-pulse uppercase tracking-widest">Loading...</span>
              </div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-slate-200" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">No clients found</h3>
              <p className="text-slate-400 text-xs mb-4">Try adjusting your filters.</p>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-blue-500 font-bold hover:text-blue-700">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => router.push(`/dashboard/accounts/clients/${client.id}/containers`)}
                  className="group grid grid-cols-1 md:grid-cols-[2fr_1fr_3fr_80px] gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors cursor-pointer items-center"
                >
                  {/* Name */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-slate-900 group-hover:text-white text-slate-700 flex items-center justify-center font-black text-sm transition-all flex-shrink-0">
                      {client.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate group-hover:text-blue-600 transition-colors">
                        {client.name}
                      </p>
                      {client.companyName && (
                        <p className="text-[11px] text-slate-400 truncate">{client.companyName}</p>
                      )}
                    </div>
                  </div>

                  {/* City */}
                  <div className="flex items-center gap-1.5">
                    {client.city ? (
                      <>
                        <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="text-xs text-slate-600 font-medium">{client.city}</span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </div>

                  {/* Containers */}
                  <div>
                    {client.containers?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {client.containers.slice(0, 20).map(ctn => {
                          const cfg = STATUS_CONFIG[ctn.status] || STATUS_CONFIG.OPEN;
                          return (
                            <span
                              key={ctn.code}
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-tight ${cfg.cls}`}
                              title={ctn.status}
                            >
                              {ctn.code}
                            </span>
                          );
                        })}
                        {client.containers.length > 20 && (
                          <span className="text-[9px] font-bold bg-slate-800 text-white px-1.5 py-0.5 rounded uppercase">
                            +{client.containers.length - 20}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Package className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">No containers</span>
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-end">
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && pagination?.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
            <span className="text-xs text-slate-400 font-semibold">
              Page <span className="text-slate-700">{page}</span>{" / "}{pagination.totalPages}
              &nbsp;·&nbsp; {pagination.totalItems} clients
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => handlePage(page - 1)}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-slate-50 transition-all text-slate-500"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                const total = pagination.totalPages;
                let p;
                if (total <= 7) p = i + 1;
                else if (page <= 4) p = i + 1 <= 5 ? i + 1 : i === 5 ? "…" : total;
                else if (page >= total - 3) p = i === 0 ? 1 : i === 1 ? "…" : total - 6 + i + 2;
                else p = i === 0 ? 1 : i === 1 ? "…" : i === 5 ? "…" : i === 6 ? total : page + i - 3;
                return (
                  <button
                    key={i}
                    disabled={p === "…"}
                    onClick={() => typeof p === "number" && handlePage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border ${
                      p === page
                        ? "bg-slate-900 text-white border-slate-900"
                        : p === "…"
                          ? "border-transparent text-slate-300 cursor-default"
                          : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => handlePage(page + 1)}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-slate-50 transition-all text-slate-500"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
