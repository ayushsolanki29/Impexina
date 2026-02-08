"use client";
import { createContext, useContext, useState, useEffect } from "react";

const CustomizationContext = createContext();

export const useCustomization = () => {
    const context = useContext(CustomizationContext);
    if (!context) {
        throw new Error("useCustomization must be used within CustomizationProvider");
    }
    return context;
};

// Default widget configuration
const DEFAULT_WIDGETS = {
    // Main Sections
    ALERTS: {
        id: "ALERTS",
        name: "Critical Alerts",
        visible: true,
        order: 0,
        children: [
            { id: "STAT_ARRIVING", name: "Containers Arriving", visible: true, order: 0 },
            { id: "STAT_ACTIVE", name: "Active Containers", visible: true, order: 1 },
            { id: "STAT_TEAM", name: "Team Members", visible: true, order: 2 },
            { id: "STAT_TASKS", name: "Today's Tasks", visible: true, order: 3 },
        ],
    },
    CONTAINER_DB: {
        id: "CONTAINER_DB",
        name: "Container Database",
        visible: true,
        order: 1,
        children: [
            { id: "FILTER_BAR", name: "Filter Controls", visible: true, order: 0 },
            { id: "CONTAINER_LIST", name: "Container List", visible: true, order: 1 },
            { id: "PAGINATION", name: "Pagination", visible: true, order: 2 },
        ],
    },
    CONTENT_GRID: {
        id: "CONTENT_GRID",
        name: "Dashboard Widgets",
        visible: true,
        order: 2,
        children: [
            { id: "UPCOMING_CONTAINERS", name: "Upcoming Arrivals", visible: true, order: 0 },
            { id: "TEAM_TASKS", name: "Team Task Status", visible: true, order: 1 },
            { id: "CONTAINER_CHART", name: "Container Status Chart", visible: true, order: 2 },
            { id: "TODAY_SUMMARY", name: "Today's Summary", visible: true, order: 3 },
            { id: "MY_TASKS", name: "My Tasks Status", visible: true, order: 4 },
            { id: "QUICK_ACTIONS", name: "Quick Actions", visible: true, order: 5 },
            { id: "PERSONAL_NOTES", name: "Personal Notes", visible: true, order: 6 },
            { id: "QUICK_LINKS", name: "Quick Links", visible: true, order: 7 },
        ],
    },
};

export function CustomizationProvider({ children, userId }) {
    const [isCustomizing, setIsCustomizing] = useState(false);
    const [widgets, setWidgets] = useState(DEFAULT_WIDGETS);
    const [showSettingsPanel, setShowSettingsPanel] = useState(false);

    // Load saved customization from localStorage
    useEffect(() => {
        if (typeof window !== "undefined" && userId) {
            const saved = localStorage.getItem(`dashboard_customization_${userId}`);
            if (saved) {
                try {
                    setWidgets(JSON.parse(saved));
                } catch (error) {
                    console.error("Error loading customization:", error);
                }
            }
        }
    }, [userId]);

    // Save customization to localStorage
    const saveCustomization = (newWidgets) => {
        setWidgets(newWidgets);
        if (typeof window !== "undefined" && userId) {
            localStorage.setItem(
                `dashboard_customization_${userId}`,
                JSON.stringify(newWidgets)
            );
        }
    };

    // Toggle widget visibility
    const toggleWidgetVisibility = (sectionId, widgetId = null) => {
        const newWidgets = { ...widgets };

        if (widgetId) {
            // Toggle child widget
            const section = newWidgets[sectionId];
            const child = section.children.find((c) => c.id === widgetId);
            if (child) {
                child.visible = !child.visible;
            }
        } else {
            // Toggle section
            newWidgets[sectionId].visible = !newWidgets[sectionId].visible;
        }

        saveCustomization(newWidgets);
    };

    // Reorder sections
    const reorderSections = (dragIndex, dropIndex) => {
        const sections = Object.values(widgets).sort((a, b) => a.order - b.order);
        const [draggedSection] = sections.splice(dragIndex, 1);
        sections.splice(dropIndex, 0, draggedSection);

        const newWidgets = { ...widgets };
        sections.forEach((section, index) => {
            newWidgets[section.id].order = index;
        });

        saveCustomization(newWidgets);
    };

    // Reorder widgets within a section
    const reorderWidgets = (sectionId, dragIndex, dropIndex) => {
        const newWidgets = { ...widgets };
        const section = newWidgets[sectionId];
        const children = [...section.children].sort((a, b) => a.order - b.order);

        const [draggedWidget] = children.splice(dragIndex, 1);
        children.splice(dropIndex, 0, draggedWidget);

        children.forEach((child, index) => {
            child.order = index;
        });

        section.children = children;
        saveCustomization(newWidgets);
    };

    // Reset to defaults
    const resetToDefaults = () => {
        saveCustomization(DEFAULT_WIDGETS);
    };

    // Get visible sections in order
    const getVisibleSections = () => {
        return Object.values(widgets)
            .filter((section) => section.visible)
            .sort((a, b) => a.order - b.order);
    };

    // Get visible widgets for a section
    const getVisibleWidgets = (sectionId) => {
        const section = widgets[sectionId];
        if (!section) return [];
        return section.children
            .filter((widget) => widget.visible)
            .sort((a, b) => a.order - b.order);
    };

    // Check if widget is visible
    const isWidgetVisible = (sectionId, widgetId = null) => {
        if (widgetId) {
            const section = widgets[sectionId];
            const widget = section?.children.find((c) => c.id === widgetId);
            return widget?.visible ?? false;
        }
        return widgets[sectionId]?.visible ?? false;
    };

    const value = {
        isCustomizing,
        setIsCustomizing,
        showSettingsPanel,
        setShowSettingsPanel,
        widgets,
        toggleWidgetVisibility,
        reorderSections,
        reorderWidgets,
        resetToDefaults,
        getVisibleSections,
        getVisibleWidgets,
        isWidgetVisible,
    };

    return (
        <CustomizationContext.Provider value={value}>
            {children}
        </CustomizationContext.Provider>
    );
}
