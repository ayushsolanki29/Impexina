import React from 'react';
import { ChevronLeft, Eye, Printer, CheckCircle, AlertCircle } from 'lucide-react';

const ContainerHeader = ({ 
  containerCode, 
  containerData, 
  containerStatus, 
  onBack, 
  onStatusUpdate, 
  onPreviewAll, 
  onExportClick 
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  return (
    <div className="mb-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 group"
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Containers</span>
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span className="text-blue-600">{containerCode}</span>
            <span className="text-lg text-gray-600 font-normal">| {containerData.container.origin}</span>
            <span className={`inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full ${getStatusColor(containerStatus)}`}>
              {containerStatus === 'COMPLETED' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {containerStatus}
            </span>
          </h1>
          <p className="text-gray-600 mt-2">
            {containerData.overallTotals.totalClients} clients • {containerData.overallTotals.totalItems} items
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Status Update Buttons */}
          <div className="flex gap-2 p-2 bg-gray-50 rounded-lg">
            {['DRAFT', 'CONFIRMED', 'COMPLETED'].map((status) => (
              <button
                key={status}
                onClick={() => onStatusUpdate(status)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  containerStatus === status 
                    ? status === 'COMPLETED' 
                      ? 'bg-green-50 border border-green-200 text-green-700' 
                      : status === 'CONFIRMED'
                      ? 'bg-blue-50 border border-blue-200 text-blue-700'
                      : 'bg-gray-100 border border-gray-300 text-gray-900'
                    : 'text-gray-600 hover:bg-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onPreviewAll}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg"
            >
              <Eye className="w-4 h-4" />
              Preview All
            </button>
            
            <button
              onClick={() => onExportClick('print')}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContainerHeader;