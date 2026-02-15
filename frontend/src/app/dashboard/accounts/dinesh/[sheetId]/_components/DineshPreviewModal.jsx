"use client";

import React, { useState, useRef } from "react";
import { 
  X, FileSpreadsheet, FileText, Loader2, Printer, 
  TrendingUp, Wallet, CheckCircle2, Clock
} from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

export default function DineshPreviewModal({ 
  isOpen, 
  onClose, 
  sheet,
  entries,
  totals
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
          orientation: "portrait",
          unit: "px",
          format: "a4"
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${sheet.title}.pdf`);
        toast.success("PDF Generated Successfully");
      } else {
        const link = document.createElement("a");
        link.download = `${sheet.title}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        toast.success("Image Saved Successfully");
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
        ['SUPPLIER', 'DATE', 'BOOKING', 'RATE', 'TOTAL', 'PAID', 'BALANCE', 'STATUS'],
        ...entries.map(e => [
          e.supplier,
          formatDate(e.paymentDate),
          e.booking || 0,
          e.rate || 0,
          e.total || 0,
          e.paid || 0,
          e.balance || 0,
          e.isPaid ? 'PAID' : 'PENDING'
        ]),
        [],
        ['', '', '', 'GRAND TOTALS', totals.totalPayable, totals.totalPaid, totals.totalBalance, '']
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Logistics Ledger');
      XLSX.writeFile(wb, `${sheet.title}.xlsx`);
      toast.success("Excel Sheet Downloaded");
    } catch (error) {
      toast.error("Excel Export Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-5xl h-[92vh] rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-8 py-5 border-b flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
              Logistics Preview
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Dineshbhai Central Booking Ledger</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all text-xs font-bold uppercase tracking-wider">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={handleDownloadExcel} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-100">
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </button>
            <button onClick={() => performExport('pdf')} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-100">
              <FileText className="w-4 h-4" /> PDF
            </button>
            <button onClick={onClose} className="ml-4 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 transition-colors border border-slate-100">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-y-auto p-12 bg-slate-100/50 print:bg-white print:p-0">
          <div 
            ref={previewRef}
            className="bg-white p-16 shadow-2xl border border-slate-200 mx-auto max-w-[850px] space-y-10 print:shadow-none print:border-none print:p-6 rounded-sm"
          >
            {/* Header */}
            <div className="flex justify-between items-start border-b-8 border-slate-900 pb-8">
              <div>
                <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-3">
                  Logistics & Booking Ledger
                </h1>
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-600 text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                    {sheet.title}
                  </div>
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                    Generated: {new Date().toLocaleDateString('en-GB')}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Sheet ID</div>
                <div className="font-mono text-sm font-bold text-slate-900">#DBS-{sheet.id.slice(-6).toUpperCase()}</div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-6">
              <div className="p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl flex flex-col justify-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                   Total Payable
                </p>
                <p className="text-3xl font-black text-slate-900 tracking-tight leading-none italic">
                  ₹{totals.totalPayable.toLocaleString()}
                </p>
              </div>
              <div className="p-6 bg-emerald-50 border-2 border-emerald-100 rounded-2xl flex flex-col justify-center">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" /> Total Paid
                </p>
                <p className="text-3xl font-black text-emerald-700 tracking-tight leading-none italic">
                  ₹{totals.totalPaid.toLocaleString()}
                </p>
              </div>
              <div className="p-6 bg-amber-50 border-2 border-amber-100 rounded-2xl flex flex-col justify-center">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                  <Clock className="w-3 h-3" /> Balance Due
                </p>
                <p className="text-3xl font-black text-slate-900 tracking-tight leading-none italic">
                  ₹{totals.totalBalance.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Table */}
            <div className="border-4 border-slate-900 rounded-xl overflow-hidden shadow-2xl shadow-slate-200">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-black uppercase tracking-widest border-b-4 border-slate-900">
                    <th className="px-4 py-5 text-left border-r border-slate-700">Supplier / Ref</th>
                    <th className="px-4 py-5 text-center border-r border-slate-700">Date</th>
                    <th className="px-4 py-5 text-right border-r border-slate-700">Calc</th>
                    <th className="px-4 py-5 text-right border-r border-slate-700 w-32">Amount</th>
                    <th className="px-4 py-5 text-right border-r border-slate-700 w-32">Paid</th>
                    <th className="px-4 py-5 text-right w-32">Balance</th>
                  </tr>
                </thead>
                <tbody className="font-bold divide-y divide-slate-100">
                  {entries.map((e, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <td className="px-4 py-4 border-r border-slate-100">
                        <div className="text-slate-900 uppercase font-black">{e.supplier}</div>
                        {e.clientRef && <div className="text-[9px] text-slate-400 mt-0.5">{e.clientRef}</div>}
                      </td>
                      <td className="px-4 py-4 text-center border-r border-slate-100 text-slate-500 font-mono">
                        {formatDate(e.paymentDate)}
                      </td>
                      <td className="px-4 py-4 text-right border-r border-slate-100 text-[10px] text-slate-400">
                        {e.booking} × {e.rate}
                      </td>
                      <td className="px-4 py-4 text-right border-r border-slate-100 font-black text-slate-900">
                        ₹{e.total.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-right border-r border-slate-100 font-bold text-emerald-600">
                        ₹{e.paid ? e.paid.toLocaleString() : '0'}
                      </td>
                      <td className={`px-4 py-4 text-right font-black ${e.balance > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                        ₹{e.balance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white font-black border-t-8 border-slate-900 uppercase tracking-widest text-[10px]">
                    <td colSpan="3" className="px-4 py-6 text-right">Ledger Summary Totals</td>
                    <td className="px-4 py-6 text-right font-mono text-xs">₹{totals.totalPayable.toLocaleString()}</td>
                    <td className="px-4 py-6 text-right font-mono text-xs">₹{totals.totalPaid.toLocaleString()}</td>
                    <td className="px-4 py-6 text-right font-mono text-xs italic">₹{totals.totalBalance.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Verification Footer */}
            <div className="pt-12 border-t font-black uppercase tracking-[0.4em] text-[8px] text-slate-300 flex justify-between">
              <span>Verified Logistics Statement • {sheet.status} Mode</span>
              <span>Impexina Financial Hub</span>
            </div>
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mb-4" />
            <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Generating Document...</p>
          </div>
        )}
      </div>
    </div>
  );
}
