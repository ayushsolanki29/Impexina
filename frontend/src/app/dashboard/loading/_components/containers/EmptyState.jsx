// components/containers/EmptyState.jsx
import { Plus } from "lucide-react";

export default function EmptyState({ 
  message, 
  actionText, 
  onAction, 
  hasFilters = false 
}) {
  return (
    <div className="p-10 text-center">
      <div className="text-gray-400 mb-4 text-lg">
        {message || "No containers found"}
      </div>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        {hasFilters 
          ? "Try adjusting your filters or create a new container loading."
          : "Create your first container loading sheet to get started."}
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> {actionText || "Create New Loading"}
        </button>
      )}
    </div>
  );
}