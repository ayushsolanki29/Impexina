"use client";
import React, { useState, useEffect, useRef } from "react";
import { Search, Package, X } from "lucide-react";

const AutoSuggestInput = ({
  placeholder = "Search...",
  onSelect,
  fetchSuggestions,
  displayValue = (item) => item.name,
  suggestionKey = "id",
  debounceDelay = 300,
}) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!query.trim() || query.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const data = await fetchSuggestions(query);
        setSuggestions(data.data.data || []);
        setShowDropdown(true);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchData, debounceDelay);
    return () => clearTimeout(debounceTimer);
  }, [query, fetchSuggestions, debounceDelay]);

  const handleSelect = (item) => {
    setSelectedItem(item);
    setQuery(displayValue(item));
    setShowDropdown(false);
    onSelect?.(item);
  };

  const handleClear = () => {
    setQuery("");
    setSelectedItem(null);
    setSuggestions([]);
    onSelect?.(null);
    inputRef.current?.focus();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-sm text-slate-500">Loading...</div>
          ) : suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500">
              No results found for "{query}"
            </div>
          ) : (
            <ul>
              {suggestions.map((item) => (
                <li key={item[suggestionKey]}>
                  <button
                    onClick={() => handleSelect(item)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-slate-100 last:border-0 flex items-start gap-3"
                  >
                    <Package className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">
                        {displayValue(item)}
                      </div>
                      {item.origin && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          Origin: {item.origin}
                        </div>
                      )}
                      {item.totalCBM && (
                        <div className="text-xs text-slate-500">
                          CBM: {item.totalCBM} | Weight: {item.totalWeight}kg
                        </div>
                      )}
                      {item.clients && item.clients.length > 0 && (
                        <div className="mt-1">
                          <div className="text-xs font-medium text-slate-600">
                            Contains items:
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {item.clients[0].items
                              ?.map((i) => i.particular)
                              .slice(0, 2)
                              .join(", ")}
                            {item.clients[0].items?.length > 2 && "..."}
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Selected Item Info */}
      {selectedItem && selectedItem.clients && (
        <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
          <div className="text-xs font-medium text-blue-800 mb-1">
            Container Items:
          </div>
          <ul className="space-y-1">
            {selectedItem.clients.flatMap((client, idx) =>
              client.items?.map((item, itemIdx) => (
                <li key={`${idx}-${itemIdx}`} className="text-xs text-blue-700">
                  • {item.particular} ({item.cbm} CBM, {item.weight} kg)
                </li>
              ))
            ).slice(0, 3)}
            {selectedItem.clients.flatMap(c => c.items).length > 3 && (
              <li className="text-xs text-blue-600 italic">
                + {selectedItem.clients.flatMap(c => c.items).length - 3} more items
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AutoSuggestInput;