"use client";

export default function StatCard({
    icon: Icon,
    title,
    value,
    subtitle,
    color = "indigo",
    onClick,
    loading = false
}) {
    const colorClasses = {
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-300",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-300",
        amber: "bg-amber-50 text-amber-600 border-amber-300",
        purple: "bg-purple-50 text-purple-600 border-purple-300",
        sky: "bg-sky-50 text-sky-600 border-sky-300",
    };

    return (
        <div
            className={`bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all ${onClick ? "cursor-pointer hover:border-" + color + "-300" : ""
                }`}
            onClick={onClick}
        >
            <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${colorClasses[color]?.split(" ")[0] || "bg-indigo-50"}`}>
                    {Icon && <Icon className={`w-5 h-5 ${colorClasses[color]?.split(" ")[1] || "text-indigo-600"}`} />}
                </div>
                {subtitle && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${colorClasses[color]}`}>
                        {subtitle}
                    </span>
                )}
            </div>
            <div className="text-3xl font-bold text-slate-900">
                {loading ? "..." : value}
            </div>
            <p className="text-sm text-slate-500 mt-1">{title}</p>
        </div>
    );
}
