"use client";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";

export default function QuickLinks({ links }) {
    const router = useRouter();

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-indigo-600" />
                Quick Links
            </h3>
            <div className="space-y-2">
                {links.map((link, index) => {
                    const Icon = link.icon;
                    return (
                        <button
                            key={index}
                            onClick={() => router.push(link.href)}
                            className={`w-full p-3 flex items-center gap-3 ${link.className || "bg-slate-50 text-slate-700 hover:bg-slate-100"} rounded-xl transition-colors`}
                        >
                            {Icon && <Icon className="w-5 h-5" />}
                            <span className="font-medium text-sm">{link.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
