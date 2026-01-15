"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  Shield, 
  UserPlus, 
  Key, 
  ArrowRight,
  Monitor
} from "lucide-react";

export default function UsersHub() {
  const router = useRouter();

  const MODULES = [
    {
      title: "User Management",
      desc: "View, edit, activate/deactivate, and delete system users.",
      path: "/dashboard/users/management",
      icon: Users,
      color: "bg-blue-50 text-blue-600",
      border: "border-blue-200 hover:border-blue-400",
    },
    {
      title: "Create User",
      desc: "Add new users to the system with roles and initial permissions.",
      path: "/dashboard/users/create",
      icon: UserPlus,
      color: "bg-emerald-50 text-emerald-600",
      border: "border-emerald-200 hover:border-emerald-400",
    },
    {
      title: "Permission Management",
      desc: "Assign and manage module access permissions for users.",
      path: "/dashboard/users/permissions",
      icon: Key,
      color: "bg-amber-50 text-amber-600",
      border: "border-amber-200 hover:border-amber-400",
    },
    {
      title: "Login Sessions",
      desc: "Monitor active sessions and manage user login activity.",
      path: "/dashboard/users/sessions",
      icon: Monitor,
      color: "bg-purple-50 text-purple-600",
      border: "border-purple-200 hover:border-purple-400",
      badge: "Coming Soon",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">User Administration</h1>
          </div>
          <p className="text-slate-500 ml-13">
            Manage users, permissions, and access control for the system.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {MODULES.map((module) => (
            <div
              key={module.title}
              onClick={() => router.push(module.path)}
              className={`bg-white rounded-xl border-2 ${module.border} p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden`}
            >
              {/* Badge */}
              {module.badge && (
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full">
                    {module.badge}
                  </span>
                </div>
              )}

              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl ${module.color} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                <module.icon className="w-7 h-7" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {module.title}
              </h3>
              <p className="text-sm text-slate-500 mb-5 leading-relaxed">
                {module.desc}
              </p>

              {/* Action */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-sm font-medium text-slate-400 group-hover:text-slate-600 transition-colors">
                  Open Module
                </span>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-slate-700" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-slate-200">
          <p className="text-center text-sm text-slate-400">
            User Administration Hub • Bennet Trading
          </p>
        </div>
      </div>
    </div>
  );
}
