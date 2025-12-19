"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Toaster, toast } from "sonner";
import {
  Search,
  ChevronLeft,
  Download,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  FileSpreadsheet,
  Copy,
  Check,
  Calendar,
  Package,
  Scale,
  Box,
  Truck,
  Filter,
} from "lucide-react";
import * as XLSX from "xlsx";

// Warehouse plan data matching your structure
const WAREHOUSE_PLAN_DATA = [
  {
    id: 1,
    code: "PSDH-86",
    mark: "BB-AMD",
    ctn: 42,
    product: "MIX ITEM",
    totalCBM: 4.585,
    totalWeight: 414,
    loadingDate: "09-10-25",
    deliveryDate: "",
    invNo: "",
    gst: "",
    transporter: "SAMEER ROADLINE",
    status: "pending",
  },
  {
    id: 2,
    code: "PSDH-86",
    mark: "SMWGC18,SMWINK,SMWRB163",
    ctn: 94,
    product: "MIX ITEM",
    totalCBM: 5.35,
    totalWeight: 1719,
    loadingDate: "09-10-25",
    deliveryDate: "",
    invNo: "",
    gst: "",
    transporter: "SAMEER ROADLINE",
    status: "pending",
  },
  {
    id: 3,
    code: "PSDH-86",
    mark: "SMW-INK",
    ctn: 120,
    product: "MIX ITEM",
    totalCBM: 6.5,
    totalWeight: 2481,
    loadingDate: "09-10-25",
    deliveryDate: "",
    invNo: "",
    gst: "",
    transporter: "",
    status: "pending",
  },
  {
    id: 4,
    code: "PSDH-86",
    mark: "RMSZ-M",
    ctn: 97,
    product: "MIX ITEM",
    totalCBM: 11.94,
    totalWeight: 2131,
    loadingDate: "09-10-25",
    deliveryDate: "",
    invNo: "",
    gst: "",
    transporter: "",
    status: "pending",
  },
  {
    id: 5,
    code: "PSDH-86",
    mark: "EXPRESS",
    ctn: 1,
    product: "TOOTHBRUSH HOLDER",
    totalCBM: null,
    totalWeight: null,
    loadingDate: "09-10-25",
    deliveryDate: "",
    invNo: "",
    gst: "",
    transporter: "HOLD",
    status: "draft",
  },
  {
    id: 6,
    code: "PSDH-86",
    mark: "JB-210-211-212-213",
    ctn: 37,
    product: "GOLDEN TAPE,STORAGE BAG",
    totalCBM: 3.491,
    totalWeight: 787,
    loadingDate: "09-10-25",
    deliveryDate: "",
    invNo: "",
    gst: "",
    transporter: "GUJRAT TRANSPORT",
    status: "pending",
  },
  {
    id: 7,
    code: "PSDH-86",
    mark: "BST-AD",
    ctn: 70,
    product: "STACKING STAND,STORAGE BAG",
    totalCBM: 8.023,
    totalWeight: 570,
    loadingDate: "09-10-25",
    deliveryDate: "",
    invNo: "",
    gst: "",
    transporter: "SAMEER ROADLINE",
    status: "pending",
  },
  {
    id: 8,
    code: "PSDH-86",
    mark: "KD",
    ctn: 171,
    product: "STORAGE BOX,YOGA BLOCK",
    totalCBM: 26.21,
    totalWeight: 3726,
    loadingDate: "09-10-25",
    deliveryDate: "01-11-25",
    invNo: "968",
    gst: "16663",
    transporter: "SAMEER ROADLINE",
    status: "completed",
  },
  {
    id: 9,
    code: "PSDH-86",
    mark: "SH-18-SH-19",
    ctn: 5,
    product: "BAG",
    totalCBM: 0.696,
    totalWeight: 99,
    loadingDate: "09-10-25",
    deliveryDate: "",
    invNo: "",
    gst: "",
    transporter: "GUJRAT TRANSPORT",
    status: "pending",
  },
  {
    id: 10,
    code: "PSDH-86",
    mark: "LE",
    ctn: 6,
    product: "PUMP",
    totalCBM: 1.056,
    totalWeight: 57,
    loadingDate: "09-10-25",
    deliveryDate: "",
    invNo: "",
    gst: "",
    transporter: "VRL LOGISTICS",
    status: "pending",
  },
];

