"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldOff, Home, ArrowLeft, Lock, AlertTriangle } from "lucide-react";
import { Suspense } from "react";

function ForbiddenContent() {
  const searchParams = useSearchParams();
  const module = searchParams.get("module");

  const formatModuleName = (key) => {
    if (!key) return "this resource";
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-red-900 to-orange-900" />
      
      {/* Animated Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500 rounded-full blur-[150px] opacity-30 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500 rounded-full blur-[120px] opacity-20" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* Main Content */}
        <div className="text-center max-w-2xl mx-auto">
          {/* Icon */}
          <div className="relative mb-8">
            <div className="w-32 h-32 mx-auto relative">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border-4 border-red-400/30 animate-ping" style={{ animationDuration: '3s' }} />
              {/* Middle ring */}
              <div className="absolute inset-2 rounded-full border-2 border-orange-400/50" />
              {/* Inner circle */}
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-red-500/50">
                <ShieldOff className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>

          {/* Error Code */}
          <div className="mb-6">
            <h1 className="text-[140px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-red-200 drop-shadow-2xl">
              403
            </h1>
          </div>

          {/* Title */}
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Access Forbidden
          </h2>

          {/* Description */}
          <p className="text-lg text-red-100/80 mb-8 max-w-lg mx-auto">
            You don&apos;t have permission to access{" "}
            <span className="font-semibold text-white">
              {formatModuleName(module)}
            </span>
            . This area requires special authorization.
          </p>

          {/* Warning Box */}
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 mb-10 border border-white/10">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-300" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">Permission Required</p>
              <p className="text-xs text-red-200/70">
                {module ? (
                  <span className="font-mono">{module}</span>
                ) : (
                  "Contact your administrator for access"
                )}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-red-900 hover:bg-red-50 transition-all duration-200 shadow-lg shadow-black/20 hover:shadow-xl hover:scale-105"
            >
              <Home className="w-5 h-5" />
              Go to Dashboard
            </Link>

            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 px-8 py-4 text-base font-semibold text-white hover:bg-white/10 transition-all duration-200 backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </button>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-sm text-red-200/50">
            Need access? Contact your system administrator
          </p>
          <p className="text-xs text-red-200/30 mt-2">
            © {new Date().getFullYear()}{" "}
            {process.env.NEXT_PUBLIC_COMPANY_NAME || "Impexina"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ForbiddenPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-red-950">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ForbiddenContent />
    </Suspense>
  );
}
