"use client";

import React, { useState, useRef } from "react";
import { 
  X, FileSpreadsheet, FileText, Image as ImageIcon, 
  Loader2, Printer
} from "lucide-react";
import { toast } from "sonner";
import API from "@/lib/api";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx-js-style";

export default function AccountsPreviewModal({ 
  isOpen, 
  onClose, 
  client, 
  expenseTransactions, 
  trfTransactions, 
  sheetName,
  dateRange
}) {
  const [loading, setLoading] = useState(false);
  const previewRef = useRef(null);

  if (!isOpen) return null;

  const toSafeFileBase = (value) => {
    const raw = String(value || "")
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[\\/:*?"<>|]+/g, "-");
    return raw || "account_ledger";
  };

  // Calculate totals
  const expenseTotal = expenseTransactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  const expensePaid = expenseTransactions.reduce((sum, t) => sum + (parseFloat(t.paid) || 0), 0);
  const expenseBalance = expenseTotal - expensePaid;

  const trfTotal = trfTransactions.reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0);
  const trfPaid = trfTransactions.reduce((sum, t) => sum + (parseFloat(t.paid) || 0), 0);
  const trfBalance = trfTotal - trfPaid;

  // Export functions
  const captureCanvas = async () => {
    if (!previewRef.current || typeof document === "undefined") return null;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-9999px";
    iframe.style.top = "0";
    iframe.style.width = "1800px";
    iframe.style.height = "2400px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    try {
      const stylesHtml = Array.from(
        document.querySelectorAll("style, link[rel=\"stylesheet\"]"),
      )
        .map((n) => n.outerHTML)
        .join("");

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <base href="${window.location.origin}/" />
            ${stylesHtml}
            <style>
              body { margin: 0; padding: 0; background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              * { box-sizing: border-box; }
              .print-area { margin: 0 auto; }
            </style>
          </head>
          <body>
            <div id="capture-mount" style="display: inline-block; width: 100%; background: #ffffff;"></div>
          </body>
        </html>
      `);
      doc.close();

      const mountPoint = doc.getElementById("capture-mount");
      const content = previewRef.current.cloneNode(true);
      mountPoint.appendChild(content);

      const images = Array.from(doc.images);
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        }),
      );

      return await html2canvas(mountPoint.firstElementChild, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
    } finally {
      document.body.removeChild(iframe);
    }
  };

  const performExport = async (format) => {
    try {
      setLoading(true);
      const canvas = await captureCanvas();
      if (!canvas) return;

      const fileBase = toSafeFileBase(`${client?.name || "account"}-${sheetName || "ledger"}`);

      if (format === "pdf") {
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const pdf = new jsPDF("landscape", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position -= pageHeight;
          pdf.addPage();
          pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(`${fileBase}.pdf`);
        toast.success("PDF generated successfully", { duration: 5000 });
      } else {
        const link = document.createElement("a");
        link.download = `${fileBase}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        toast.success("Image downloaded", { duration: 5000 });
      }
    } catch (error) {
      console.error("Export Error:", error);
      toast.error(`Failed to export ${format.toUpperCase()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => performExport("pdf");
  const handleDownloadImage = () => performExport("image");

  const styleAllCells = (ws) => {
    if (!ws || !ws["!ref"]) return;
    const range = XLSX.utils.decode_range(ws["!ref"]);
    const border = {
      top: { style: "thin", color: { rgb: "CBD5E1" } },
      bottom: { style: "thin", color: { rgb: "CBD5E1" } },
      left: { style: "thin", color: { rgb: "CBD5E1" } },
      right: { style: "thin", color: { rgb: "CBD5E1" } },
    };

    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const ref = XLSX.utils.encode_cell({ r, c });
        const cell = ws[ref];
        if (!cell) continue;
        cell.s = cell.s || {};
        cell.s.border = cell.s.border || border;
        cell.s.alignment = cell.s.alignment || { vertical: "center", wrapText: true };
        cell.s.font = cell.s.font || { name: "Arial", sz: 10 };
      }
    }
  };

  const applyHeaderStyle = (ws, headerRowIndex, fillRgb) => {
    if (!ws || !ws["!ref"]) return;
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let c = range.s.c; c <= range.e.c; c++) {
      const ref = XLSX.utils.encode_cell({ r: headerRowIndex, c });
      const cell = ws[ref];
      if (!cell) continue;
      cell.s = {
        ...(cell.s || {}),
        font: { name: "Arial", sz: 10, bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: fillRgb } },
        alignment: { vertical: "center", horizontal: "center", wrapText: true },
        border: {
          top: { style: "thin", color: { rgb: "1E293B" } },
          bottom: { style: "thin", color: { rgb: "1E293B" } },
          left: { style: "thin", color: { rgb: "1E293B" } },
          right: { style: "thin", color: { rgb: "1E293B" } },
        },
      };
    }
  };

  const setAutoColumnWidths = (ws, rows, min = 8, max = 45) => {
    if (!ws) return;
    const widths = [];
    rows.forEach((row) => {
      row.forEach((v, idx) => {
        const len = String(v ?? "").length;
        widths[idx] = Math.max(widths[idx] || 0, len);
      });
    });
    ws["!cols"] = widths.map((w) => ({ wch: Math.min(Math.max(w + 2, min), max) }));
  };

  const handleDownloadExcel = () => {
    try {
      setLoading(true);
      const wb = XLSX.utils.book_new();

      // Expense Sheet
      const expenseData = [
        [`${client?.name || "Client"} Account Ledger`],
        [sheetName || "ENTIRE LEDGER"],
        [`Generated: ${new Date().toLocaleDateString("en-GB")}`],
        [],
        ['CONTAINER', 'DELIVERY', 'PARTICULARS', 'CBM', 'WEIGHT', 'RATE', 'BASIS', 'TOTAL', 'PAID', 'PAYMENT DATE', 'MODE'],
        ...expenseTransactions.map(t => [
          t.containerCode || '',
          t.deliveryDate ? new Date(t.deliveryDate).toLocaleDateString('en-GB') : '',
          t.particulars || '',
          Number(t.quantity) || 0,
          Number(t.weight) || 0,
          Number(t.rate) || 0,
          t.billingType || 'FLAT',
          Number(t.amount) || 0,
          Number(t.paid) || 0,
          t.paymentDate ? new Date(t.paymentDate).toLocaleDateString('en-GB') : '',
          t.paymentMode || ''
        ]),
        ['', '', 'TOTAL', '', '', '', '', expenseTotal, expensePaid, '', ''],
        ['', '', 'BALANCE', '', '', '', '', expenseBalance, '', '', '']
      ];
      const expenseWs = XLSX.utils.aoa_to_sheet(expenseData);
      expenseWs["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 10 } },
      ];
      applyHeaderStyle(expenseWs, 4, "2563EB");
      styleAllCells(expenseWs);
      setAutoColumnWidths(expenseWs, expenseData);

      const expenseTotalsRow = 5 + expenseTransactions.length;
      const expenseBalanceRow = expenseTotalsRow + 1;
      for (let r = 5; r <= expenseBalanceRow; r++) {
        for (const c of [3, 4, 5, 7, 8]) {
          const ref = XLSX.utils.encode_cell({ r, c });
          if (expenseWs[ref]) expenseWs[ref].z = "#,##0";
        }
      }
      // Totals/balance row highlight
      for (const r of [expenseTotalsRow, expenseBalanceRow]) {
        for (let c = 0; c <= 10; c++) {
          const ref = XLSX.utils.encode_cell({ r, c });
          const cell = expenseWs[ref];
          if (!cell) continue;
          cell.s = {
            ...(cell.s || {}),
            font: { name: "Arial", sz: 10, bold: true },
            fill: { fgColor: { rgb: r === expenseTotalsRow ? "DBEAFE" : "FEF9C3" } },
          };
        }
      }
      XLSX.utils.book_append_sheet(wb, expenseWs, 'EXPENSE');

      // TRF Sheet
      const trfData = [
        [`${client?.name || "Client"} Account Ledger`],
        [sheetName || "ENTIRE LEDGER"],
        [`Generated: ${new Date().toLocaleDateString("en-GB")}`],
        [],
        ['PARTICULAR', 'DATE', 'AMOUNT', 'BOOKING', 'RATE', 'TOTAL', 'PAID', 'PAYMENT DATE', 'MODE'],
        ...trfTransactions.map(t => [
          t.particular || '',
          t.transactionDate ? new Date(t.transactionDate).toLocaleDateString('en-GB') : '',
          Number(t.amount) || 0,
          Number(t.booking) || 0,
          Number(t.rate) || 0,
          Number(t.total) || 0,
          Number(t.paid) || 0,
          t.paymentDate ? new Date(t.paymentDate).toLocaleDateString('en-GB') : '',
          t.paymentMode || ''
        ]),
        ['', '', '', '', 'TOTAL', trfTotal, trfPaid, '', ''],
        ['', '', '', '', 'BALANCE', trfBalance, '', '', '']
      ];
      const trfWs = XLSX.utils.aoa_to_sheet(trfData);
      trfWs["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } },
      ];
      applyHeaderStyle(trfWs, 4, "F59E0B");
      styleAllCells(trfWs);
      setAutoColumnWidths(trfWs, trfData);

      const trfTotalsRow = 5 + trfTransactions.length;
      const trfBalanceRow = trfTotalsRow + 1;
      for (let r = 5; r <= trfBalanceRow; r++) {
        for (const c of [2, 3, 4, 5, 6]) {
          const ref = XLSX.utils.encode_cell({ r, c });
          if (trfWs[ref]) trfWs[ref].z = "#,##0";
        }
      }
      for (const r of [trfTotalsRow, trfBalanceRow]) {
        for (let c = 0; c <= 8; c++) {
          const ref = XLSX.utils.encode_cell({ r, c });
          const cell = trfWs[ref];
          if (!cell) continue;
          cell.s = {
            ...(cell.s || {}),
            font: { name: "Arial", sz: 10, bold: true },
            fill: { fgColor: { rgb: r === trfTotalsRow ? "FFEDD5" : "FEF9C3" } },
          };
        }
      }
      XLSX.utils.book_append_sheet(wb, trfWs, 'TRF');

      const fileBase = toSafeFileBase(`${client?.name || 'account'}-${sheetName || 'ledger'}`);
      XLSX.writeFile(wb, `${fileBase}.xlsx`);
      toast.success("Excel downloaded", { duration: 5000 });
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

  const startPrint = (fileBase) => {
    if (!previewRef.current || typeof document === "undefined") {
      window.print();
      return;
    }

    const existing = document.getElementById("accounts-ledger-print-root");
    if (existing) existing.remove();

    const root = document.createElement("div");
    root.id = "accounts-ledger-print-root";
    root.style.background = "#ffffff";

    const clone = previewRef.current.cloneNode(true);
    root.appendChild(clone);
    document.body.appendChild(root);

    document.body.classList.add("accounts-ledger-printing");
    const originalTitle = document.title;
    document.title = fileBase;

    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      document.title = originalTitle;
      document.body.classList.remove("accounts-ledger-printing");
      root.remove();
    };

    window.addEventListener("afterprint", cleanup, { once: true });
    setTimeout(cleanup, 30_000);
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
  };

  const handlePrint = () => {
    const fileBase = toSafeFileBase(`${client?.name || "account"}-${sheetName || "ledger"}`);
    startPrint(fileBase);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-[1600px] h-[90vh] rounded-xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Responsive Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white print:hidden overflow-x-auto">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 truncate">Account Preview</h2>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">
              {client?.name} • {sheetName || 'Entire Ledger'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button 
              onClick={handlePrint} 
              className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-bold text-[10px] sm:text-xs shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Print
            </button>
            <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
              <button
                onClick={handleDownloadExcel}
                disabled={loading}
                className="px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-1 sm:gap-1.5 shadow-sm disabled:opacity-50"
              >
                <FileSpreadsheet className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> Excel
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={loading}
                className="px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-1 sm:gap-1.5 shadow-sm disabled:opacity-50"
              >
                <FileText className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> PDF
              </button>
              <button
                onClick={handleDownloadImage}
                disabled={loading}
                className="px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1 sm:gap-1.5 shadow-sm disabled:opacity-50"
              >
                <ImageIcon className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> Image
              </button>
            </div>
            <button 
              onClick={onClose}
              className="p-1 sm:p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-8 bg-slate-100 print:bg-white print:p-0">
          <div 
            ref={previewRef}
            className="print-area space-y-6 max-w-[1500px] mx-auto bg-white p-4 sm:p-6 md:p-8 shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-4"
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
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {dateRange?.from || dateRange?.to ? `Period Filtered By ${
                      dateRange.type === 'deliveryDate' ? 'Delivery Date' : 
                      dateRange.type === 'paymentDate' ? 'Payment Date' : 'Entry Date'
                    }` : 'Date Generated'}
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    {dateRange?.from || dateRange?.to 
                      ? `${dateRange.from || '...'} to ${dateRange.to || '...'}`
                      : new Date().toLocaleDateString('en-GB')
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Side by Side Sheets (Responsive Grid) */}
            <div className="accounts-ledger-grid grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* EXPENSE Sheet (Blue) */}
              <div className="accounts-ledger-sheet border-2 border-blue-200 rounded-lg overflow-hidden">
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
                        <th className="px-2 py-2 text-center border-r border-blue-200">Basis</th>
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
                            <td className="px-2 py-2 border-r border-blue-100 text-center text-[8px] font-bold text-blue-600 uppercase">
                              {txn.billingType || 'FLAT'}
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
                        <td colSpan="7" className="px-2 py-2 text-right border-r border-blue-200">
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
                        <td colSpan="7" className="px-2 py-2 text-right border-r border-blue-200">
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
              <div className="accounts-ledger-sheet border-2 border-amber-200 rounded-lg overflow-hidden">
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

        <style jsx global>{`
          @media print {
            /* Let user pick paper size; force landscape layout for wide tables */
            @page { size: landscape; margin: 8mm; }

            body.accounts-ledger-printing > :not(#accounts-ledger-print-root) { display: none !important; }
            body.accounts-ledger-printing { margin: 0 !important; padding: 0 !important; }

            body.accounts-ledger-printing #accounts-ledger-print-root {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: #ffffff !important;
            }

            body.accounts-ledger-printing #accounts-ledger-print-root * {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            /* Stack the two sheets on print and split onto separate pages */
            body.accounts-ledger-printing #accounts-ledger-print-root .accounts-ledger-grid {
              display: block !important;
            }
            body.accounts-ledger-printing #accounts-ledger-print-root .accounts-ledger-sheet {
              break-inside: avoid;
              page-break-inside: avoid;
              margin-bottom: 12mm;
            }
            body.accounts-ledger-printing #accounts-ledger-print-root .accounts-ledger-sheet + .accounts-ledger-sheet {
              break-before: page;
              page-break-before: always;
            }

            body.accounts-ledger-printing #accounts-ledger-print-root .overflow-x-auto { overflow: visible !important; }
            body.accounts-ledger-printing #accounts-ledger-print-root table { width: 100% !important; page-break-inside: auto; }
            body.accounts-ledger-printing #accounts-ledger-print-root tr { break-inside: avoid; page-break-inside: avoid; }
          }
        `}</style>
      </div>
    </div>
  );
}
