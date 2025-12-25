import React from "react";
import { ChevronLeft, Eye, Printer } from "lucide-react";
import StatusToggle from "../../_components/containers/StatusToggle";

const ContainerHeader = ({
  containerCode,
  containerData,
  containerStatus,
  onBack,
  onStatusUpdate,
  onPreviewAll,
  onExportClick,
  updatingStatus = false,
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800 border border-green-200";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "DRAFT":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        );
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
            <span className="text-lg text-gray-600 font-normal">
              | {containerData?.container?.origin || "Unknown Origin"}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full ${getStatusColor(
                containerStatus
              )}`}
            >
              {getStatusIcon(containerStatus)}
              {containerStatus}
            </span>
          </h1>
          <p className="text-gray-600 mt-2">
            {containerData?.overallTotals?.totalClients || 0} clients •{" "}
            {containerData?.overallTotals?.totalItems || 0} items
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {/* Status Toggle Component - Same as overview page */}
          <div className="flex justify-end">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Status:</span>
              <button
                onClick={() => onStatusUpdate("DRAFT")}
                disabled={updatingStatus || containerStatus === "DRAFT"}
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  containerStatus === "DRAFT"
                    ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {updatingStatus && containerStatus !== "DRAFT"
                  ? "Updating..."
                  : "Draft"}
              </button>
              <button
                onClick={() => onStatusUpdate("CONFIRMED")}
                disabled={updatingStatus || containerStatus === "CONFIRMED"}
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  containerStatus === "CONFIRMED"
                    ? "bg-green-100 text-green-800 border border-green-300"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {updatingStatus && containerStatus !== "CONFIRMED"
                  ? "Updating..."
                  : "Confirmed"}
              </button>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={onPreviewAll}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg"
            >
              <Eye className="w-4 h-4" />
              Preview All
            </button>

            <button
              onClick={() => onExportClick("print")}
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
