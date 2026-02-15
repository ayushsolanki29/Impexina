"use client";

import React, { useState, useRef } from "react";
import { 
  X, FileSpreadsheet, FileText, Image as ImageIcon, 
  Loader2, Printer, Globe, Wallet
} from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

export default function PartnerPreviewModal({ 
  isOpen, 
  onClose, 
  sheetName,
  rows,
  totals,
  partnerName = "David",
  themeColor = "blue"
}) {
  const [loading, setLoading] = useState(false);
  const previewRef = useRef(null);

  if (!isOpen) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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
        pdf.save(`${sheetName}.pdf`);
        toast.success("PDF generated");
      } else {
        const link = document.createElement("a");
        link.download = `${sheetName}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        toast.success("Image downloaded");
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
        ['DATE', 'PARTICULARS', 'DEBIT (RMB)', 'CREDIT (RMB)', 'DEBIT (USD)', 'CREDIT (USD)'],
        ...rows.map(r => [
          formatDate(r.date),
          r.particulars || '',
          r.debitRMB || 0,
          r.creditRMB || 0,
          r.debitUSD || 0,
          r.creditUSD || 0
        ]),
        ['', 'TOTALS', totals.dRMB, totals.cRMB, totals.dUSD, totals.cUSD],
        ['', 'NET BALANCE', totals.dRMB - totals.cRMB, '', totals.dUSD - totals.cUSD, '']
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Forex Ledger');
      XLSX.writeFile(wb, `${sheetName}.xlsx`);
      toast.success("Excel downloaded");
    } catch (error) {
      toast.error("Excel export failed");
    } finally {
      setLoading(false);
    }
  };

  const netRMB = totals.dRMB - totals.cRMB;
  const netUSD = totals.dUSD - totals.cUSD;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-white">
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Partner Preview</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{partnerName}'s Account Ledger</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider shadow-lg">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={handleDownloadExcel} className="p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg">
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </button>
            <button onClick={() => performExport('pdf')} className="p-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg">
              <FileText className="w-4 h-4" /> PDF
            </button>
            <button onClick={onClose} className="ml-4 p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-y-auto p-12 bg-slate-50 print:bg-white print:p-0">
          <div 
            ref={previewRef}
            className="bg-white p-12 shadow-sm border border-slate-200 mx-auto max-w-[800px] space-y-8 print:shadow-none print:border-none print:p-4"
          >
            {/* Header Section */}
            <div className="flex justify-between items-start border-b-4 border-slate-900 pb-6">
              <div>
                <h1 className={`text-4xl font-black text-${themeColor}-600 uppercase tracking-tighter leading-none`}>
                  Forex Ledger
                </h1>
                <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] mt-2">
                  Partner: {partnerName} • {sheetName}
                </p>
              </div>
              <div className="text-right">
                <div className="bg-slate-900 text-white px-4 py-1 rounded text-[10px] font-black uppercase tracking-widest">
                  Statement Date
                </div>
                <p className="text-sm font-bold text-slate-800 mt-1">{new Date().toLocaleDateString('en-GB')}</p>
              </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className={`p-6 rounded-2xl bg-amber-50 border-2 border-amber-100`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">RMB Net Balance</p>
                </div>
                <p className="text-3xl font-black text-slate-900 font-mono">¥ {formatCurrency(netRMB)}</p>
              </div>
              <div className={`p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-100`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                    <Globe className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">USD Net Balance</p>
                </div>
                <p className="text-3xl font-black text-slate-900 font-mono">$ {formatCurrency(netUSD)}</p>
              </div>
            </div>

            {/* Main Table */}
            <div className="border-2 border-slate-900 rounded-xl overflow-hidden">
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-black uppercase tracking-widest">
                    <th className="px-3 py-4 text-left border-r border-slate-700">Date</th>
                    <th className="px-3 py-4 text-left border-r border-slate-700">Particulars</th>
                    <th className="px-3 py-4 text-right border-r border-slate-700">RMB DR</th>
                    <th className="px-3 py-4 text-right border-r border-slate-700">RMB CR</th>
                    <th className="px-3 py-4 text-right border-r border-slate-700">USD DR</th>
                    <th className="px-3 py-4 text-right">USD CR</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-100 font-bold">
                  {rows.map((r, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <td className="px-3 py-3 border-r border-slate-100">{formatDate(r.date)}</td>
                      <td className="px-3 py-3 border-r border-slate-100 text-slate-900 uppercase">{r.particulars || '-'}</td>
                      <td className="px-3 py-3 border-r border-slate-100 text-right font-mono text-slate-600 italic">
                        {r.debitRMB ? formatCurrency(r.debitRMB) : '-'}
                      </td>
                      <td className="px-3 py-3 border-r border-slate-100 text-right font-mono text-red-600 italic">
                        {r.creditRMB ? formatCurrency(r.creditRMB) : '-'}
                      </td>
                      <td className="px-3 py-3 border-r border-slate-100 text-right font-mono text-slate-600 italic">
                        {r.debitUSD ? formatCurrency(r.debitUSD) : '-'}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-red-600 italic">
                        {r.creditUSD ? formatCurrency(r.creditUSD) : '-'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-900 text-white font-black">
                    <td colSpan="2" className="px-3 py-4 text-right uppercase tracking-[0.2em]">Summary Totals</td>
                    <td className="px-3 py-4 text-right font-mono">{formatCurrency(totals.dRMB)}</td>
                    <td className="px-3 py-4 text-right font-mono">{formatCurrency(totals.cRMB)}</td>
                    <td className="px-3 py-4 text-right font-mono">{formatCurrency(totals.dUSD)}</td>
                    <td className="px-3 py-4 text-right font-mono">{formatCurrency(totals.cUSD)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="pt-8 border-t-2 border-slate-100 flex justify-between items-center opacity-50">
              <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                Impexina Financial Matrix • Digital Ledger
              </div>
              <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                Generated By Antigravity
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