export default function WarehousePlanPage() {
  const router = useRouter();
  const params = useParams();
  const containerCode = params?.containerCode || "PSDH-86";

  // State
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [transporterFilter, setTransporterFilter] = useState("all");
  const [newItem, setNewItem] = useState({
    mark: "",
    ctn: "",
    product: "",
    totalCBM: "",
    totalWeight: "",
    loadingDate: "09-10-25",
    deliveryDate: "",
    invNo: "",
    gst: "",
    transporter: "",
    status: "pending",
  });

  // Load data
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const data = WAREHOUSE_PLAN_DATA;
      setItems(data);
      setLoading(false);
    }, 500);
  }, []);

  // Get unique transporters for filter
  const uniqueTransporters = useMemo(() => {
    const transporters = [...new Set(items.map(item => item.transporter).filter(Boolean))];
    return transporters.sort();
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    let result = items;
    
    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(item => item.status === statusFilter);
    }
    
    // Transporter filter
    if (transporterFilter !== "all") {
      result = result.filter(item => item.transporter === transporterFilter);
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.mark?.toLowerCase().includes(query) ||
          item.product?.toLowerCase().includes(query) ||
          item.transporter?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [items, searchQuery, statusFilter, transporterFilter]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredItems.reduce(
      (acc, item) => ({
        totalCTN: acc.totalCTN + (item.ctn || 0),
        totalCBM: acc.totalCBM + (item.totalCBM || 0),
        totalWeight: acc.totalWeight + (item.totalWeight || 0),
        itemsWithDelivery: acc.itemsWithDelivery + (item.deliveryDate ? 1 : 0),
        itemsWithInvoice: acc.itemsWithInvoice + (item.invNo ? 1 : 0),
        itemsWithTransporter: acc.itemsWithTransporter + (item.transporter ? 1 : 0),
        completedItems: acc.completedItems + (item.status === "completed" ? 1 : 0),
      }),
      {
        totalCTN: 0,
        totalCBM: 0,
        totalWeight: 0,
        itemsWithDelivery: 0,
        itemsWithInvoice: 0,
        itemsWithTransporter: 0,
        completedItems: 0,
      }
    );
  }, [filteredItems]);

  // Handle edit
  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const saveEdit = () => {
    setItems(items.map(item => 
      item.id === editingId ? { ...editForm } : item
    ));
    setEditingId(null);
    toast.success("Item updated successfully");
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  // Handle add new item
  const handleAddItem = () => {
    if (!newItem.mark) {
      toast.error("Mark is required");
      return;
    }

    const newId = Math.max(...items.map(item => item.id)) + 1;
    const itemToAdd = {
      id: newId,
      code: containerCode,
      mark: newItem.mark,
      ctn: parseFloat(newItem.ctn) || 0,
      product: newItem.product,
      totalCBM: parseFloat(newItem.totalCBM) || 0,
      totalWeight: parseFloat(newItem.totalWeight) || 0,
      loadingDate: newItem.loadingDate,
      deliveryDate: newItem.deliveryDate,
      invNo: newItem.invNo,
      gst: newItem.gst,
      transporter: newItem.transporter,
      status: newItem.status,
    };
    
    setItems([...items, itemToAdd]);
    setNewItem({
      mark: "",
      ctn: "",
      product: "",
      totalCBM: "",
      totalWeight: "",
      loadingDate: "09-10-25",
      deliveryDate: "",
      invNo: "",
      gst: "",
      transporter: "",
      status: "pending",
    });
    setShowAddForm(false);
    toast.success("Item added successfully");
  };

  // Handle delete
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      setItems(items.filter(item => item.id !== id));
      toast.success("Item deleted successfully");
    }
  };

  // Export functions
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredItems.map((item) => ({
        "CONTAINER CODE": item.code,
        MARK: item.mark,
        CTN: item.ctn,
        PRODUCT: item.product,
        "TOTAL CBM": item.totalCBM,
        "TOTAL WEIGHT": item.totalWeight,
        "LOADING DATE": item.loadingDate,
        "DELIVERY DATE": item.deliveryDate,
        "INV NO.": item.invNo,
        GST: item.gst,
        TRANSPORTER: item.transporter,
        STATUS: item.status === "completed" ? "COMPLETED" : "PENDING",
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Warehouse Plan");

    // Add summary sheet
    const summaryData = [
      { 
        "CONTAINER": containerCode,
        "TOTAL CTN": totals.totalCTN,
        "TOTAL CBM": totals.totalCBM.toFixed(3),
        "TOTAL WEIGHT": totals.totalWeight,
        "WITH DELIVERY": totals.itemsWithDelivery,
        "WITH INVOICE": totals.itemsWithInvoice,
        "WITH TRANSPORTER": totals.itemsWithTransporter,
        "COMPLETED ITEMS": totals.completedItems,
        "TOTAL ITEMS": filteredItems.length,
        "GENERATED DATE": new Date().toLocaleDateString()
      }
    ];
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

    XLSX.writeFile(
      workbook,
      `${containerCode}_warehouse_plan_${new Date().toISOString().split("T")[0]}.xlsx`
    );
    toast.success("Excel file downloaded");
  };

  const copyToClipboard = () => {
    const text = filteredItems.map(item => 
      `${item.code}\t${item.mark}\t${item.ctn}\t${item.product}\t${item.totalCBM}\t${item.totalWeight}\t${item.loadingDate}\t${item.deliveryDate}\t${item.invNo}\t${item.gst}\t${item.transporter}`
    ).join('\n');
    
    navigator.clipboard.writeText(text);
    toast.success("Data copied to clipboard");
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTransporterFilter("all");
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "draft":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format number
  const formatNumber = (num) => {
    if (!num && num !== 0) return "-";
    return Number(num).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/dashboard/warehouse")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Warehouse
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Warehouse Plan - {containerCode}
            </h1>
            <p className="text-gray-600 mt-1">
              Container-wise warehouse planning and tracking
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </button>
       
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              <Plus className="w-4 h-4" />
              Add Entry
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <Package className="w-4 h-4" />
            Total CTN
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {totals.totalCTN}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <Box className="w-4 h-4" />
            Total CBM
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {totals.totalCBM.toFixed(3)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <Scale className="w-4 h-4" />
            Total Weight
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {totals.totalWeight} kg
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <Truck className="w-4 h-4" />
            Transporters
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {totals.itemsWithTransporter}
          </div>
          <div className="text-xs text-gray-500">of {filteredItems.length}</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow border mb-6">
        <div className="p-4 border-b">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by mark, product, or transporter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Clear Filters */}
            {(searchQuery || statusFilter !== "all" || transporterFilter !== "all") && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-2 text-sm rounded ${
                    statusFilter === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter("completed")}
                  className={`px-3 py-2 text-sm rounded ${
                    statusFilter === "completed"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                 Dispatch
                </button>
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={`px-3 py-2 text-sm rounded ${
                    statusFilter === "pending"
                      ? "bg-yellow-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  Hold
                </button>
                <button
                  onClick={() => setStatusFilter("draft")}
                  className={`px-3 py-2 text-sm rounded ${
                    statusFilter === "draft"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  Draft
                </button>
              </div>
            </div>

            {/* Transporter Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transporter
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={transporterFilter}
                  onChange={(e) => setTransporterFilter(e.target.value)}
                  className="flex-1 p-2 border rounded"
                >
                  <option value="all">All Transporters</option>
                  {uniqueTransporters.map((transporter) => (
                    <option key={transporter} value={transporter}>
                      {transporter}
                    </option>
                  ))}
                </select>
                <Filter className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          Showing <span className="font-semibold">{filteredItems.length}</span>{" "}
          of <span className="font-semibold">{items.length}</span> entries
        </div>
        <div className="text-sm text-gray-600">
          {statusFilter !== "all" && `Status: ${statusFilter} `}
          {transporterFilter !== "all" && `| Transporter: ${transporterFilter}`}
        </div>
      </div>

      {/* Add New Item Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-lg border mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Add New Warehouse Entry</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mark *
              </label>
              <input
                type="text"
                value={newItem.mark}
                onChange={(e) => setNewItem({...newItem, mark: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="e.g., BB-AMD"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CTN
              </label>
              <input
                type="number"
                value={newItem.ctn}
                onChange={(e) => setNewItem({...newItem, ctn: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="e.g., 42"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product
              </label>
              <input
                type="text"
                value={newItem.product}
                onChange={(e) => setNewItem({...newItem, product: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="e.g., MIX ITEM"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total CBM
              </label>
              <input
                type="number"
                step="0.001"
                value={newItem.totalCBM}
                onChange={(e) => setNewItem({...newItem, totalCBM: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="e.g., 4.585"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Weight (kg)
              </label>
              <input
                type="number"
                value={newItem.totalWeight}
                onChange={(e) => setNewItem({...newItem, totalWeight: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="e.g., 414"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loading Date
              </label>
              <input
                type="text"
                value={newItem.loadingDate}
                onChange={(e) => setNewItem({...newItem, loadingDate: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="e.g., 09-10-25"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Date
              </label>
              <input
                type="text"
                value={newItem.deliveryDate}
                onChange={(e) => setNewItem({...newItem, deliveryDate: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="e.g., 01-11-25"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice No.
              </label>
              <input
                type="text"
                value={newItem.invNo}
                onChange={(e) => setNewItem({...newItem, invNo: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="e.g., 968"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GST
              </label>
              <input
                type="text"
                value={newItem.gst}
                onChange={(e) => setNewItem({...newItem, gst: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="e.g., 16663"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transporter
              </label>
              <input
                type="text"
                value={newItem.transporter}
                onChange={(e) => setNewItem({...newItem, transporter: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="e.g., SAMEER ROADLINE"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={newItem.status}
                onChange={(e) => setNewItem({...newItem, status: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddItem}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
              disabled={!newItem.mark}
            >
              <Plus className="w-4 h-4" />
              Add Entry
            </button>
          </div>
        </div>
      )}

      {/* Warehouse Plan Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  MARK
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  CTN
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  PRODUCT
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  TOTAL CBM
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  TOTAL WEIGHT
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  LOADING DATE
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  DELIVERY DATE
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  INV NO.
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  GST
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  TRANSPORTER
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                // Skeleton Loaders
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 12 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                    No warehouse plan data found
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className={`hover:bg-gray-50 ${item.status === "completed" ? "bg-green-50" : ""}`}>
                    {editingId === item.id ? (
                      // Edit mode
                      <>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editForm.mark}
                            onChange={(e) => setEditForm({...editForm, mark: e.target.value})}
                            className="w-full p-1 border rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={editForm.ctn}
                            onChange={(e) => setEditForm({...editForm, ctn: e.target.value})}
                            className="w-full p-1 border rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editForm.product}
                            onChange={(e) => setEditForm({...editForm, product: e.target.value})}
                            className="w-full p-1 border rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            step="0.001"
                            value={editForm.totalCBM}
                            onChange={(e) => setEditForm({...editForm, totalCBM: e.target.value})}
                            className="w-full p-1 border rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={editForm.totalWeight}
                            onChange={(e) => setEditForm({...editForm, totalWeight: e.target.value})}
                            className="w-full p-1 border rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editForm.loadingDate}
                            onChange={(e) => setEditForm({...editForm, loadingDate: e.target.value})}
                            className="w-full p-1 border rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editForm.deliveryDate}
                            onChange={(e) => setEditForm({...editForm, deliveryDate: e.target.value})}
                            className="w-full p-1 border rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editForm.invNo}
                            onChange={(e) => setEditForm({...editForm, invNo: e.target.value})}
                            className="w-full p-1 border rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editForm.gst}
                            onChange={(e) => setEditForm({...editForm, gst: e.target.value})}
                            className="w-full p-1 border rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editForm.transporter}
                            onChange={(e) => setEditForm({...editForm, transporter: e.target.value})}
                            className="w-full p-1 border rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={editForm.status}
                            onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                            className="w-full p-1 border rounded text-sm"
                          >
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="draft">Draft</option>
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={saveEdit}
                              className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                              title="Save"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      // View mode
                      <>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.mark}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {formatNumber(item.ctn)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {item.product || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {item.totalCBM ? item.totalCBM.toFixed(3) : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {item.totalWeight ? `${formatNumber(item.totalWeight)} kg` : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {item.loadingDate}
                        </td>
                        <td className="px-4 py-3">
                          <div className={`text-sm ${item.deliveryDate ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'} px-2 py-1 rounded text-center`}>
                            {item.deliveryDate || "Pending"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`text-sm ${item.invNo ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-500'} px-2 py-1 rounded text-center`}>
                            {item.invNo || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {item.gst || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">
                              {item.transporter || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                            {item.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(item)}
                              className="p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}

              {/* Totals Row */}
              {!loading && filteredItems.length > 0 && (
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    TOTAL ({filteredItems.length} entries)
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {formatNumber(totals.totalCTN)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">-</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {totals.totalCBM.toFixed(3)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {formatNumber(totals.totalWeight)} kg
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">-</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {totals.itemsWithDelivery} / {filteredItems.length}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {totals.itemsWithInvoice} / {filteredItems.length}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">-</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {totals.itemsWithTransporter} / {filteredItems.length}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {totals.completedItems} / {filteredItems.length}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">-</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-600">
          Container: {containerCode} • Total Entries: {filteredItems.length}
        </div>
        <div className="text-sm text-gray-600">
          Last Updated: {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}