// ========================
// HELPER FUNCTIONS
// ========================

export function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
}

export function isCompletedToday(completion) {
    if (!completion?.completedAt) return false;
    const completedDate = new Date(completion.completedAt);
    const today = new Date();
    return completedDate.toDateString() === today.toDateString();
}

export function getRoleColor(role, isSuper) {
    if (isSuper) return "from-purple-600 via-indigo-600 to-blue-600";
    if (role === "ADMIN") return "from-indigo-600 to-purple-600";
    return "from-slate-600 to-slate-700";
}

export function getRoleBadge(role, isSuper) {
    if (isSuper) {
        return {
            label: "SUPER ADMIN",
            bg: "bg-purple-500",
            icon: "Crown",
        };
    }
    if (role === "ADMIN") {
        return {
            label: "ADMIN",
            bg: "bg-indigo-500",
            icon: "Shield",
        };
    }
    return {
        label: "EMPLOYEE",
        bg: "bg-emerald-500",
        icon: "User",
    };
}
