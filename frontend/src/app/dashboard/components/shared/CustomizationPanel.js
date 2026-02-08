"use client";
import { X, Eye, EyeOff, RotateCcw, Settings2 } from "lucide-react";
import { useCustomization } from "../../contexts/CustomizationContext";

export default function CustomizationPanel() {
    const {
        showSettingsPanel,
        setShowSettingsPanel,
        widgets,
        toggleWidgetVisibility,
        resetToDefaults,
        isWidgetVisible,
    } = useCustomization();

    if (!showSettingsPanel) return null;

    const sections = Object.values(widgets).sort((a, b) => a.order - b.order);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                onClick={() => setShowSettingsPanel(false)}
            />

            {/* Panel */}
            <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 bg-indigo-600">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-white">
                            <Settings2 className="w-6 h-6" />
                            <h2 className="text-xl font-bold">Dashboard Settings</h2>
                        </div>
                        <button
                            onClick={() => setShowSettingsPanel(false)}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <p className="text-white/80 text-sm">
                        Customize your dashboard layout and widgets
                    </p>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        {sections.map((section) => (
                            <div key={section.id} className="space-y-3">
                                {/* Section Header */}
                                <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900">{section.name}</span>
                                        <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                                            {section.children.filter((w) => w.visible).length}/
                                            {section.children.length}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => toggleWidgetVisibility(section.id)}
                                        className={`p-1.5 rounded-lg transition-colors ${section.visible
                                            ? "bg-green-100 text-green-600 hover:bg-green-200"
                                            : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                                            }`}
                                    >
                                        {section.visible ? (
                                            <Eye className="w-4 h-4" />
                                        ) : (
                                            <EyeOff className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>

                                {/* Widgets */}
                                <div className="ml-4 space-y-2">
                                    {section.children
                                        .sort((a, b) => a.order - b.order)
                                        .map((widget) => (
                                            <div
                                                key={widget.id}
                                                className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors"
                                            >
                                                <span className="text-sm text-slate-700">{widget.name}</span>
                                                <button
                                                    onClick={() => toggleWidgetVisibility(section.id, widget.id)}
                                                    className={`p-1 rounded transition-colors ${widget.visible
                                                        ? "text-green-600 hover:bg-green-50"
                                                        : "text-gray-400 hover:bg-gray-50"
                                                        }`}
                                                >
                                                    {widget.visible ? (
                                                        <Eye className="w-4 h-4" />
                                                    ) : (
                                                        <EyeOff className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 bg-slate-50">
                    <button
                        onClick={() => {
                            if (confirm("Reset all customizations to default? This cannot be undone.")) {
                                resetToDefaults();
                            }
                        }}
                        className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset to Defaults
                    </button>
                </div>
            </div>
        </>
    );
}
