"use client";

import Link from "next/link";
import { FileQuestion, Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="max-w-lg w-full">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-slate-800 px-6 py-8 text-center">
            <div className="w-20 h-20 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-4">
              <FileQuestion className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">404</h1>
            <p className="text-slate-300 mt-2 text-lg">Page Not Found</p>
          </div>

          {/* Content */}
          <div className="px-6 py-8 text-center">
            <div className="w-12 h-12 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-slate-600" />
            </div>

            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Oops! We can&apos;t find that page
            </h2>

            <p className="text-slate-600 mb-6">
              The page you&apos;re looking for doesn&apos;t exist, has been moved, or
              the URL might be incorrect.
            </p>

            {/* Suggestions */}
            <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm font-medium text-slate-700 mb-2">
                Here are some helpful links:
              </p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>
                  • <Link href="/dashboard" className="text-blue-600 hover:underline">Dashboard</Link> - Go to your main dashboard
                </li>
                <li>
                  • <Link href="/dashboard/loading" className="text-blue-600 hover:underline">Loading Sheets</Link> - View loading sheets
                </li>
                <li>
                  • <Link href="/dashboard/clients" className="text-blue-600 hover:underline">Clients</Link> - Manage clients
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition"
              >
                <Home className="w-4 h-4" />
                Go to Dashboard
              </Link>

              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-6 py-4 bg-slate-50">
            <p className="text-xs text-slate-500 text-center">
              If you believe this is an error, please contact support.
            </p>
          </div>
        </div>

        {/* Company */}
        <div className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()}{" "}
          {process.env.NEXT_PUBLIC_COMPANY_NAME || "Impexina"}
        </div>
      </div>
    </div>
  );
}
