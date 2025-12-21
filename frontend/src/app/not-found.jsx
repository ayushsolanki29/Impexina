"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full text-center bg-white border border-slate-200 rounded-xl shadow-sm p-8">
        <div className="text-5xl font-bold text-slate-900">404</div>

        <h1 className="mt-4 text-lg font-semibold text-slate-800">
          Page not found
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          The page you’re looking for doesn’t exist or may have been moved.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
          >
            Go to Dashboard
          </Link>

          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
          >
            Login
          </Link>
        </div>

        <div className="mt-8 text-xs text-slate-400">
          © {new Date().getFullYear()}{" "}
          {process.env.NEXT_PUBLIC_COMPANY_NAME || "Impexina"}
        </div>
      </div>
    </div>
  );
}
