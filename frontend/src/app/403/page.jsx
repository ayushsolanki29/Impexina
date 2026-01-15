"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldX, Home, ArrowLeft, Lock } from "lucide-react";
import { Suspense } from "react";

function ForbiddenContent() {
  const searchParams = useSearchParams();
  const module = searchParams.get("module");

  // Format module name for display
  const formatModuleName = (key) => {
    if (!key) return "this resource";
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="max-w-lg w-full">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-red-600 px-6 py-8 text-center">
            <div className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
              <ShieldX className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">403</h1>
            <p className="text-red-100 mt-2 text-lg">Access Denied</p>
          </div>

          {/* Content */}
          <div className="px-6 py-8 text-center">
            <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-red-600" />
            </div>

            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Permission Required
            </h2>

            <p className="text-slate-600 mb-2">
              You don&apos;t have permission to access{" "}
              <span className="font-semibold text-slate-900">
                {formatModuleName(module)}
              </span>
              .
            </p>

            <p className="text-sm text-slate-500 mb-6">
              Contact your administrator if you believe this is an error.
            </p>

            {/* Module Badge */}
            {module && (
              <div className="inline-flex items-center gap-2 bg-slate-100 rounded-full px-4 py-2 mb-6">
                <Lock className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-mono text-slate-700">{module}</span>
              </div>
            )}

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
              Need access? Contact your system administrator or request
              permission through User Management.
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

export default function ForbiddenPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
          <div className="text-slate-600">Loading...</div>
        </div>
      }
    >
      <ForbiddenContent />
    </Suspense>
  );
}
