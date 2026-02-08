"use client";
import { Users, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TeamTaskStatus({ userTaskSummary }) {
    const router = useRouter();

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    Team Task Status
                </h3>
                <button
                    onClick={() => router.push("/dashboard/tasks/reports")}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                >
                    Reports <ArrowRight className="w-3 h-3" />
                </button>
            </div>
            <div className="p-4">
                {userTaskSummary.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No task data available</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {userTaskSummary.map((user, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                                    {user.user?.name?.charAt(0) || "U"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="font-medium text-slate-900 truncate">{user.user?.name}</p>
                                        <span className="text-xs text-slate-500">
                                            {user.stats?.totalCompletions || 0}/{user.stats?.totalAssignments || 0}
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-purple-500 h-full rounded-full transition-all duration-1000"
                                            style={{
                                                width: `${(user.stats?.totalCompletions / (user.stats?.totalAssignments || 1)) * 100}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
