"use client";

import React, { useRef, useState } from "react";
import { X, Printer, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

function formatDateDDMMYYYY(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export default function DineshPreviewModal({
  isOpen,
  onClose,
  sheet,
  entries,
  totals,
}) {
  const previewRef = useRef(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !sheet) return null;

  const totalLeft = totals?.totalPayable ?? 0;
  const totalPaid = totals?.totalPaid ?? 0;
  const balance = totals?.totalBalance ?? totalPaid - totalLeft;

  const handleDownloadExcel = () => {
    try {
      setLoading(true);
      const data = [
        ["SUPPLIER", "PAYMENT DATE", "AMOUNT", "BOOKING", "RATE", "TOTAL", "PAID", "DATE", "CLIENT"],
        ...entries.map((e) => [
          e.supplier,
          formatDateDDMMYYYY(e.paymentDate),
          e.amount ?? "",
          e.booking ?? "",
          e.rate ?? "",
          e.total ?? 0,
          e.paid ?? 0,
          formatDateDDMMYYYY(e.paymentDate),
          e.clientRef ?? "",
        ]),
        [],
        ["", "", "", "", "TOTAL", totalLeft, totalPaid, "", ""],
        [formatDateDDMMYYYY(new Date()) + " INR", "", "", "", "", "", "", "", `₹ ${balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })} BALANCE`],
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Ledger");
      XLSX.writeFile(wb, `${sheet.title}.xlsx`);
      toast.success("Excel downloaded");
    } catch (err) {
      toast.error("Export failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-white shrink-0">
          <h2 className="text-lg font-bold text-slate-900">Preview</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleDownloadExcel}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              Excel
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-slate-100 print:bg-white print:p-4">
          <div ref={previewRef} className="bg-white border border-slate-300 shadow-sm print:shadow-none max-w-4xl mx-auto">
            {/* Green title */}
            <div className="bg-emerald-600 text-white px-6 py-4">
              <h1 className="text-2xl font-black uppercase tracking-tight">
                {sheet.title}
              </h1>
            </div>

            {/* Table */}
            <table className="w-full border-collapse text-sm">
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
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b border-slate-200">
                    <td className="border border-slate-200 px-3 py-2 font-medium text-slate-800">{e.supplier || "-"}</td>
                    <td className="border border-slate-200 px-3 py-2 text-slate-600">{formatDateDDMMYYYY(e.paymentDate)}</td>
                    <td className="border border-slate-200 px-3 py-2 text-right">{(e.amount ?? "").toString() || "-"}</td>
                    <td className="border border-slate-200 px-3 py-2 text-right">{(e.booking ?? "").toString() || "-"}</td>
                    <td className="border border-slate-200 px-3 py-2 text-right">{(e.rate ?? "").toString() || "-"}</td>
                    <td className="border border-slate-200 px-3 py-2 text-right font-medium">{(e.total ?? 0).toLocaleString("en-IN")}</td>
                    <td className="border border-slate-200 px-3 py-2 text-right">{(e.paid ?? 0).toLocaleString("en-IN")}</td>
                    <td className="border border-slate-200 px-3 py-2 text-slate-600">{formatDateDDMMYYYY(e.paymentDate)}</td>
                    <td className="border border-slate-200 px-3 py-2 text-slate-700">{e.clientRef || "-"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                  <td colSpan="5" className="border border-slate-300 px-3 py-2 text-right">TOTAL</td>
                  <td className="border border-slate-300 px-3 py-2 text-right">
                    ₹ {totalLeft.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right">
                    ₹ {totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan="2" className="border border-slate-300"></td>
                </tr>
                <tr className="bg-amber-100 border-b border-slate-300">
                  <td className="border border-slate-300 px-3 py-2 text-slate-700">
                    {formatDateDDMMYYYY(new Date())} INR
                  </td>
                  <td colSpan="6" className="border border-slate-300"></td>
                  <td className="border border-slate-300 px-3 py-2 text-right font-black text-amber-800 bg-amber-200/80">
                    ₹ {balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })} BALANCE
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
