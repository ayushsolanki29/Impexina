"use client";
import React, { useState, useRef, useEffect } from "react";
import { Copy, Trash2, ImageIcon, Keyboard } from "lucide-react";

const LoadingRow = ({ 
  row, 
  onUpdate, 
  onDuplicate, 
  onRemove,
  shippingMarkSuggestions = [],
  isLastRow
}) => {
  const [shippingMarkOpen, setShippingMarkOpen] = useState(false);
  const [shippingMarkQuery, setShippingMarkQuery] = useState("");
  const particularInputRef = useRef(null);
  
  // Auto-focus on new last row
  useEffect(() => {
    if (isLastRow && particularInputRef.current) {
      particularInputRef.current.focus();
    }
  }, [isLastRow]);

  const handleKeyDown = (e, field) => {
    // Tab to next field
    if (e.key === 'Tab') {
      e.preventDefault();
      const inputs = document.querySelectorAll(`[data-row-id="${row.id}"] input`);
      const currentIndex = Array.from(inputs).findIndex(input => input === e.target);
      if (currentIndex < inputs.length - 1) {
        inputs[currentIndex + 1].focus();
      } else if (isLastRow) {
        // If last field of last row, add new row
        onAddNewRow();
      }
    }
    
    // Enter to next row or add new
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isLastRow) {
        onAddNewRow();
      } else {
        // Move to next row
        const nextRowInputs = document.querySelectorAll(`[data-row-id] input`);
        const currentIndex = Array.from(nextRowInputs).findIndex(input => input === e.target);
        if (currentIndex < nextRowInputs.length - 1) {
          nextRowInputs[currentIndex + 1].focus();
        }
      }
    }
  };

  const onAddNewRow = () => {
    const event = new KeyboardEvent('keydown', {
      key: 'n',
      ctrlKey: true
    });
    window.dispatchEvent(event);
  };

  const handleFileUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onUpdate(row.id, "photo", ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleParticularChange = (value) => {
    onUpdate(row.id, "particular", value);
    onUpdate(row.id, "itemNo", value);
  };

  const numericFields = ["ctn", "pcs", "cbm", "wt"];

  return (
    <tr className="border-t hover:bg-gray-50/50" data-row-id={row.id}>
      {/* Photo Column */}
      <td className="px-3 py-3 align-top">
        <div className="w-20 h-16 border border-dashed border-gray-300 rounded flex items-center justify-center bg-white cursor-pointer hover:bg-gray-50">
          {row.photo ? (
            <div className="relative w-full h-full">
              <img
                src={row.photo}
                alt="preview"
                className="w-full h-full object-cover rounded"
              />
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center cursor-pointer text-gray-500 text-xs">
              <ImageIcon className="w-4 h-4 mb-1" />
              <span>Optional</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files?.[0])}
                className="hidden"
              />
            </label>
          )}
        </div>
      </td>

      {/* Particular Column */}
      <td className="px-3 py-3 align-top">
        <input
          ref={particularInputRef}
          value={row.particular}
          onChange={(e) => handleParticularChange(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 'particular')}
          className="w-48 border border-gray-300 px-3 py-2 rounded text-sm focus:ring-1 focus:ring-blue-300"
          placeholder="Item description"
          data-row-id={row.id}
        />
      </td>

      {/* Shipping Mark Column */}
      <td className="px-3 py-3 align-top">
        <div className="relative">
          <input
            value={row.shippingMark}
            onChange={(e) => {
              onUpdate(row.id, "shippingMark", e.target.value);
              setShippingMarkQuery(e.target.value);
              setShippingMarkOpen(true);
            }}
            onKeyDown={(e) => handleKeyDown(e, 'shippingMark')}
            onFocus={() => setShippingMarkOpen(true)}
            onBlur={() => setTimeout(() => setShippingMarkOpen(false), 200)}
            placeholder="Shipping mark"
            className="w-40 border border-gray-300 px-3 py-2 rounded text-sm focus:ring-1 focus:ring-blue-300"
            data-row-id={row.id}
            list={`shippingMarks-${row.id}`}
          />
          {shippingMarkSuggestions.length > 0 && (
            <datalist id={`shippingMarks-${row.id}`}>
              {shippingMarkSuggestions.map((mark, index) => (
                <option key={index} value={mark.name}>
                  {mark.source ? `${mark.name} (${mark.source})` : mark.name}
                </option>
              ))}
            </datalist>
          )}
        </div>
      </td>

      {/* CTN Mark Column */}
      <td className="px-3 py-3 align-top">
        <input
          value={row.ctnMark}
          onChange={(e) => onUpdate(row.id, "ctnMark", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 'ctnMark')}
          className="w-36 border border-gray-300 px-3 py-2 rounded text-sm focus:ring-1 focus:ring-blue-300"
          placeholder="CTN mark"
          data-row-id={row.id}
        />
      </td>

      {/* Item No Column */}
      <td className="px-3 py-3 align-top">
        <input
          value={row.itemNo}
          onChange={(e) => onUpdate(row.id, "itemNo", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 'itemNo')}
          className="w-36 border border-gray-300 px-3 py-2 rounded text-sm bg-gray-50 focus:ring-1 focus:ring-blue-300"
          placeholder="Auto-filled"
          readOnly
          data-row-id={row.id}
        />
      </td>

      {/* Numeric Columns */}
      {["ctn", "pcs", "cbm", "wt"].map((field) => (
        <td key={field} className="px-3 py-3 align-top">
          <input
            type="number"
            min="0"
            step={field === "cbm" ? "0.001" : field === "wt" ? "0.01" : "1"}
            value={row[field]}
            onChange={(e) => onUpdate(row.id, field, Number(e.target.value || 0))}
            onKeyDown={(e) => handleKeyDown(e, field)}
            className={`w-24 border border-gray-300 px-3 py-2 rounded text-sm text-right focus:ring-1 focus:ring-blue-300`}
            data-row-id={row.id}
          />
        </td>
      ))}

      {/* Calculated Columns */}
      <td className="px-3 py-3 align-top">
        <div className="w-24 text-right text-sm font-semibold text-gray-800 bg-blue-50 px-3 py-2 rounded">
          {Number(row.tpcs || 0).toLocaleString()}
        </div>
      </td>
      
      <td className="px-3 py-3 align-top">
        <div className="w-24 text-right text-sm font-semibold text-gray-800 bg-blue-50 px-3 py-2 rounded">
          {Number(row.tcbm || 0).toFixed(3)}
        </div>
      </td>
      
      <td className="px-3 py-3 align-top">
        <div className="w-24 text-right text-sm font-semibold text-gray-800 bg-blue-50 px-3 py-2 rounded">
          {Number(row.twt || 0).toFixed(2)}
        </div>
      </td>

      {/* Actions Column */}
      <td className="px-3 py-3 align-top">
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onDuplicate(row)}
            className="text-xs px-3 py-2 rounded bg-gray-100 border border-gray-300 text-gray-700 inline-flex items-center gap-2 hover:bg-gray-200"
            title="Duplicate (Ctrl+D)"
          >
            <Copy className="w-3 h-3" /> Dup
          </button>
          <button
            onClick={() => onRemove(row.id)}
            className="text-xs px-3 py-2 rounded bg-red-50 border border-red-200 text-red-700 inline-flex items-center gap-2 hover:bg-red-100"
            title="Remove"
          >
            <Trash2 className="w-3 h-3" /> Remove
          </button>
        </div>
      </td>
    </tr>
  );
};

export default LoadingRow;