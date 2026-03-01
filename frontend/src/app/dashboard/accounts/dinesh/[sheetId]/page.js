"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Printer, FileDown, Eye, PlusCircle, Trash2 } from "lucide-react";
import { dineshbhaiAPI } from "@/services/dineshbhai.service";
import DineshPreviewModal from "./_components/DineshPreviewModal";

function formatDateDDMMYYYY(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export default function DineshSheetPage() {
  const params = useParams();
  const router = useRouter();
  const sheetId = params.sheetId;

  const [sheet, setSheet] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [entry, setEntry] = useState({
    supplier: "",
    paymentDate: new Date().toISOString().split("T")[0],
    amount: "",
    booking: "",
    rate: "",
    total: 0,
    paid: "",
    paidDate: "",
    clientRef: "",
  });

  useEffect(() => {
    if (sheetId && sheetId !== "new") {
      loadSheetData();
      loadEntries();
    }
  }, [sheetId]);

  const loadSheetData = async () => {
    try {
      const data = await dineshbhaiAPI.getSheet(sheetId);
      setSheet(data.data.data);
    } catch (error) {
      const data = error.response?.data;
      const msg = data?.message || "Failed to load sheet";
      if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        data.errors.forEach((err) => toast.error(`${err.field || "Field"}: ${err.message || msg}`));
      } else {
        toast.error(msg);
      }
    }
  };

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await dineshbhaiAPI.getSheetEntries(sheetId, {
        page: 1,
        limit: 5000,
      });
      setEntries(data.data.data.entries || []);
    } catch (error) {
      const data = error.response?.data;
      const msg = data?.message || "Failed to load entries";
      if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        data.errors.forEach((err) => toast.error(`${err.field || "Field"}: ${err.message || msg}`));
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const booking = parseFloat(entry.booking) || 0;
    const rate = parseFloat(entry.rate) || 0;
    const total = booking * rate;
    setEntry((prev) => ({
      ...prev,
      total: isNaN(total) ? 0 : parseFloat(total.toFixed(2)),
    }));
  }, [entry.booking, entry.rate]);

  // Keyboard: Ctrl+S save (add entry), Escape back
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (isPreviewOpen) {
          setIsPreviewOpen(false);
        } else {
          router.push("/dashboard/accounts/dinesh");
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (entry.supplier?.trim()) {
          handleAddEntry({ preventDefault: () => {} });
        } else {
          toast.info("Enter supplier to save new entry");
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [entry.supplier, isPreviewOpen, router]);

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!entry.supplier) {
      toast.error("Supplier is required");
      return;
    }
    try {
      await dineshbhaiAPI.addEntry(sheetId, {
        ...entry,
        amount: entry.amount ? parseFloat(entry.amount) : null,
        booking: entry.booking ? parseFloat(entry.booking) : null,
        rate: entry.rate ? parseFloat(entry.rate) : null,
        total: entry.total != null ? Number(entry.total) : 0,
        paid: entry.paid ? parseFloat(entry.paid) : null,
      });
      toast.success("Entry added");
      setEntry({
        supplier: "",
        paymentDate: new Date().toISOString().split("T")[0],
        amount: "",
        booking: "",
        rate: "",
        total: 0,
        paid: "",
        paidDate: "",
        clientRef: "",
      });
      loadEntries();
      loadSheetData();
    } catch (error) {
      const data = error.response?.data;
      const msg = data?.message || error.message || "Failed to add entry";
      if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        data.errors.forEach((err) => toast.error(`${err.field || "Field"}: ${err.message || msg}`));
      } else {
        toast.error(msg);
      }
    }
  };

  const handleUpdateEntry = async (entryId, field, value) => {
    const row = entries.find((e) => e.id === entryId);
    if (!row) return;
    const updateData = { ...row, [field]: value };
    if (["amount", "booking", "rate", "paid", "total"].includes(field)) {
      updateData[field] = value === "" ? null : parseFloat(value) || 0;
    }
    if (field === "booking" || field === "rate") {
      const b = field === "booking" ? parseFloat(value) || 0 : row.booking || 0;
      const r = field === "rate" ? parseFloat(value) || 0 : row.rate || 0;
      updateData.total = b * r;
    }
    updateData.balance = (updateData.total || 0) - (updateData.paid || 0);
    try {
      await dineshbhaiAPI.updateEntry(entryId, updateData);
      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, ...updateData } : e))
      );
    } catch (error) {
      const data = error.response?.data;
      const msg = data?.message || "Failed to update";
      if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        data.errors.forEach((err) => toast.error(`${err.field || "Field"}: ${err.message || msg}`));
      } else {
        toast.error(msg);
      }
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!confirm("Delete this entry?")) return;
    try {
      await dineshbhaiAPI.deleteEntry(entryId);
      toast.success("Entry deleted");
      loadEntries();
      loadSheetData();
    } catch (error) {
      const data = error.response?.data;
      const msg = data?.message || "Failed to delete";
      if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        data.errors.forEach((err) => toast.error(`${err.field || "Field"}: ${err.message || msg}`));
      } else {
        toast.error(msg);
      }
    }
  };

  const handleExport = async () => {
    try {
      const blob = await dineshbhaiAPI.exportSheet(sheetId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${sheet?.title || "sheet"}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Exported");
    } catch (error) {
      let msg = "Export failed";
      const data = error.response?.data;
      if (data instanceof Blob) {
        try {
          const text = await data.text();
          const parsed = JSON.parse(text);
          msg = parsed?.message || msg;
        } catch (_) {}
      } else if (data?.message) {
        msg = data.message;
      } else if (error.message) {
        msg = error.message;
      }
      if (data && !(data instanceof Blob) && data?.errors?.length > 0) {
        data.errors.forEach((err) => toast.error(`${err.field || "Field"}: ${err.message || msg}`));
      } else {
        toast.error(msg);
      }
    }
  };

  const totals = useMemo(() => {
    const totalLeft = entries.reduce((s, e) => s + (e.total || 0), 0);
    const totalPaid = entries.reduce((s, e) => s + (e.paid || 0), 0);
    const balance = totalPaid - totalLeft;
    return { totalLeft, totalPaid, balance };
  }, [entries]);

  if (loading && (!entries || entries.length === 0))
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 font-medium">Loading...</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar: back + title + actions */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard/accounts/dinesh")}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider hidden sm:inline">
              Ctrl+S Save · Esc Back
            </span>
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 text-sm font-medium"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
            >
              <FileDown className="w-4 h-4" />
              Excel
            </button>
          </div>
        </div>
      </div>

      {/* Green title */}
      <div className="bg-emerald-600 text-white py-4">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-2xl font-black uppercase tracking-tight">
            {sheet?.title || "DINESHBHAI 25-26"}
          </h1>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-6xl mx-auto px-6 py-6 overflow-x-auto">
        <table className="w-full border-collapse text-sm" style={{ minWidth: "900px" }}>
          {/* Yellow header */}
          <thead>
            <tr className="bg-amber-200 text-slate-900 border border-slate-300">
              <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase">Supplier</th>
              <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase">Payment Date</th>
              <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase">Amount</th>
              <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase">Booking</th>
              <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase">Rate</th>
              <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase">Total</th>
              <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase">Paid</th>
              <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase">Date</th>
              <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase">Client</th>
              <th className="border border-slate-300 px-2 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {entries.map((row) => (
              <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50/50">
                <td className="border border-slate-200 px-3 py-1.5">
                  <input
                    className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-blue-500 outline-none py-0.5 text-slate-800 font-medium"
                    value={row.supplier || ""}
                    onChange={(e) => handleUpdateEntry(row.id, "supplier", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-3 py-1.5">
                  <input
                    type="date"
                    className="w-full bg-transparent border-0 outline-none py-0.5 text-slate-700 text-xs"
                    value={row.paymentDate ? new Date(row.paymentDate).toISOString().split("T")[0] : ""}
                    onChange={(e) => handleUpdateEntry(row.id, "paymentDate", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-3 py-1.5 text-right">
                  <input
                    type="number"
                    className="w-full text-right bg-transparent border-0 outline-none py-0.5"
                    value={row.amount ?? ""}
                    onChange={(e) => handleUpdateEntry(row.id, "amount", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-3 py-1.5 text-right">
                  <input
                    type="number"
                    step="0.01"
                    className="w-full text-right bg-transparent border-0 outline-none py-0.5"
                    value={row.booking ?? ""}
                    onChange={(e) => handleUpdateEntry(row.id, "booking", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-3 py-1.5 text-right">
                  <input
                    type="number"
                    step="0.01"
                    className="w-full text-right bg-transparent border-0 outline-none py-0.5"
                    value={row.rate ?? ""}
                    onChange={(e) => handleUpdateEntry(row.id, "rate", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-3 py-1.5 text-right font-medium text-slate-900">
                  {(row.total || 0).toLocaleString("en-IN")}
                </td>
                <td className="border border-slate-200 px-3 py-1.5 text-right">
                  <input
                    type="number"
                    className="w-full text-right bg-transparent border-0 outline-none py-0.5"
                    value={row.paid ?? ""}
                    onChange={(e) => handleUpdateEntry(row.id, "paid", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-3 py-1.5 text-slate-600">
                  {formatDateDDMMYYYY(row.paymentDate)}
                </td>
                <td className="border border-slate-200 px-3 py-1.5">
                  <input
                    className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-blue-500 outline-none py-0.5 text-slate-700"
                    value={row.clientRef || ""}
                    onChange={(e) => handleUpdateEntry(row.id, "clientRef", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => handleDeleteEntry(row.id)}
                    className="p-1 text-slate-300 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}

            {/* New entry row */}
            <tr className="bg-slate-50 border-t-2 border-slate-200">
              <td className="border border-slate-200 px-3 py-2">
                <input
                  className="w-full border border-slate-200 rounded px-2 py-1 text-sm"
                  placeholder="Supplier"
                  value={entry.supplier}
                  onChange={(e) => setEntry({ ...entry, supplier: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleAddEntry(e)}
                />
              </td>
              <td className="border border-slate-200 px-3 py-2">
                <input
                  type="date"
                  className="w-full border border-slate-200 rounded px-2 py-1 text-sm"
                  value={entry.paymentDate}
                  onChange={(e) => setEntry({ ...entry, paymentDate: e.target.value })}
                />
              </td>
              <td className="border border-slate-200 px-3 py-2">
                <input
                  type="number"
                  className="w-full border border-slate-200 rounded px-2 py-1 text-sm text-right"
                  placeholder="0"
                  value={entry.amount}
                  onChange={(e) => setEntry({ ...entry, amount: e.target.value })}
                />
              </td>
              <td className="border border-slate-200 px-3 py-2">
                <input
                  type="number"
                  step="0.01"
                  className="w-full border border-slate-200 rounded px-2 py-1 text-sm text-right"
                  placeholder="0"
                  value={entry.booking}
                  onChange={(e) => setEntry({ ...entry, booking: e.target.value })}
                />
              </td>
              <td className="border border-slate-200 px-3 py-2">
                <input
                  type="number"
                  step="0.01"
                  className="w-full border border-slate-200 rounded px-2 py-1 text-sm text-right"
                  placeholder="0"
                  value={entry.rate}
                  onChange={(e) => setEntry({ ...entry, rate: e.target.value })}
                />
              </td>
              <td className="border border-slate-200 px-3 py-2 text-right font-medium">
                {entry.total.toLocaleString("en-IN")}
              </td>
              <td className="border border-slate-200 px-3 py-2">
                <input
                  type="number"
                  className="w-full border border-slate-200 rounded px-2 py-1 text-sm text-right"
                  placeholder="0"
                  value={entry.paid}
                  onChange={(e) => setEntry({ ...entry, paid: e.target.value })}
                />
              </td>
              <td className="border border-slate-200 px-3 py-2 text-slate-500 text-xs">
                {formatDateDDMMYYYY(entry.paymentDate)}
              </td>
              <td className="border border-slate-200 px-3 py-2">
                <input
                  className="w-full border border-slate-200 rounded px-2 py-1 text-sm"
                  placeholder="Client"
                  value={entry.clientRef}
                  onChange={(e) => setEntry({ ...entry, clientRef: e.target.value })}
                />
              </td>
              <td className="border border-slate-200 px-2 py-2">
                <button
                  type="button"
                  onClick={handleAddEntry}
                  className="p-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                >
                  <PlusCircle className="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
          {/* Footer: TOTAL row + BALANCE row */}
          <tfoot>
            <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold">
              <td colSpan="5" className="border border-slate-300 px-3 py-2 text-right">
                TOTAL
              </td>
              <td className="border border-slate-300 px-3 py-2 text-right">
                ₹ {totals.totalLeft.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
              <td className="border border-slate-300 px-3 py-2 text-right">
                ₹ {totals.totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
              <td colSpan="2" className="border border-slate-300"></td>
            </tr>
            <tr className="bg-amber-100 border-b border-slate-300">
              <td className="border border-slate-300 px-3 py-2 text-slate-700">
                {formatDateDDMMYYYY(new Date())} INR
              </td>
              <td colSpan="7" className="border border-slate-300"></td>
              <td className="border border-slate-300 px-3 py-2 text-right font-black text-amber-800 bg-amber-200/80">
                ₹ {totals.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })} BALANCE
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <DineshPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        sheet={sheet}
        entries={entries}
        totals={{
          totalPayable: totals.totalLeft,
          totalPaid: totals.totalPaid,
          totalBalance: totals.balance,
        }}
      />
    </div>
  );
}
