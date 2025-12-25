import React from "react";
import { ArrowLeft, RefreshCw, Download } from "lucide-react";

export default function Header({
  containerCode,
  status,
  onBack,
  onRefresh,
  onExport,
  hasBifurcationData,
}) {
  // Decode URL-encoded container code and replace underscores/spaces
  const formatContainerCode = (code) => {
    if (!code) return "";

    // Decode URL-encoded characters
    const decoded = decodeURIComponent(code);

    // Replace underscores and dashes with spaces for better readability
    const formatted = decoded
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .replace(/%20/g, " ")
      .replace(/\s+/g, " ") // Remove multiple spaces
      .trim();

    return formatted;
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
              {" "}
              {/* Prevents text overflow */}
              <h1 className="text-xl font-semibold text-gray-900 truncate">
                {formattedContainerCode}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-gray-500">Bifurcation Management</p>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    status === "COMPLETED"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {status === "LOADING_SHEET" ? "DRAFT" : status}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasBifurcationData && (
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
