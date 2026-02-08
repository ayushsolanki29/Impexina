"use client";
import { Shield, Crown, User, Settings } from "lucide-react";
import { getRoleColor, getRoleBadge, getGreeting } from "../../utils/helpers";

export default function DashboardHeader({
    user,
    isCustomizing,
    onToggleCustomize,
    showCustomizeButton = false
}) {
    const badge = getRoleBadge(user?.role, user?.isSuper);
    const BadgeIcon = badge.icon === "Crown" ? Crown : badge.icon === "Shield" ? Shield : User;

    return (
        <div className={`bg-gradient-to-r ${getRoleColor(user?.role, user?.isSuper)} rounded-2xl p-6 text-white relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className={`${badge.bg} p-2 rounded-lg`}>
                        <BadgeIcon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold tracking-wider opacity-80">{badge.label}</span>
                </div>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl md:text-3xl font-bold">
                        {getGreeting()}, {user?.name || "User"}
                    </h1>
                    {showCustomizeButton && (
                        <button
                            onClick={onToggleCustomize}
                            className={`ml-4 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${isCustomizing
                                    ? "bg-amber-400 text-amber-900 shadow-lg scale-105"
                                    : "bg-white/10 hover:bg-white/20 text-white"
                                }`}
                        >
                            <Settings className={`w-3.5 h-3.5 ${isCustomizing ? "animate-spin" : ""}`} />
                            {isCustomizing ? "DONE CUSTOMIZING" : "CUSTOMIZE LAYOUT"}
                        </button>
                    )}
                </div>
                <p className="text-white/70">
                    {new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric"
                    })}
                </p>
            </div>
        </div>
    );
}
