"use client";
import React from "react";
import { Save, Plus, Copy, Trash2, ChevronRight, Keyboard } from "lucide-react";

const QuickActionsFooter = ({ 
  onSave, 
  onAddItem, 
  onDuplicateLast, 
  onClearAll,
  onSaveAndNext,
  disabled,
  isSubmitting
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-3 border-t border-gray-700 z-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Shortcut Info */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300">Shortcuts:</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">Ctrl</kbd>
              <span className="text-gray-400">+</span>
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">S</kbd>
              <span className="text-gray-300 ml-2">Save</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">Tab</kbd>
              <span className="text-gray-300 ml-2">Next Field</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">Ctrl</kbd>
              <span className="text-gray-400">+</span>
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">N</kbd>
              <span className="text-gray-300 ml-2">New Item</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">Ctrl</kbd>
              <span className="text-gray-400">+</span>
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">D</kbd>
              <span className="text-gray-300 ml-2">Duplicate</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onAddItem}
              disabled={disabled}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm disabled:opacity-50"
              title="Add New Item (Ctrl+N)"
            >
              <Plus className="w-4 h-4" />
              <span>New Item</span>
            </button>
            
            <button
              onClick={onDuplicateLast}
              disabled={disabled || isSubmitting}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-sm disabled:opacity-50"
              title="Duplicate Last Item (Ctrl+D)"
            >
              <Copy className="w-4 h-4" />
              <span>Duplicate</span>
            </button>
            
            <button
              onClick={onSave}
              disabled={disabled || isSubmitting}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm disabled:opacity-50"
              title="Save (Ctrl+S)"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? "Saving..." : "Save"}</span>
            </button>
            
            <button
              onClick={onSaveAndNext}
              disabled={disabled || isSubmitting}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded text-sm disabled:opacity-50"
              title="Save & Next Client (Ctrl+Shift+N)"
            >
              <ChevronRight className="w-4 h-4" />
              <span>Save & Next</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActionsFooter;