"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import authService from "@/services/auth.service";
import {
  Loader2,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  UserX,
  KeyRound,
  HelpCircle,
  Building2,
  X,
  Users,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Check for redirect messages
  useEffect(() => {
    const message = searchParams.get("message");
    if (message === "session_expired") {
      toast.info("Session expired", {
        description: "Please login again to continue.",
      });
    } else if (message === "unauthorized") {
      toast.warning("Access denied", {
        description: "Please login to access that page.",
      });
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError({
        type: "validation",
        title: "Missing Credentials",
        message: "Please enter your username and password.",
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
        toast.success("Welcome back!");
        setTimeout(() => {
          router.push("/dashboard");
        }, 300);
      } else {
        handleLoginError(res.message || "Login failed");
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error.response?.data?.message || error.message || "An error occurred";
      handleLoginError(errorMessage);
      setLoading(false);
    }
  };

  const handleLoginError = (message) => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("deactivated") || lowerMessage.includes("inactive") || lowerMessage.includes("disabled")) {
      setError({
        type: "deactivated",
        title: "Account Deactivated",
        message: "Your account has been deactivated. Contact your administrator.",
      });
    } else if (lowerMessage.includes("not found") || lowerMessage.includes("invalid username")) {
      setError({
        type: "not_found",
        title: "Account Not Found",
        message: "No account found with this username.",
      });
    } else if (lowerMessage.includes("password") || lowerMessage.includes("incorrect") || lowerMessage.includes("wrong")) {
      setError({
        type: "password",
        title: "Incorrect Password",
        message: "The password you entered is incorrect.",
      });
    } else {
      setError({
        type: "generic",
        title: "Login Failed",
        message: message || "Something went wrong. Please try again.",
      });
    }
  };

  const getErrorIcon = (type) => {
    switch (type) {
      case "deactivated":
        return <UserX className="w-4 h-4" />;
      case "password":
        return <KeyRound className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getErrorColor = (type) => {
    switch (type) {
      case "deactivated":
        return "bg-orange-50 border-orange-200 text-orange-700";
      default:
        return "bg-red-50 border-red-200 text-red-700";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      {/* Main Login Card */}
      <div className="w-full max-w-[400px]">
        {/* Logo & Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-900 rounded-xl mb-4">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-wide">BENNET TRADING</h1>
          <p className="text-xs text-slate-500 mt-1">Internal Management System</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Sign in</h2>
          <p className="text-sm text-slate-500 mb-5">Enter your credentials to continue</p>

          {/* Error Alert */}
          {error && (
            <div className={`mb-4 p-3 rounded-lg border text-sm ${getErrorColor(error.type)}`}>
              <div className="flex items-start gap-2">
                <span className="mt-0.5">{getErrorIcon(error.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{error.title}</p>
                  <p className="text-xs mt-0.5 opacity-90">{error.message}</p>
                </div>
                <button onClick={() => setError(null)} className="opacity-60 hover:opacity-100">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                placeholder="Enter username"
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(true)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="Enter password"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Note */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secure connection</span>
          </div>
        </div>

        {/* Help Link */}
        <button
          onClick={() => setShowHelpModal(true)}
          className="w-full mt-4 flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          Need help signing in?
        </button>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          © 2026 Bennet Trading • app.bennettrading.in
        </p>
      </div>

      {/* Help Modal - Compact */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Need Help?</h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              <p className="text-sm text-slate-600">
                Please contact your administrator for:
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-100 rounded-lg">
                  <UserX className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">Account Deactivated</p>
                    <p className="text-xs text-orange-600">Admin can reactivate your account</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <KeyRound className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Forgot Password</p>
                    <p className="text-xs text-blue-600">Admin can reset your password</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <Users className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">New Account</p>
                    <p className="text-xs text-slate-600">Admin can create your account</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-xl">
              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
