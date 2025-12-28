"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Toaster, toast } from "sonner";
import {
  Save,
  X,
  Plus,
  Trash2,
  ChevronLeft,
  Download,
  Calendar,
  Package,
  DollarSign,
  Percent,
  Ship,
  FileText,
  Calculator,
  Loader2,
  AlertCircle,
} from "lucide-react";
import API from "@/lib/api";

// Default empty container template
const EMPTY_CONTAINER = {
  containerCode: "",
  ctn: 0,
  loadingDate: new Date().toISOString().split("T")[0],
  eta: "",
  dollar: 0,
  dollarRate: 89.7,
  doCharge: 58000,
  cfs: 21830,
  shippingLine: "",
  bl: "",
  containerNo: "",
  sims: "",
  status: "Loaded",
};

export default function ContainerSummaryEditor() {
  const router = useRouter();
  const params = useParams();
  const isEdit = params.id && params.id !== "new";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [formData, setFormData] = useState({
    month: "",
    status: "DRAFT",
  });

  const [containers, setContainers] = useState([]);
  const [error, setError] = useState(null);

  // Load data for edit mode
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      if (isEdit) {
        try {
          const response = await API.get(`/container-summaries/${params.id}`);
          
          if (response.data.success) {
            const summary = response.data.data;
            
            setFormData({
              month: summary.month,
              status: summary.status,
            });
            
            // Transform containers for editing
            const transformedContainers = (summary.containers || []).map((container) => ({
              containerCode: container.containerCode || "",
              ctn: container.ctn || 0,
              loadingDate: container.loadingDate ? 
                new Date(container.loadingDate).toISOString().split("T")[0] : 
                new Date().toISOString().split("T")[0],
              eta: container.eta || "",
              dollar: container.dollar || 0,
              dollarRate: container.dollarRate || 89.7,
              doCharge: container.doCharge || 58000,
              cfs: container.cfs || 21830,
              shippingLine: container.shippingLine || "",
              bl: container.bl || "",
              containerNo: container.containerNoField || "",
              sims: container.sims || "",
              status: container.status || "Loaded",
              // Calculated fields for display
              inr: container.inr || 0,
              duty: container.duty || 0,
              total: container.total || 0,
              gst: container.gst || 0,
              totalDuty: container.totalDuty || 0,
              finalAmount: container.finalAmount || 0,
            }));
            
            setContainers(transformedContainers);
          } else {
            setError(response.message || "Failed to load summary");
            toast.error("Summary not found");
          }
        } catch (error) {
          console.error("Error loading summary:", error);
          setError("Failed to load summary");
          toast.error("Failed to load summary");
        }
      } else {
        // New summary - set default month
        const now = new Date();
        const month = now.toLocaleString("default", { month: "long" });
        const year = now.getFullYear();

        setFormData({
          month: `${month} ${year}`,
          status: "DRAFT",
        });
        setContainers([{ ...EMPTY_CONTAINER }]);
      }

      setLoading(false);
    };

    loadData();
  }, [isEdit, params.id]);

  // Calculate container fields
  const calculateContainerFields = (container) => {
    const dollar = Number(container.dollar) || 0;
    const dollarRate = Number(container.dollarRate) || 89.7;
    const doCharge = Number(container.doCharge) || 58000;
    const cfs = Number(container.cfs) || 21830;

    // Calculate INR
    const inr = dollar * dollarRate;

    // Calculate Duty (16.5% of INR)
    const duty = inr * 0.165;

    // Calculate Total (INR + Duty)
    const total = inr + duty;

    // Calculate GST (18% of Total)
    const gst = total * 0.18;

    // Calculate Total Duty (Duty + GST)
    const totalDuty = duty + gst;

    // Calculate Final Amount (Total Duty + DO Charge + CFS)
    const finalAmount = totalDuty + doCharge + cfs;

    return {
      inr: parseFloat(inr.toFixed(2)),
      duty: parseFloat(duty.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      gst: parseFloat(gst.toFixed(2)),
      totalDuty: parseFloat(totalDuty.toFixed(2)),
      finalAmount: parseFloat(finalAmount.toFixed(2)),
    };
  };

  // Calculate totals for display
  const calculateTotals = () => {
    return containers.reduce(
      (acc, container) => {
        const calculated = calculateContainerFields(container);
        return {
          totalContainers: containers.length,
          totalCTN: acc.totalCTN + (Number(container.ctn) || 0),
          totalDollar: acc.totalDollar + (Number(container.dollar) || 0),
          totalINR: acc.totalINR + calculated.inr,
          totalFinalAmount: acc.totalFinalAmount + calculated.finalAmount,
        };
      },
      {
        totalContainers: 0,
        totalCTN: 0,
        totalDollar: 0,
        totalINR: 0,
        totalFinalAmount: 0,
      }
    );
  };

  const totals = calculateTotals();

  // Handle container field change
  const handleContainerChange = (index, field, value) => {
    const newContainers = [...containers];

    // Convert numeric fields to numbers
    let processedValue = value;
    if (
      ["dollar", "dollarRate", "ctn", "doCharge", "cfs"].includes(field)
    ) {
      processedValue = value === "" ? 0 : parseFloat(value) || 0;
    }

    newContainers[index] = {
      ...newContainers[index],
      [field]: processedValue,
    };

    setContainers(newContainers);
  };

  // Get calculated values for a container
  const getCalculatedValues = (container) => {
    return calculateContainerFields(container);
  };

  // Add new container
  const addContainer = () => {
    setContainers([...containers, { ...EMPTY_CONTAINER }]);
    toast.success("New container added");
  };

  // Remove container
  const removeContainer = (index) => {
    if (containers.length <= 1) {
      toast.error("At least one container is required");
      return;
    }

    const newContainers = containers.filter((_, i) => i !== index);
    setContainers(newContainers);
    toast.success("Container removed");
  };

  // Validate form
  const validateForm = () => {
    if (!formData.month.trim()) {
      toast.error("Month name is required");
      return false;
    }

    if (containers.length === 0) {
      toast.error("Add at least one container");
      return false;
    }

    // Validate containers
    for (let i = 0; i < containers.length; i++) {
      const container = containers[i];
      if (!container.containerCode.trim()) {
        toast.error(`Container ${i + 1}: Container code is required`);
        return false;
      }
      if (container.dollar <= 0) {
        toast.error(`Container ${i + 1}: Dollar amount must be greater than 0`);
        return false;
      }
    }

    return true;
  };

  // Save summary
  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);

    try {
      // Prepare data for API
      const summaryData = {
        month: formData.month,
        status: formData.status,
        containers: containers.map((container) => ({
          containerCode: container.containerCode,
          ctn: container.ctn || 0,
          loadingDate: container.loadingDate || new Date().toISOString().split('T')[0],
          eta: container.eta || "",
          status: container.status || "Loaded",
          dollar: container.dollar || 0,
          dollarRate: container.dollarRate || 89.7,
          doCharge: container.doCharge || 58000,
          cfs: container.cfs || 21830,
          shippingLine: container.shippingLine || "",
          bl: container.bl || "",
          containerNo: container.containerNo || "",
          sims: container.sims || "",
        })),
      };

      let response;
      if (isEdit) {
        response = await API.patch(`/container-summaries/${params.id}`, summaryData);
      } else {
        response = await API.post("/container-summaries", summaryData);
      }

      if (response.data.success) {
        toast.success(response.data.message || 
          `Summary ${isEdit ? "updated" : "created"} successfully!`
        );
        
        // Navigate after a short delay
        setTimeout(() => {
          router.push("/dashboard/container-summary");
        }, 1500);
      } else {
        toast.error(response.datamessage || `Failed to ${isEdit ? "update" : "create"} summary`);
      }
    } catch (error) {
      console.error("Error saving summary:", error);
      
      if (error.response) {
        const errorMsg = error.response.data?.message || 
                        error.response.data?.error || 
                        "Server error occurred";
        toast.error(errorMsg);
      } else if (error.request) {
        toast.error("No response from server. Please check your connection.");
      } else {
        toast.error(`Failed to ${isEdit ? "update" : "create"} summary. Please try again.`);
      }
    } finally {
      setSaving(false);
    }
  };

  // Export to CSV
  const exportToCSV = async () => {
    setExporting(true);
    try {
      if (isEdit) {
        await API.download(
          `/container-summaries/${params.id}/export/csv`,
          {},
          `container_summary_${formData.month.replace(/\s+/g, "_")}_${
            new Date().toISOString().slice(0, 10)
          }.csv`
        );
        toast.success("CSV exported successfully");
      } else {
        // For new summaries, create CSV locally
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

        const rows = containers.map((container, index) => {
          const calculated = getCalculatedValues(container);
          return [
            index + 1,
            container.containerCode || "",
            container.ctn,
            container.loadingDate || "",
            container.eta || "",
            container.dollar,
            container.dollarRate,
            calculated.inr,
            calculated.duty,
            calculated.total,
            calculated.gst,
            calculated.totalDuty,
            container.doCharge,
            container.cfs,
            calculated.finalAmount,
            container.shippingLine || "",
            container.bl || "",
            container.containerNo || "",
            container.sims || "",
            container.status || "Loaded",
          ];
        });

        const csvContent = [
          headers.join(","),
          ...rows.map((row) => row.join(",")),
        ].join("\n");
        
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `container_summary_${formData.month.replace(
          /\s+/g,
          "_"
        )}_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("CSV exported");
      }
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export CSV");
    } finally {
      setExporting(false);
    }
  };

  // Format number for display
  const formatNumber = (num) => {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading editor...</p>
        </div>
      </div>
    );
  }

  if (error && isEdit) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
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
              onClick={() => window.location.reload()}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6">
      <Toaster position="top-right" richColors />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
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
                {isEdit ? `Edit ${formData.month}` : "Create New Month Summary"}
              </h1>
              <p className="text-gray-600 mt-1">
                {isEdit ? "Update container details" : "Add containers for the month"}
              </p>
              {isEdit && (
                <p className="text-sm text-gray-500 mt-1">
                  ID: {params.id}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={exportToCSV}
                disabled={exporting || containers.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 disabled:bg-green-400 text-white rounded hover:bg-green-700 disabled:cursor-not-allowed transition-colors"
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export CSV
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 disabled:bg-blue-400 text-white rounded hover:bg-blue-700 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isEdit ? "Update Summary" : "Create Summary"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Month Info */}
        <div className="bg-white rounded-lg shadow border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Month *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.month}
                  onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="e.g., November 2025"
                  required
                  disabled={saving}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                disabled={saving}
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="text-sm text-gray-600">Total Final Amount</div>
              <div className="text-2xl font-bold text-blue-900">
                ₹{formatNumber(totals.totalFinalAmount)}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                {totals.totalContainers} container(s)
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-white rounded-lg shadow border p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Month Totals</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-sm text-gray-600">Total Containers</div>
              <div className="text-xl font-bold text-gray-900">
                {totals.totalContainers}
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="text-sm text-gray-600">Total CTN</div>
              <div className="text-xl font-bold text-gray-900">
                {totals.totalCTN}
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div className="text-sm text-gray-600">Total Dollar</div>
              <div className="text-xl font-bold text-gray-900">
                ${formatNumber(totals.totalDollar)}
              </div>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
              <div className="text-sm text-gray-600">Total INR</div>
              <div className="text-xl font-bold text-gray-900">
                ₹{formatNumber(totals.totalINR)}
              </div>
            </div>
          </div>
        </div>

        {/* Containers Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="text-lg font-semibold text-gray-900">
            Containers ({containers.length})
          </div>
          <button
            onClick={addContainer}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 disabled:bg-blue-400 text-white rounded hover:bg-blue-700 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Container
          </button>
        </div>

        {/* Container List */}
        <div className="space-y-4 mb-6">
          {containers.length === 0 ? (
            <div className="bg-white rounded-lg shadow border p-8 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Containers Added
              </h3>
              <p className="text-gray-600 mb-4">
                Add your first container to get started
              </p>
              <button
                onClick={addContainer}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add First Container
              </button>
            </div>
          ) : (
            containers.map((container, index) => {
              const calculated = getCalculatedValues(container);
              
              return (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow border p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-700">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Container #{index + 1}
                        </h3>
                        {container.containerCode && (
                          <p className="text-sm text-gray-500">
                            Code: {container.containerCode}
                          </p>
                        )}
                      </div>
                    </div>
                    {containers.length > 1 && (
                      <button
                        onClick={() => removeContainer(index)}
                        disabled={saving}
                        className="p-2 text-red-600 hover:bg-red-50 disabled:text-red-300 disabled:cursor-not-allowed rounded-lg transition-colors"
                        title="Remove container"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Basic Info */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Container Code *
                        </label>
                        <input
                          type="text"
                          value={container.containerCode}
                          onChange={(e) =>
                            handleContainerChange(index, "containerCode", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          placeholder="e.g., IMPAK-10"
                          disabled={saving}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          CTN (Cartons)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={container.ctn}
                          onChange={(e) =>
                            handleContainerChange(index, "ctn", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          disabled={saving}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Status
                        </label>
                        <select
                          value={container.status}
                          onChange={(e) =>
                            handleContainerChange(index, "status", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          disabled={saving}
                        >
                          <option value="Loaded">Loaded</option>
                          <option value="Insea">Insea</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Pending">Pending</option>
                        </select>
                      </div>
                    </div>

                    {/* Dates & Logistics */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Loading Date
                        </label>
                        <input
                          type="date"
                          value={container.loadingDate}
                          onChange={(e) =>
                            handleContainerChange(index, "loadingDate", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          disabled={saving}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          ETA
                        </label>
                        <input
                          type="date"
                          value={container.eta}
                          onChange={(e) =>
                            handleContainerChange(index, "eta", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          disabled={saving}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Shipping Line
                        </label>
                        <input
                          type="text"
                          value={container.shippingLine}
                          onChange={(e) =>
                            handleContainerChange(index, "shippingLine", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          placeholder="e.g., KMTC"
                          disabled={saving}
                        />
                      </div>
                    </div>

                    {/* Financial Inputs */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Dollar Amount ($) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={container.dollar}
                          onChange={(e) =>
                            handleContainerChange(index, "dollar", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          disabled={saving}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Dollar Rate (₹)
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={container.dollarRate}
                          onChange={(e) =>
                            handleContainerChange(index, "dollarRate", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          disabled={saving}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            DO Charge (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={container.doCharge}
                            onChange={(e) =>
                              handleContainerChange(index, "doCharge", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            disabled={saving}
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            CFS (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={container.cfs}
                            onChange={(e) =>
                              handleContainerChange(index, "cfs", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            disabled={saving}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Calculated Fields */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          INR Amount
                        </label>
                        <div className="px-3 py-2 border border-gray-200 rounded bg-gray-50 text-gray-900 font-medium">
                          ₹{formatNumber(calculated.inr)}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Duty (16.5%)
                        </label>
                        <div className="px-3 py-2 border border-gray-200 rounded bg-gray-50 text-gray-900">
                          ₹{formatNumber(calculated.duty)}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          GST (18%)
                        </label>
                        <div className="px-3 py-2 border border-gray-200 rounded bg-gray-50 text-gray-900">
                          ₹{formatNumber(calculated.gst)}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Final Amount
                        </label>
                        <div className="px-3 py-2 border border-gray-200 rounded bg-gray-50 text-gray-900 font-semibold">
                          ₹{formatNumber(calculated.finalAmount)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        BL No
                      </label>
                      <input
                        type="text"
                        value={container.bl}
                        onChange={(e) =>
                          handleContainerChange(index, "bl", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Bill of Lading"
                        disabled={saving}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Container No
                      </label>
                      <input
                        type="text"
                        value={container.containerNo}
                        onChange={(e) =>
                          handleContainerChange(index, "containerNo", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="e.g., KMTCNBO9160808"
                        disabled={saving}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        SIMS
                      </label>
                      <input
                        type="text"
                        value={container.sims}
                        onChange={(e) =>
                          handleContainerChange(index, "sims", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="SIMS status"
                        disabled={saving}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Validation Summary */}
        {containers.some((c) => !c.containerCode.trim() || c.dollar <= 0) && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Required Fields Missing:</span>
            </div>
            <ul className="mt-2 text-sm text-amber-700 list-disc list-inside space-y-1">
              {containers.map((container, index) => {
                const issues = [];
                if (!container.containerCode.trim()) {
                  issues.push(`Container ${index + 1}: Container code is required`);
                }
                if (container.dollar <= 0) {
                  issues.push(`Container ${index + 1}: Dollar amount must be greater than 0`);
                }
                return issues.length > 0 ? (
                  <li key={index}>{issues.join(", ")}</li>
                ) : null;
              })}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <button
              onClick={() => router.push("/dashboard/container-summary")}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportToCSV}
              disabled={exporting || containers.length === 0}
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
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 disabled:bg-blue-400 text-white rounded-lg hover:bg-blue-700 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEdit ? "Update Summary" : "Create Summary"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}