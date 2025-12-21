"use client";
import React from "react";

const ReferenceComparison = ({ 
  reference, 
  actual 
}) => {
  const comparisons = [
    {
      label: "CTN",
      reference: reference.totalCTN,
      actual: actual.ctn,
      isMatch: reference.totalCTN === actual.ctn
    },
    {
      label: "Weight (KG)",
      reference: reference.totalWeight,
      actual: Number(actual.twt).toFixed(2),
      isMatch: Math.abs(reference.totalWeight - actual.twt) < 0.01
    },
    {
      label: "CBM",
      reference: reference.totalCBM,
      actual: Number(actual.tcbm).toFixed(3),
      isMatch: Math.abs(reference.totalCBM - actual.tcbm) < 0.001
    }
  ];

  return (
    <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-amber-900">
          Reference vs. Actual Comparison
        </h4>
        <div className="text-xs text-amber-700">
          Side-by-side validation
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {comparisons.map((comp) => (
          <div 
            key={comp.label}
            className={`p-3 rounded ${
              comp.isMatch 
                ? 'bg-green-100 text-green-800' 
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            <div className="text-xs font-medium">{comp.label}</div>
            <div className="flex items-center justify-between">
              <span>Reference: {comp.reference}</span>
              <span>Actual: {comp.actual}</span>
            </div>
            {!comp.isMatch && (
              <div className="text-xs mt-1">
                Difference: {Math.abs(comp.reference - comp.actual)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReferenceComparison;