"use client";
import React, { useState, useMemo } from "react";
import {
  X,
  Plus,
  Trash2,
  Ship,
  Calendar,
  CreditCard,
  Scale,
  MapPin,
  PackageOpen,
  ArrowLeft,
  UploadCloud,
  FileText,
  Info,
  CheckCircle,
  AlertCircle
} from "lucide-react";

// --- INITIAL DATA STRUCTURES ---
const initialItem = {
  id: Date.now(),
  itemName: "",
  itemNo: "",
  mark: "",
  ctn: 0,
  pcs: 0,
  cbm: 0,
  weight: 0,
};

const initialFormState = {
  shippingCode: "",
  shippingMark: "",
  supplier: "",
  loadingDate: new Date().toISOString().substring(0, 10),
  arrivalDate: "",
  items: [{ ...initialItem }],
};

// --- MAIN COMPONENT: AddLoadingSheet ---
export default function AddLoadingSheet() {
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemIdCounter, setItemIdCounter] = useState(Date.now());
  const [activeItemTab, setActiveItemTab] = useState('manual');
  const [csvFile, setCsvFile] = useState(null);
  const [showTips, setShowTips] = useState(true);

  // Calculate totals
  const totals = useMemo(() => {
    return formData.items.reduce(
      (acc, item) => {
        acc.totalCBM += parseFloat(item.cbm || 0);
        acc.totalWeight += parseFloat(item.weight || 0);
        acc.totalCartons += parseFloat(item.ctn || 0);
        return acc;
      },
      { totalCBM: 0, totalWeight: 0, totalCartons: 0 }
    );
  }, [formData.items]);

  // Form validation
  const formErrors = useMemo(() => {
    const errors = [];
    if (!formData.shippingCode) errors.push("Shipping Code is required");
    if (!formData.supplier) errors.push("Supplier is required");
    if (formData.items.some(item => !item.itemName)) {
      errors.push("All items must have a name");
    }
    return errors;
  }, [formData]);

  // --- HANDLERS ---
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (itemId, fieldName, value) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              [fieldName]: 
                ['itemName', 'itemNo', 'mark'].includes(fieldName) ? value : parseFloat(value) || 0,
            }
          : item
      ),
    }));
  };

  const handleAddItem = () => {
    const newId = itemIdCounter + 1;
    setItemIdCounter(newId);
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { ...initialItem, id: newId }],
    }));
  };

  const handleRemoveItem = (itemId) => {
    if (formData.items.length === 1) return; 
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }));
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      // In real implementation, parse CSV and populate items
      alert(`CSV file "${file.name}" selected. Processing...`);
    } else {
      alert('Please upload a valid CSV file.');
      setCsvFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formErrors.length > 0) {
      alert("Please fix the errors before submitting:\n" + formErrors.join("\n"));
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    console.log("Submitting Loading Sheet:", {
      ...formData,
      calculatedTotals: totals,
    });

    setIsSubmitting(false);
    setFormData(initialFormState);
    setCsvFile(null);
    alert('Loading Sheet Created Successfully!');
  };

  // --- UI COMPONENTS ---
  const TextInput = ({ label, name, type = "text", value, placeholder, required = false, icon: Icon, info, onChange }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 block">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {info && (
          <div className="group relative">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
              {info}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        )}
      </div>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange || handleFieldChange}
          placeholder={placeholder}
          required={required}
          className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            Icon ? 'pl-10' : ''
          } ${value ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}
        />
      </div>
    </div>
  );

  const ItemInput = ({ item, onChange, isLast }) => (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-all">
      {/* Item Name */}
      <div className="md:col-span-3">
        <TextInput 
          label="Item Name" 
          value={item.itemName} 
          onChange={(e) => onChange(item.id, 'itemName', e.target.value)}
          placeholder="e.g., Folding Chairs"
          required
          info="Product description as it appears on invoice"
        />
      </div>
      
      {/* Item Number */}
      <div className="md:col-span-2">
        <TextInput 
          label="Item Number" 
          value={item.itemNo} 
          onChange={(e) => onChange(item.id, 'itemNo', e.target.value)}
          placeholder="SKU or Product ID"
          info="Internal product identifier"
        />
      </div>

      {/* Mark */}
      <div className="md:col-span-2">
        <TextInput 
          label="Shipping Mark" 
          value={item.mark} 
          onChange={(e) => onChange(item.id, 'mark', e.target.value)}
          placeholder="e.g., BB-AMD"
          info="Markings on shipping containers"
        />
      </div>
      
      {/* Quantities */}
      {[
        { field: 'ctn', label: 'Cartons', placeholder: '0' },
        { field: 'pcs', label: 'Pieces', placeholder: '0' },
        { field: 'cbm', label: 'CBM', placeholder: '0.00' },
        { field: 'weight', label: 'Weight (kg)', placeholder: '0.00' }
      ].map(({ field, label, placeholder }) => (
        <div key={field} className="md:col-span-1 space-y-2">
          <label className="text-xs font-medium text-gray-500 block uppercase tracking-wide">
            {label}
          </label>
          <input
            type="number"
            step={['cbm', 'weight'].includes(field) ? '0.01' : '1'}
            value={item[field]}
            onChange={(e) => onChange(item.id, field, e.target.value)}
            min="0"
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 transition-all"
          />
        </div>
      ))}

      {/* Action Button */}
      <div className="md:col-span-1 flex justify-center">
        <button
          type="button"
          onClick={() => handleRemoveItem(item.id)}
          disabled={isLast}
          className={`p-2 rounded-lg transition-all ${
            isLast 
              ? 'text-gray-300 bg-gray-100 cursor-not-allowed' 
              : 'text-red-600 bg-red-50 hover:bg-red-100 hover:scale-105'
          }`}
          title={isLast ? "At least one item required" : "Remove this item"}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const CSVUploadSection = () => (
    <div className="p-6 bg-white rounded-lg border border-gray-200 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Bulk Upload Items</h3>
          <p className="text-sm text-gray-600">Upload CSV file with multiple items at once</p>
        </div>
        <button
          type="button"
          onClick={() => alert("Downloading CSV template...")}
          className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span className="text-sm font-medium">Download Template</span>
        </button>
      </div>
      
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleCSVUpload} 
          className="hidden" 
          id="csv-upload"
        />
        <label htmlFor="csv-upload" className="cursor-pointer block">
          <UploadCloud className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-700 mb-2">
            {csvFile ? `Ready to process: ${csvFile.name}` : "Upload your CSV file"}
          </p>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Drag and drop your CSV file here, or click to browse. 
            Supports up to 10,000 items per file.
          </p>
        </label>
        {csvFile && (
          <button
            type="button"
            onClick={() => setCsvFile(null)}
            className="mt-4 text-sm text-red-600 hover:text-red-700 flex items-center justify-center gap-1 mx-auto"
          >
            <X className="w-4 h-4" />
            Remove File
          </button>
        )}
      </div>
    </div>
  );

  const ManualEntrySection = () => (
    <div className="p-6 bg-white rounded-lg border border-gray-200 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Manual Item Entry</h3>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {formData.items.length} item{formData.items.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {formData.items.map((item, index) => (
          <ItemInput
            key={item.id}
            item={item}
            onChange={handleItemChange}
            isLast={formData.items.length === 1}
          />
        ))}
      </div>
      
      <button
        type="button"
        onClick={handleAddItem}
        className="w-full py-4 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl flex items-center justify-center gap-3 hover:bg-blue-50 hover:border-blue-400 transition-all"
      >
        <Plus className="w-5 h-5" />
        <span className="font-semibold">Add Another Item</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50/30">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Sheets</span>
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">Create Loading Sheet</h1>
              <p className="text-gray-600 mt-1">Add new shipment details and item information</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Tips */}
        {showTips && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Quick Tips</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Fill in required fields marked with *</li>
                    <li>• Add at least one item with complete details</li>
                    <li>• Use bulk CSV upload for multiple items</li>
                    <li>• Totals are calculated automatically</li>
                  </ul>
                </div>
              </div>
              <button
                onClick={() => setShowTips(false)}
                className="text-blue-400 hover:text-blue-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Shipment Details */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">1</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Shipment Information</h2>
                <p className="text-gray-600">Basic details about this shipment</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <TextInput 
                  label="Shipping Code" 
                  name="shippingCode" 
                  value={formData.shippingCode}
                  icon={Ship}
                  placeholder="e.g., PSDH-91"
                  required
                  info="Unique identifier for this shipment"
                />
                <TextInput 
                  label="Shipping Mark" 
                  name="shippingMark" 
                  value={formData.shippingMark}
                  icon={MapPin}
                  placeholder="e.g., SMWGC20"
                  required
                  info="Markings on shipping containers"
                />
              </div>
              
              <div className="space-y-6">
                <TextInput 
                  label="Supplier Name" 
                  name="supplier" 
                  value={formData.supplier}
                  placeholder="e.g., YIWU ZHOULAI TRADING"
                  required
                  info="Company or individual supplying goods"
                />
                <div className="grid grid-cols-2 gap-4">
                  <TextInput 
                    label="Loading Date" 
                    name="loadingDate" 
                    type="date" 
                    value={formData.loadingDate}
                    icon={Calendar}
                    required
                  />
                  <TextInput 
                    label="Arrival Date" 
                    name="arrivalDate" 
                    type="date" 
                    value={formData.arrivalDate}
                    icon={Calendar}
                    info="Expected arrival date at destination"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Items */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Item Details</h2>
                  <p className="text-gray-600">Add products included in this shipment</p>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => setActiveItemTab('manual')}
                  className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-colors ${
                    activeItemTab === 'manual'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Manual Entry
                </button>
                <button
                  type="button"
                  onClick={() => setActiveItemTab('csv')}
                  className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-colors ${
                    activeItemTab === 'csv'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <UploadCloud className="w-4 h-4" />
                  Bulk CSV Upload
                </button>
              </div>
            </div>

            {activeItemTab === 'manual' && <ManualEntrySection />}
            {activeItemTab === 'csv' && <CSVUploadSection />}
          </section>

          {/* Summary & Submit */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-bold text-sm">3</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Summary & Submit</h2>
                <p className="text-gray-600">Review totals and create loading sheet</p>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center gap-3">
                  <PackageOpen className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Total Items</p>
                    <p className="text-2xl font-bold text-blue-900">{formData.items.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-green-700 font-medium">Total CBM</p>
                    <p className="text-2xl font-bold text-green-900">{totals.totalCBM.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                <div className="flex items-center gap-3">
                  <Scale className="w-8 h-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-orange-700 font-medium">Total Weight</p>
                    <p className="text-2xl font-bold text-orange-900">{totals.totalWeight.toFixed(2)} kg</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center gap-3">
                  <PackageOpen className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-purple-700 font-medium">Total Cartons</p>
                    <p className="text-2xl font-bold text-purple-900">{totals.totalCartons}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Validation & Submit */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3">
                {formErrors.length === 0 ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">All required fields are complete</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">{formErrors.length} issue{formErrors.length !== 1 ? 's' : ''} to fix</span>
                  </div>
                )}
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting || formErrors.length > 0}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Sheet...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Create Loading Sheet
                  </>
                )}
              </button>
            </div>
          </section>
        </form>
      </main>
    </div>
  );
}