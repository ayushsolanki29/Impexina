"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Save,
  Plus,
  Trash2,
  ChevronLeft,
  Calendar,
  Info,
  Loader2,
} from "lucide-react";
import API from "@/lib/api"; // Your axios helper

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

export default function CreateContainerSummary() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    month: "",
    status: "DRAFT",
  });

  const [containers, setContainers] = useState([{ ...EMPTY_CONTAINER }]);

  // --- Initialization ---
  useEffect(() => {
    if (!initialized) {
      // Set default month
      const now = new Date();
      const monthStr = now.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });

      setFormData((prev) => ({ ...prev, month: monthStr }));
      setInitialized(true);
    }
  }, [initialized]);

  // --- Calculations ---
  const calculateContainerFields = (container) => {
    const ctn = Number(container.ctn) || 0;
    const dollar = Number(container.dollar) || 0;
    const dollarRate = Number(container.dollarRate) || 89.7;

    // Financial Logic
    const inr = dollar * dollarRate;
    const duty = inr * 0.165; // 16.5% Duty
    const total = inr + duty;
    const gst = total * 0.18; // 18% GST
    const totalDuty = duty + gst;

    const doCharge = Number(container.doCharge) || 58000;
    const cfs = Number(container.cfs) || 21830;
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

  // --- Handlers ---
  const handleContainerChange = (index, field, value) => {
    const newContainers = [...containers];
    let processedValue = value;

    // Convert numbers
    if (["dollar", "dollarRate", "ctn", "doCharge", "cfs"].includes(field)) {
      processedValue = value === "" ? 0 : parseFloat(value) || 0;
    }

    newContainers[index] = {
      ...newContainers[index],
      [field]: processedValue,
    };

    setContainers(newContainers);
  };

  const addContainer = () => {
    setContainers([...containers, { ...EMPTY_CONTAINER }]);
    toast.success("New container added");
  };

  const removeContainer = (index) => {
    if (containers.length <= 1) {
      toast.error("At least one container is required");
      return;
    }

    const newContainers = containers.filter((_, i) => i !== index);
    setContainers(newContainers);
    toast.success("Container removed");
  };

  const handleSave = async () => {
    // Validation
    if (!formData.month.trim()) {
      toast.error("Month name is required");
      return;
    }

    if (containers.length === 0) {
      toast.error("Add at least one container");
      return;
    }

    // Validate containers
    for (let i = 0; i < containers.length; i++) {
      const container = containers[i];
      if (!container.containerCode.trim()) {
        toast.error(`Container ${i + 1}: Container code is required`);
        return;
      }
      if (container.dollar <= 0) {
        toast.error(`Container ${i + 1}: Dollar amount must be greater than 0`);
        return;
      }
    }

    setSaving(true);

    try {
      // Prepare data for API
      const summaryData = {
        month: formData.month,
        status: formData.status,
        containers: containers.map((container) => ({
          containerCode: container.containerCode,
          ctn: container.ctn || 0,
          loadingDate:
            container.loadingDate || new Date().toISOString().split("T")[0],
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

      // Call API
      const response = await API.post("/container-summaries", summaryData);

      if (response.data.success) {
        toast.success(response.message || "Summary created successfully!");

        // Navigate after a short delay
        setTimeout(() => {
          router.push("/dashboard/container-summary");
        }, 1500);
      } else {
        toast.error(response.message || "Failed to create summary");
      }
    } catch (error) {
      console.error("Error creating summary:", error);

      // Handle different types of errors
      if (error.response) {
        // Server responded with error
        const errorMsg =
          error.response.data?.message ||
          error.response.data?.error ||
          "Server error occurred";
        toast.error(errorMsg);
      } else if (error.request) {
        // No response received
        toast.error("No response from server. Please check your connection.");
      } else {
        // Request setup error
        toast.error("Failed to create summary. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  // Get calculated values for a specific container
  const getCalculatedValues = (container) => {
    return calculateContainerFields(container);
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Top Navigation */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-white hover:shadow-sm rounded-full transition-all text-slate-500"
                disabled={saving}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Create New Summary
                </h1>
                <p className="text-slate-500 text-sm">
                  Add containers and calculate duties for the month.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 md:px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-md transition-all"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Summary
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Month & Meta Data */}
        <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200 mb-6 md:mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Month Name *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={formData.month}
                  onChange={(e) =>
                    setFormData({ ...formData, month: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="e.g. December 2024"
                  disabled={saving}
                  required
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Format: Month Year (e.g., December 2024)
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                disabled={saving}
              >
                <option value="DRAFT">Draft (Work in Progress)</option>
                <option value="ACTIVE">Active (Finalized)</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 md:p-6 flex items-center justify-between border border-blue-100">
              <div>
                <div className="text-blue-600 text-xs font-bold uppercase">
                  Total Final Amount
                </div>
                <div className="text-xl md:text-2xl font-bold text-blue-900">
                  ₹{formatNumber(totals.totalFinalAmount)}
                </div>
                <div className="text-xs text-blue-500 mt-1">
                  {totals.totalContainers} container(s)
                </div>
              </div>
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <Info className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
            <div className="text-center">
              <div className="text-sm text-slate-600">Total CTN</div>
              <div className="text-lg font-bold text-slate-900">
                {totals.totalCTN}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-slate-600">Total Dollar</div>
              <div className="text-lg font-bold text-slate-900">
                ${formatNumber(totals.totalDollar)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-slate-600">Total INR</div>
              <div className="text-lg font-bold text-slate-900">
                ₹{formatNumber(totals.totalINR)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-slate-600">Total Duty</div>
              <div className="text-lg font-bold text-slate-900">
                ₹
                {formatNumber(totals.totalINR * 0.165 + totals.totalINR * 0.18)}
              </div>
            </div>
          </div>
        </div>

        {/* Container Cards Loop */}
        <div className="space-y-4 md:space-y-6">
          {containers.map((container, index) => {
            const calculated = getCalculatedValues(container);

            return (
              <div
                key={index}
                className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-200 overflow-hidden group"
              >
                {/* Card Header */}
                <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="bg-slate-900 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-700">
                        Container #{index + 1}
                      </span>
                      {container.containerCode && (
                        <span className="text-sm text-slate-500 ml-2">
                          ({container.containerCode})
                        </span>
                      )}
                    </div>
                  </div>
                  {containers.length > 1 && (
                    <button
                      onClick={() => removeContainer(index)}
                      disabled={saving}
                      className="text-slate-400 hover:text-red-500 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors p-2"
                      title="Remove container"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
                  {/* Identification */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2">
                      Identification
                    </h4>
                    <div>
                      <label className="text-xs font-medium text-slate-600">
                        Container Code *
                      </label>
                      <input
                        type="text"
                        value={container.containerCode}
                        onChange={(e) =>
                          handleContainerChange(
                            index,
                            "containerCode",
                            e.target.value
                          )
                        }
                        className="w-full mt-1 p-2 border border-slate-200 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="IMPAK-10"
                        disabled={saving}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600">
                        CTN (Cartons)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={container.ctn}
                        onChange={(e) =>
                          handleContainerChange(index, "ctn", e.target.value)
                        }
                        className="w-full mt-1 p-2 border border-slate-200 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        disabled={saving}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600">
                        Status
                      </label>
                      <select
                        value={container.status}
                        onChange={(e) =>
                          handleContainerChange(index, "status", e.target.value)
                        }
                        className="w-full mt-1 p-2 border border-slate-200 rounded-md text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        disabled={saving}
                      >
                        <option>Loaded</option>
                        <option>Insea</option>
                        <option>Delivered</option>
                        <option>Pending</option>
                      </select>
                    </div>
                  </div>

                  {/* Dates & Shipping */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2">
                      Logistics
                    </h4>
                    <div>
                      <label className="text-xs font-medium text-slate-600">
                        Loading Date
                      </label>
                      <input
                        type="date"
                        value={container.loadingDate}
                        onChange={(e) =>
                          handleContainerChange(
                            index,
                            "loadingDate",
                            e.target.value
                          )
                        }
                        className="w-full mt-1 p-2 border border-slate-200 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        disabled={saving}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600">
                        Shipping Line
                      </label>
                      <input
                        type="text"
                        value={container.shippingLine}
                        onChange={(e) =>
                          handleContainerChange(
                            index,
                            "shippingLine",
                            e.target.value
                          )
                        }
                        className="w-full mt-1 p-2 border border-slate-200 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="e.g. KMTC"
                        disabled={saving}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600">
                        Container No.
                      </label>
                      <input
                        type="text"
                        value={container.containerNo}
                        onChange={(e) =>
                          handleContainerChange(
                            index,
                            "containerNo",
                            e.target.value
                          )
                        }
                        className="w-full mt-1 p-2 border border-slate-200 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="ABCD1234567"
                        disabled={saving}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600">
                        ETA
                      </label>
                      <input
                        type="text"
                        value={container.eta}
                        onChange={(e) =>
                          handleContainerChange(index, "eta", e.target.value)
                        }
                        className="w-full mt-1 p-2 border border-slate-200 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="Approx. arrival date"
                        disabled={saving}
                      />
                    </div>
                  </div>

                  {/* Financial Inputs */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2">
                      Costs (Input)
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-600">
                          Dollar ($) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={container.dollar}
                          onChange={(e) =>
                            handleContainerChange(
                              index,
                              "dollar",
                              e.target.value
                            )
                          }
                          className="w-full mt-1 p-2 border border-slate-200 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          disabled={saving}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600">
                          Rate (₹)
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={container.dollarRate}
                          onChange={(e) =>
                            handleContainerChange(
                              index,
                              "dollarRate",
                              e.target.value
                            )
                          }
                          className="w-full mt-1 p-2 border border-slate-200 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          disabled={saving}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-600">
                          DO Charge (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={container.doCharge}
                          onChange={(e) =>
                            handleContainerChange(
                              index,
                              "doCharge",
                              e.target.value
                            )
                          }
                          className="w-full mt-1 p-2 border border-slate-200 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          disabled={saving}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600">
                          CFS (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={container.cfs}
                          onChange={(e) =>
                            handleContainerChange(index, "cfs", e.target.value)
                          }
                          className="w-full mt-1 p-2 border border-slate-200 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          disabled={saving}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-600">
                          BL No.
                        </label>
                        <input
                          type="text"
                          value={container.bl}
                          onChange={(e) =>
                            handleContainerChange(index, "bl", e.target.value)
                          }
                          className="w-full mt-1 p-2 border border-slate-200 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          disabled={saving}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600">
                          SIMS
                        </label>
                        <input
                          type="text"
                          value={container.sims}
                          onChange={(e) =>
                            handleContainerChange(index, "sims", e.target.value)
                          }
                          className="w-full mt-1 p-2 border border-slate-200 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Calculated Results */}
                  <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2">
                      Calculations
                    </h4>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">INR Value:</span>
                        <span className="font-semibold">
                          ₹{formatNumber(calculated.inr)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Duty (16.5%):</span>
                        <span className="font-semibold">
                          ₹{formatNumber(calculated.duty)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">GST (18%):</span>
                        <span className="font-semibold">
                          ₹{formatNumber(calculated.gst)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Total Duty:</span>
                        <span className="font-semibold">
                          ₹{formatNumber(calculated.totalDuty)}
                        </span>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-200 mt-2">
                      <div className="flex justify-between text-sm font-bold text-blue-700">
                        <span>Final Amount:</span>
                        <span>₹{formatNumber(calculated.finalAmount)}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        = Duty + GST + DO Charge + CFS
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Container Button */}
        <button
          onClick={addContainer}
          disabled={saving}
          className="w-full mt-6 py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-semibold hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add Another Container
        </button>

        {/* Validation Summary */}
        {containers.some((c) => !c.containerCode.trim() || c.dollar <= 0) && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2 text-amber-800">
              <Info className="w-5 h-5" />
              <span className="font-medium">Required Fields Missing:</span>
            </div>
            <ul className="mt-2 text-sm text-amber-700 list-disc list-inside space-y-1">
              {containers.map((container, index) => {
                const issues = [];
                if (!container.containerCode.trim()) {
                  issues.push(
                    `Container ${index + 1}: Container code is required`
                  );
                }
                if (container.dollar <= 0) {
                  issues.push(
                    `Container ${
                      index + 1
                    }: Dollar amount must be greater than 0`
                  );
                }
                return issues.length > 0 ? (
                  <li key={index}>{issues.join(", ")}</li>
                ) : null;
              })}
            </ul>
          </div>
        )}

        {/* Save Button (Fixed at bottom for mobile) */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg lg:hidden">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-md transition-all"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Summary
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
