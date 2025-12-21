import React from 'react';
import { Package, Users, Box, Scale } from 'lucide-react';

const StatsCards = ({ totals }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl border border-blue-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="text-sm text-gray-600 font-medium">Total Items</div>
            <div className="text-2xl font-bold text-gray-900">{totals.totalItems}</div>
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-green-50 to-white p-5 rounded-xl border border-green-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-xl">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <div className="text-sm text-gray-600 font-medium">Total Clients</div>
            <div className="text-2xl font-bold text-gray-900">{totals.totalClients}</div>
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-purple-50 to-white p-5 rounded-xl border border-purple-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 rounded-xl">
            <Box className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <div className="text-sm text-gray-600 font-medium">Total CTN</div>
            <div className="text-2xl font-bold text-gray-900">{totals.totalCTN}</div>
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-orange-50 to-white p-5 rounded-xl border border-orange-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-100 rounded-xl">
            <Scale className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <div className="text-sm text-gray-600 font-medium">Total Weight</div>
            <div className="text-2xl font-bold text-gray-900">{totals.totalWeight.toFixed(2)} kg</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;