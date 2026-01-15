"use client";
import React from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ClientAccountForm from "../_components/ClientAccountForm";

export default function NewAccountClientPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/accounts/clients" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">New Client Account</h1>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <ClientAccountForm />
      </div>
    </div>
  );
}
