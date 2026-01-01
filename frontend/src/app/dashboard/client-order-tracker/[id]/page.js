"use client";

import React, { useState, useEffect } from "react";
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
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function OrderSheetEditor({ params }) {
  const router = useRouter();
  const [unwrappedParams, setUnwrappedParams] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Sheet Data
  const [sheet, setSheet] = useState(null);
  const [rows, setRows] = useState([]);

  // Handle Params
  useEffect(() => {
    if (params instanceof Promise) {
      params.then(p => setUnwrappedParams(p));
    } else {
      setUnwrappedParams(params);
    }
  }, [params]);

  useEffect(() => {
    if (unwrappedParams?.id) {
      fetchSheet(unwrappedParams.id);
    }
  }, [unwrappedParams]);

  const fetchSheet = async (sheetId) => {
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
      }
    } catch (error) {
      toast.error("Failed to load sheet");
    } finally {
      setLoading(false);
    }
  };

  const createEmptyRow = () => ({
      _key: `temp_${Date.now()}_${Math.random()}`,
      id: `temp_${Date.now()}`,
      shippingMark: "",
      supplier: "",
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

  const handleAddRow = () => {
    setRows([...rows, createEmptyRow()]);
    toast.success("New order card added");
  };

  const handleChange = (index, field, value) => {
    const newRows = [...rows];
    let processedValue = value;

    if (['quantity', 'ctn', 'totalAmount', 'deposit'].includes(field)) {
        processedValue = (value === "" ? 0 : parseFloat(value) || 0);
    }

    newRows[index] = { ...newRows[index], [field]: processedValue };

    // Auto calculate balance
    if (field === 'totalAmount' || field === 'deposit') {
        const total = parseFloat(newRows[index].totalAmount || 0);
        const deposit = parseFloat(newRows[index].deposit || 0);
        newRows[index].balanceAmount = total - deposit;
    }

    setRows(newRows);
  };

  const handleDeleteRow = (index) => {
    if (rows.length <= 1 && !rows[0].shippingMark) {
        toast.error("Cannot delete the only empty row");
        return;
    }
    if (confirm("Are you sure you want to remove this order?")) {
        setRows(rows.filter((_, i) => i !== index));
        toast.success("Order removed");
    }
  };

  const handleSave = async () => {
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
        toast.success("Sheet saved successfully");
        router.push("/dashboard/client-order-tracker"); // Go back to list after save? Or stay? Let's stay and refresh.
        fetchSheet(unwrappedParams.id);
      }
    } catch (error) {
      toast.error("Failed to save sheet");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !unwrappedParams) return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
  );

  const totalValue = rows.reduce((s, r) => s + (parseFloat(r.totalAmount)||0), 0);
  const totalBalance = rows.reduce((s, r) => s + (parseFloat(r.balanceAmount)||0), 0);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 pb-32">
        <div className="max-w-5xl mx-auto space-y-6">
            
            {/* Top Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-full h-10 w-10 bg-white border-slate-200">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">{sheet?.name}</h1>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="w-4 h-4" />
                        <span>{sheet?.month || 'General Sheet'}</span>
                        <span className="text-slate-300">|</span>
                        <span>{rows.length} Orders</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
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
                        <p className="text-xs font-bold text-blue-200 uppercase tracking-wider">Orders Count</p>
                        <p className="text-2xl font-bold mt-1">{rows.length}</p>
                    </div>
                    <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center text-white">
                        <Package className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Order Cards List */}
            <div className="space-y-6">
                {rows.map((row, i) => (
                    <div key={row._key} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group transition-all hover:shadow-md">
                        {/* Card Header */}
                        <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <span className="h-8 w-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                                    {i + 1}
                                </span>
                                <h3 className="font-semibold text-slate-700">
                                    {row.product || 'New Order'}
                                    {row.shippingMark && <span className="ml-2 font-normal text-slate-500 text-sm">({row.shippingMark})</span>}
                                </h3>
                             </div>
                             <Button variant="ghost" size="sm" onClick={() => handleDeleteRow(i)} className="text-slate-400 hover:text-red-600 hover:bg-red-50">
                                <Trash2 className="w-4 h-4" />
                             </Button>
                        </div>

                        {/* Card Body */}
                        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-6">
                            
                            {/* Section 1: Identification */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase border-b pb-2 tracking-wider flex items-center gap-2">
                                    <Package className="w-3 h-3" /> Identification
                                </h4>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600">Shipping Mark *</label>
                                    <input 
                                        className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                                        placeholder="e.g. SMK-123"
                                        value={row.shippingMark}
                                        onChange={e => handleChange(i, 'shippingMark', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600">Supplier Name</label>
                                    <input 
                                        className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                                        placeholder="e.g. Global Traders"
                                        value={row.supplier}
                                        onChange={e => handleChange(i, 'supplier', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600">Product Name *</label>
                                    <input 
                                        className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                                        placeholder="e.g. Widget X"
                                        value={row.product}
                                        onChange={e => handleChange(i, 'product', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Section 2: Logistics */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase border-b pb-2 tracking-wider flex items-center gap-2">
                                    <Truck className="w-3 h-3" /> Logistics
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600">Mode</label>
                                        <select 
                                            className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                                            value={row.shippingMode}
                                            onChange={e => handleChange(i, 'shippingMode', e.target.value)}
                                        >
                                            <option value="">Select</option>
                                            <option value="AIR">Air</option>
                                            <option value="SEA">Sea</option>
                                            <option value="ROAD">Road</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600">Status</label>
                                        <select 
                                            className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                                            value={row.status}
                                            onChange={e => handleChange(i, 'status', e.target.value)}
                                        >
                                            <option value="PENDING">Pending</option>
                                            <option value="LOADED">Loaded</option>
                                            <option value="IN_TRANSIT">In Transit</option>
                                            <option value="ARRIVED">Arrived</option>
                                            <option value="DELIVERED">Delivered</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600">Shipping Code</label>
                                    <input 
                                        className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                                        placeholder="e.g. SHIP-001"
                                        value={row.shippingCode}
                                        onChange={e => handleChange(i, 'shippingCode', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600">LR No.</label>
                                    <input 
                                        className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                                        placeholder="e.g. LR-9988"
                                        value={row.lrNo}
                                        onChange={e => handleChange(i, 'lrNo', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Section 3: Dates */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase border-b pb-2 tracking-wider flex items-center gap-2">
                                    <Calendar className="w-3 h-3" /> Key Dates
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600">Order Date</label>
                                        <input 
                                            type="date"
                                            className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs transition-all"
                                            value={row.orderDate ? new Date(row.orderDate).toISOString().split('T')[0] : ''}
                                            onChange={e => handleChange(i, 'orderDate', new Date(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600">Loading Date</label>
                                        <input 
                                            className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                                            placeholder="DD-MM-YYYY"
                                            value={row.loadingDate}
                                            onChange={e => handleChange(i, 'loadingDate', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600">Arrival (Exp)</label>
                                        <input 
                                            className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                                            placeholder="DD-MM-YYYY"
                                            value={row.arrivalDate}
                                            onChange={e => handleChange(i, 'arrivalDate', e.target.value)}
                                        />
                                    </div>
                                     <div>
                                        <label className="text-xs font-semibold text-slate-600">Delivery</label>
                                        <input 
                                            className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                                            placeholder="DD-MM-YYYY"
                                            value={row.deliveryDate}
                                            onChange={e => handleChange(i, 'deliveryDate', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                             {/* Section 4: Financials */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase border-b pb-2 tracking-wider flex items-center gap-2">
                                    <DollarSign className="w-3 h-3" /> Financials
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600">Qty</label>
                                        <input 
                                            type="number"
                                            className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                                            value={row.quantity}
                                            onChange={e => handleChange(i, 'quantity', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600">Cartons</label>
                                        <input 
                                            type="number"
                                            className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                                            value={row.ctn}
                                            onChange={e => handleChange(i, 'ctn', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500">Total Amount ($)</label>
                                        <input 
                                            type="number"
                                            className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-slate-900"
                                            value={row.totalAmount}
                                            onChange={e => handleChange(i, 'totalAmount', e.target.value)}
                                        />
                                    </div>
                                     <div>
                                        <label className="text-xs font-semibold text-slate-500">Deposit ($)</label>
                                        <input 
                                            type="number"
                                            className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            value={row.deposit}
                                            onChange={e => handleChange(i, 'deposit', e.target.value)}
                                        />
                                    </div>
                                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-600">Balance:</span>
                                        <span className={`text-sm font-bold ${row.balanceAmount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                            ${(row.balanceAmount||0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                ))}
            </div>

            {/* Add Button */}
            <button 
                onClick={handleAddRow}
                className="w-full py-5 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
            >
                <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform group-hover:bg-blue-100">
                    <Plus className="w-6 h-6" />
                </div>
                <span className="font-semibold">Add Another Order</span>
            </button>
        </div>
    </div>
  );
}