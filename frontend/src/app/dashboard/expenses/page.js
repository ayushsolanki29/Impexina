"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Building2, Wallet, ArrowRight } from "lucide-react";

export default function ExpensesHub() {
  const router = useRouter();

  const MODULES = [
    {
      title: "Mumbai Office",
      desc: "Container-wise unloading, transport, and monthly advance tracking.",
      path: "/dashboard/expenses/mumbai",
      icon: Building2,
      color: "bg-blue-50 text-blue-600",
      border: "border-blue-200"
    },
    {
      title: "Ahmedabad Office",
      desc: "Petty cash ledger, daily miscellaneous expenses, and credits.",
      path: "/dashboard/expenses/ahmedabad",
      icon: Wallet,
      color: "bg-emerald-50 text-emerald-600",
      border: "border-emerald-200"
    }
  ];

  return (
    <div className="p-8 min-h-screen bg-slate-50/50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Expense Management</h1>
        <p className="text-slate-500 mb-8">Select an office to manage expenses.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MODULES.map((m) => (
            <div
              key={m.title}
              onClick={() => router.push(m.path)}
              className={`bg-white p-6 rounded-2xl border ${m.border} shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden`}
            >
              <div className={`w-12 h-12 rounded-xl ${m.color} flex items-center justify-center mb-4`}>
                <m.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {m.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                {m.desc}
              </p>
              <div className="flex items-center text-sm font-medium text-slate-900 group-hover:underline">
                View Dashboard <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}