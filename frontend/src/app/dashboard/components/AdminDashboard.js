"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GripVertical } from "lucide-react";
import DashboardHeader from "../components/shared/DashboardHeader";
import AlertsSection from "../components/admin/AlertsSection";
import ContainerDashboard from "../components/admin/ContainerDashboard";
import ContentGrid from "../components/admin/ContentGrid";

export default function AdminDashboard({ user, dashboardData }) {
    const router = useRouter();

    // State for customizable layout
    const [isCustomizing, setIsCustomizing] = useState(false);
    const [layoutOrder, setLayoutOrder] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('admin_dashboard_layout');
            return saved ? JSON.parse(saved) : ['ALERTS', 'CONTAINER_DB', 'CONTENT_GRID'];
        }
        return ['ALERTS', 'CONTAINER_DB', 'CONTENT_GRID'];
    });

    // All other state variables from the original AdminDashboard
    // (containerStats, taskStats, filters, pagination, etc.)
    // ... [Keep all the existing state and logic from the original component]

    // Drag and drop handlers
    const handleDragStart = (e, index) => {
        if (!isCustomizing) return;
        e.dataTransfer.setData('dragIndex', index);
        e.target.style.opacity = '0.4';
    };

    const handleDragEnd = (e) => {
        e.target.style.opacity = '1';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        const dragIndex = parseInt(e.dataTransfer.getData('dragIndex'));
        if (isNaN(dragIndex) || dragIndex === dropIndex) return;

        const newLayoutOrder = [...layoutOrder];
        const draggedItem = newLayoutOrder.splice(dragIndex, 1)[0];
        newLayoutOrder.splice(dropIndex, 0, draggedItem);

        setLayoutOrder(newLayoutOrder);
        localStorage.setItem('admin_dashboard_layout', JSON.stringify(newLayoutOrder));
    };

    // Section renderer (will be imported from separate component files)
    const renderSection = (id) => {
        switch (id) {
            case 'ALERTS':
                return <AlertsSection /* props */ />;
            case 'CONTAINER_DB':
                return <ContainerDashboard /* props */ />;
            case 'CONTENT_GRID':
                return <ContentGrid /* props */ />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 space-y-6 pb-20">
            {/* Header */}
            <DashboardHeader
                user={user}
                isCustomizing={isCustomizing}
                onToggleCustomize={() => setIsCustomizing(!isCustomizing)}
                showCustomizeButton={true}
            />

            {/* Draggable Sections Container */}
            <div className="space-y-6">
                {layoutOrder.map((sectionId, index) => (
                    <div
                        key={sectionId}
                        draggable={isCustomizing}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                        className={`relative transition-all duration-300 ${isCustomizing
                                ? "cursor-move border-2 border-dashed border-amber-300 rounded-2xl p-2 bg-amber-50/30 hover:bg-amber-50/50"
                                : ""
                            }`}
                    >
                        {isCustomizing && (
                            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 z-50 bg-amber-500 text-white p-1.5 rounded-full shadow-lg">
                                <GripVertical className="w-4 h-4" />
                            </div>
                        )}
                        {renderSection(sectionId)}
                    </div>
                ))}
            </div>
        </div>
    );
}
