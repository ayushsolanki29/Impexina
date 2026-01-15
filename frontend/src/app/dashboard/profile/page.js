"use client";

import React, { useState, useEffect } from "react";
import API from "@/lib/api";
import { toast } from "sonner";
import { User, Lock, Save, Loader2, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState({
    name: "",
    username: "",
    role: "",
    isSuper: false,
  });

  // Get avatar color based on role and isSuper
  const getAvatarColor = (role, isSuper) => {
    if (isSuper) {
      return "bg-slate-900 text-white";
    }
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-700";
      case "EMPLOYEE":
        return "bg-emerald-100 text-emerald-700";
      case "NEW_JOINNER":
        return "bg-slate-100 text-slate-600";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role, isSuper) => {
    if (isSuper) {
      return "bg-slate-900 text-white";
    }
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-700";
      case "EMPLOYEE":
        return "bg-emerald-100 text-emerald-700";
      case "NEW_JOINNER":
        return "bg-slate-100 text-slate-600";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get("/profile");
      if (res.data.success) {
        setUser(res.data.data);
      }
    } catch (error) {
      toast.error("Failed to load profile");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await API.put("/profile", {
        name: user.name,
        username: user.username,
      });
      if (res.data.success) {
        toast.success("Profile updated successfully");
        setUser((prev) => ({ ...prev, ...res.data.data }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error("New passwords do not match");
    }
    if (passwordForm.newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setSaving(true);
    try {
      const res = await API.put("/profile/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      if (res.data.success) {
        toast.success("Password changed successfully");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-slate-500">Manage your profile and security preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold mb-4 ${getAvatarColor(user.role, user.isSuper)}`}>
              {(user.name || "Bennet User")[0].toUpperCase()}
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{user.name || "Bennet User"}</h2>
              {user.isSuper && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-900 text-white">
                  SUPER
                </span>
              )}
            </div>
            <div className={`flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${getRoleBadgeColor(user.role, user.isSuper)}`}>
              <Shield className="w-3 h-3" />
              {user.isSuper ? "Super Admin" : user.role?.replace("_", " ")}
            </div>
            <p className="text-xs text-slate-400 mt-4 text-center">
              Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
            </p>
          </div>
        </div>

        {/* Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* General Info */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500" />
              <h3 className="font-semibold text-slate-800">General Information</h3>
            </div>
            <form onSubmit={handleProfileUpdate} className="p-6 space-y-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={user.name}
                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-700"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={user.username}
                    onChange={(e) => setUser({ ...user, username: e.target.value })}
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-700"
                    placeholder="johndoe"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </div>

          {/* Security */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-500" />
              <h3 className="font-semibold text-slate-800">Security</h3>
            </div>
            <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-slate-700"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-slate-700"
                    required
                    minLength={6}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">Confirm Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-slate-700"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                 <Button type="submit" variant="destructive" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Change Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
