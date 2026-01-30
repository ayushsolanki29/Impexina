"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Loader2,
  Eye,
  Edit2,
  Download,
  Calendar,
  Package,
  DollarSign,
  Ship,
  FileText,
  MapPin,
  Receipt,
  Truck,
  RefreshCw,
  X,
  Check,
  User,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import API from "@/lib/api";

// Helper function to safely convert date string to YYYY-MM-DD format
const formatDateForInput = (dateValue) => {
  if (!dateValue) return '';
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }
  if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
    return dateValue.toISOString().split('T')[0];
  }
  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  }
  return '';
};

const formatNumber = (num) => {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num || 0);
};

export default function ContainerSummaryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [containers, setContainers] = useState([]);
  const [formData, setFormData] = useState({ month: "", status: "DRAFT" });
  const [fieldErrors, setFieldErrors] = useState({}); // { "containers.0.containerNo": "must be a string", ... }
  const [validationErrors, setValidationErrors] = useState([]); // Array of error messages

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/container-summaries/${id}`);
      if (res.data.success) {
        setSummary(res.data.data);
        setFormData({
          month: res.data.data.month,
          status: res.data.data.status,
        });
        const transformed = (res.data.data.containers || []).map(c => ({
          ...c,
          loadingDate: formatDateForInput(c.loadingDate),
          eta: formatDateForInput(c.eta),
          invoiceDate: formatDateForInput(c.invoiceDate),
          deliveryDate: formatDateForInput(c.deliveryDate),
          containerNo: c.containerNo != null ? String(c.containerNo) : (c.containerNoField != null ? String(c.containerNoField) : ""),
        }));
        setContainers(transformed);
      }
    } catch (error) {
      toast.error("Failed to load summary");
    } finally {
      setLoading(false);
    }
  };

  const calculateContainerFields = (container) => {
    const dollar = Number(container.dollar) || 0;
    const dollarRate = Number(container.dollarRate) || 89.7;
    const doCharge = Number(container.doCharge) || 58000;
    const cfs = Number(container.cfs) || 21830;
    const inr = dollar * dollarRate;
    const duty = inr * 0.165;
    const total = inr + duty;
    const gst = total * 0.18;
    const totalDuty = duty + gst;
    const finalAmount = totalDuty + doCharge + cfs;
    return { inr, duty, total, gst, totalDuty, finalAmount };
  };

  const handleContainerChange = (index, field, value) => {
    setContainers(prev => prev.map((c, i) => 
      i === index ? { ...c, [field]: value } : c
    ));
    // Clear error for this field when user starts typing
    const errorKey = `containers.${index}.${field}`;
    if (fieldErrors[errorKey]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  // Helper function to get error for a specific field
  const getFieldError = (containerIndex, fieldName) => {
    const errorKey = `containers.${containerIndex}.${fieldName}`;
    return fieldErrors[errorKey];
  };

  // Helper function to check if a container has any errors
  const hasContainerErrors = (containerIndex) => {
    return Object.keys(fieldErrors).some(key => key.startsWith(`containers.${containerIndex}.`));
  };

  // Helper function to render input with error styling
  const renderInputWithError = (containerIndex, fieldName, inputProps, label) => {
    const error = getFieldError(containerIndex, fieldName);
    return (
      <div>
        <label className={`text-xs font-semibold text-slate-600 mb-1 block ${error ? 'text-red-600' : ''}`}>
          {label}
          {error && (
            <span className="text-red-600 ml-1 text-xs">({error})</span>
          )}
        </label>
        {isEditing ? (
          <>
            <input
              {...inputProps}
              className={`w-full p-2 bg-slate-50 border rounded-lg focus:bg-white focus:ring-2 outline-none text-sm ${
                error 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-slate-200 focus:ring-blue-500'
              }`}
            />
            {error && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error}
              </p>
            )}
          </>
        ) : (
          <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900">
            {inputProps.value || "-"}
          </div>
        )}
      </div>
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setFieldErrors({});
    setValidationErrors([]);
    
    try {
      const payload = {
        month: formData.month,
        status: formData.status,
        containers: containers.map((c, index) => ({
          containerCode: c.containerCode || "",
          ctn: Number(c.ctn) || 0,
          loadingDate: c.loadingDate || null,
          eta: c.eta || null,
          dollar: Number(c.dollar) || 0,
          dollarRate: Number(c.dollarRate) || 89.7,
          doCharge: Number(c.doCharge) || 58000,
          cfs: Number(c.cfs) || 21830,
          shippingLine: c.shippingLine || "",
          bl: c.bl || "",
          containerNo: c.containerNo != null ? String(c.containerNo) : "",
          containerNoField: c.containerNo != null ? String(c.containerNo) : "",
          sims: c.sims || "",
          status: c.status || "Loaded",
          invoiceNo: c.invoiceNo || "",
          invoiceDate: c.invoiceDate || null,
          location: c.location || "",
          deliveryDate: c.deliveryDate || null,
          shipper: c.shipper || "",
          workflowStatus: c.workflowStatus || "",
        })),
      };

      const res = await API.patch(`/container-summaries/${id}`, payload);
      if (res.data.success) {
        toast.success("Summary saved successfully!");
        setIsEditing(false);
        setFieldErrors({});
        setValidationErrors([]);
        fetchData();
      }
    } catch (error) {
      // Parse validation errors from response
      const errorData = error.response?.data;
      
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        // Map errors to field paths
        const errors = {};
        const errorMessages = [];
        
        errorData.errors.forEach((err) => {
          // Handle field paths like "containers.0.containerNo" or "containers[0].containerNo"
          let field = err.field || err.path || "";
          const message = err.message || err.msg || "Invalid value";
          
          // Normalize field path: containers[0].containerNo -> containers.0.containerNo
          field = field.replace(/\[(\d+)\]/g, '.$1');
          
          if (field) {
            errors[field] = message;
            // Extract readable field name for error message
            const fieldParts = field.split('.');
            const fieldName = fieldParts[fieldParts.length - 1];
            const containerIndex = fieldParts.length > 1 && fieldParts[1] !== undefined 
              ? `Container ${parseInt(fieldParts[1]) + 1}` 
              : '';
            errorMessages.push(`${containerIndex ? containerIndex + ' - ' : ''}${fieldName}: ${message}`);
          } else {
            errorMessages.push(message);
          }
        });
        
        setFieldErrors(errors);
        setValidationErrors(errorMessages);
        
        // Show detailed error toast
        toast.error(
          `Validation failed: ${errorMessages.slice(0, 3).join(", ")}${errorMessages.length > 3 ? ` and ${errorMessages.length - 3} more...` : ""}`,
          { duration: 5000 }
        );
      } else {
        // Generic error
        const errorMessage = errorData?.message || error.message || "Failed to save summary";
        toast.error(errorMessage);
        setValidationErrors([errorMessage]);
      }
    } finally {
      setSaving(false);
    }
  };

  const addContainer = () => {
    setContainers(prev => [...prev, {
      containerCode: "",
      ctn: 0,
      loadingDate: new Date().toISOString().split('T')[0],
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
      invoiceNo: "",
      invoiceDate: "",
      location: "",
      deliveryDate: "",
      shipper: "",
      workflowStatus: "",
    }]);
  };

  const removeContainer = (index) => {
    if (confirm("Remove this container?")) {
      setContainers(prev => prev.filter((_, i) => i !== index));
    }
  };

  const totals = containers.reduce((acc, c) => {
    const calc = calculateContainerFields(c);
    return {
      totalCTN: acc.totalCTN + (Number(c.ctn) || 0),
      totalDollar: acc.totalDollar + (Number(c.dollar) || 0),
      totalFinalAmount: acc.totalFinalAmount + calc.finalAmount,
    };
  }, { totalCTN: 0, totalDollar: 0, totalFinalAmount: 0 });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex-none px-6 py-4 border-b border-slate-200 bg-white rounded-t-xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <button
                onClick={() => router.push("/dashboard/container-summary")}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-900 shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0 flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.month}
                    onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                    className="text-xl font-bold text-slate-900 px-2 py-1 border-2 border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-full"
                    placeholder="Month name"
                  />
                ) : (
                  <h1 className="text-xl font-bold text-slate-900 truncate">
                    {summary?.month || "Container Summary"}
                  </h1>
                )}
                <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                  <span>{containers.length} Containers</span>
                  <span>•</span>
                  <span>{summary?.status || "DRAFT"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      fetchData();
                    }}
                    className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await API.download(`/container-summaries/${id}/export/csv`, {}, `${summary.month}_summary.csv`);
                        toast.success("CSV exported");
                      } catch (e) {
                        toast.error("Export failed");
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total CTN</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totals.totalCTN}</p>
            </div>
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Dollar</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">${formatNumber(totals.totalDollar)}</p>
            </div>
            <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Final Amount</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">₹{formatNumber(totals.totalFinalAmount)}</p>
            </div>
            <div className="h-10 w-10 bg-violet-100 rounded-full flex items-center justify-center text-violet-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Validation Errors Banner */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 mb-2">Validation Errors</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                  {validationErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => {
                  setValidationErrors([]);
                  setFieldErrors({});
                }}
                className="text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Containers List */}
        <div className="space-y-4">
          {containers.map((container, index) => {
            const calculated = calculateContainerFields(container);
            const containerHasErrors = hasContainerErrors(index);
            return (
              <div 
                key={index} 
                className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                  containerHasErrors ? 'border-red-300 border-2' : 'border-slate-200'
                }`}
              >
                {/* Container Header */}
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">
                          {container.containerCode || `Container #${index + 1}`}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            container.status === "Loaded" ? "bg-emerald-100 text-emerald-700" :
                            container.status === "Insea" ? "bg-sky-100 text-sky-700" :
                            "bg-violet-100 text-violet-700"
                          }`}>
                            {container.status || "Loaded"}
                          </span>
                          {container.workflowStatus && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                              {container.workflowStatus}
                            </span>
                          )}
                          {container.shipper && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                              {container.shipper}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => removeContainer(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Container Body */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase border-b pb-2 tracking-wider flex items-center gap-2">
                        <Package className="w-3 h-3" /> Basic Info
                      </h4>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">
                          Container Code *
                          {getFieldError(index, 'containerCode') && (
                            <span className="text-red-600 ml-1">({getFieldError(index, 'containerCode')})</span>
                          )}
                        </label>
                        {isEditing ? (
                          <>
                            <input
                              type="text"
                              value={container.containerCode}
                              onChange={(e) => handleContainerChange(index, 'containerCode', e.target.value)}
                              className={`w-full p-2 bg-slate-50 border rounded-lg focus:bg-white focus:ring-2 outline-none text-sm ${
                                getFieldError(index, 'containerCode') 
                                  ? 'border-red-300 focus:ring-red-500' 
                                  : 'border-slate-200 focus:ring-blue-500'
                              }`}
                              placeholder="e.g. IMPAK-10"
                            />
                            {getFieldError(index, 'containerCode') && (
                              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {getFieldError(index, 'containerCode')}
                              </p>
                            )}
                          </>
                        ) : (
                          <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900">
                            {container.containerCode || "-"}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">CTN</label>
                        {isEditing ? (
                          <input
                            type="number"
                            value={container.ctn}
                            onChange={(e) => handleContainerChange(index, 'ctn', e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          />
                        ) : (
                          <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900">
                            {container.ctn || 0}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Shipping Line</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={container.shippingLine}
                            onChange={(e) => handleContainerChange(index, 'shippingLine', e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            placeholder="e.g. KMTC"
                          />
                        ) : (
                          <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900">
                            {container.shippingLine || "-"}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className={`text-xs font-semibold mb-1 block ${
                          getFieldError(index, 'bl') ? 'text-red-600' : 'text-slate-600'
                        }`}>
                          BL No
                          {getFieldError(index, 'bl') && (
                            <span className="text-red-600 ml-1 text-xs">({getFieldError(index, 'bl')})</span>
                          )}
                        </label>
                        {isEditing ? (
                          <>
                            <input
                              type="text"
                              value={container.bl || ""}
                              onChange={(e) => handleContainerChange(index, 'bl', e.target.value)}
                              className={`w-full p-2 bg-slate-50 border rounded-lg focus:bg-white focus:ring-2 outline-none text-sm ${
                                getFieldError(index, 'bl') 
                                  ? 'border-red-300 focus:ring-red-500' 
                                  : 'border-slate-200 focus:ring-blue-500'
                              }`}
                              placeholder="Bill of Lading"
                            />
                            {getFieldError(index, 'bl') && (
                              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {getFieldError(index, 'bl')}
                              </p>
                            )}
                          </>
                        ) : (
                          <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900">
                            {container.bl || "-"}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className={`text-xs font-semibold mb-1 block ${
                          getFieldError(index, 'containerNo') ? 'text-red-600' : 'text-slate-600'
                        }`}>
                          Container No
                          {getFieldError(index, 'containerNo') && (
                            <span className="text-red-600 ml-1 text-xs">({getFieldError(index, 'containerNo')})</span>
                          )}
                        </label>
                        {isEditing ? (
                          <>
                            <input
                              type="text"
                              value={container.containerNo || ""}
                              onChange={(e) => handleContainerChange(index, 'containerNo', e.target.value)}
                              className={`w-full p-2 bg-slate-50 border rounded-lg focus:bg-white focus:ring-2 outline-none text-sm ${
                                getFieldError(index, 'containerNo') 
                                  ? 'border-red-300 focus:ring-red-500' 
                                  : 'border-slate-200 focus:ring-blue-500'
                              }`}
                              placeholder="Container Number"
                            />
                            {getFieldError(index, 'containerNo') && (
                              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {getFieldError(index, 'containerNo')}
                              </p>
                            )}
                          </>
                        ) : (
                          <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900">
                            {container.containerNo || "-"}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Dates & Location */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase border-b pb-2 tracking-wider flex items-center gap-2">
                        <Calendar className="w-3 h-3" /> Dates & Location
                      </h4>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Loading Date</label>
                        {isEditing ? (
                          <input
                            type="date"
                            value={container.loadingDate}
                            onChange={(e) => handleContainerChange(index, 'loadingDate', e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          />
                        ) : (
                          <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900">
                            {container.loadingDate || "-"}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">ETA</label>
                        {isEditing ? (
                          <input
                            type="date"
                            value={container.eta}
                            onChange={(e) => handleContainerChange(index, 'eta', e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          />
                        ) : (
                          <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900">
                            {container.eta || "-"}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Location / Port *
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={container.location}
                            onChange={(e) => handleContainerChange(index, 'location', e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            placeholder="e.g. Mundra"
                          />
                        ) : (
                          <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900">
                            {container.location || "-"}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block flex items-center gap-1">
                          <Receipt className="w-3 h-3" /> Invoice No *
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={container.invoiceNo}
                            onChange={(e) => handleContainerChange(index, 'invoiceNo', e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            placeholder="e.g. INV-001"
                          />
                        ) : (
                          <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900">
                            {container.invoiceNo || "-"}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Invoice Date *</label>
                        {isEditing ? (
                          <input
                            type="date"
                            value={container.invoiceDate}
                            onChange={(e) => handleContainerChange(index, 'invoiceDate', e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          />
                        ) : (
                          <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900">
                            {container.invoiceDate || "-"}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block flex items-center gap-1">
                          <Truck className="w-3 h-3" /> Delivery Date *
                        </label>
                        {isEditing ? (
                          <input
                            type="date"
                            value={container.deliveryDate}
                            onChange={(e) => handleContainerChange(index, 'deliveryDate', e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          />
                        ) : (
                          <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900">
                            {container.deliveryDate || "-"}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">SIMS *</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={container.sims}
                            onChange={(e) => handleContainerChange(index, 'sims', e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            placeholder="SIMS status"
                          />
                        ) : (
                          <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900">
                            {container.sims || "-"}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block flex items-center gap-1">
                          <User className="w-3 h-3" /> Shipper *
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={container.shipper}
                            onChange={(e) => handleContainerChange(index, 'shipper', e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            placeholder="Shipper name"
                          />
                        ) : (
                          <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900">
                            {container.shipper || "-"}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Status *
                        </label>
                        {isEditing ? (
                          <select
                            value={container.workflowStatus}
                            onChange={(e) => handleContainerChange(index, 'workflowStatus', e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          >
                            <option value="">Select Status</option>
                            <option value="WHATSAPP">WhatsApp</option>
                            <option value="MAIL">Mail</option>
                            <option value="SIMS">SIMS</option>
                            <option value="PIMS">PIMS</option>
                            <option value="CHECKLIST">Checklist</option>
                            <option value="LOADING SHEET">Loading Sheet</option>
                            <option value="BIFURCATION">Bifurcation</option>
                            <option value="PACKING LIST">Packing List</option>
                            <option value="INVOICE">Invoice</option>
                            <option value="BOE">BOE</option>
                            <option value="DUTY CALCULATOR">Duty Calculator</option>
                            <option value="PURCHASE SELL">Purchase Sell</option>
                            <option value="WAREHOUSE PLAN">Warehouse Plan</option>
                            <option value="ACCOUNT">Account</option>
                          </select>
                        ) : (
                          <div className={`w-full p-2 border rounded-lg text-sm font-medium ${
                            container.workflowStatus 
                              ? "bg-blue-50 border-blue-200 text-blue-900" 
                              : "bg-slate-50 border-slate-200 text-slate-900"
                          }`}>
                            {container.workflowStatus || "-"}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Financial Inputs */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase border-b pb-2 tracking-wider flex items-center gap-2">
                        <DollarSign className="w-3 h-3" /> Financials
                      </h4>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Dollar Amount ($)</label>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={container.dollar}
                            onChange={(e) => handleContainerChange(index, 'dollar', e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          />
                        ) : (
                          <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900">
                            ${formatNumber(container.dollar)}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Dollar Rate</label>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={container.dollarRate}
                            onChange={(e) => handleContainerChange(index, 'dollarRate', e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          />
                        ) : (
                          <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900">
                            {container.dollarRate || 89.7}
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-600 mb-1 block">DO Charge</label>
                          {isEditing ? (
                            <input
                              type="number"
                              value={container.doCharge}
                              onChange={(e) => handleContainerChange(index, 'doCharge', e.target.value)}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                          ) : (
                            <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900">
                              ₹{formatNumber(container.doCharge)}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 mb-1 block">CFS</label>
                          {isEditing ? (
                            <input
                              type="number"
                              value={container.cfs}
                              onChange={(e) => handleContainerChange(index, 'cfs', e.target.value)}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                          ) : (
                            <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900">
                              ₹{formatNumber(container.cfs)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Calculated Fields */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase border-b pb-2 tracking-wider flex items-center gap-2">
                        <FileText className="w-3 h-3" /> Calculated
                      </h4>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">INR Amount</label>
                        <div className="w-full p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-bold text-blue-900">
                          ₹{formatNumber(calculated.inr)}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Duty (16.5%)</label>
                        <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900">
                          ₹{formatNumber(calculated.duty)}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">GST (18%)</label>
                        <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900">
                          ₹{formatNumber(calculated.gst)}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Total Duty</label>
                        <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900">
                          ₹{formatNumber(calculated.totalDuty)}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Final Amount</label>
                        <div className="w-full p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-bold text-emerald-900">
                          ₹{formatNumber(calculated.finalAmount)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Container Button */}
        {isEditing && (
          <button
            onClick={addContainer}
            className="w-full py-5 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
          >
            <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform group-hover:bg-blue-100">
              <Plus className="w-6 h-6" />
            </div>
            <span className="font-semibold">Add Container</span>
          </button>
        )}
      </div>
    </div>
  );
}
