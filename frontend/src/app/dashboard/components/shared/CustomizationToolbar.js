"use client";
import { Settings, Check, Settings2, X } from "lucide-react";
import { useCustomization } from "../../contexts/CustomizationContext";

export default function CustomizationToolbar() {
    const { isCustomizing, setIsCustomizing, setShowSettingsPanel } = useCustomization();

    return (
        <div className="flex items-center gap-2">
            {/* Customize Layout Button */}
            <button
                onClick={() => setIsCustomizing(!isCustomizing)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isCustomizing
                        ? "bg-amber-400 text-amber-900 shadow-lg scale-105 hover:bg-amber-500"
                        : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
            >
                {isCustomizing ? (
                    <>
                        <Check className="w-4 h-4" />
                        Done Customizing
                    </>
                ) : (
                    <>
                        <Settings className={`w-4 h-4 ${isCustomizing ? "animate-spin" : ""}`} />
                        Customize Layout
                    </>
                )}
            </button>

            {/* Settings Panel Button */}
            <button
                onClick={() => setShowSettingsPanel(true)}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-2"
            >
                <Settings2 className="w-4 h-4" />
                Widget Settings
            </button>
        </div>
    );
}
