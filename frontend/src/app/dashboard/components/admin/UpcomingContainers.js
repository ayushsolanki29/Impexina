"use client";
import { Ship, Package, Eye, Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UpcomingContainers({
    containers,
    loading,
    onViewAll
}) {
    const router = useRouter();

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Ship className="w-5 h-5 text-indigo-600" />
                    Upcoming Arrivals (15 Days)
                </h3>
                <button
                    onClick={onViewAll}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                >
                    View All <ArrowRight className="w-3 h-3" />
                </button>
            </div>
            <div className="p-4">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    </div>
                ) : containers.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        <Ship className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No containers arriving in next 15 days</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {containers.map((container, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                onClick={() => router.push(`/dashboard/container-summary/${container.summaryId}`)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                        <Package className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">{container.containerCode}</p>
                                        <p className="text-xs text-slate-500">{container.shippingLine || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-slate-900">
                                        {new Date(container.arrivalDate).toLocaleDateString("en-IN", {
                                            day: "2-digit",
                                            month: "short"
                                        })}
                                    </p>
                                    <p className="text-xs text-amber-600">
                                        ₹{((container.duty || 0) / 1000).toFixed(1)}K duty
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
