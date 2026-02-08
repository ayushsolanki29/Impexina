"use client";
import { GripVertical, Eye, EyeOff } from "lucide-react";
import { useCustomization } from "../../contexts/CustomizationContext";

export default function CustomizableWidget({
    widgetId,
    sectionId,
    children,
    className = "",
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
    draggable = true,
}) {
    const { isCustomizing, isWidgetVisible, toggleWidgetVisibility } = useCustomization();

    const visible = isWidgetVisible(sectionId, widgetId);

    if (!visible && !isCustomizing) {
        return null;
    }

    return (
        <div
            className={`relative ${className} ${isCustomizing
                    ? "transition-all duration-300 border-2 border-dashed border-blue-300 rounded-xl p-2 bg-blue-50/20"
                    : ""
                } ${!visible && isCustomizing ? "opacity-50" : ""}`}
            draggable={isCustomizing && draggable}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            {isCustomizing && (
                <div className="absolute top-2 right-2 z-50 flex gap-2">
                    {/* Drag Handle */}
                    {draggable && (
                        <div className="bg-blue-500 text-white p-1.5 rounded-lg shadow-lg cursor-move hover:bg-blue-600 transition-colors">
                            <GripVertical className="w-4 h-4" />
                        </div>
                    )}

                    {/* Visibility Toggle */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleWidgetVisibility(sectionId, widgetId);
                        }}
                        className={`p-1.5 rounded-lg shadow-lg transition-colors ${visible
                                ? "bg-green-500 hover:bg-green-600 text-white"
                                : "bg-gray-400 hover:bg-gray-500 text-white"
                            }`}
                    >
                        {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                </div>
            )}

            <div className={!visible && isCustomizing ? "pointer-events-none" : ""}>
                {children}
            </div>
        </div>
    );
}
