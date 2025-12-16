"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Toaster, toast } from "sonner";
import {
  ChevronLeft,
  Download,
  Calendar,
  Package,
  DollarSign,
  Ship,
  FileText,
  Printer,
  Edit,
  AlertCircle,
} from "lucide-react";

const CONTAINER_SUMMARY_KEY = "igpl_container_summary_v1";

// Helper function to safely format numbers
const formatNumber = (value, defaultValue = "0.00", decimals = 2) => {
  if (value === null || value === undefined || value === "")
    return defaultValue;

  // Convert to number if it's a string
  const num = typeof value === "string" ? parseFloat(value) : value;

  // Check if it's a valid number
  if (isNaN(num)) return defaultValue;

  return num.toFixed(decimals);
};

// Helper function to safely convert to number
const safeNumber = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === "")
    return defaultValue;
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? defaultValue : num;
};

export default function ViewContainerSummary() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const summaries = JSON.parse(
        localStorage.getItem(CONTAINER_SUMMARY_KEY) || "[]"
      );
      const found = summaries.find((s) => s.id === params.id);

      if (found) {
        // Ensure all container values are numbers
        const sanitizedSummary = {
          ...found,
          containers: (found.containers || []).map((container) => ({
            ...container,
            dollar: safeNumber(container.dollar),
            dollarRate: safeNumber(container.dollarRate, 89.7),
            ctn: safeNumber(container.ctn),
            inr: safeNumber(container.inr),
            duty: safeNumber(container.duty),
            total: safeNumber(container.total),
            gst: safeNumber(container.gst),
            totalDuty: safeNumber(container.totalDuty),
            doCharge: safeNumber(container.doCharge, 58000),
            cfs: safeNumber(container.cfs, 21830),
            finalAmount: safeNumber(container.finalAmount),
          })),
        };

        setSummary(sanitizedSummary);
      } else {
        toast.error("Summary not found");
        router.push("/dashboard/container-summary");
      }
    } catch (err) {
      setError("Failed to load summary");
      console.error("Error loading summary:", err);
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  const exportToPDF = () => {
    window.print();
  };

  const exportToCSV = () => {
    if (!summary) return;

    try {
      const headers = [
        "NO",
        "CONTAINER CODE",
        "CTN",
        "LOADING DATE",
        "ETA",
        "DOLLAR",
        "DOLLAR RATE",
        "INR",
        "DUTY 16.5%",
        "TOTAL",
        "GST 18%",
        "TOTAL DUTY",
        "DO CHARGE",
        "CFS",
        "FINAL AMOUNT",
        "SHIPPING LINE",
        "BL",
        "CONTAINER NO.",
        "SIMS",
        "STATUS",
      ];

      const rows = summary.containers.map((container) => [
        container.no,
        container.containerCode || "",
        safeNumber(container.ctn),
        container.loadingDate || "",
        container.eta || "",
        safeNumber(container.dollar),
        safeNumber(container.dollarRate, 89.7),
        formatNumber(container.inr),
        formatNumber(container.duty),
        formatNumber(container.total),
        formatNumber(container.gst),
        formatNumber(container.totalDuty),
        safeNumber(container.doCharge, 58000),
        safeNumber(container.cfs, 21830),
        formatNumber(container.finalAmount),
        container.shippingLine || "",
        container.bl || "",
        container.containerNo || "",
        container.sims || "",
        container.status || "Loaded",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `container_summary_${summary.month.replace(/\s+/g, "_")}_${
        summary.id
      }.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported successfully");
    } catch (err) {
      toast.error("Failed to export CSV");
      console.error("Export error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-600">Loading summary...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Summary
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/dashboard/container-summary")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Summaries
          </button>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Summary Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The requested summary could not be found.
          </p>
          <button
            onClick={() => router.push("/dashboard/container-summary")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Summaries
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 print:hidden">
          <button
            onClick={() => router.push("/dashboard/container-summary")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Summaries
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {summary.month} Summary
              </h1>
              <p className="text-gray-600 mt-1">
                View container details and financial breakdown
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  router.push(`/dashboard/container-summary/${summary.id}/edit`)
                }
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit Summary
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={exportToPDF}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print/PDF
              </button>
            </div>
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {summary.month} Container Summary
          </h1>
          <p className="text-gray-600 mt-2">
            Generated on {new Date().toLocaleDateString()}
          </p>
          <p className="text-gray-600">ID: {summary.id}</p>
        </div>

        {/* Month Info Card */}
        <div className="bg-white rounded-lg shadow border p-6 mb-6 print:shadow-none print:border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-sm text-gray-600">Month</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {summary.month}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <div className="text-lg font-semibold text-gray-900 capitalize">
                    {summary.status}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-sm text-gray-600">Containers</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {summary.totals?.totalContainers || 0}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Ship className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="text-sm text-gray-600">Updated</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {summary.updatedAt}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Totals */}
        <div className="bg-white rounded-lg shadow border p-6 mb-6 print:shadow-none print:border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Month Totals
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600">Total Containers</div>
              <div className="text-xl font-bold text-gray-900">
                {summary.totals?.totalContainers || 0}
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600">Total CTN</div>
              <div className="text-xl font-bold text-gray-900">
                {summary.totals?.totalCTN || 0}
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600">Total Dollar</div>
              <div className="text-xl font-bold text-gray-900">
                ${formatNumber(summary.totals?.totalDollar)}
              </div>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="text-sm text-gray-600">Total INR</div>
              <div className="text-xl font-bold text-gray-900">
                ₹{formatNumber(summary.totals?.totalINR)}
              </div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-sm text-gray-600">Final Amount</div>
              <div className="text-xl font-bold text-gray-900">
                ₹{formatNumber(summary.totals?.totalFinalAmount)}
              </div>
            </div>
          </div>
        </div>

        {/* Container Details */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Container Details ({summary.containers?.length || 0})
          </h3>

          {summary.containers?.map((container, index) => (
            <div
              key={`${container.no}-${index}`}
              className="bg-white rounded-lg shadow border p-6 mb-4 print:shadow-none print:border print:break-inside-avoid"
            >
              {/* Container Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-blue-700">
                      {container.no}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">
                      Container #{container.no}
                    </h4>
                    <div
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        container.status === "Loaded"
                          ? "bg-green-100 text-green-800"
                          : container.status === "Insea"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {container.status || "Loaded"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Final Amount</div>
                  <div className="text-2xl font-bold text-gray-900">
                    ₹{formatNumber(container.finalAmount)}
                  </div>
                </div>
              </div>

              {/* Container Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Basic Info */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Container Code
                    </label>
                    <div className="px-3 py-2 bg-gray-50 rounded border text-gray-900">
                      {container.containerCode || "-"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      CTN
                    </label>
                    <div className="px-3 py-2 bg-gray-50 rounded border text-gray-900">
                      {container.ctn || 0}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Shipping Line
                    </label>
                    <div className="px-3 py-2 bg-gray-50 rounded border text-gray-900">
                      {container.shippingLine || "-"}
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Loading Date
                    </label>
                    <div className="px-3 py-2 bg-gray-50 rounded border text-gray-900">
                      {container.loadingDate || "-"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      ETA
                    </label>
                    <div className="px-3 py-2 bg-gray-50 rounded border text-gray-900">
                      {container.eta || "-"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      BL No
                    </label>
                    <div className="px-3 py-2 bg-gray-50 rounded border text-gray-900">
                      {container.bl || "-"}
                    </div>
                  </div>
                </div>

                {/* Financial Inputs */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Dollar Amount
                    </label>
                    <div className="px-3 py-2 bg-gray-50 rounded border text-gray-900">
                      ${formatNumber(container.dollar)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Dollar Rate
                    </label>
                    <div className="px-3 py-2 bg-gray-50 rounded border text-gray-900">
                      {formatNumber(container.dollarRate, "89.70", 2)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      DO Charge
                    </label>
                    <div className="px-3 py-2 bg-gray-50 rounded border text-gray-900">
                      ₹{container.doCharge?.toLocaleString() || "58,000"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      CFS
                    </label>
                    <div className="px-3 py-2 bg-gray-50 rounded border text-gray-900">
                      ₹{container.cfs?.toLocaleString() || "21,830"}
                    </div>
                  </div>
                </div>

                {/* Calculated Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      INR Amount
                    </label>
                    <div className="px-3 py-2 bg-gray-50 rounded border text-gray-900 font-medium">
                      ₹{formatNumber(container.inr)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Duty (16.5%)
                    </label>
                    <div className="px-3 py-2 bg-gray-50 rounded border text-gray-900">
                      ₹{formatNumber(container.duty)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      GST (18%)
                    </label>
                    <div className="px-3 py-2 bg-gray-50 rounded border text-gray-900">
                      ₹{formatNumber(container.gst)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Total Duty
                    </label>
                    <div className="px-3 py-2 bg-gray-50 rounded border text-gray-900 font-medium">
                      ₹{formatNumber(container.totalDuty)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Container No
                  </label>
                  <div className="px-3 py-2 bg-gray-50 rounded border text-gray-900">
                    {container.containerNo || "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    SIMS
                  </label>
                  <div className="px-3 py-2 bg-gray-50 rounded border text-gray-900">
                    {container.sims || "-"}
                  </div>
                </div>
              </div>

              {/* Calculations Breakdown */}
              <div className="mt-6 pt-6 border-t text-sm text-gray-600">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">
                      Calculation Breakdown:
                    </h5>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Dollar Amount:</span>
                        <span>${formatNumber(container.dollar)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dollar Rate:</span>
                        <span>
                          {formatNumber(container.dollarRate, "89.70")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>INR Conversion:</span>
                        <span>
                          ${formatNumber(container.dollar)} ×{" "}
                          {formatNumber(container.dollarRate, "89.70")} = ₹
                          {formatNumber(container.inr)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">
                      Final Amount Breakdown:
                    </h5>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Total Duty:</span>
                        <span>₹{formatNumber(container.totalDuty)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>DO Charge:</span>
                        <span>
                          ₹{container.doCharge?.toLocaleString() || "58,000"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>CFS:</span>
                        <span>
                          ₹{container.cfs?.toLocaleString() || "21,830"}
                        </span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Final Amount:</span>
                        <span>₹{formatNumber(container.finalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {(!summary.containers || summary.containers.length === 0) && (
            <div className="bg-white rounded-lg shadow border p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No containers found
              </h3>
              <p className="text-gray-600">
                This summary doesn't contain any container data.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="print:hidden flex justify-between gap-4 mt-8 pt-8 border-t">
          <button
            onClick={() => router.push("/dashboard/container-summary")}
            className="px-6 py-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to List
          </button>
          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() =>
                router.push(`/dashboard/container-summary/${summary.id}/edit`)
              }
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit Summary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
