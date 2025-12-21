"use client";
import React, { forwardRef, useImperativeHandle } from "react";
import LoadingRow from "./LoadingRow";

const LoadingTable = forwardRef(({ 
  rows, 
  onUpdateRow, 
  onDuplicateRow, 
  onRemoveRow,
  onPhotoUpload,
  shippingMarkSuggestions,
  setLastRowRef
}, ref) => {
  
  // Expose method to focus last row
  useImperativeHandle(ref, () => ({
    focusLastRow: () => {
      const lastRowInput = document.querySelector(`[data-row-id="${rows[rows.length - 1]?.id}"] input`);
      if (lastRowInput) {
        lastRowInput.focus();
      }
    }
  }));

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="text-xs text-gray-600 bg-gray-50">
          <tr>
            <th className="px-3 py-3 font-medium">Photo</th>
            <th className="px-3 py-3 font-medium">Item Description</th>
            <th className="px-3 py-3 font-medium">Shipping Mark</th>
            <th className="px-3 py-3 font-medium">CTN Mark</th>
            <th className="px-3 py-3 font-medium">Item No</th>
            <th className="px-3 py-3 font-medium">CTN</th>
            <th className="px-3 py-3 font-medium">PCS</th>
            <th className="px-3 py-3 font-medium">T.PCS</th>
            <th className="px-3 py-3 font-medium">CBM</th>
            <th className="px-3 py-3 font-medium">T.CBM</th>
            <th className="px-3 py-3 font-medium">WT (KG)</th>
            <th className="px-3 py-3 font-medium">T.WT (KG)</th>
            <th className="px-3 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <LoadingRow
              key={row.id}
              row={row}
              onUpdate={onUpdateRow}
              onDuplicate={onDuplicateRow}
              onRemove={onRemoveRow}
              onPhotoUpload={onPhotoUpload}
              shippingMarkSuggestions={shippingMarkSuggestions}
              isLastRow={index === rows.length - 1}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
});

LoadingTable.displayName = "LoadingTable";
export default LoadingTable;