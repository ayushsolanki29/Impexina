import React, { useState } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, X } from 'lucide-react';

const SearchFilters = ({
  filters,
  showFilters,
  selectedClients,
  clientGroups,
  onFilterChange,
  onToggleFilters,
  onToggleClient,
  onToggleAllClients,
  onClearFilters,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    onFilterChange('search', value);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border mb-6 overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search items, marks, particulars, clients..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onToggleFilters}
              className="flex items-center gap-2 px-4 py-2.5 border rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filters
              {showFilters ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onClearFilters}
              className="flex items-center gap-2 px-4 py-2.5 border rounded-lg hover:bg-gray-50"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="p-4 border-t bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Client Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Client
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto p-2 border rounded-lg bg-white">
                <label className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedClients.length === clientGroups.length}
                    onChange={onToggleAllClients}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">
                    Select All ({clientGroups.length})
                  </span>
                </label>
                {clientGroups.map((group) => (
                  <label key={group.client} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedClients.includes(group.client)}
                      onChange={() => onToggleClient(group.client)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{group.client}</span>
                    <span className="ml-auto text-xs text-gray-500">
                      ({group.items.length})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status and Date Filters */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => onFilterChange('status', e.target.value)}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loading Date Range
                </label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => onFilterChange('dateFrom', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => onFilterChange('dateTo', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>

            {/* CTN and Weight Range */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CTN Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minCTN}
                    onChange={(e) => onFilterChange('minCTN', e.target.value)}
                    className="w-1/2 p-2 border rounded"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxCTN}
                    onChange={(e) => onFilterChange('maxCTN', e.target.value)}
                    className="w-1/2 p-2 border rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight Range (kg)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Min"
                    value={filters.minWeight}
                    onChange={(e) => onFilterChange('minWeight', e.target.value)}
                    className="w-1/2 p-2 border rounded"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Max"
                    value={filters.maxWeight}
                    onChange={(e) => onFilterChange('maxWeight', e.target.value)}
                    className="w-1/2 p-2 border rounded"
                  />
                </div>
              </div>
            </div>

            {/* CBM Range and Sort */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CBM Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Min"
                    value={filters.minCBM}
                    onChange={(e) => onFilterChange('minCBM', e.target.value)}
                    className="w-1/2 p-2 border rounded"
                  />
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Max"
                    value={filters.maxCBM}
                    onChange={(e) => onFilterChange('maxCBM', e.target.value)}
                    className="w-1/2 p-2 border rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => onFilterChange('sortBy', e.target.value)}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="client">Client Name</option>
                  <option value="ctn">Total CTN</option>
                  <option value="weight">Total Weight</option>
                  <option value="cbm">Total CBM</option>
                  <option value="date">Loading Date</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;