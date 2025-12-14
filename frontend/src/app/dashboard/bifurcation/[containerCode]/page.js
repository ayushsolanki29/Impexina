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
  Eye,
  Printer,
  FileText,
  FileImage,
  Calendar,
  Package,
  Scale,
  Box,
} from "lucide-react";
import * as XLSX from "xlsx";

// Sample data matching your Bifurcation format
const BIFURCATION_DATA = [
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
    status: "draft",
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
    status: "draft",
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
    status: "draft",
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
    status: "draft",
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
    status: "draft",
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
    status: "draft",
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
    status: "draft",
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
    status: "draft",
  },
];

export default function BifurcationPage() {
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
  const [showPreview, setShowPreview] = useState(false);
  const [containerStatus, setContainerStatus] = useState("draft");
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
  });

  // Load data
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const data = BIFURCATION_DATA;
      setItems(data);
      
      // Check if any item is completed to determine container status
      const hasCompleted = data.some(item => item.status === "completed");
      setContainerStatus(hasCompleted ? "completed" : "draft");
      
      setLoading(false);
    }, 500);
  }, []);

  // Filter items
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.mark?.toLowerCase().includes(query) ||
        item.product?.toLowerCase().includes(query) ||
        item.invNo?.toString().toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredItems.reduce(
      (acc, item) => ({
        totalCTN: acc.totalCTN + (item.ctn || 0),
        totalCBM: acc.totalCBM + (item.totalCBM || 0),
        totalWeight: acc.totalWeight + (item.totalWeight || 0),
        itemsWithDelivery: acc.itemsWithDelivery + (item.deliveryDate ? 1 : 0),
        itemsWithInvoice: acc.itemsWithInvoice + (item.invNo ? 1 : 0),
        completedItems: acc.completedItems + (item.status === "completed" ? 1 : 0),
      }),
      {
        totalCTN: 0,
        totalCBM: 0,
        totalWeight: 0,
        itemsWithDelivery: 0,
        itemsWithInvoice: 0,
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
      status: "draft",
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

  // Save container as complete
  const saveAsComplete = () => {
    if (window.confirm("Mark this container bifurcation as complete? This action cannot be undone.")) {
      const updatedItems = items.map(item => ({
        ...item,
        status: "completed"
      }));
      
      setItems(updatedItems);
      setContainerStatus("completed");
      toast.success("Container marked as complete!");
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
        STATUS: item.status === "completed" ? "COMPLETED" : "DRAFT",
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bifurcation");

    // Add summary sheet
    const summaryData = [
      { 
        "CONTAINER": containerCode,
        "TOTAL CTN": totals.totalCTN,
        "TOTAL CBM": totals.totalCBM.toFixed(3),
        "TOTAL WEIGHT": totals.totalWeight,
        "WITH DELIVERY": totals.itemsWithDelivery,
        "WITH INVOICE": totals.itemsWithInvoice,
        "COMPLETED ITEMS": totals.completedItems,
        "STATUS": containerStatus.toUpperCase(),
        "GENERATED DATE": new Date().toLocaleDateString()
      }
    ];
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

    XLSX.writeFile(
      workbook,
      `${containerCode}_bifurcation_${new Date().toISOString().split("T")[0]}.xlsx`
    );
    toast.success("Excel file downloaded");
  };

  const copyToClipboard = () => {
    const text = filteredItems.map(item => 
      `${item.code}\t${item.mark}\t${item.ctn}\t${item.product}\t${item.totalCBM}\t${item.totalWeight}\t${item.loadingDate}\t${item.deliveryDate}\t${item.invNo}\t${item.gst}`
    ).join('\n');
    
    navigator.clipboard.writeText(text);
    toast.success("Data copied to clipboard");
  };

  // Print preview
  const printPreview = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Bifurcation - ${containerCode}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .header h1 { margin: 0; color: #333; }
            .header .subtitle { color: #666; margin-top: 5px; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
            .summary-item { border: 1px solid #ddd; padding: 10px; border-radius: 4px; }
            .summary-item .label { font-size: 12px; color: #666; }
            .summary-item .value { font-size: 18px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .completed { background-color: #d4edda; }
            .draft { background-color: #fff3cd; }
            .status-badge { padding: 2px 8px; border-radius: 12px; font-size: 12px; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 10px; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>BIFURCATION REPORT</h1>
            <div class="subtitle">Container: ${containerCode} | Status: ${containerStatus.toUpperCase()}</div>
            <div class="subtitle">Generated on: ${new Date().toLocaleDateString()}</div>
          </div>
          
          <div class="summary">
            <div class="summary-item">
              <div class="label">Total CTN</div>
              <div class="value">${totals.totalCTN}</div>
            </div>
            <div class="summary-item">
              <div class="label">Total CBM</div>
              <div class="value">${totals.totalCBM.toFixed(3)}</div>
            </div>
            <div class="summary-item">
              <div class="label">Total Weight</div>
              <div class="value">${totals.totalWeight} kg</div>
            </div>
            <div class="summary-item">
              <div class="label">Entries</div>
              <div class="value">${filteredItems.length}</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>MARK</th>
                <th>CTN</th>
                <th>PRODUCT</th>
                <th>CBM</th>
                <th>WEIGHT</th>
                <th>DELIVERY DATE</th>
                <th>INV NO.</th>
                <th>GST</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              ${filteredItems.map(item => `
                <tr class="${item.status}">
                  <td>${item.mark}</td>
                  <td>${item.ctn}</td>
                  <td>${item.product || '-'}</td>
                  <td>${item.totalCBM ? item.totalCBM.toFixed(3) : '-'}</td>
                  <td>${item.totalWeight || '-'}</td>
                  <td>${item.deliveryDate || 'Pending'}</td>
                  <td>${item.invNo || '-'}</td>
                  <td>${item.gst || '-'}</td>
                  <td><span class="status-badge">${item.status.toUpperCase()}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Total Items: ${filteredItems.length} | With Delivery: ${totals.itemsWithDelivery} | With Invoice: ${totals.itemsWithInvoice}</p>
            <p>This is a ${containerStatus} bifurcation report for container ${containerCode}</p>
          </div>
          
          <div class="no-print" style="margin-top: 20px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Print Report</button>
            <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">Close</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Save as image
  const saveAsImage = async () => {
    toast.info("Image download feature would require html2canvas library");
    // For production, you would use html2canvas to capture the preview
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/dashboard/loading")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Containers
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Bifurcation - {containerCode}
              </h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                containerStatus === "completed" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-yellow-100 text-yellow-800"
              }`}>
                {containerStatus.toUpperCase()}
              </span>
            </div>
            <p className="text-gray-600 mt-1">
              Client-wise breakdown with delivery and invoice details
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </button>
         
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
            >
              <Plus className="w-4 h-4" />
              Add New
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
            <Check className="w-4 h-4" />
            Completed
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {totals.completedItems}
          </div>
          <div className="text-xs text-gray-500">of {filteredItems.length}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={saveAsComplete}
          disabled={containerStatus === "completed"}
          className={`flex items-center gap-2 px-4 py-2 rounded ${
            containerStatus === "completed"
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          <Save className="w-4 h-4" />
          {containerStatus === "completed" ? "Already Completed" : "Save as Complete"}
        </button>
        <button
          onClick={printPreview}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          <Printer className="w-4 h-4" />
          Print Preview
        </button>
  
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow border mb-6 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by mark, product, or invoice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Add New Item Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-lg border mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Add New Bifurcation Entry</h3>
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
                CTN *
              </label>
              <input
                type="number"
                value={newItem.ctn}
                onChange={(e) => setNewItem({...newItem, ctn: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="e.g., 42"
                required
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
              disabled={!newItem.mark || !newItem.ctn}
            >
              <Plus className="w-4 h-4" />
              Add Entry
            </button>
          </div>
        </div>
      )}

      {/* Bifurcation Table */}
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
                    {Array.from({ length: 11 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    No bifurcation data found
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
                          <select
                            value={editForm.status}
                            onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                            className="w-full p-1 border rounded text-sm"
                          >
                            <option value="draft">Draft</option>
                            <option value="completed">Completed</option>
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
                          {item.ctn}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {item.product || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {item.totalCBM ? item.totalCBM.toFixed(3) : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {item.totalWeight ? `${item.totalWeight} kg` : "-"}
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
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.status === "completed" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
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
                    {totals.totalCTN}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">-</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {totals.totalCBM.toFixed(3)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {totals.totalWeight} kg
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
                    {totals.completedItems} / {filteredItems.length}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">-</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">Bifurcation Preview</h3>
                <p className="text-sm text-gray-600">
                  Container: {containerCode} | Status: <span className="font-medium">{containerStatus.toUpperCase()}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={printPreview}
                  className="flex items-center gap-2 px-3 py-2 border rounded hover:bg-gray-50"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button
                  onClick={exportToExcel}
                  className="flex items-center gap-2 px-3 py-2 border rounded hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-auto p-4">
              <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-6 border-b pb-4">
                  <h2 className="text-2xl font-bold text-gray-900">BIFURCATION REPORT</h2>
                  <p className="text-gray-600 mt-1">Container: {containerCode}</p>
                  <p className="text-gray-500 text-sm">Generated on: {new Date().toLocaleDateString()}</p>
                  <div className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                    containerStatus === "completed" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    STATUS: {containerStatus.toUpperCase()}
                  </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="text-sm text-gray-600">Total CTN</div>
                    <div className="text-xl font-bold text-gray-900">{totals.totalCTN}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="text-sm text-gray-600">Total CBM</div>
                    <div className="text-xl font-bold text-gray-900">{totals.totalCBM.toFixed(3)}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="text-sm text-gray-600">Total Weight</div>
                    <div className="text-xl font-bold text-gray-900">{totals.totalWeight} kg</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="text-sm text-gray-600">Total Entries</div>
                    <div className="text-xl font-bold text-gray-900">{filteredItems.length}</div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium">MARK</th>
                        <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium">CTN</th>
                        <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium">PRODUCT</th>
                        <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium">CBM</th>
                        <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium">WEIGHT</th>
                        <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium">DELIVERY DATE</th>
                        <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium">INV NO.</th>
                        <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium">GST</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item, idx) => (
                        <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="border border-gray-300 px-4 py-2 text-sm">{item.mark}</td>
                          <td className="border border-gray-300 px-4 py-2 text-sm text-right">{item.ctn}</td>
                          <td className="border border-gray-300 px-4 py-2 text-sm">{item.product || "-"}</td>
                          <td className="border border-gray-300 px-4 py-2 text-sm text-right">{item.totalCBM ? item.totalCBM.toFixed(3) : "-"}</td>
                          <td className="border border-gray-300 px-4 py-2 text-sm text-right">{item.totalWeight ? `${item.totalWeight} kg` : "-"}</td>
                          <td className="border border-gray-300 px-4 py-2 text-sm">{item.deliveryDate || "Pending"}</td>
                          <td className="border border-gray-300 px-4 py-2 text-sm">{item.invNo || "-"}</td>
                          <td className="border border-gray-300 px-4 py-2 text-sm">{item.gst || "-"}</td>
                        </tr>
                      ))}
                      {/* Totals Row */}
                      <tr className="bg-gray-100 font-bold">
                        <td className="border border-gray-300 px-4 py-2">TOTAL</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">{totals.totalCTN}</td>
                        <td className="border border-gray-300 px-4 py-2">-</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">{totals.totalCBM.toFixed(3)}</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">{totals.totalWeight} kg</td>
                        <td className="border border-gray-300 px-4 py-2">{totals.itemsWithDelivery} delivered</td>
                        <td className="border border-gray-300 px-4 py-2">{totals.itemsWithInvoice} invoiced</td>
                        <td className="border border-gray-300 px-4 py-2">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Footer Notes */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">Notes:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Container Code: {containerCode}</li>
                    <li>• Loading Date: {items[0]?.loadingDate || "09-10-25"}</li>
                    <li>• Total Entries: {filteredItems.length}</li>
                    <li>• Status: {containerStatus.toUpperCase()}</li>
                    {containerStatus === "draft" && (
                      <li className="font-medium">• This is a DRAFT bifurcation report</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Preview generated on {new Date().toLocaleString()}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={saveAsComplete}
                  disabled={containerStatus === "completed"}
                  className={`px-4 py-2 rounded ${
                    containerStatus === "completed"
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {containerStatus === "completed" ? "Already Completed" : "Save as Complete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-600">
          Container: {containerCode} • Total Entries: {filteredItems.length}
          • Status: <span className="font-medium">{containerStatus.toUpperCase()}</span>
        </div>
        <div className="text-sm text-gray-600">
          Last Updated: {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}