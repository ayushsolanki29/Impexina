"use client";

import Link from "next/link";
import { Compass, Home, ArrowLeft, MapPin, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950" />
      
      {/* Stars Pattern */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
              opacity: Math.random() * 0.7 + 0.3,
            }}
          />
        ))}
      </div>

      {/* Glowing Orbs */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-indigo-500 rounded-full blur-[150px] opacity-20" />
      <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-violet-500 rounded-full blur-[120px] opacity-20" />
      <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-15" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* Main Content */}
        <div className="text-center max-w-2xl mx-auto">
          {/* Floating Icon */}
          <div className="relative mb-8">
            <div className="w-36 h-36 mx-auto relative">
              {/* Orbit ring */}
              <div className="absolute inset-0 rounded-full border border-indigo-400/20 animate-spin" style={{ animationDuration: '20s' }}>
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-indigo-400" />
              </div>
              {/* Second orbit */}
              <div className="absolute inset-4 rounded-full border border-violet-400/30 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }}>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-violet-400" />
              </div>
              {/* Inner circle */}
              <div className="absolute inset-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                <Compass className="w-10 h-10 text-white animate-pulse" />
              </div>
            </div>
          </div>

          {/* Error Code */}
          <div className="mb-6 relative">
            <h1 className="text-[140px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-indigo-200 to-violet-300 drop-shadow-2xl">
              404
            </h1>
            <Sparkles className="absolute top-4 right-1/4 w-6 h-6 text-indigo-300 animate-bounce" style={{ animationDelay: '0.5s' }} />
            <Sparkles className="absolute bottom-8 left-1/3 w-4 h-4 text-violet-300 animate-bounce" style={{ animationDelay: '1s' }} />
          </div>

          {/* Title */}
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Page Not Found
          </h2>

          {/* Description */}
          <p className="text-lg text-indigo-100/70 mb-10 max-w-lg mx-auto leading-relaxed">
            Looks like you&apos;ve ventured into uncharted territory. 
            The page you&apos;re looking for has drifted away or never existed.
          </p>

          {/* Location Box */}
          <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-2xl px-6 py-4 mb-10 border border-white/10">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-indigo-300" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">Lost in space</p>
              <p className="text-xs text-indigo-200/60">
                Let&apos;s get you back on track
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-8 py-4 text-base font-semibold text-white hover:from-indigo-400 hover:to-violet-400 transition-all duration-200 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:scale-105"
            >
              <Home className="w-5 h-5" />
              Go to Dashboard
            </Link>

            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/20 px-8 py-4 text-base font-semibold text-white hover:bg-white/10 transition-all duration-200 backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </button>
          </div>

          {/* Quick Links */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 max-w-md mx-auto">
            <p className="text-sm font-medium text-white mb-4">Quick Navigation</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-lg bg-white/10 text-sm text-indigo-200 hover:bg-white/20 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/loading"
                className="px-4 py-2 rounded-lg bg-white/10 text-sm text-indigo-200 hover:bg-white/20 transition-colors"
              >
                Loading Sheets
              </Link>
              <Link
                href="/dashboard/clients"
                className="px-4 py-2 rounded-lg bg-white/10 text-sm text-indigo-200 hover:bg-white/20 transition-colors"
              >
                Clients
              </Link>
              <Link
                href="/dashboard/tasks"
                className="px-4 py-2 rounded-lg bg-white/10 text-sm text-indigo-200 hover:bg-white/20 transition-colors"
              >
                Tasks
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-xs text-indigo-200/30">
            © {new Date().getFullYear()}{" "}
            {process.env.NEXT_PUBLIC_COMPANY_NAME || "Impexina"}
          </p>
        </div>
      </div>
    </div>
  );
}
