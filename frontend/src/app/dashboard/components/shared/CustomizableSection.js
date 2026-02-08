"use client";
import { GripVertical } from "lucide-react";
import { useCustomization } from "../../contexts/CustomizationContext";

export default function CustomizableSection({
    sectionId,
    children,
    className = "",
    index,
}) {
    const { isCustomizing, reorderSections, isWidgetVisible } = useCustomization();

    const visible = isWidgetVisible(sectionId);

    const handleDragStart = (e) => {
        if (!isCustomizing) return;
        e.dataTransfer.setData("sectionIndex", index);
        e.target.style.opacity = "0.4";
    };

    const handleDragEnd = (e) => {
        e.target.style.opacity = "1";
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const dragIndex = parseInt(e.dataTransfer.getData("sectionIndex"));
        if (isNaN(dragIndex) || dragIndex === index) return;
        reorderSections(dragIndex, index);
    };

    if (!visible && !isCustomizing) {
        return null;
    }

    return (
        <div
            className={`relative transition-all duration-300 ${className} ${isCustomizing
                    ? "cursor-move border-2 border-dashed border-amber-300 rounded-2xl p-2 bg-amber-50/30 hover:bg-amber-50/50"
                    : ""
                } ${!visible && isCustomizing ? "opacity-50" : ""}`}
            draggable={isCustomizing}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {isCustomizing && (
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 z-50 bg-amber-500 text-white p-1.5 rounded-full shadow-lg">
                    <GripVertical className="w-4 h-4" />
                </div>
            )}

            <div className={!visible && isCustomizing ? "pointer-events-none" : ""}>
                {children}
            </div>
        </div>
    );
}
