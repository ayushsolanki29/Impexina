"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import API from "@/lib/api";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Loader2,
  Info,
  Calendar,
  Package,
  Truck,
  DollarSign,
  Keyboard,
  User,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  Edit2,
  Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// Helper function to safely convert date string to YYYY-MM-DD format for date inputs
const formatDateForInput = (dateValue) => {
  if (!dateValue) return '';
  
  // If it's already in YYYY-MM-DD format, return as is
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }
  
  // If it's a Date object, convert to YYYY-MM-DD
  if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
    return dateValue.toISOString().split('T')[0];
  }
  
  // Try to parse various date string formats
  if (typeof dateValue === 'string') {
    // Try parsing DD-MM-YY format (e.g., "29-09-25")
    const ddmmyyMatch = dateValue.match(/^(\d{2})-(\d{2})-(\d{2})$/);
    if (ddmmyyMatch) {
      const [, day, month, year] = ddmmyyMatch;
      const fullYear = parseInt(year) < 50 ? `20${year}` : `19${year}`;
      const date = new Date(`${fullYear}-${month}-${day}`);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    // Try parsing as ISO string or other formats
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  }
  
  return '';
};

export default function OrderSheetEditor({ params }) {
  const router = useRouter();
  const [unwrappedParams, setUnwrappedParams] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Sheet Data
  const [sheet, setSheet] = useState(null);
  const [rows, setRows] = useState([]);
  const [supplierSuggestions, setSupplierSuggestions] = useState([]);
  const [showSupplierSuggestions, setShowSupplierSuggestions] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [expandedSuppliers, setExpandedSuppliers] = useState(new Set());
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [editingShippingMark, setEditingShippingMark] = useState(null);
  const [editingShippingMarkValue, setEditingShippingMarkValue] = useState("");
  const [supplierInputRefs, setSupplierInputRefs] = useState({});
  const [shippingMarkSuggestions, setShippingMarkSuggestions] = useState([]);

  // Handle Params
  useEffect(() => {
    if (params instanceof Promise) {
      params.then(p => setUnwrappedParams(p));
    } else {
      setUnwrappedParams(params);
    }
  }, [params]);

  const fetchSheet = useCallback(async (sheetId) => {
    setLoading(true);
    try {
      const res = await API.get(`/client-order-tracker/sheets/${sheetId}`);
      if (res.data.success) {
        setSheet(res.data.data);
        const fetchedRows = res.data.data.orders.map(o => ({ ...o, _key: o.id }));
        // If no rows, start with one empty row
        if (fetchedRows.length === 0) {
            setRows([createEmptyRow()]);
        } else {
            setRows(fetchedRows);
        }
        // Expand all suppliers by default
        const suppliers = [...new Set(fetchedRows.map(r => r.supplier).filter(Boolean))];
        setExpandedSuppliers(new Set(suppliers));
      }
    } catch (error) {
      toast.error("Failed to load sheet");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (unwrappedParams?.id) {
      fetchSheet(unwrappedParams.id);
    }
  }, [unwrappedParams, fetchSheet]);

  // Fetch supplier suggestions
  const fetchSupplierSuggestions = useCallback(async (search) => {
    if (!search || search.length < 2) {
      setSupplierSuggestions([]);
      return;
    }
    try {
      const res = await API.get(`/client-order-tracker/suppliers/suggestions`, {
        params: { search }
      });
      if (res.data.success) {
        setSupplierSuggestions(res.data.data || []);
        setShowSupplierSuggestions(true);
      }
    } catch (error) {
      console.error("Error fetching supplier suggestions:", error);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (supplierSearch) {
        fetchSupplierSuggestions(supplierSearch);
      } else {
        setSupplierSuggestions([]);
        setShowSupplierSuggestions(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [supplierSearch, fetchSupplierSuggestions]);

  const createEmptyRow = (supplier = "", shippingMark = "") => ({
      _key: `temp_${Date.now()}_${Math.random()}`,
      id: `temp_${Date.now()}`,
      shippingMark: shippingMark,
      supplier: supplier,
      product: "",
      quantity: 0,
      ctn: 0,
      totalAmount: 0,
      deposit: 0,
      balanceAmount: 0,
      shippingMode: "",
      shippingCode: "",
      lrNo: "",
      status: "PENDING",
      orderDate: "",
      paymentDate: "",
      deliveryDate: "",
      loadingDate: "",
      arrivalDate: "",
      isNew: true
  });

  // Group rows by supplier, then by shipping mark
  const groupedRows = useMemo(() => {
    const grouped = {};
    rows.forEach(row => {
      const supplier = row.supplier || "Unassigned";
      const mark = row.shippingMark || "No Mark";
      
      if (!grouped[supplier]) {
        grouped[supplier] = {};
      }
      if (!grouped[supplier][mark]) {
        grouped[supplier][mark] = [];
      }
      grouped[supplier][mark].push(row);
    });
    return grouped;
  }, [rows]);

  const handleChange = (rowKey, field, value) => {
    setRows(prev => prev.map(row => {
      if (row._key === rowKey) {
        let processedValue = value;
        if (['quantity', 'ctn', 'totalAmount', 'deposit'].includes(field)) {
          processedValue = (value === "" ? 0 : parseFloat(value) || 0);
        }
        const updated = { ...row, [field]: processedValue };
        
        // Auto calculate balance
        if (field === 'totalAmount' || field === 'deposit') {
          const total = parseFloat(updated.totalAmount || 0);
          const deposit = parseFloat(updated.deposit || 0);
          updated.balanceAmount = total - deposit;
        }
        return updated;
      }
      return row;
    }));
  };

  const handleAddProduct = (supplier, shippingMark) => {
    const newRow = createEmptyRow(supplier, shippingMark);
    setRows(prev => [...prev, newRow]);
    // Expand supplier if collapsed
    if (supplier && !expandedSuppliers.has(supplier)) {
      setExpandedSuppliers(prev => new Set([...prev, supplier]));
    }
    toast.success("Product added");
  };

  const handleAddShippingMark = (supplier) => {
    const newRow = createEmptyRow(supplier, "");
    setRows(prev => [...prev, newRow]);
    if (supplier && !expandedSuppliers.has(supplier)) {
      setExpandedSuppliers(prev => new Set([...prev, supplier]));
    }
    toast.success("Shipping mark added");
  };

  const handleDeleteRow = (rowKey) => {
    if (confirm("Are you sure you want to remove this product?")) {
      setRows(prev => prev.filter(r => r._key !== rowKey));
      toast.success("Product removed");
    }
  };

  const handleSupplierSelect = (supplierName, oldSupplier) => {
    // Update all rows with the old supplier name to the new one
    setRows(prev => prev.map(row => {
      if (row.supplier === oldSupplier) {
        return { ...row, supplier: supplierName };
      }
      return row;
    }));
    setSupplierSearch("");
    setShowSupplierSuggestions(false);
    setEditingSupplier(null);
    if (supplierName && !expandedSuppliers.has(supplierName)) {
      setExpandedSuppliers(prev => {
        const newSet = new Set(prev);
        newSet.delete(oldSupplier);
        newSet.add(supplierName);
        return newSet;
      });
    }
  };

  const handleSupplierInputChange = (oldSupplier, value) => {
    setSupplierSearch(value);
    // Update supplier for all rows in this group
    if (value && value !== oldSupplier) {
      setRows(prev => prev.map(row => {
        if (row.supplier === oldSupplier) {
          return { ...row, supplier: value };
        }
        return row;
      }));
    }
  };

  const handleShippingMarkChange = (oldMark, newMark, supplier) => {
    // Update shipping mark for all products with this mark under this supplier
    setRows(prev => prev.map(row => {
      if (row.supplier === supplier && row.shippingMark === oldMark) {
        return { ...row, shippingMark: newMark };
      }
      return row;
    }));
    setEditingShippingMark(null);
  };

  const fetchShippingMarkSuggestions = useCallback(async (search) => {
    if (!search || search.length < 2) {
      setShippingMarkSuggestions([]);
      return;
    }
    try {
      // Get unique shipping marks from existing rows
      const existingMarks = [...new Set(rows.map(r => r.shippingMark).filter(Boolean))];
      const filtered = existingMarks.filter(mark => 
        mark.toLowerCase().includes(search.toLowerCase())
      );
      setShippingMarkSuggestions(filtered.slice(0, 10).map(mark => ({ name: mark, id: mark })));
    } catch (error) {
      console.error("Error fetching shipping mark suggestions:", error);
    }
  }, [rows]);

  const toggleSupplier = (supplier) => {
    setExpandedSuppliers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(supplier)) {
        newSet.delete(supplier);
      } else {
        newSet.add(supplier);
      }
      return newSet;
    });
  };

  const handleSave = useCallback(async () => {
    if (!unwrappedParams?.id) return;
    
    // Validation
    const invalid = rows.find(r => !r.shippingMark || !r.product);
    if (invalid) {
        toast.error("All orders must have at least a Shipping Mark and Product Name.");
        return;
    }

    setSaving(true);
    try {
      const res = await API.post(`/client-order-tracker/sheets/${unwrappedParams.id}/orders`, {
        orders: rows
      });
      if (res.data.success) {
        toast.success("Sheet saved successfully! (Ctrl+S)");
        fetchSheet(unwrappedParams.id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save sheet");
    } finally {
      setSaving(false);
    }
  }, [unwrappedParams, rows, fetchSheet]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const firstSupplier = Object.keys(groupedRows)[0];
        if (firstSupplier) {
          handleAddProduct(firstSupplier, "");
        } else {
          setRows(prev => [...prev, createEmptyRow()]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, groupedRows]);

  if (loading || !unwrappedParams) return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
  );

  const totalValue = rows.reduce((s, r) => s + (parseFloat(r.totalAmount)||0), 0);
  const totalBalance = rows.reduce((s, r) => s + (parseFloat(r.balanceAmount)||0), 0);
  const supplierCount = Object.keys(groupedRows).length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 pb-32">
        <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Top Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-full h-10 w-10 bg-white border-slate-200">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">{sheet?.name}</h1>
                    <div className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
                        <Calendar className="w-4 h-4" />
                        <span>{sheet?.month || 'General Sheet'}</span>
                        <span className="text-slate-300">|</span>
                        <span>{rows.length} Products</span>
                        <span className="text-slate-300">|</span>
                        <span>{supplierCount} Suppliers</span>
                        {sheet?.client && (
                          <>
                            <span className="text-slate-300">|</span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs">
                              <User className="w-3 h-3" />
                              {sheet.client.name}
                            </span>
                          </>
                        )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 items-center">
                    <div className="hidden lg:flex items-center gap-3 text-xs text-slate-400 mr-2">
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono">Ctrl+S</kbd>
                        Save
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono">Ctrl+Enter</kbd>
                        Add Product
                      </span>
                    </div>
                    <Button onClick={handleSave} disabled={saving} size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-md">
                        {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                        Save Sheet
                    </Button>
                </div>
            </div>

            {/* Summary Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Value</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">${totalValue.toLocaleString()}</p>
                    </div>
                    <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                        <DollarSign className="w-5 h-5" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Outstanding Balance</p>
                        <p className="text-2xl font-bold text-red-600 mt-1">${totalBalance.toLocaleString()}</p>
                    </div>
                    <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                        <Info className="w-5 h-5" />
                    </div>
                </div>
                 <div className="bg-blue-600 p-6 rounded-2xl shadow-sm border border-blue-500 flex items-center justify-between text-white">
                    <div>
                        <p className="text-xs font-bold text-blue-200 uppercase tracking-wider">Suppliers</p>
                        <p className="text-2xl font-bold mt-1">{supplierCount}</p>
                    </div>
                    <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center text-white">
                        <Package className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Supplier Groups */}
            <div className="space-y-4">
              {Object.entries(groupedRows).map(([supplier, marks]) => {
                const isExpanded = expandedSuppliers.has(supplier);
                const supplierRows = Object.values(marks).flat();
                const supplierTotal = supplierRows.reduce((s, r) => s + (parseFloat(r.totalAmount)||0), 0);
                const supplierBalance = supplierRows.reduce((s, r) => s + (parseFloat(r.balanceAmount)||0), 0);
                
                return (
                  <div key={supplier} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Supplier Header */}
                    <div 
                      className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 p-4 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => toggleSupplier(supplier)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSupplier(supplier);
                            }}
                            className="p-1 hover:bg-slate-200 rounded"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-slate-600" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-slate-600" />
                            )}
                          </button>
                          <div className="relative flex-1 flex items-center gap-2">
                            {editingSupplier === supplier ? (
                              <div className="relative flex-1">
                                <input
                                  type="text"
                                  value={supplierSearch || supplier}
                                  onChange={(e) => handleSupplierInputChange(supplier, e.target.value)}
                                  onFocus={() => {
                                    setSupplierSearch(supplier);
                                    fetchSupplierSuggestions(supplier);
                                  }}
                                  onBlur={() => {
                                    setTimeout(() => {
                                      setShowSupplierSuggestions(false);
                                      setEditingSupplier(null);
                                    }, 200);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      if (supplierSearch && supplierSearch !== supplier) {
                                        handleSupplierSelect(supplierSearch, supplier);
                                      } else {
                                        setEditingSupplier(null);
                                      }
                                    }
                                    if (e.key === 'Escape') {
                                      setEditingSupplier(null);
                                      setSupplierSearch("");
                                    }
                                  }}
                                  className="text-lg font-bold text-slate-900 px-3 py-1.5 border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[200px]"
                                  autoFocus
                                />
                                {showSupplierSuggestions && supplierSuggestions.length > 0 && (
                                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {supplierSuggestions.map((suggestion, idx) => (
                                      <button
                                        key={idx}
                                        onClick={() => handleSupplierSelect(suggestion.name, supplier)}
                                        className="w-full px-4 py-2 text-left hover:bg-blue-50 border-b border-slate-100 last:border-0"
                                      >
                                        <div className="font-medium text-slate-900">{suggestion.name}</div>
                                      </button>
                                    ))}
                                    {supplierSearch && !supplierSuggestions.find(s => s.name.toLowerCase() === supplierSearch.toLowerCase()) && (
                                      <button
                                        onClick={() => handleSupplierSelect(supplierSearch, supplier)}
                                        className="w-full px-4 py-2 text-left hover:bg-emerald-50 border-t border-slate-200 bg-emerald-50/50"
                                      >
                                        <div className="font-medium text-emerald-700">Create "{supplierSearch}"</div>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSupplier(supplier);
                                    setSupplierSearch(supplier);
                                    fetchSupplierSuggestions(supplier);
                                  }}
                                  className="text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors flex items-center gap-2 group"
                                >
                                  <LinkIcon className={`w-4 h-4 ${selectedSupplier === supplier ? 'text-blue-600' : 'text-slate-400'} group-hover:text-blue-600`} />
                                  {supplier}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSupplier(supplier);
                                    setSupplierSearch(supplier);
                                    fetchSupplierSuggestions(supplier);
                                  }}
                                  className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                                  title="Edit Supplier"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-slate-500 hover:text-blue-600" />
                                </button>
                              </>
                            )}
                          </div>
                          <span className="text-sm text-slate-500">
                            ({Object.keys(marks).length} marks, {supplierRows.length} products)
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-xs text-slate-500">Total</div>
                            <div className="text-lg font-bold text-slate-900">${supplierTotal.toLocaleString()}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-slate-500">Balance</div>
                            <div className={`text-lg font-bold ${supplierBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                              ${supplierBalance.toLocaleString()}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddShippingMark(supplier);
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Mark
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Shipping Marks */}
                    {isExpanded && (
                      <div className="p-4 space-y-4">
                        {Object.entries(marks).map(([mark, products]) => {
                          const markTotal = products.reduce((s, r) => s + (parseFloat(r.totalAmount)||0), 0);
                          return (
                            <div key={mark} className="border border-slate-200 rounded-xl overflow-hidden">
                              {/* Shipping Mark Header */}
                              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <Package className="w-4 h-4 text-slate-500" />
                                  {editingShippingMark === `${supplier}-${mark}` ? (
                                    <div className="relative flex-1 max-w-xs">
                                      <input
                                        type="text"
                                        value={editingShippingMarkValue}
                                        onChange={(e) => setEditingShippingMarkValue(e.target.value)}
                                        onBlur={() => {
                                          if (editingShippingMarkValue && editingShippingMarkValue !== mark) {
                                            handleShippingMarkChange(mark, editingShippingMarkValue, supplier);
                                          }
                                          setTimeout(() => {
                                            setEditingShippingMark(null);
                                            setEditingShippingMarkValue("");
                                          }, 200);
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (editingShippingMarkValue && editingShippingMarkValue !== mark) {
                                              handleShippingMarkChange(mark, editingShippingMarkValue, supplier);
                                            }
                                            setEditingShippingMark(null);
                                            setEditingShippingMarkValue("");
                                          }
                                          if (e.key === 'Escape') {
                                            setEditingShippingMark(null);
                                            setEditingShippingMarkValue("");
                                          }
                                        }}
                                        className="font-semibold text-slate-700 px-2 py-1 border-2 border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[150px]"
                                        autoFocus
                                      />
                                    </div>
                                  ) : (
                                    <>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingShippingMark(`${supplier}-${mark}`);
                                          setEditingShippingMarkValue(mark);
                                        }}
                                        className="font-semibold text-slate-700 hover:text-blue-600 transition-colors group flex items-center gap-2"
                                      >
                                        {mark}
                                        <Pencil className="w-3 h-3 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                      </button>
                                    </>
                                  )}
                                  <span className="text-sm text-slate-500">({products.length} products)</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <div className="text-xs text-slate-500">Total</div>
                                    <div className="text-sm font-bold text-slate-900">${markTotal.toLocaleString()}</div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAddProduct(supplier, mark)}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add Product
                                  </Button>
                                </div>
                              </div>

                              {/* Products List */}
                              <div className="divide-y divide-slate-100">
                                {products.map((product, idx) => (
                                  <div key={product._key} className="p-4 hover:bg-slate-50/50 transition-colors">
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                                      {/* Product Name */}
                                      <div className="lg:col-span-3">
                                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Product *</label>
                                        <input 
                                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                          placeholder="Product name"
                                          value={product.product}
                                          onChange={e => handleChange(product._key, 'product', e.target.value)}
                                        />
                                      </div>

                                      {/* QTY & CTN */}
                                      <div className="lg:col-span-2">
                                        <label className="text-xs font-semibold text-slate-600 mb-1 block">QTY</label>
                                        <input 
                                          type="number"
                                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                          value={product.quantity}
                                          onChange={e => handleChange(product._key, 'quantity', e.target.value)}
                                        />
                                      </div>
                                      <div className="lg:col-span-2">
                                        <label className="text-xs font-semibold text-slate-600 mb-1 block">CTN</label>
                                        <input 
                                          type="number"
                                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                          value={product.ctn}
                                          onChange={e => handleChange(product._key, 'ctn', e.target.value)}
                                        />
                                      </div>

                                      {/* Financials */}
                                      <div className="lg:col-span-2">
                                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Total Amount</label>
                                        <input 
                                          type="number"
                                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
                                          value={product.totalAmount}
                                          onChange={e => handleChange(product._key, 'totalAmount', e.target.value)}
                                        />
                                      </div>
                                      <div className="lg:col-span-2">
                                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Deposit</label>
                                        <input 
                                          type="number"
                                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                          value={product.deposit}
                                          onChange={e => handleChange(product._key, 'deposit', e.target.value)}
                                        />
                                      </div>
                                      <div className="lg:col-span-1">
                                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Balance</label>
                                        <div className={`w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold ${product.balanceAmount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                          ${(product.balanceAmount||0).toLocaleString()}
                                        </div>
                                      </div>

                                      {/* Actions */}
                                      <div className="lg:col-span-1 flex items-end">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDeleteRow(product._key)}
                                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Additional Fields Row */}
                                    <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 mt-3 pt-3 border-t border-slate-100">
                                      <div>
                                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Shipping Code</label>
                                        <input 
                                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                                          placeholder="PSDE-83"
                                          value={product.shippingCode || ""}
                                          onChange={e => handleChange(product._key, 'shippingCode', e.target.value)}
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Status</label>
                                        <select 
                                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                                          value={product.status}
                                          onChange={e => handleChange(product._key, 'status', e.target.value)}
                                        >
                                          <option value="PENDING">Pending</option>
                                          <option value="LOADED">Loaded</option>
                                          <option value="IN_TRANSIT">In Transit</option>
                                          <option value="ARRIVED">Arrived</option>
                                          <option value="DELIVERED">Delivered</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Loading Date</label>
                                        <input 
                                          type="date"
                                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                                          value={formatDateForInput(product.loadingDate)}
                                          onChange={e => handleChange(product._key, 'loadingDate', e.target.value)}
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Arrival Date</label>
                                        <input 
                                          type="date"
                                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                                          value={formatDateForInput(product.arrivalDate)}
                                          onChange={e => handleChange(product._key, 'arrivalDate', e.target.value)}
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Payment Date</label>
                                        <input 
                                          type="date"
                                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                                          value={formatDateForInput(product.paymentDate)}
                                          onChange={e => handleChange(product._key, 'paymentDate', e.target.value)}
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs font-semibold text-slate-600 mb-1 block">LR No.</label>
                                        <input 
                                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                                          placeholder="LR-9988"
                                          value={product.lrNo || ""}
                                          onChange={e => handleChange(product._key, 'lrNo', e.target.value)}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add New Supplier Button */}
            <div className="relative">
              <button 
                onClick={() => {
                  const newRow = createEmptyRow();
                  setRows(prev => [...prev, newRow]);
                }}
                className="w-full py-5 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
              >
                <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform group-hover:bg-blue-100">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="font-semibold">Add New Supplier</span>
                <span className="text-xs text-slate-400 mt-1">or press <kbd className="px-1.5 py-0.5 bg-slate-200 rounded">Ctrl+Enter</kbd></span>
              </button>
            </div>

            {/* Floating Save Button (Mobile) */}
            <div className="fixed bottom-6 right-6 lg:hidden">
              <Button 
                onClick={handleSave} 
                disabled={saving} 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 shadow-xl rounded-full h-14 w-14 p-0"
              >
                {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
              </Button>
            </div>
        </div>
    </div>
  );
}
