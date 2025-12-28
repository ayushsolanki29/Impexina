import React from "react";
import { ArrowLeft, RefreshCw, Download } from "lucide-react";

export default function Header({
  containerCode,
  status,
  onBack,
  onRefresh,
  onExport,
  hasWarehousePlan,
}) {
  const formatContainerCode = (code) => {
    if (!code) return "";
    const decoded = decodeURIComponent(code);
    return decoded
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .replace(/%20/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "DRAFT":
        return "bg-blue-100 text-blue-800";
      case "HOLD":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formattedContainerCode = formatContainerCode(containerCode);

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>

            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-gray-900 truncate">
                Warehouse Plan - {formattedContainerCode}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-gray-500">Mark-wise warehouse tracking</p>
                {status && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      status
                    )}`}
                  >
                    {status}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasWarehousePlan && (
              <>
                <button
                  onClick={onRefresh}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Refresh data"
                >
                  <RefreshCw className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={onExport}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export Excel</span>
                  <span className="inline sm:hidden">Export</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}