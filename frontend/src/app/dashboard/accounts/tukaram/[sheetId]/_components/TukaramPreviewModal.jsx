"use client";

import React, { useState, useRef } from "react";
import { 
  X, FileSpreadsheet, FileText, Image as ImageIcon, 
  Loader2, Printer
} from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

export default function TukaramPreviewModal({ 
  isOpen, 
  onClose, 
  sheet,
  entries,
  totals,
  finalBalance
}) {
  const [loading, setLoading] = useState(false);
  const previewRef = useRef(null);

  if (!isOpen) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '1400px';
    iframe.style.height = '2000px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    try {
      setLoading(true);

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { margin: 0; padding: 0; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; -webkit-print-color-adjust: exact; }
              * { box-sizing: border-box; }
              @media print {
                .print-area { padding: 0 !important; border: none !important; shadow: none !important; }
              }
            </style>
          </head>
          <body>
            <div id="capture-mount" style="display: inline-block; width: 100%;"></div>
          </body>
        </html>
      `);
      doc.close();

      const content = previewRef.current.cloneNode(true);
      
      const stripClasses = (node) => {
        if (node.nodeType === 1) {
          node.removeAttribute('class');
          node.removeAttribute('className');
          if (!node.style.borderColor) node.style.borderColor = '#e2e8f0';
          Array.from(node.children).forEach(stripClasses);
        }
      };
      stripClasses(content);
      
      const mountPoint = doc.getElementById('capture-mount');
      mountPoint.appendChild(content);

      const images = Array.from(doc.images);
      await Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      const canvas = await html2canvas(mountPoint.firstElementChild, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
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
        pdf.save(`${sheet?.title || 'tukaram-ji-sheet'}.pdf`);
        toast.success("PDF generated successfully");
      } else {
        const link = document.createElement("a");
        link.download = `${sheet?.title || 'tukaram-ji-sheet'}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        toast.success("Image downloaded");
      }

    } catch (error) {
      console.error("Export Error:", error);
      toast.error(`Failed to export ${format.toUpperCase()}`);
    } finally {
      document.body.removeChild(iframe);
      setLoading(false);
    }
  };

  const handleDownloadExcel = () => {
    try {
      setLoading(true);
      const wb = XLSX.utils.book_new();

      const data = [
        ['SR', 'CONT CODE', 'CTN', 'LOADING DATE', 'DLY DATE', 'PARTICULAR', 'CHARGES', 'SCANNING', 'DC', 'TOTAL', 'PAID', 'PAYMENT DATE', 'NOTE'],
        ['-', 'OPENING BALANCE', '', '', '', '', '', '', '', '', sheet?.openingBalance || 0, '', ''],
        ...entries.map((e, idx) => [
          idx + 1,
          e.containerCode || '',
          e.totalCtn || 0,
          e.loadingDate ? formatDate(e.loadingDate) : '',
          e.deliveryDate ? formatDate(e.deliveryDate) : '',
          e.particular || '',
          e.charges || 0,
          e.scanning || 0,
          e.dc || 0,
          e.total || 0,
          e.paid || 0,
          e.paymentDate ? formatDate(e.paymentDate) : '',
          e.note || ''
        ]),
        ['', 'TOTAL', '', '', '', '', totals.totalCharges, totals.totalScanning, totals.totalDc, totals.totalPayable, totals.totalPaid, '', ''],
        ['', 'BALANCE', '', '', '', '', '', '', '', '', finalBalance, '', '']
      ];

      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'TukaramJI');
      XLSX.writeFile(wb, `${sheet?.title || 'tukaram-ji-sheet'}.xlsx`);
      toast.success("Excel downloaded");
    } catch (error) {
      console.error("Excel Export Error:", error);
      toast.error("Failed to download Excel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-[1400px] h-[90vh] rounded-xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-white print:hidden">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Account Preview</h2>
            <p className="text-xs text-slate-500 font-medium">
              TukaramJI • {sheet?.title}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.print()} 
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-semibold text-xs shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleDownloadExcel}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-bold bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
            </button>
            <button
              onClick={() => performExport('pdf')}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
            <button
              onClick={() => performExport('image')}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <ImageIcon className="w-3.5 h-3.5" /> Image
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-100 print:bg-white print:p-0">
          <div 
            ref={previewRef}
            className="print-area space-y-6 max-w-[1300px] mx-auto bg-white p-8 shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-4"
          >
            {/* Document Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                  TukaramJI Account Ledger
                </h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">
                  {sheet?.title} {sheet?.description && `| ${sheet.description}`}
                </p>
              </div>
              <div className="text-right">
                <div className="inline-block bg-slate-100 px-3 py-1 rounded">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Generated</p>
                  <p className="text-sm font-bold text-slate-800">{new Date().toLocaleDateString('en-GB')}</p>
                </div>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Opening Balance</p>
                <p className="text-lg font-black text-slate-700">₹{formatCurrency(sheet?.openingBalance)}</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Total Charges</p>
                <p className="text-lg font-black text-blue-700">₹{formatCurrency(totals.totalPayable)}</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Total Paid</p>
                <p className="text-lg font-black text-emerald-700">₹{formatCurrency(totals.totalPaid)}</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg">
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">Final Balance</p>
                <p className="text-lg font-black text-amber-700">₹{formatCurrency(finalBalance)}</p>
              </div>
            </div>

            {/* Entries Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider">
                    <th className="px-2 py-3 text-left border-r border-slate-700 w-10">SR</th>
                    <th className="px-2 py-3 text-left border-r border-slate-700">CONT CODE</th>
                    <th className="px-2 py-3 text-center border-r border-slate-700 w-12">CTN</th>
                    <th className="px-2 py-3 text-left border-r border-slate-700 w-24">Loading</th>
                    <th className="px-2 py-3 text-left border-r border-slate-700 w-24">Delivery</th>
                    <th className="px-2 py-3 text-left border-r border-slate-700">Particular</th>
                    <th className="px-2 py-3 text-right border-r border-slate-700 w-20">Charges</th>
                    <th className="px-2 py-3 text-right border-r border-slate-700 w-20">Scanning</th>
                    <th className="px-2 py-3 text-right border-r border-slate-700 w-20">DC</th>
                    <th className="px-2 py-3 text-right border-r border-slate-700 w-24 bg-slate-800">Total</th>
                    <th className="px-2 py-3 text-right border-r border-slate-700 w-24">Paid</th>
                    <th className="px-2 py-3 text-left border-r border-slate-700 w-24">Date</th>
                    <th className="px-2 py-3 text-left">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {/* Opening Balance Row */}
                  <tr className="bg-slate-50 font-bold">
                    <td className="px-2 py-2 border-r border-slate-200 text-center text-slate-400">-</td>
                    <td colSpan="9" className="px-2 py-2 border-r border-slate-200 text-slate-500 uppercase tracking-widest">Opening Balance Carried Forward</td>
                    <td className="px-2 py-2 border-r border-slate-200 text-right font-mono text-slate-900">₹{formatCurrency(sheet?.openingBalance)}</td>
                    <td colSpan="2" className="px-2 py-2"></td>
                  </tr>

                  {entries.map((entry, idx) => (
                    <tr key={entry.id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-2 py-2 border-r border-slate-100 text-slate-400 font-medium">{idx + 1}</td>
                      <td className="px-2 py-2 border-r border-slate-100 text-slate-900 font-bold uppercase">{entry.containerCode || '-'}</td>
                      <td className="px-2 py-2 border-r border-slate-100 text-center font-medium">{entry.totalCtn || '-'}</td>
                      <td className="px-2 py-2 border-r border-slate-100 text-slate-600">{formatDate(entry.loadingDate)}</td>
                      <td className="px-2 py-2 border-r border-slate-100 text-slate-600">{formatDate(entry.deliveryDate)}</td>
                      <td className="px-2 py-2 border-r border-slate-100 text-slate-700 font-medium">{entry.particular || '-'}</td>
                      <td className="px-2 py-2 border-r border-slate-100 text-right font-mono text-slate-600">₹{formatCurrency(entry.charges)}</td>
                      <td className="px-2 py-2 border-r border-slate-100 text-right font-mono text-slate-600">₹{formatCurrency(entry.scanning)}</td>
                      <td className="px-2 py-2 border-r border-slate-100 text-right font-mono text-slate-600">₹{formatCurrency(entry.dc)}</td>
                      <td className="px-2 py-2 border-r border-slate-100 text-right font-mono font-black text-slate-900 bg-slate-50/50">₹{formatCurrency(entry.total)}</td>
                      <td className="px-2 py-2 border-r border-slate-100 text-right font-mono text-emerald-600 font-bold">₹{formatCurrency(entry.paid)}</td>
                      <td className="px-2 py-2 border-r border-slate-100 text-slate-600">{formatDate(entry.paymentDate)}</td>
                      <td className="px-2 py-2 text-slate-500 italic max-w-xs truncate">{entry.note || '-'}</td>
                    </tr>
                  ))}
                  
                  {/* Summary Totals Row */}
                  <tr className="bg-slate-100 font-black border-t-2 border-slate-300 uppercase">
                    <td colSpan="6" className="px-2 py-3 text-right border-r border-slate-200 tracking-widest text-slate-500">Total Account Summary</td>
                    <td className="px-2 py-3 text-right border-r border-slate-200 font-mono">₹{formatCurrency(totals.totalCharges)}</td>
                    <td className="px-2 py-3 text-right border-r border-slate-200 font-mono">₹{formatCurrency(totals.totalScanning)}</td>
                    <td className="px-2 py-3 text-right border-r border-slate-200 font-mono">₹{formatCurrency(totals.totalDc)}</td>
                    <td className="px-2 py-3 text-right border-r border-slate-200 font-mono bg-slate-200">₹{formatCurrency(totals.totalPayable)}</td>
                    <td className="px-2 py-3 text-right border-r border-slate-200 font-mono text-emerald-700">₹{formatCurrency(totals.totalPaid)}</td>
                    <td colSpan="2" className="px-2 py-3"></td>
                  </tr>

                  {/* Net Balance Row */}
                  <tr className="bg-amber-50 font-black border-t border-amber-200 uppercase">
                    <td colSpan="10" className="px-2 py-3 text-right border-r border-amber-200 tracking-widest text-amber-600">Grand Total Balance</td>
                    <td className="px-2 py-3 text-right border-r border-amber-200 font-mono text-amber-700 bg-amber-100/50">₹{formatCurrency(finalBalance)}</td>
                    <td colSpan="2" className="px-2 py-3"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Fine Print */}
            <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-[8px] text-slate-400 font-bold uppercase tracking-widest">
              <div>Impexina Digital Ledger • TukaramJI Logistics Management</div>
              <div className="flex gap-4">
                <span>Total Containers: {[...new Set(entries.map(e => e.containerCode))].length}</span>
                <span>Generated: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-3 bg-white border-t text-[10px] text-slate-400 flex justify-between items-center print:hidden">
          <span className="font-bold uppercase tracking-widest">Impexina Financial Management</span>
          <span className="font-medium italic">Confidential Document</span>
        </div>
      </div>
    </div>
  );
}
