import React from 'react';
import { Package, Box, Scale, Users } from 'lucide-react';

export default function SummaryCards({ totals, containerDetails }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Clients</p>
            <p className="text-2xl font-semibold">{totals.clientCount}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg">
            <Package className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">CTN</p>
            <p className="text-2xl font-semibold">{totals.totalCTN}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Box className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">CBM</p>
            <p className="text-2xl font-semibold">{totals.totalCBM.toFixed(3)}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 rounded-lg">
            <Scale className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Weight</p>
            <p className="text-2xl font-semibold">{totals.totalWeight} kg</p>
          </div>
        </div>
      </div>
    </div>
  );
}