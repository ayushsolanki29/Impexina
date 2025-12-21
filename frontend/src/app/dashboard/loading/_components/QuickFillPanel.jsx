"use client";
import React, { useState } from "react";
import { Zap, Calculator, AlertTriangle } from "lucide-react";

const QuickFillPanel = ({ 
  calculatedTotals,
  onApplyTotals,
  showWarning,
  warningMessage
}) => {
  const [manualTotals, setManualTotals] = useState({
    totalCTN: 0,
    totalWeight: 0,
    totalCBM: 0,
  });

  const handleApply = () => {
    onApplyTotals(manualTotals);
    setManualTotals({
      totalCTN: calculatedTotals.ctn,
      totalWeight: calculatedTotals.twt,
      totalCBM: calculatedTotals.tcbm,
    });
  };

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-600" />
          <h3 className="font-semibold text-amber-800">Quick Fill & Reference</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleApply}
            className="px-3 py-1.5 bg-amber-600 text-white rounded text-sm hover:bg-amber-700"
          >
            Apply All Totals
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
        {/* Calculated Totals */}
        <div className="bg-white p-3 rounded border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-700">Calculated CTN</div>
            <Calculator className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{calculatedTotals.ctn}</div>
          <div className="text-xs text-gray-500 mt-1">From items</div>
        </div>

        <div className="bg-white p-3 rounded border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-700">Calculated Weight</div>
            <Calculator className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{calculatedTotals.twt.toFixed(2)} kg</div>
          <div className="text-xs text-gray-500 mt-1">From items</div>
        </div>

        <div className="bg-white p-3 rounded border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-700">Calculated CBM</div>
            <Calculator className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{calculatedTotals.tcbm.toFixed(3)}</div>
          <div className="text-xs text-gray-500 mt-1">From items</div>
        </div>
      </div>

      {/* Manual Entry for Reference */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-medium text-amber-700 mb-1 block">Reference CTN</label>
          <input
            type="number"
            value={manualTotals.totalCTN}
            onChange={(e) => setManualTotals(prev => ({ ...prev, totalCTN: Number(e.target.value) || 0 }))}
            className="w-full border border-amber-300 px-3 py-2 rounded text-sm"
            placeholder="Enter reference CTN"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-amber-700 mb-1 block">Reference Weight</label>
          <input
            type="number"
            step="0.01"
            value={manualTotals.totalWeight}
            onChange={(e) => setManualTotals(prev => ({ ...prev, totalWeight: Number(e.target.value) || 0 }))}
            className="w-full border border-amber-300 px-3 py-2 rounded text-sm"
            placeholder="Enter reference weight"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-amber-700 mb-1 block">Reference CBM</label>
          <input
            type="number"
            step="0.001"
            value={manualTotals.totalCBM}
            onChange={(e) => setManualTotals(prev => ({ ...prev, totalCBM: Number(e.target.value) || 0 }))}
            className="w-full border border-amber-300 px-3 py-2 rounded text-sm"
            placeholder="Enter reference CBM"
          />
        </div>
      </div>

      {/* Warning if mismatched */}
      {showWarning && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Totals Mismatch Warning</p>
            <p className="text-sm text-red-700">{warningMessage}</p>
            <button
              onClick={() => onApplyTotals(calculatedTotals)}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Click to auto-fill with calculated totals
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickFillPanel;