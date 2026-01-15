// components/containers/ResultsHeader.jsx
import { Filter } from "lucide-react";

export default function ResultsHeader({ 
  count, 
  total, 
  hasFilters = false 
}) {
  return (
    <div className="px-5 py-4 border-b bg-white">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{count}</span> of{" "}
          <span className="font-semibold text-gray-900">{total}</span> containers
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Filter className="w-3 h-3" />
          {hasFilters ? "Filters applied" : "No filters"}
        </div>
      </div>
    </div>
  );
}