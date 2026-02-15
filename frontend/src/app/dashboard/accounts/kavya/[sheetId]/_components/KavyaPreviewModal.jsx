"use client";

import React, { useState, useRef } from "react";
import { 
  X, FileSpreadsheet, FileText, Loader2, Printer, 
  Package, DollarSign, CheckCircle2, Calendar 
} from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

export default function KavyaPreviewModal({ 
  isOpen, 
  onClose, 
  sheet,
  entries,
  totals,
  finalBalance
}) {
  const [loading, setLoading] = useState(false);
  const previewRef = useRef(null);

  if (!isOpen || !sheet) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const performExport = async (format) => {
    if (!previewRef.current) return;

    try {
      setLoading(true);
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      if (format === 'pdf') {
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "px",
          format: "a4"
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${sheet.title}.pdf`);
        toast.success("PDF Generated");
      } else {
        const link = document.createElement("a");
        link.download = `${sheet.title}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        toast.success("Image Saved");
      }
    } catch (error) {
      console.error("Export Error:", error);
      toast.error(`Failed to export ${format.toUpperCase()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = () => {
    try {
      setLoading(true);
      const wb = XLSX.utils.book_new();
      const data = [
        ['CONT CODE', 'LOADING DATE', 'DELIVERY DATE', 'MARK', 'PARTICULAR', 'RATE (CBM/WT)', 'CBM/KG', 'DUTY/FVB', 'TOTAL', 'PAID', 'PAYMENT DATE'],
        ...entries.map(e => [
          e.containerCode,
          formatDate(e.loadingDate),
          formatDate(e.deliveryDate),
          e.shippingMark,
          e.particular,
          e.rateCbmWeight || 0,
          e.cbmKg || 0,
          e.dutyFvb || 0,
          e.total || 0,
          e.paid || 0,
          formatDate(e.paymentDate)
        ]),
        [],
        ['', '', '', '', 'GRAND TOTALS', totals.totalRateCbmWeight, totals.totalCbmKg, totals.totalDutyFvb, totals.totalPayable, totals.totalPaid, ''],
        ['', '', '', '', 'FINAL BALANCE (Incl. Opening)', '', '', '', '', finalBalance, '']
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Kavya Ledger');
      XLSX.writeFile(wb, `${sheet.title}.xlsx`);
      toast.success("Excel Downloaded");
    } catch (error) {
      toast.error("Excel Export Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-[95vw] h-[92vh] rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
        {/* Modal Header */}
        <div className="px-8 py-5 border-b flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-pink-50 rounded-2xl border border-pink-100">
              <Package className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">{sheet.title}</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Container-Wise Account Logistics Statement</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all text-xs font-bold uppercase tracking-wider">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={handleDownloadExcel} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-100">
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </button>
            <button onClick={() => performExport('pdf')} className="flex items-center gap-2 px-5 py-2.5 bg-pink-600 text-white rounded-xl hover:bg-pink-700 transition-all text-xs font-bold uppercase tracking-wider shadow-lg shadow-pink-100">
              <FileText className="w-4 h-4" /> PDF
            </button>
            <button onClick={onClose} className="ml-4 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 transition-colors border border-slate-100">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Preview Area (Landscape Optimization) */}
        <div className="flex-1 overflow-auto p-12 bg-slate-100/50 print:bg-white print:p-0">
          <div 
            ref={previewRef}
            className="bg-white p-16 shadow-2xl border border-slate-200 mx-auto min-w-[1100px] space-y-10 print:shadow-none print:border-none print:p-6 rounded-sm"
          >
            {/* Header */}
            <div className="flex justify-between items-start border-b-8 border-pink-600 pb-8">
              <div className="space-y-4">
                <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                  Statement of Account
                </h1>
                <div className="flex items-center gap-6">
                  <div className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">Reference: KAVYA-{sheet.id.slice(-6).toUpperCase()}</div>
                  <div className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">Date: {new Date().toLocaleDateString('en-GB')}</div>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Final Outstanding</div>
                <div className="text-4xl font-black text-pink-600 italic tracking-tight">{formatCurrency(finalBalance)}</div>
              </div>
            </div>

            {/* Balances Block */}
            <div className="grid grid-cols-4 gap-6">
              {[
                { label: "Opening Balance", val: sheet.openingBalance, color: "slate" },
                { label: "Total Charges", val: totals.totalPayable, color: "slate" },
                { label: "Total Realized", val: totals.totalPaid, color: "emerald" },
                { label: "Net Balance", val: finalBalance, color: "pink" }
              ].map((b, i) => (
                <div key={i} className={`p-6 rounded-2xl bg-${b.color}-50 border border-${b.color}-100 flex flex-col justify-center`}>
                  <p className={`text-[10px] font-black text-${b.color}-600 uppercase tracking-[0.2em] mb-2`}>{b.label}</p>
                  <p className={`text-2xl font-black text-${b.color === 'pink' ? 'pink-600' : 'slate-900'} tracking-tight`}>
                    {formatCurrency(b.val)}
                  </p>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="border-2 border-slate-900 rounded-xl overflow-hidden shadow-2xl shadow-slate-100">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-black uppercase tracking-widest border-b border-slate-900">
                    <th className="px-3 py-4 text-left border-r border-slate-700">Cont Code</th>
                    <th className="px-3 py-4 text-center border-r border-slate-700">Dates</th>
                    <th className="px-3 py-4 text-left border-r border-slate-700">Details</th>
                    <th className="px-3 py-4 text-right border-r border-slate-700">Rate</th>
                    <th className="px-3 py-4 text-right border-r border-slate-700">CBM/KG</th>
                    <th className="px-3 py-4 text-right border-r border-slate-700">Duty/FVB</th>
                    <th className="px-3 py-4 text-right border-r border-slate-700">Total</th>
                    <th className="px-3 py-4 text-right border-r border-slate-700">Paid</th>
                    <th className="px-3 py-4 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="font-bold divide-y divide-slate-100">
                  {entries.map((e, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <td className="px-3 py-3 border-r border-slate-100 uppercase font-black text-slate-800 italic">
                        {e.containerCode}
                      </td>
                      <td className="px-3 py-3 text-center border-r border-slate-100 text-slate-400 font-mono text-[9px] leading-tight">
                        L: {formatDate(e.loadingDate)}<br/>D: {formatDate(e.deliveryDate)}
                      </td>
                      <td className="px-3 py-3 border-r border-slate-100 uppercase">
                        <div className="text-slate-900">{e.particular || '-'}</div>
                        <div className="text-[9px] text-slate-400">MARK: {e.shippingMark || '-'}</div>
                      </td>
                      <td className="px-3 py-3 text-right border-r border-slate-100 text-slate-500">{e.rateCbmWeight.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right border-r border-slate-100 text-slate-500">{e.cbmKg.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right border-r border-slate-100 text-slate-500">{e.dutyFvb.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right border-r border-slate-100 font-black text-slate-900 italic">₹{e.total.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right border-r border-slate-100 font-bold text-emerald-600">₹{e.paid ? e.paid.toLocaleString() : '0'}</td>
                      <td className={`px-3 py-3 text-right font-black ${e.balance > 0 ? "text-amber-500" : "text-emerald-500"} italic`}>
                        ₹{e.balance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white font-black border-t-4 border-slate-900 uppercase tracking-widest text-[9px]">
                    <td colSpan="3" className="px-3 py-5 text-right">Ledger Totals</td>
                    <td colSpan="3" className="px-3 py-5 text-right">Charges Sum</td>
                    <td className="px-3 py-5 text-right font-mono text-[11px]">₹{totals.totalPayable.toLocaleString()}</td>
                    <td className="px-3 py-5 text-right font-mono text-[11px]">₹{totals.totalPaid.toLocaleString()}</td>
                    <td className="px-3 py-5 text-right font-mono text-[11px] italic">₹{totals.totalBalance.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Footer Summary */}
            <div className="flex justify-end pt-4">
              <div className="w-80 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <span>Opening Bal:</span>
                  <span>{formatCurrency(sheet.openingBalance)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">
                  <span>Current Charges:</span>
                  <span>{formatCurrency(totals.totalBalance)}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-black text-pink-600 uppercase italic">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(finalBalance)}</span>
                </div>
              </div>
            </div>

            {/* Branded Footer */}
            <div className="pt-16 border-t flex justify-between items-center opacity-30">
               <div className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-500">Impexina Matrix • Kavya Accounts System</div>
               <img src="/logo.png" className="h-6 grayscale opacity-50" alt="" />
            </div>
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-md flex flex-col items-center justify-center">
            <Loader2 className="w-16 h-16 animate-spin text-pink-600 mb-6" />
            <p className="text-lg font-black text-slate-900 uppercase tracking-widest italic animate-pulse">Archiving Records...</p>
          </div>
        )}
      </div>
    </div>
  );
}
