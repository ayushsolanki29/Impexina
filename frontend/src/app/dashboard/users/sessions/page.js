"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { 
  Monitor, 
  ArrowLeft, 
  Clock, 
  Shield,
  Laptop,
  Smartphone,
  Globe,
  Activity
} from "lucide-react";

export default function LoginSessionsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard/users")}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Monitor className="w-6 h-6 text-purple-600" />
                Login Sessions
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Monitor and manage user login activity
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Coming Soon Banner */}
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 px-8 py-12 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">
              Coming Soon
            </h2>
            <p className="text-purple-100 text-lg max-w-md mx-auto">
              We're working on an advanced session management system for better security and control.
            </p>
          </div>

          {/* Features Preview */}
          <div className="p-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 text-center">
              Upcoming Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Active Sessions</h4>
                  <p className="text-sm text-slate-500 mt-1">
                    View all active login sessions across users
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Laptop className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Device Tracking</h4>
                  <p className="text-sm text-slate-500 mt-1">
                    Track login devices and locations
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Force Logout</h4>
                  <p className="text-sm text-slate-500 mt-1">
                    Terminate suspicious or unauthorized sessions
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Login History</h4>
                  <p className="text-sm text-slate-500 mt-1">
                    Complete audit trail of all login attempts
                  </p>
                </div>
              </div>
            </div>

            {/* Back Button */}
            <div className="mt-8 text-center">
              <button
                onClick={() => router.push("/dashboard/users")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to User Administration
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
