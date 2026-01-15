"use client";
import React, { useState, useEffect } from "react";
import { Search, Loader2, ArrowLeft, Users, Building2, MapPin, Mail, Phone, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { get } from "@/lib/api";

export default function AccountClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [selectedCity, setSelectedCity] = useState("ALL");

  useEffect(() => {
    fetchClients();
  }, [page, search]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      // Fetch from accounts/clients which now proxies to CRM clients
      // Or we can fetch directly from /clients if we prefer
      // The backend service was updated to fetch from prisma.client
      const res = await get(`/accounts/clts?page=${page}&limit=20&search=${search}`);
      if (res.success) {
        setClients(res.data);
        setPagination(res.pagination);
      }
    } catch (error) {
      toast.error("Failed to load clients");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const filteredClients = selectedCity === "ALL" 
    ? clients 
    : clients.filter(c => c.city === selectedCity);

  const cities = ["ALL", ...new Set(clients.map(c => c.city).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push("/dashboard/accounts")}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                title="Back to Accounts"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-600" />
                  Client Ledgers
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Select a client to manage their financial records
                </p>
              </div>
            </div>
            <div className="w-full md:w-72">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Filter Chips */}
        {!loading && clients.length > 0 && (
          <div className="mb-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                {cities.map(city => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border ${
                      selectedCity === city 
                        ? "bg-blue-600 text-white border-blue-600" 
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-48 bg-slate-100 animate-pulse rounded-xl"
              />
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900">
              No Clients Found
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              {search || selectedCity !== "ALL" 
                ? "Try adjusting your filters" 
                : "No clients available"}
            </p>
            {(search || selectedCity !== "ALL") && (
              <button 
                onClick={() => {setSearch(""); setSelectedCity("ALL")}} 
                className="text-xs font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map(client => (
              <div 
                key={client.id}
                onClick={() => router.push(`/dashboard/accounts/clients/${client.id}/containers`)}
                className="group bg-white p-5 rounded-xl border shadow-sm transition-all hover:shadow-md border-blue-200 cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 mb-1">
                      {client.name}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-1">
                      {client.companyName || 'No Company Details'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 ml-2">
                    {client.city && (
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 py-0.5 bg-slate-50 border border-slate-200 rounded">
                        {client.city}
                      </span>
                    )}
                    {client.type === 'LEAD' && (
                      <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded font-bold uppercase tracking-widest border border-amber-100">
                        LEAD
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4 text-[11px] font-medium text-slate-400 uppercase tracking-widest">
                      {client.phone && <span>PH</span>}
                      {client.email && <span>EM</span>}
                    </div>
                    <div className="flex items-center gap-1 text-blue-600 font-medium text-sm group-hover:gap-2 transition-all">
                      <span>Open</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Footer */}
        {!loading && clients.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-200 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            {filteredClients.length} {filteredClients.length === 1 ? 'Client' : 'Clients'} Identified • {new Set(filteredClients.map(c => c.city)).size} {new Set(filteredClients.map(c => c.city)).size === 1 ? 'City' : 'Cities'}
          </div>
        )}
      </div>
    </div>
  );
}
