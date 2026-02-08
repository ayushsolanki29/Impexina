"use client";
import { Ship, Package, Users, Target } from "lucide-react";
import StatCard from "../shared/StatCard";
import CustomizableWidget from "../shared/CustomizableWidget";
import { useCustomization } from "../../contexts/CustomizationContext";

export default function AlertsSection({
    containerStats,
    taskStats,
    loadingContainers,
    onStatClick
}) {
    const { getVisibleWidgets, reorderWidgets } = useCustomization();
    const visibleWidgets = getVisibleWidgets("ALERTS");

    const handleDragStart = (e, index) => {
        e.dataTransfer.setData("widgetIndex", index);
        e.target.style.opacity = "0.4";
    };

    const handleDragEnd = (e) => {
        e.target.style.opacity = "1";
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        const dragIndex = parseInt(e.dataTransfer.getData("widgetIndex"));
        if (isNaN(dragIndex) || dragIndex === dropIndex) return;
        reorderWidgets("ALERTS", dragIndex, dropIndex);
    };

    const widgetComponents = {
        STAT_ARRIVING: (
            <StatCard
                icon={Ship}
                title="Containers Arriving"
                value={containerStats?.arriving15Days || 0}
                subtitle="Next 15 Days"
                color="indigo"
                loading={loadingContainers}
                onClick={() => onStatClick?.({ type: 'arriving', days: 15 })}
            />
        ),
        STAT_ACTIVE: (
            <StatCard
                icon={Package}
                title="Active Containers"
                value={containerStats?.active || 0}
                subtitle="In Progress"
                color="emerald"
                loading={loadingContainers}
                onClick={() => onStatClick?.({ type: 'status', status: 'Active' })}
            />
        ),
        STAT_TEAM: (
            <StatCard
                icon={Users}
                title="Team Members"
                value={containerStats?.teamSize || 0}
                subtitle="Active"
                color="purple"
            />
        ),
        STAT_TASKS: (
            <StatCard
                icon={Target}
                title="Today's Tasks"
                value={taskStats?.total || 0}
                subtitle={`${taskStats?.completed || 0} Done`}
                color="amber"
            />
        ),
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {visibleWidgets.map((widget, index) => (
                <CustomizableWidget
                    key={widget.id}
                    widgetId={widget.id}
                    sectionId="ALERTS"
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                >
                    {widgetComponents[widget.id]}
                </CustomizableWidget>
            ))}
        </div>
    );
}
