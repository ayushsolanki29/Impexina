"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users, TrendingUp, Globe, CreditCard, Ship, FileText,
  Lock, ShieldCheck, LogOut, Key, X, Loader2, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import API from "@/lib/api";

export default function AccountsHub() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [accountsConfigured, setAccountsConfigured] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    const session = localStorage.getItem("accountsSessionAuth");
    if (session === "true") {
      setIsAuthenticated(true);
    }
    setMounted(true);
    checkAccountsConfig();
  }, []);

  const checkAccountsConfig = async () => {
    try {
      const response = await API.get('/settings/accounts/get');
      if (response.data.success) {
        setAccountsConfigured(response.data.data.isConfigured);
      }
    } catch (error) {
      console.error("Failed to check accounts config");
    }
  };

  // Save to localStorage when authenticated
  useEffect(() => {
    if (mounted) {
      if (isAuthenticated) {
        localStorage.setItem("accountsSessionAuth", "true");
      } else {
        localStorage.removeItem("accountsSessionAuth");
      }
    }
  }, [isAuthenticated, mounted]);

  const MODULES = [
    {
      title: "Client Ledgers",
      desc: "Comprehensive multi-client accounting and records.",
      path: "/dashboard/accounts/clients",
      icon: Users,
      color: "bg-blue-50 text-blue-600",
      border: "border-blue-200 hover:border-blue-400",
    },
    {
      title: "Dineshbhai Ledger",
      desc: "Track shipping bookings, freight costs, and supplier payments.",
      path: "/dashboard/accounts/dinesh",
      icon: TrendingUp,
      color: "bg-emerald-50 text-emerald-600",
      border: "border-emerald-200 hover:border-emerald-400",
    },
    {
      title: "Partner Ledgers Hub",
      desc: "Consolidated partner-level multi-currency account management.",
      path: "/dashboard/accounts/david",
      icon: Globe,
      color: "bg-amber-50 text-amber-600",
      border: "border-amber-200 hover:border-amber-400",
    },
    {
      title: "Payment Collection",
      desc: "Client payment tracking, expected dates, and yearly dues.",
      path: "/dashboard/accounts/collection",
      icon: CreditCard,
      color: "bg-purple-50 text-purple-600",
      border: "border-purple-200 hover:border-purple-400",
    },
    {
      title: "Container Shipping",
      desc: "Track container costs, freight, duty, and local charges.",
      path: "/dashboard/accounts/shipping",
      icon: Ship,
      color: "bg-indigo-50 text-indigo-600",
      border: "border-indigo-200 hover:border-indigo-400",
    },
    {
      title: "TukaramJI Accounts",
      desc: "Container-wise account sheets with charges, scanning, and DC tracking.",
      path: "/dashboard/accounts/tukaram",
      icon: FileText,
      color: "bg-cyan-50 text-cyan-600",
      border: "border-cyan-200 hover:border-cyan-400",
    },
    {
      title: "Kavya Accounts",
      desc: "Container-wise account sheets with CBM, duty, and payment tracking.",
      path: "/dashboard/accounts/kavya",
      icon: FileText,
      color: "bg-pink-50 text-pink-600",
      border: "border-pink-200 hover:border-pink-400",
    },
  ];

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!otp) {
      toast.error("Please enter password or keyphrase");
      return;
    }

    if (!accountsConfigured) {
      toast.error("Accounts security not configured. Please set up keyphrase in Settings first.");
      return;
    }

    try {
      setVerifying(true);
      const response = await API.post('/settings/accounts/verify', {
        input: otp
      });
      
      if (response.data.success && response.data.data.isValid) {
        setIsAuthenticated(true);
        toast.success("Access granted");
        setOtp("");
      } else {
        toast.error("Invalid password or keyphrase");
        setOtp("");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Verification failed");
      setOtp("");
    } finally {
      setVerifying(false);
    }
  };

  // --- SECURITY SCREEN ---
  if (!isAuthenticated || !mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    
        
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Financial Portal
              </h1>
              <p className="text-gray-500 text-sm">
                {accountsConfigured 
                  ? "Enter password or keyphrase to continue"
                  : "Security not configured. Please set up keyphrase in Settings."}
              </p>
              {!accountsConfigured && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      Accounts security must be configured in Settings before accessing this module.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password or Keyphrase
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="password" 
                    placeholder="Enter password or keyphrase"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={!accountsConfigured || verifying}
                    autoFocus
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={!accountsConfigured || verifying || !otp}
                className="w-full py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    Unlock Portal
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                Impexina Accounts • Secure Access
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN DASHBOARD ---
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
   
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  Secure Access Active
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Accounting Control Hub
              </h1>
              <p className="text-gray-500 mt-1">
                Centralized access to all client and partner financial ledgers.
              </p>
            </div>
            
            <button 
              onClick={() => {
                setIsAuthenticated(false);
                toast.info("Session locked");
              }}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 hover:bg-gray-100 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              Lock
            </button>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map((module) => (
            <div
              key={module.title}
              onClick={() => router.push(module.path)}
              className={`bg-white rounded-xl border ${module.border} p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group`}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-lg ${module.color} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                <module.icon className="w-6 h-6" />
              </div>
              
              {/* Content */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {module.title}
              </h3>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                {module.desc}
              </p>
              
              {/* Action */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-xs font-medium text-gray-400">
                  Click to open
                </span>
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition">
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-400">
            Impexina Financial Management • 2025
          </p>
        </div>
      </div>
    </div>
  );
}