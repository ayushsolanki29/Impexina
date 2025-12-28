"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {  toast } from "sonner";
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
  Loader2,
  Users,
  Activity,
} from "lucide-react";
import API from "@/lib/api";

// Helper function to safely format numbers
const formatNumber = (value, defaultValue = "0.00", decimals = 2) => {
  if (value === null || value === undefined || value === "")
    return defaultValue;

  // Convert to number if it's a string
  const num = typeof value === "string" ? parseFloat(value) : value;

  // Check if it's a valid number
  if (isNaN(num)) return defaultValue;

  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

// Helper function to safely convert to number
const safeNumber = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === "")
    return defaultValue;
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? defaultValue : num;
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (error) {
    return dateString;
  }
};

export default function ViewContainerSummary() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [summary, setSummary] = useState(null);
  const [activities, setActivities] = useState([]);
  const [showActivities, setShowActivities] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSummary();
  }, [params.id]);

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await API.get(`/container-summaries/${params.id}`);
      
      if (response.data.success) {
        setSummary(response.data.data);
        
        // Load activities
        const activitiesResponse = await API.get(`/container-summaries/${params.id}/activities`);
        if (activitiesResponse.data.success) {
          setActivities(activitiesResponse.data.data || []);
        }
      } else {
        setError(response.message || "Failed to load summary");
        toast.error(response.message || "Summary not found");
      }
    } catch (error) {
      console.error("Error loading summary:", error);
      setError("Failed to load summary. Please try again.");
      toast.error("Failed to load summary");
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    window.print();
  };

  const exportToCSV = async () => {
    if (!summary) return;

    setExporting(true);
    try {
      const response = await API.download(
        `/container-summaries/${summary.id}/export/csv`,
        {},
        `container_summary_${summary.month.replace(/\s+/g, "_")}_${
          new Date().toISOString().slice(0, 10)
        }.csv`
      );
      
      toast.success("CSV exported successfully");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export CSV");
    } finally {
      setExporting(false);
    }
  };

  const exportToExcel = async () => {
    if (!summary) return;

    setExporting(true);
    try {
      const response = await API.download(
        `/container-summaries/${summary.id}/export/excel`,
        {},
        `container_summary_${summary.month.replace(/\s+/g, "_")}_${
          new Date().toISOString().slice(0, 10)
        }.xlsx`
      );
      
      toast.success("Excel exported successfully");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export to Excel");
    } finally {
      setExporting(false);
    }
  };

  const deleteSummary = async () => {
    if (!confirm("Are you sure you want to delete this summary? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await API.delete(`/container-summaries/${params.id}`);
      
      if (response.success) {
        toast.success(response.message || "Summary deleted successfully");
        router.push("/dashboard/container-summary");
      } else {
        toast.error(response.message || "Failed to delete summary");
      }
    } catch (error) {
      console.error("Error deleting summary:", error);
      toast.error("Failed to delete summary");
    }
  };

  // Calculate container totals for display
  const calculateContainerTotals = () => {
    if (!summary?.containers) return { ctn: 0, dollar: 0, finalAmount: 0 };
    
    return summary.containers.reduce(
      (acc, container) => ({
        ctn: acc.ctn + (container.ctn || 0),
        dollar: acc.dollar + (container.dollar || 0),
        finalAmount: acc.finalAmount + (container.finalAmount || 0),
      }),
      { ctn: 0, dollar: 0, finalAmount: 0 }
    );
  };

  const containerTotals = calculateContainerTotals();

  // Get calculated values for a container
  const getCalculatedValues = (container) => {
    if (!container) return {};
    
    // If values are already calculated, return them
    if (container.inr && container.duty && container.gst) {
      return {
        inr: container.inr,
        duty: container.duty,
        total: container.total,
        gst: container.gst,
        totalDuty: container.totalDuty,
        finalAmount: container.finalAmount,
      };
    }
    
    // Calculate fresh if needed
    const dollar = container.dollar || 0;
    const dollarRate = container.dollarRate || 89.7;
    const doCharge = container.doCharge || 58000;
    const cfs = container.cfs || 21830;
    
    const inr = dollar * dollarRate;
    const duty = inr * 0.165;
    const total = inr + duty;
    const gst = total * 0.18;
    const totalDuty = duty + gst;
    const finalAmount = totalDuty + doCharge + cfs;
    
    return {
      inr,
      duty,
      total,
      gst,
      totalDuty,
      finalAmount,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading summary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Summary
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push("/dashboard/container-summary")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Summaries
            </button>
            <button
              onClick={loadSummary}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
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
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm text-gray-500">
                  ID: {summary.id}
                </span>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-500">
                  Created by: {summary.createdBy}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowActivities(!showActivities)}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
              >
                <Activity className="w-4 h-4" />
                {showActivities ? "Hide" : "Show"} Activities
              </button>
              <button
                onClick={() =>
                  router.push(`/dashboard/container-summary/${summary.id}/edit`)
                }
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={exportToCSV}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 disabled:bg-green-400 text-white rounded hover:bg-green-700 disabled:cursor-not-allowed transition-colors"
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                CSV
              </button>
              <button
                onClick={exportToPDF}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print
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
          <div className="grid grid-cols-2 gap-4 mt-4 max-w-2xl mx-auto">
            <div className="text-left">
              <p className="text-sm text-gray-600">ID: {summary.id}</p>
              <p className="text-sm text-gray-600">Created by: {summary.createdBy}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Status: {summary.status}</p>
              <p className="text-sm text-gray-600">Updated: {formatDate(summary.updatedAt)}</p>
            </div>
          </div>
        </div>

        {/* Activities Panel */}
        {showActivities && activities.length > 0 && (
          <div className="bg-white rounded-lg shadow border p-6 mb-6 print:hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Activities
              </h3>
              <button
                onClick={() => setShowActivities(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {activity.type.replace("_", " ")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {activity.user?.name || "System"}
                        </p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(activity.createdAt)}
                      </span>
                    </div>
                    {activity.note && (
                      <p className="text-sm text-gray-600 mt-1">{activity.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Header Cards */}
        <div className="bg-white rounded-lg shadow border p-6 mb-6 print:shadow-none print:border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
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
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <div className="text-lg font-semibold text-gray-900 capitalize">
                    {summary.status.toLowerCase()}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-sm text-gray-600">Containers</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {summary.totalContainers || 0}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-center gap-3">
                <Ship className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="text-sm text-gray-600">Updated</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatDate(summary.updatedAt)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-white rounded-lg shadow border p-6 mb-6 print:shadow-none print:border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Financial Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-sm text-gray-600">Total CTN</div>
              <div className="text-xl font-bold text-gray-900">
                {formatNumber(summary.totalCTN, "0", 0)}
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="text-sm text-gray-600">Total Dollar</div>
              <div className="text-xl font-bold text-gray-900">
                ${formatNumber(summary.totalDollar)}
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div className="text-sm text-gray-600">Total INR</div>
              <div className="text-xl font-bold text-gray-900">
                ₹{formatNumber(summary.totalINR)}
              </div>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
              <div className="text-sm text-gray-600">Total Duty & GST</div>
              <div className="text-xl font-bold text-gray-900">
                ₹{formatNumber(summary.totalINR * 0.165 + summary.totalINR * 0.18)}
              </div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
              <div className="text-sm text-gray-600">Final Amount</div>
              <div className="text-xl font-bold text-gray-900">
                ₹{formatNumber(summary.totalFinalAmount)}
              </div>
            </div>
          </div>
        </div>

        {/* Container Details */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Container Details ({summary.containers?.length || 0})
            </h3>
            <div className="text-sm text-gray-600">
              Total: ₹{formatNumber(containerTotals.finalAmount)}
            </div>
          </div>

          {summary.containers?.length > 0 ? (
            <div className="space-y-6">
              {summary.containers.map((container, index) => {
                const calculated = getCalculatedValues(container);
                const containerNo = container.containerNo || index + 1;
                
                return (
                  <div
                    key={container.id || index}
                    className="bg-white rounded-lg shadow border p-6 print:shadow-none print:border print:break-inside-avoid"
                  >
                    {/* Container Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-4 border-b">
                      <div className="flex items-center gap-4 mb-4 md:mb-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg font-bold text-blue-700">
                            {containerNo}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">
                            Container #{containerNo}
                            {container.containerCode && (
                              <span className="text-gray-600 ml-2">
                                ({container.containerCode})
                              </span>
                            )}
                          </h4>
                          <div
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              container.status === "Loaded"
                                ? "bg-green-100 text-green-800 border border-green-200"
                                : container.status === "Insea"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : "bg-gray-100 text-gray-800 border border-gray-200"
                            }`}
                          >
                            {container.status || "Loaded"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Final Amount</div>
                        <div className="text-2xl font-bold text-gray-900">
                          ₹{formatNumber(calculated.finalAmount)}
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
                          <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200 text-gray-900">
                            {container.containerCode || "-"}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            CTN (Cartons)
                          </label>
                          <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200 text-gray-900">
                            {container.ctn || 0}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Shipping Line
                          </label>
                          <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200 text-gray-900">
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
                          <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200 text-gray-900">
                            {formatDate(container.loadingDate) || "-"}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            ETA
                          </label>
                          <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200 text-gray-900">
                            {container.eta || "-"}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            BL No
                          </label>
                          <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200 text-gray-900">
                            {container.bl || "-"}
                          </div>
                        </div>
                      </div>

                      {/* Financial Inputs */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Dollar Amount ($)
                          </label>
                          <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200 text-gray-900">
                            ${formatNumber(container.dollar)}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Dollar Rate (₹)
                          </label>
                          <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200 text-gray-900">
                            {formatNumber(container.dollarRate, "89.70")}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            DO Charge (₹)
                          </label>
                          <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200 text-gray-900">
                            ₹{formatNumber(container.doCharge, "58,000")}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            CFS (₹)
                          </label>
                          <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200 text-gray-900">
                            ₹{formatNumber(container.cfs, "21,830")}
                          </div>
                        </div>
                      </div>

                      {/* Calculated Fields */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            INR Amount
                          </label>
                          <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200 text-gray-900 font-medium">
                            ₹{formatNumber(calculated.inr)}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Duty (16.5%)
                          </label>
                          <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200 text-gray-900">
                            ₹{formatNumber(calculated.duty)}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            GST (18%)
                          </label>
                          <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200 text-gray-900">
                            ₹{formatNumber(calculated.gst)}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Total Duty
                          </label>
                          <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200 text-gray-900 font-medium">
                            ₹{formatNumber(calculated.totalDuty)}
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
                        <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200 text-gray-900">
                          {container.containerNoField || "-"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          SIMS
                        </label>
                        <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200 text-gray-900">
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
                              <span>{formatNumber(container.dollarRate, "89.70")}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>INR Conversion:</span>
                              <span>
                                ${formatNumber(container.dollar)} ×{" "}
                                {formatNumber(container.dollarRate, "89.70")} = ₹
                                {formatNumber(calculated.inr)}
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
                              <span>₹{formatNumber(calculated.totalDuty)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>DO Charge:</span>
                              <span>₹{formatNumber(container.doCharge, "58,000")}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>CFS:</span>
                              <span>₹{formatNumber(container.cfs, "21,830")}</span>
                            </div>
                            <div className="flex justify-between font-medium">
                              <span>Final Amount:</span>
                              <span>₹{formatNumber(calculated.finalAmount)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
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
        <div className="print:hidden flex flex-col sm:flex-row justify-between gap-4 mt-8 pt-8 border-t">
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/dashboard/container-summary")}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to List
            </button>
            <button
              onClick={deleteSummary}
              className="px-6 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              Delete Summary
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportToCSV}
              disabled={exporting}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 disabled:bg-green-400 text-white rounded-lg hover:bg-green-700 disabled:cursor-not-allowed transition-colors"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export CSV
            </button>
            <button
              onClick={exportToExcel}
              disabled={exporting}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 disabled:bg-blue-400 text-white rounded-lg hover:bg-blue-700 disabled:cursor-not-allowed transition-colors"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              Export Excel
            </button>
            <button
              onClick={() =>
                router.push(`/dashboard/container-summary/${summary.id}/edit`)
              }
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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