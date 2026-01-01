"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import authService from "@/services/auth.service";
import {
  Loader2,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  LayoutDashboard,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      toast.warning("Missing credentials", {
        description: "Please enter your username and password to continue.",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await authService.login({
        username,
        password,
      });

      if (res.success) {
     
        // Small delay for UX smoothness
        setTimeout(() => {
          router.push("/dashboard");
        }, 200);
      } else {
        // Handle failure explicitly if service doesn't throw
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white">
      {/* Left Panel - Branding & Visuals (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl -ml-20 -mb-20"></div>

        {/* Top Brand */}
        <div className="relative z-10 flex items-center gap-2 font-bold text-xl tracking-wide">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          IMPEXINA
        </div>

        {/* Middle Content */}
        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl font-bold leading-tight mb-6">
            Logistics management for the modern era.
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            Streamline your shipping orders, track inputs, and manage container
            summaries with precision.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-slate-300">
                Real-time Order Tracking
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-slate-300">
                Automated Duty Calculations
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-slate-300">
                Seamless Sheet Management
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="relative z-10 text-sm text-slate-500 flex justify-between items-center">
          <span>© 2026 Impexina Inc.</span>
          <div className="flex items-center gap-4">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-12 bg-white">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile Logo (Visible only on mobile) */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-2 font-bold text-xl tracking-wide text-slate-900">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              IMPEXINA
            </div>
          </div>

          <div className="text-center lg:text-left">
            <h1 className="text-2xl font-bold text-slate-900">
              Log in to your account
            </h1>
            <p className="text-slate-500 mt-2 text-sm">
              Enter your credentials to access the workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Password
                </label>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="text-center text-sm text-slate-500 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Secure, encrypted connection</span>
          </div>
        </div>
      </div>
    </div>
  );
}
