"use client";

import React, { useState, useRef } from "react";
import { 
  X, FileSpreadsheet, FileText, Image as ImageIcon, 
  Loader2, Printer
} from "lucide-react";
import { toast } from "sonner";
import API from "@/lib/api";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

export default function AccountsPreviewModal({ 
  isOpen, 
  onClose, 
  client, 
  expenseTransactions, 
  trfTransactions, 
  sheetName 
}) {
  const [loading, setLoading] = useState(false);
  const previewRef = useRef(null);

  if (!isOpen) return null;

  // Calculate totals
  const expenseTotal = expenseTransactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  const expensePaid = expenseTransactions.reduce((sum, t) => sum + (parseFloat(t.paid) || 0), 0);
  const expenseBalance = expenseTotal - expensePaid;

  const trfTotal = trfTransactions.reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0);
  const trfPaid = trfTransactions.reduce((sum, t) => sum + (parseFloat(t.paid) || 0), 0);
  const trfBalance = trfTotal - trfPaid;

  // Export functions
  const performExport = async (format) => {
    if (!previewRef.current) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '1600px';
    iframe.style.height = '2500px';
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
        pdf.save(`${client?.name || 'account'}-${sheetName || 'ledger'}.pdf`);
        toast.success("PDF generated successfully");
      } else {
        const link = document.createElement("a");
        link.download = `${client?.name || 'account'}-${sheetName || 'ledger'}.png`;
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

  const handleDownloadPDF = () => performExport('pdf');
  const handleDownloadImage = () => performExport('image');

  const handleDownloadExcel = () => {
    try {
      setLoading(true);
      const wb = XLSX.utils.book_new();

      // Expense Sheet
      const expenseData = [
        ['CONTAINER', 'DELIVERY', 'PARTICULARS', 'CBM', 'WEIGHT', 'RATE', 'TOTAL', 'PAID', 'PAYMENT DATE', 'MODE'],
        ...expenseTransactions.map(t => [
          t.containerCode || '',
          t.deliveryDate ? new Date(t.deliveryDate).toLocaleDateString() : '',
          t.particulars || '',
          t.quantity || '',
          t.weight || '',
          t.rate || '',
          t.amount || 0,
          t.paid || 0,
          t.paymentDate ? new Date(t.paymentDate).toLocaleDateString() : '',
          t.paymentMode || ''
        ]),
        ['', '', 'TOTAL', '', '', '', expenseTotal, expensePaid, '', ''],
        ['', '', 'BALANCE', '', '', '', expenseBalance, '', '', '']
      ];
      const expenseWs = XLSX.utils.aoa_to_sheet(expenseData);
      XLSX.utils.book_append_sheet(wb, expenseWs, 'EXPENSE');

      // TRF Sheet
      const trfData = [
        ['PARTICULAR', 'DATE', 'AMOUNT', 'BOOKING', 'RATE', 'TOTAL', 'PAID', 'DATE', 'MODE'],
        ...trfTransactions.map(t => [
          t.particular || '',
          t.transactionDate ? new Date(t.transactionDate).toLocaleDateString() : '',
          t.amount || 0,
          t.booking || 0,
          t.rate || 0,
          t.total || 0,
          t.paid || 0,
          t.paymentDate ? new Date(t.paymentDate).toLocaleDateString() : '',
          t.paymentMode || ''
        ]),
        ['', '', '', '', '', 'TOTAL', trfTotal, trfPaid, ''],
        ['', '', '', '', '', 'BALANCE', trfBalance, '', '']
      ];
      const trfWs = XLSX.utils.aoa_to_sheet(trfData);
      XLSX.utils.book_append_sheet(wb, trfWs, 'TRF');

      XLSX.writeFile(wb, `${client?.name || 'account'}-${sheetName || 'ledger'}.xlsx`);
      toast.success("Excel downloaded");
    } catch (error) {
      console.error("Excel Export Error:", error);
      toast.error("Failed to download Excel");
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-[1600px] h-[90vh] rounded-xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-white print:hidden">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Account Preview</h2>
            <p className="text-xs text-slate-500 font-medium">
              {client?.name} • {sheetName || 'Entire Ledger'}
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
              onClick={handleDownloadPDF}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
            <button
              onClick={handleDownloadImage}
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
            className="print-area space-y-6 max-w-[1500px] mx-auto bg-white p-8 shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-4"
          >
            {/* Document Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                  {client?.name || 'Client'} Account Ledger
                </h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">
                  {sheetName || 'ENTIRE LEDGER'}
                </p>
              </div>
              <div className="text-right">
                <div className="inline-block bg-slate-100 px-3 py-1 rounded">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Generated</p>
                  <p className="text-sm font-bold text-slate-800">{new Date().toLocaleDateString('en-GB')}</p>
                </div>
              </div>
            </div>

            {/* Side by Side Sheets */}
            <div className="grid grid-cols-2 gap-6">
              {/* EXPENSE Sheet (Blue) */}
              <div className="border-2 border-blue-200 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
                  <h3 className="text-white font-bold text-sm uppercase tracking-wider">
                    EXPENSE SHEET
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] border-collapse">
                    <thead>
                      <tr className="bg-blue-50 text-blue-700 font-bold uppercase tracking-wider border-b border-blue-200">
                        <th className="px-2 py-2 text-left border-r border-blue-200">Container</th>
                        <th className="px-2 py-2 text-left border-r border-blue-200">Delivery</th>
                        <th className="px-2 py-2 text-left border-r border-blue-200">Particulars</th>
                        <th className="px-2 py-2 text-right border-r border-blue-200">CBM</th>
                        <th className="px-2 py-2 text-right border-r border-blue-200">Weight</th>
                        <th className="px-2 py-2 text-right border-r border-blue-200">Rate</th>
                        <th className="px-2 py-2 text-right border-r border-blue-200 bg-blue-100">Total</th>
                        <th className="px-2 py-2 text-right border-r border-blue-200">Paid</th>
                        <th className="px-2 py-2 text-left border-r border-blue-200">Date</th>
                        <th className="px-2 py-2 text-left">Mode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50">
                      {expenseTransactions.length > 0 ? (
                        expenseTransactions.map((txn, idx) => (
                          <tr key={txn.id || idx} className="hover:bg-blue-50/50">
                            <td className="px-2 py-2 border-r border-blue-100 text-slate-700 font-medium">
                              {txn.containerCode || '-'}
                            </td>
                            <td className="px-2 py-2 border-r border-blue-100 text-slate-600">
                              {formatDate(txn.deliveryDate)}
                            </td>
                            <td className="px-2 py-2 border-r border-blue-100 text-slate-900 font-semibold">
                              {txn.particulars || '-'}
                            </td>
                            <td className="px-2 py-2 border-r border-blue-100 text-right text-slate-600">
                              {txn.quantity || '-'}
                            </td>
                            <td className="px-2 py-2 border-r border-blue-100 text-right text-slate-600">
                              {txn.weight || '-'}
                            </td>
                            <td className="px-2 py-2 border-r border-blue-100 text-right text-slate-600">
                              {txn.rate || '-'}
                            </td>
                            <td className="px-2 py-2 border-r border-blue-100 text-right font-bold bg-blue-50">
                              ₹{formatCurrency(txn.amount)}
                            </td>
                            <td className="px-2 py-2 border-r border-blue-100 text-right font-bold text-emerald-600">
                              ₹{formatCurrency(txn.paid)}
                            </td>
                            <td className="px-2 py-2 border-r border-blue-100 text-slate-500">
                              {formatDate(txn.paymentDate)}
                            </td>
                            <td className="px-2 py-2 text-slate-500 text-xs">
                              {txn.paymentMode || '-'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="10" className="px-4 py-8 text-center text-slate-400 text-xs">
                            No expense transactions
                          </td>
                        </tr>
                      )}
                      {/* Totals Row */}
                      <tr className="bg-blue-50 font-bold border-t-2 border-blue-300">
                        <td colSpan="6" className="px-2 py-2 text-right border-r border-blue-200">
                          TOTAL
                        </td>
                        <td className="px-2 py-2 text-right border-r border-blue-200 bg-blue-100">
                          ₹{formatCurrency(expenseTotal)}
                        </td>
                        <td className="px-2 py-2 text-right border-r border-blue-200 text-emerald-600">
                          ₹{formatCurrency(expensePaid)}
                        </td>
                        <td colSpan="2" className="px-2 py-2"></td>
                      </tr>
                      <tr className="bg-amber-50 font-bold">
                        <td colSpan="6" className="px-2 py-2 text-right border-r border-blue-200">
                          BALANCE
                        </td>
                        <td colSpan="4" className="px-2 py-2 text-right text-amber-700">
                          ₹{formatCurrency(expenseBalance)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TRF Sheet (Yellow/Amber) */}
              <div className="border-2 border-amber-200 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3">
                  <h3 className="text-white font-bold text-sm uppercase tracking-wider">
                    TRF SHEET
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] border-collapse">
                    <thead>
                      <tr className="bg-amber-50 text-amber-700 font-bold uppercase tracking-wider border-b border-amber-200">
                        <th className="px-2 py-2 text-left border-r border-amber-200">Particular</th>
                        <th className="px-2 py-2 text-left border-r border-amber-200">Date</th>
                        <th className="px-2 py-2 text-right border-r border-amber-200">Amount</th>
                        <th className="px-2 py-2 text-right border-r border-amber-200">Booking</th>
                        <th className="px-2 py-2 text-right border-r border-amber-200">Rate</th>
                        <th className="px-2 py-2 text-right border-r border-amber-200 bg-amber-100">Total</th>
                        <th className="px-2 py-2 text-right border-r border-amber-200">Paid</th>
                        <th className="px-2 py-2 text-left border-r border-amber-200">Date</th>
                        <th className="px-2 py-2 text-left">Mode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50">
                      {trfTransactions.length > 0 ? (
                        trfTransactions.map((txn, idx) => (
                          <tr key={txn.id || idx} className="hover:bg-amber-50/50">
                            <td className="px-2 py-2 border-r border-amber-100 text-slate-900 font-semibold">
                              {txn.particular || '-'}
                            </td>
                            <td className="px-2 py-2 border-r border-amber-100 text-slate-600">
                              {formatDate(txn.transactionDate)}
                            </td>
                            <td className="px-2 py-2 border-r border-amber-100 text-right text-slate-600">
                              ₹{formatCurrency(txn.amount)}
                            </td>
                            <td className="px-2 py-2 border-r border-amber-100 text-right text-slate-600">
                              ₹{formatCurrency(txn.booking)}
                            </td>
                            <td className="px-2 py-2 border-r border-amber-100 text-right text-slate-600">
                              {txn.rate || '-'}
                            </td>
                            <td className="px-2 py-2 border-r border-amber-100 text-right font-bold bg-amber-50">
                              ₹{formatCurrency(txn.total)}
                            </td>
                            <td className="px-2 py-2 border-r border-amber-100 text-right font-bold text-emerald-600">
                              ₹{formatCurrency(txn.paid)}
                            </td>
                            <td className="px-2 py-2 border-r border-amber-100 text-slate-500">
                              {formatDate(txn.paymentDate)}
                            </td>
                            <td className="px-2 py-2 text-slate-500 text-xs">
                              {txn.paymentMode || '-'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="9" className="px-4 py-8 text-center text-slate-400 text-xs">
                            No TRF transactions
                          </td>
                        </tr>
                      )}
                      {/* Totals Row */}
                      <tr className="bg-amber-50 font-bold border-t-2 border-amber-300">
                        <td colSpan="5" className="px-2 py-2 text-right border-r border-amber-200">
                          TOTAL
                        </td>
                        <td className="px-2 py-2 text-right border-r border-amber-200 bg-amber-100">
                          ₹{formatCurrency(trfTotal)}
                        </td>
                        <td className="px-2 py-2 text-right border-r border-amber-200 text-emerald-600">
                          ₹{formatCurrency(trfPaid)}
                        </td>
                        <td colSpan="2" className="px-2 py-2"></td>
                      </tr>
                      <tr className="bg-amber-50 font-bold">
                        <td colSpan="5" className="px-2 py-2 text-right border-r border-amber-200">
                          BALANCE
                        </td>
                        <td colSpan="4" className="px-2 py-2 text-right text-amber-700">
                          ₹{formatCurrency(trfBalance)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Overall Balance */}
            <div className="mt-6 pt-4 border-t-2 border-slate-300">
              <div className="flex justify-end">
                <div className="bg-yellow-50 border-2 border-yellow-300 px-6 py-3 rounded-lg">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    TOTAL BALANCE
                  </p>
                  <p className="text-xl font-black text-slate-900">
                    ₹{formatCurrency(expenseBalance + trfBalance)}
                  </p>
                </div>
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
