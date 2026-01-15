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
    <div className="min-h-screen bg-white p-4 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-4">
          <div className="flex items-start gap-6">
            <button 
                onClick={() => router.push("/dashboard/accounts")}
                className="mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all hover:bg-slate-50"
                title="Back to Hub"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
               <h1 className="text-4xl font-light text-slate-900 tracking-tight">Client Ledgers</h1>
               <p className="text-slate-400 mt-2 text-sm leading-relaxed">Select a client to manage their financial records</p>
            </div>
          </div>
          
          <div className="relative w-full md:w-72">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-7 pr-4 py-2 bg-transparent border-b border-slate-100 focus:border-slate-900 outline-none transition-all placeholder:text-slate-200 text-sm"
                />
          </div>
        </div>

        {/* Filter Chips */}
        {!loading && clients.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
                {cities.map(city => (
                    <button
                        key={city}
                        onClick={() => setSelectedCity(city)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border ${
                            selectedCity === city 
                            ? "bg-slate-900 text-white border-slate-900" 
                            : "bg-white text-slate-500 border-slate-100 hover:border-slate-300"
                        }`}
                    >
                        {city}
                    </button>
                ))}
            </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
              <Loader2 className="w-6 h-6 animate-spin text-slate-200 mb-4" />
              <p className="text-slate-300 text-sm">Loading clients...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
              {filteredClients.map(client => (
                  <div 
                      key={client.id}
                      onClick={() => router.push(`/dashboard/accounts/clients/${client.id}/containers`)}
                      className="group cursor-pointer flex flex-col pt-6 border-t border-slate-100/60 hover:border-slate-300 transition-colors"
                  >
                      <div className="flex justify-between items-start mb-4">
                           <div className="flex flex-col">
                               <h3 className="text-xl font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                                   {client.name}
                               </h3>
                               <p className="text-sm text-slate-400 font-normal mt-1 truncate max-w-[240px]">
                                   {client.companyName || 'No Company Details'}
                               </p>
                           </div>
                           <div className="flex flex-col items-end gap-1.5">
                               {client.city && (
                                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-0.5 border border-slate-100 rounded-md">
                                       {client.city}
                                   </span>
                               )}
                               {client.type === 'LEAD' && (
                                   <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md font-bold uppercase tracking-widest">
                                       LEAD
                                   </span>
                               )}
                           </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-[11px] font-medium text-slate-300 uppercase tracking-widest mt-auto mb-2">
                          <div className="flex gap-4">
                              <span>{client.phone ? "PH" : ""}</span>
                              <span>{client.email ? "EM" : ""}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-blue-500 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                              <span>Open</span>
                              <ChevronRight className="w-3 h-3" />
                          </div>
                      </div>
                  </div>
              ))}
              
              {filteredClients.length === 0 && (
                  <div className="col-span-full py-24 text-center">
                      <p className="text-slate-300 font-light text-xl italic">No matches found.</p>
                      <button onClick={() => {setSearch(""); setSelectedCity("ALL")}} className="mt-4 text-xs font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest">Reset Filters</button>
                  </div>
              )}
          </div>
        )}

        {/* Summary Footer */}
        {!loading && clients.length > 0 && (
            <div className="pt-8 border-t border-gray-100 text-center text-slate-300 text-[10px] font-bold uppercase tracking-[0.2em]">
                {clients.length} Clients Identified • {new Set(clients.map(c => c.city)).size} Cities
            </div>
        )}
      </div>
    </div>
  );
}
