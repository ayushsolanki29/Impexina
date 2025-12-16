"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Users, TrendingUp, Globe, ChevronRight, Plus } from "lucide-react";

export default function AccountsHub() {
  const router = useRouter();

  const MODULES = [
    {
      title: "Client Ledgers",
      desc: "Standard client accounting (Kaushik, Charu, etc.)",
      path: "/dashboard/accounts/clients",
      icon: Users,
      color: "bg-blue-50 text-blue-600",
      border: "border-blue-200"
    },
    {
      title: "Dinesh Bhai",
      desc: "Supplier bookings, rates, and payment tracking.",
      path: "/dashboard/accounts/dinesh",
      icon: TrendingUp, // Represents rates/booking
      color: "bg-emerald-50 text-emerald-600",
      border: "border-emerald-200"
    },
    {
      title: "David Impex",
      desc: "Multi-currency ledgers (RMB / USD) and internal accounts.",
      path: "/dashboard/accounts/david",
      icon: Globe, // Represents Forex/International
      color: "bg-amber-50 text-amber-600",
      border: "border-amber-200"
    }
  ];

  return (
    <div className="p-8 min-h-screen bg-slate-50/50">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Accounts Overview</h1>
        <p className="text-slate-500 mb-8">Select a module to manage finances.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MODULES.map((m) => (
            <div 
              key={m.title}
              onClick={() => router.push(m.path)}
              className={`bg-white p-6 rounded-2xl border ${m.border} shadow-sm hover:shadow-md transition-all cursor-pointer group`}
            >
              <div className={`w-12 h-12 rounded-xl ${m.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <m.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center justify-between">
                {m.title}
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600" />
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {m.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}