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
} from "lucide-react";

const CONTAINER_SUMMARY_KEY = "igpl_container_summary_v1";

// Function to generate unique ID
const generateUniqueId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `summary-${timestamp}-${random}`;
};

// Default empty container template
const EMPTY_CONTAINER = {
  no: 1,
  containerCode: "",
  ctn: 0,
  loadingDate: "",
  eta: "",
  dollar: 0,
  dollarRate: 89.7,
  inr: 0,
  duty: 0,
  total: 0,
  gst: 0,
  totalDuty: 0,
  doCharge: 58000,
  cfs: 21830,
  finalAmount: 0,
  shippingLine: "",
  bl: "",
  containerNo: "",
  sims: "",
  status: "Loaded"
};

export default function ContainerSummaryEditor() {
  const router = useRouter();
  const params = useParams();
  const isEdit = params.id && params.id !== "new";
  
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: "",
    month: "",
    status: "draft",
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
    containers: [],
    totals: {
      totalContainers: 0,
      totalCTN: 0,
      totalDollar: 0,
      totalINR: 0,
      totalFinalAmount: 0
    }
  });
  
  const [containers, setContainers] = useState([]);

  // Load data for edit mode
  useEffect(() => {
    setLoading(true);
    
    if (isEdit) {
      const summaries = JSON.parse(localStorage.getItem(CONTAINER_SUMMARY_KEY) || "[]");
      const summary = summaries.find(s => s.id === params.id);
      
      if (summary) {
        setFormData(summary);
        setContainers(summary.containers || []);
      } else {
        toast.error("Summary not found");
        router.push("/dashboard/container-summary");
      }
    } else {
      // New summary - set default month
      const now = new Date();
      const month = now.toLocaleString('default', { month: 'long' });
      const year = now.getFullYear();
      const id = generateUniqueId(); // Use unique ID generator
      
      setFormData(prev => ({
        ...prev,
        id,
        month: `${month} ${year}`
      }));
      setContainers([{ ...EMPTY_CONTAINER, no: 1 }]);
    }
    
    setLoading(false);
  }, [isEdit, params.id, router]);

  // Calculate totals when containers change
  useEffect(() => {
    const totals = containers.reduce((acc, container) => ({
      totalContainers: containers.length,
      totalCTN: acc.totalCTN + (Number(container.ctn) || 0),
      totalDollar: acc.totalDollar + (Number(container.dollar) || 0),
      totalINR: acc.totalINR + (Number(container.inr) || 0),
      totalFinalAmount: acc.totalFinalAmount + (Number(container.finalAmount) || 0)
    }), {
      totalContainers: 0,
      totalCTN: 0,
      totalDollar: 0,
      totalINR: 0,
      totalFinalAmount: 0
    });
    
    setFormData(prev => ({
      ...prev,
      totals,
      containers
    }));
  }, [containers]);

  // Handle container calculations
  const calculateContainerFields = (container) => {
    const ctn = Number(container.ctn) || 0;
    const dollar = Number(container.dollar) || 0;
    const dollarRate = Number(container.dollarRate) || 89.7;
    
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
    const doCharge = Number(container.doCharge) || 58000;
    const cfs = Number(container.cfs) || 21830;
    const finalAmount = totalDuty + doCharge + cfs;
    
    return {
      ...container,
      inr: parseFloat(inr.toFixed(2)),
      duty: parseFloat(duty.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      gst: parseFloat(gst.toFixed(2)),
      totalDuty: parseFloat(totalDuty.toFixed(2)),
      finalAmount: parseFloat(finalAmount.toFixed(2))
    };
  };

  // Handle container field change
// In ContainerSummaryEditor.jsx, update handleContainerChange:
const handleContainerChange = (index, field, value) => {
  const newContainers = [...containers];
  
  // Convert numeric fields to numbers
  let processedValue = value;
  if (['dollar', 'dollarRate', 'ctn', 'doCharge', 'cfs'].includes(field)) {
    processedValue = value === '' ? 0 : parseFloat(value) || 0;
  }
  
  newContainers[index] = {
    ...newContainers[index],
    [field]: processedValue
  };
  
  // Recalculate if needed
  if (['dollar', 'dollarRate', 'ctn', 'doCharge', 'cfs'].includes(field)) {
    newContainers[index] = calculateContainerFields(newContainers[index]);
  }
  
  setContainers(newContainers);
};

  // Add new container
  const addContainer = () => {
    const newContainer = {
      ...EMPTY_CONTAINER,
      no: containers.length + 1
    };
    setContainers([...containers, newContainer]);
  };

  // Remove container
  const removeContainer = (index) => {
    if (containers.length <= 1) {
      toast.error("At least one container is required");
      return;
    }
    
    const newContainers = containers.filter((_, i) => i !== index);
    // Re-number containers
    const renumbered = newContainers.map((container, idx) => ({
      ...container,
      no: idx + 1
    }));
    setContainers(renumbered);
  };

  // Save summary
  const handleSave = () => {
    if (!formData.month.trim()) {
      toast.error("Month name is required");
      return;
    }
    
    if (containers.length === 0) {
      toast.error("At least one container is required");
      return;
    }
    
    const summaries = JSON.parse(localStorage.getItem(CONTAINER_SUMMARY_KEY) || "[]");
    const updatedSummary = {
      ...formData,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    
    let updatedSummaries;
    if (isEdit) {
      updatedSummaries = summaries.map(s => 
        s.id === params.id ? updatedSummary : s
      );
    } else {
      // Check for duplicate month names
      const existingMonth = summaries.find(s => s.month === updatedSummary.month);
      if (existingMonth && !confirm(`A summary for "${updatedSummary.month}" already exists. Do you want to create another one?`)) {
        return;
      }
      
      updatedSummaries = [updatedSummary, ...summaries];
    }
    
    localStorage.setItem(CONTAINER_SUMMARY_KEY, JSON.stringify(updatedSummaries));
    toast.success(`Month summary ${isEdit ? 'updated' : 'created'} successfully`);
    router.push("/dashboard/container-summary");
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "NO", "CONTAINER CODE", "CTN", "LOADING DATE", "ETA", "DOLLAR", "DOLLAR RATE", "INR",
      "DUTY 16.5%", "TOTAL", "GST 18%", "TOTAL DUTY", "DO CHARGE", "CFS", "FINAL AMOUNT",
      "SHIPPING LINE", "BL", "CONTAINER NO.", "SIMS", "STATUS"
    ];
    
    const rows = containers.map(container => [
      container.no,
      `"${container.containerCode}"`,
      container.ctn,
      container.loadingDate,
      container.eta,
      container.dollar,
      container.dollarRate,
      container.inr.toFixed(2),
      container.duty.toFixed(2),
      container.total.toFixed(2),
      container.gst.toFixed(2),
      container.totalDuty.toFixed(2),
      container.doCharge,
      container.cfs,
      container.finalAmount.toFixed(2),
      `"${container.shippingLine}"`,
      `"${container.bl}"`,
      `"${container.containerNo}"`,
      `"${container.sims}"`,
      container.status
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `container_summary_${formData.month.replace(/\s+/g, "_")}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-600">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6">
      <Toaster position="top-right" />

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
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                {isEdit ? "Update Summary" : "Create Summary"}
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
              <input
                type="text"
                value={formData.month}
                onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="e.g., November 2025"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Updated Date
              </label>
              <input
                type="date"
                value={formData.updatedAt}
                onChange={(e) => setFormData(prev => ({ ...prev, updatedAt: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
          
          <div className="mt-4 text-xs text-gray-500">
            ID: {formData.id}
          </div>
        </div>

        {/* Containers Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold text-gray-900">
            Containers ({containers.length})
          </div>
          <button
            onClick={addContainer}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Container
          </button>
        </div>

        {/* Container List */}
        <div className="space-y-4 mb-6">
          {containers.map((container, index) => (
            <div key={`container-${container.no}-${index}`} className="bg-white rounded-lg shadow border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-700">
                      {container.no}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900">Container #{container.no}</h3>
                </div>
                {containers.length > 1 && (
                  <button
                    onClick={() => removeContainer(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                    <label className="block text-sm text-gray-600 mb-1">Container Code</label>
                    <input
                      type="text"
                      value={container.containerCode}
                      onChange={(e) => handleContainerChange(index, 'containerCode', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="e.g., IMPAK-10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">CTN</label>
                    <input
                      type="number"
                      value={container.ctn}
                      onChange={(e) => handleContainerChange(index, 'ctn', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Status</label>
                    <select
                      value={container.status}
                      onChange={(e) => handleContainerChange(index, 'status', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="Loaded">Loaded</option>
                      <option value="Insea">Insea</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>
                </div>

                {/* Dates */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Loading Date</label>
                    <input
                      type="date"
                      value={container.loadingDate}
                      onChange={(e) => handleContainerChange(index, 'loadingDate', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">ETA</label>
                    <input
                      type="date"
                      value={container.eta}
                      onChange={(e) => handleContainerChange(index, 'eta', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Shipping Line</label>
                    <input
                      type="text"
                      value={container.shippingLine}
                      onChange={(e) => handleContainerChange(index, 'shippingLine', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="e.g., KMTC"
                    />
                  </div>
                </div>

                {/* Financial Inputs */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Dollar Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={container.dollar}
                      onChange={(e) => handleContainerChange(index, 'dollar', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Dollar Rate</label>
                    <input
                      type="number"
                      step="0.01"
                      value={container.dollarRate}
                      onChange={(e) => handleContainerChange(index, 'dollarRate', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">DO Charge</label>
                    <input
                      type="number"
                      value={container.doCharge}
                      onChange={(e) => handleContainerChange(index, 'doCharge', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                {/* Calculated Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">INR</label>
                    <div className="px-3 py-2 border rounded bg-gray-50 text-gray-900 font-medium">
                      {container.inr.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Total Duty</label>
                    <div className="px-3 py-2 border rounded bg-gray-50 text-gray-900 font-medium">
                      {container.totalDuty.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Final Amount</label>
                    <div className="px-3 py-2 border rounded bg-gray-50 text-gray-900 font-semibold">
                      {container.finalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">BL No</label>
                  <input
                    type="text"
                    value={container.bl}
                    onChange={(e) => handleContainerChange(index, 'bl', e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Bill of Lading"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Container No</label>
                  <input
                    type="text"
                    value={container.containerNo}
                    onChange={(e) => handleContainerChange(index, 'containerNo', e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="e.g., KMTCNBO9160808"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">SIMS</label>
                  <input
                    type="text"
                    value={container.sims}
                    onChange={(e) => handleContainerChange(index, 'sims', e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="SIMS status"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Totals */}
        <div className="bg-white rounded-lg shadow border p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Month Totals</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600">Total Containers</div>
              <div className="text-xl font-bold text-gray-900">
                {formData.totals.totalContainers}
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600">Total CTN</div>
              <div className="text-xl font-bold text-gray-900">
                {formData.totals.totalCTN}
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600">Total Dollar</div>
              <div className="text-xl font-bold text-gray-900">
                ${formData.totals.totalDollar.toFixed(2)}
              </div>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="text-sm text-gray-600">Final Amount</div>
              <div className="text-xl font-bold text-gray-900">
                ₹{formData.totals.totalFinalAmount.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between gap-4">
          <button
            onClick={() => router.push("/dashboard/container-summary")}
            className="px-6 py-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
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
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              {isEdit ? "Update Summary" : "Create Summary"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}