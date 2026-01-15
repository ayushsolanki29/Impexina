// components/containers/FiltersPanel.jsx
import { Search, Calendar, Filter } from "lucide-react";

export default function FiltersPanel({
  filters,
  uniqueOrigins,
  onFilterChange,
  onClearFilters,
  hideStatusFilter = false,
}) {
  return (
    <div className="p-5 border-b bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
        <button
          onClick={onClearFilters}
          className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded-lg border border-gray-300 hover:border-gray-400"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <FilterInput
          label="Search Container"
          type="text"
          value={filters.search}
          onChange={(value) => onFilterChange("search", value)}
          placeholder="Container code..."
          icon={Search}
        />

        {/* Origin */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            Origin
          </label>
          <select
            value={filters.origin}
            onChange={(e) => onFilterChange("origin", e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Origins</option>
            {uniqueOrigins.map((origin) => (
              <option key={origin} value={origin}>
                {origin}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        {!hideStatusFilter && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => onFilterChange("status", e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="IN_PORT">In Port</option>
              <option value="IN_SEA">In Sea</option>
            </select>
          </div>
        )}

        {/* Date Range */}
        <DateRangeFilter
          dateFrom={filters.dateFrom}
          dateTo={filters.dateTo}
          onDateFromChange={(value) => onFilterChange("dateFrom", value)}
          onDateToChange={(value) => onFilterChange("dateTo", value)}
        />
      </div>
    </div>
  );
}

// Sub-components for FiltersPanel
function FilterInput({
  label,
  type,
  value,
  onChange,
  placeholder,
  icon: Icon,
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${
            Icon ? "pl-10" : "pl-3"
          } pr-4 py-2.5 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
        />
      </div>
    </div>
  );
}

function DateRangeFilter({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1.5 block">
          From Date
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1.5 block">
          To Date
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            min={dateFrom}
            className="pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
