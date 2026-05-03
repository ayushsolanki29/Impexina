"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Save, PlusCircle, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import API from "@/lib/api";

function formatDateDDMMYYYY(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export default function OrderSheetEditor() {
  const params = useParams();
  const router = useRouter();
  const sheetId = params.id;

  const [sheet, setSheet] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newRow, setNewRow] = useState({
    hisab: false,
    shippingMark: "",
    notes: "",
    orderDate: "",
    paymentDate: "",
    quantity: "",
    product: "",
    supplier: "",
    deposit: "",
    shippingCharge: "",
    totalAmount: 0,
    deliveryDate: "",
    loadingDate: "",
    ctn: 1, // required by schema
  });

  const fetchSheet = useCallback(async (id) => {
    setLoading(true);
    try {
      const res = await API.get(`/client-order-tracker/sheets/${id}`);
      if (res.data.success) {
        setSheet(res.data.data);
        const fetchedRows = res.data.data.orders.map(o => ({ ...o, _key: o.id }));
        setRows(fetchedRows);
      }
    } catch (error) {
      toast.error("Failed to load sheet");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sheetId) {
      fetchSheet(sheetId);
    }
  }, [sheetId, fetchSheet]);

  const createEmptyRow = () => ({
    _key: `temp_${Date.now()}_${Math.random()}`,
    id: `temp_${Date.now()}`,
    hisab: false,
    shippingMark: "",
    notes: "",
    orderDate: "",
    paymentDate: "",
    quantity: 0,
    product: "",
    supplier: "",
    deposit: 0,
    shippingCharge: 0,
    totalAmount: 0,
    deliveryDate: "",
    loadingDate: "",
    ctn: 1,
    isNew: true
  });

  const handleChange = (rowKey, field, value) => {
    setRows(prev => prev.map(row => {
      if (row._key === rowKey) {
        let processedValue = value;
        if (['quantity', 'ctn', 'deposit', 'shippingCharge'].includes(field)) {
          processedValue = (value === "" ? null : parseFloat(value) || 0);
        }
        
        const updated = { ...row, [field]: processedValue };

        // Auto calculate totalPayment
        if (['deposit', 'shippingCharge'].includes(field)) {
          const deposit = parseFloat(updated.deposit || 0);
          const shippingCharge = parseFloat(updated.shippingCharge || 0);
          updated.totalAmount = deposit + shippingCharge;
        }
        return updated;
      }
      return row;
    }));
  };

  const handleUpdateNewRow = (field, value) => {
    let processedValue = value;
    if (['quantity', 'ctn', 'deposit', 'shippingCharge'].includes(field)) {
      processedValue = (value === "" ? "" : parseFloat(value) || 0);
    }
    const updated = { ...newRow, [field]: processedValue };
    if (['deposit', 'shippingCharge'].includes(field)) {
      const deposit = parseFloat(updated.deposit || 0);
      const shippingCharge = parseFloat(updated.shippingCharge || 0);
      updated.totalAmount = deposit + shippingCharge;
    }
    setNewRow(updated);
  };

  const handleAddRow = () => {
    if (!newRow.product) {
      toast.error("Product name is required");
      return;
    }
    if (!newRow.shippingMark) {
      toast.error("Mark is required");
      return;
    }
    
    const rowToAdd = {
      ...createEmptyRow(),
      ...newRow,
      quantity: newRow.quantity ? parseFloat(newRow.quantity) : 1,
      deposit: newRow.deposit ? parseFloat(newRow.deposit) : 0,
      shippingCharge: newRow.shippingCharge ? parseFloat(newRow.shippingCharge) : 0,
    };
    
    setRows(prev => [...prev, rowToAdd]);
    setNewRow({
      hisab: false,
      shippingMark: "",
      notes: "",
      orderDate: "",
      paymentDate: "",
      quantity: "",
      product: "",
      supplier: "",
      deposit: "",
      shippingCharge: "",
      totalAmount: 0,
      deliveryDate: "",
      loadingDate: "",
      ctn: 1,
    });
  };

  const handleDeleteRow = (rowKey) => {
    if (confirm("Are you sure you want to remove this row?")) {
      setRows(prev => prev.filter(r => r._key !== rowKey));
      toast.success("Row removed");
    }
  };

  const handleSave = useCallback(async () => {
    if (!sheetId) return;

    // Validation
    const invalid = rows.find(r => !r.shippingMark || !r.product);
    if (invalid) {
      toast.error("All rows must have at least a Mark and Product Name.");
      return;
    }

    setSaving(true);
    try {
      const res = await API.post(`/client-order-tracker/sheets/${sheetId}/orders`, {
        orders: rows
      });
      if (res.data.success) {
        toast.success("Sheet saved successfully! (Ctrl+S)");
        fetchSheet(sheetId);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save sheet");
    } finally {
      setSaving(false);
    }
  }, [sheetId, rows, fetchSheet]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const totals = useMemo(() => {
    const totalSupplierPayment = rows.reduce((s, e) => s + (parseFloat(e.deposit) || 0), 0);
    const totalShippingCharge = rows.reduce((s, e) => s + (parseFloat(e.shippingCharge) || 0), 0);
    const totalPayment = rows.reduce((s, e) => s + (parseFloat(e.totalAmount) || 0), 0);
    return { totalSupplierPayment, totalShippingCharge, totalPayment };
  }, [rows]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 font-medium">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Top bar: back + title + actions */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider hidden sm:inline mr-2">
              Ctrl+S Save
            </span>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Sheet"}
            </button>
          </div>
        </div>
      </div>

      {/* Green title */}
      <div className="bg-emerald-600 text-white py-4">
        <div className="max-w-[1600px] mx-auto px-6">
          <h1 className="text-2xl font-black uppercase tracking-tight">
            {sheet?.name || "CLIENT ORDER TRACKER"}
          </h1>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-[1600px] mx-auto px-6 py-6 overflow-x-auto">
        <table className="w-full border-collapse text-[13px]" style={{ minWidth: "1500px" }}>
          {/* Yellow header */}
          <thead>
            <tr className="bg-amber-200 text-slate-900 border border-slate-300">
              <th className="border border-slate-300 px-2 py-2 text-left font-bold uppercase w-10 text-center">#</th>
              <th className="border border-slate-300 px-2 py-2 text-center font-bold uppercase w-12">HISAB</th>
              <th className="border border-slate-300 px-2 py-2 text-left font-bold uppercase w-24">MARK</th>
              <th className="border border-slate-300 px-2 py-2 text-left font-bold uppercase w-32">NOTES</th>
              <th className="border border-slate-300 px-2 py-2 text-left font-bold uppercase w-32">ORDER DATE</th>
              <th className="border border-slate-300 px-2 py-2 text-left font-bold uppercase w-36">SUPPLIER P. DATE</th>
              <th className="border border-slate-300 px-2 py-2 text-right font-bold uppercase w-20">QTY</th>
              <th className="border border-slate-300 px-2 py-2 text-left font-bold uppercase min-w-[200px]">PRODUCT NAME</th>
              <th className="border border-slate-300 px-2 py-2 text-left font-bold uppercase min-w-[160px]">SUPPLIER NAME</th>
              <th className="border border-slate-300 px-2 py-2 text-right font-bold uppercase w-36">SUPPLIER PAYMENT</th>
              <th className="border border-slate-300 px-2 py-2 text-right font-bold uppercase w-36">SHIPPING CHARGE</th>
              <th className="border border-slate-300 px-2 py-2 text-right font-bold uppercase w-36">TOTAL PAYMENT</th>
              <th className="border border-slate-300 px-2 py-2 text-left font-bold uppercase w-32">DELIVERED</th>
              <th className="border border-slate-300 px-2 py-2 text-left font-bold uppercase w-32">LOADED</th>
              <th className="border border-slate-300 px-2 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {rows.map((row, idx) => (
              <tr key={row._key} className="border-b border-slate-200 hover:bg-slate-50/50">
                <td className="border border-slate-200 px-2 py-1.5 text-center text-slate-400 font-medium">
                  {idx + 1}
                </td>
                <td className="border border-slate-200 px-2 py-1.5 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    checked={row.hisab || false}
                    onChange={(e) => handleChange(row._key, "hisab", e.target.checked)}
                  />
                </td>
                <td className="border border-slate-200 px-2 py-1.5">
                  <input
                    className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-blue-500 outline-none py-0.5 font-semibold"
                    value={row.shippingMark || ""}
                    onChange={(e) => handleChange(row._key, "shippingMark", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-2 py-1.5">
                  <input
                    className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-blue-500 outline-none py-0.5"
                    value={row.notes || ""}
                    onChange={(e) => handleChange(row._key, "notes", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-2 py-1.5">
                  <input
                    type="date"
                    className="w-full bg-transparent border-0 outline-none py-0.5 text-xs text-slate-700"
                    value={row.orderDate ? new Date(row.orderDate).toISOString().split("T")[0] : ""}
                    onChange={(e) => handleChange(row._key, "orderDate", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-2 py-1.5">
                  <input
                    type="date"
                    className="w-full bg-transparent border-0 outline-none py-0.5 text-xs text-slate-700"
                    value={row.paymentDate ? new Date(row.paymentDate).toISOString().split("T")[0] : ""}
                    onChange={(e) => handleChange(row._key, "paymentDate", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-2 py-1.5 text-right">
                  <input
                    type="number"
                    className="w-full text-right bg-transparent border-0 outline-none py-0.5 font-medium"
                    value={row.quantity ?? ""}
                    onChange={(e) => handleChange(row._key, "quantity", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-2 py-1.5">
                  <input
                    className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-blue-500 outline-none py-0.5 font-medium"
                    value={row.product || ""}
                    onChange={(e) => handleChange(row._key, "product", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-2 py-1.5">
                  <input
                    className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-blue-500 outline-none py-0.5"
                    value={row.supplier || ""}
                    onChange={(e) => handleChange(row._key, "supplier", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-2 py-1.5 text-right">
                  <input
                    type="number"
                    className="w-full text-right bg-transparent border-0 outline-none py-0.5 font-medium"
                    value={row.deposit ?? ""}
                    onChange={(e) => handleChange(row._key, "deposit", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-2 py-1.5 text-right">
                  <input
                    type="number"
                    className="w-full text-right bg-transparent border-0 outline-none py-0.5 font-medium"
                    value={row.shippingCharge ?? ""}
                    onChange={(e) => handleChange(row._key, "shippingCharge", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-2 py-1.5 text-right font-bold text-slate-900 bg-slate-50">
                  {(row.totalAmount || 0).toLocaleString("en-IN")}
                </td>
                <td className="border border-slate-200 px-2 py-1.5">
                  <input
                    type="date"
                    className="w-full bg-transparent border-0 outline-none py-0.5 text-xs text-slate-700"
                    value={row.deliveryDate ? new Date(row.deliveryDate).toISOString().split("T")[0] : ""}
                    onChange={(e) => handleChange(row._key, "deliveryDate", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-2 py-1.5">
                  <input
                    type="date"
                    className="w-full bg-transparent border-0 outline-none py-0.5 text-xs text-slate-700"
                    value={row.loadingDate ? new Date(row.loadingDate).toISOString().split("T")[0] : ""}
                    onChange={(e) => handleChange(row._key, "loadingDate", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => handleDeleteRow(row._key)}
                    className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}

            {/* New entry row */}
            <tr className="bg-slate-50 border-t-2 border-slate-200">
              <td className="border border-slate-200 px-2 py-2 text-center text-slate-400 font-bold">
                NEW
              </td>
              <td className="border border-slate-200 px-2 py-2 text-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  checked={newRow.hisab}
                  onChange={(e) => handleUpdateNewRow("hisab", e.target.checked)}
                />
              </td>
              <td className="border border-slate-200 px-2 py-2">
                <input
                  className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                  placeholder="Mark *"
                  value={newRow.shippingMark}
                  onChange={(e) => handleUpdateNewRow("shippingMark", e.target.value)}
                />
              </td>
              <td className="border border-slate-200 px-2 py-2">
                <input
                  className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                  placeholder="Notes"
                  value={newRow.notes}
                  onChange={(e) => handleUpdateNewRow("notes", e.target.value)}
                />
              </td>
              <td className="border border-slate-200 px-2 py-2">
                <input
                  type="date"
                  className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                  value={newRow.orderDate}
                  onChange={(e) => handleUpdateNewRow("orderDate", e.target.value)}
                />
              </td>
              <td className="border border-slate-200 px-2 py-2">
                <input
                  type="date"
                  className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                  value={newRow.paymentDate}
                  onChange={(e) => handleUpdateNewRow("paymentDate", e.target.value)}
                />
              </td>
              <td className="border border-slate-200 px-2 py-2">
                <input
                  type="number"
                  className="w-full border border-slate-200 rounded px-2 py-1 text-xs text-right"
                  placeholder="0"
                  value={newRow.quantity}
                  onChange={(e) => handleUpdateNewRow("quantity", e.target.value)}
                />
              </td>
              <td className="border border-slate-200 px-2 py-2">
                <input
                  className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                  placeholder="Product Name *"
                  value={newRow.product}
                  onChange={(e) => handleUpdateNewRow("product", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddRow()}
                />
              </td>
              <td className="border border-slate-200 px-2 py-2">
                <input
                  className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                  placeholder="Supplier Name"
                  value={newRow.supplier}
                  onChange={(e) => handleUpdateNewRow("supplier", e.target.value)}
                />
              </td>
              <td className="border border-slate-200 px-2 py-2">
                <input
                  type="number"
                  className="w-full border border-slate-200 rounded px-2 py-1 text-xs text-right"
                  placeholder="0"
                  value={newRow.deposit}
                  onChange={(e) => handleUpdateNewRow("deposit", e.target.value)}
                />
              </td>
              <td className="border border-slate-200 px-2 py-2">
                <input
                  type="number"
                  className="w-full border border-slate-200 rounded px-2 py-1 text-xs text-right"
                  placeholder="0"
                  value={newRow.shippingCharge}
                  onChange={(e) => handleUpdateNewRow("shippingCharge", e.target.value)}
                />
              </td>
              <td className="border border-slate-200 px-2 py-2 text-right font-bold text-slate-900 bg-slate-50">
                {(newRow.totalAmount || 0).toLocaleString("en-IN")}
              </td>
              <td className="border border-slate-200 px-2 py-2">
                <input
                  type="date"
                  className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                  value={newRow.deliveryDate}
                  onChange={(e) => handleUpdateNewRow("deliveryDate", e.target.value)}
                />
              </td>
              <td className="border border-slate-200 px-2 py-2">
                <input
                  type="date"
                  className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                  value={newRow.loadingDate}
                  onChange={(e) => handleUpdateNewRow("loadingDate", e.target.value)}
                />
              </td>
              <td className="border border-slate-200 px-2 py-2">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                  title="Add Row"
                >
                  <PlusCircle className="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
          {/* Footer: TOTAL row */}
          <tfoot>
            <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold">
              <td colSpan="9" className="border border-slate-300 px-3 py-2 text-right uppercase tracking-wider text-slate-500">
                Total Formula
              </td>
              <td className="border border-slate-300 px-3 py-2 text-right">
                {totals.totalSupplierPayment.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
              <td className="border border-slate-300 px-3 py-2 text-right">
                {totals.totalShippingCharge.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
              <td className="border border-slate-300 px-3 py-2 text-right font-black">
                {totals.totalPayment.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
              <td colSpan="3" className="border border-slate-300"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
