"use client";

import React, { useMemo, useRef, useState } from "react";
import { X, Printer, FileSpreadsheet, Loader2 } from "lucide-react";
import * as XLSX from "xlsx-js-style";

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
  const sheetTitle = sheet?.title || "DINESHBHAI";

  const toSafeFileBase = (value) => {
    const raw = String(value || "")
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[\\/:*?"<>|]+/g, "-");
    return raw || "Ledger";
  };

  const printFileBase = useMemo(() => {
    return toSafeFileBase(["Ledger", sheetTitle].filter(Boolean).join("_"));
  }, [sheetTitle]);

  if (!isOpen || !sheet) return null;

  const totalLeft = totals?.totalPayable ?? 0;
  const totalPaid = totals?.totalPaid ?? 0;
  const balance = totals?.totalBalance ?? totalPaid - totalLeft;

  const startPrint = () => {
    if (!previewRef.current || typeof document === "undefined") {
      window.print();
      return;
    }

    const existing = document.getElementById("dinesh-print-root");
    if (existing) existing.remove();

    const root = document.createElement("div");
    root.id = "dinesh-print-root";
    root.style.background = "#ffffff";

    const page = document.createElement("div");
    page.className = "dinesh-print-page";

    const clone = previewRef.current.cloneNode(true);
    page.appendChild(clone);
    root.appendChild(page);
    document.body.appendChild(root);

    document.body.classList.add("dinesh-printing");

    const originalTitle = document.title;
    document.title = printFileBase;

    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      document.title = originalTitle;
      document.body.classList.remove("dinesh-printing");
      root.remove();
    };

    window.addEventListener("afterprint", cleanup, { once: true });
    setTimeout(cleanup, 30_000);

    requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
  };

  const handleDownloadExcel = () => {
    try {
      setLoading(true);

      const header = [
        "SUPPLIER",
        "PAYMENT DATE",
        "AMOUNT",
        "BOOKING",
        "RATE",
        "TOTAL",
        "PAID",
        "PAID DATE",
        "CLIENT",
      ];

      const wsData = [
        [sheetTitle.toUpperCase()],
        [],
        header,
        ...(entries || []).map((e) => [
          e.supplier || "",
          formatDateDDMMYYYY(e.paymentDate),
          typeof e.amount === "number" ? e.amount : parseFloat(e.amount) || 0,
          typeof e.booking === "number" ? e.booking : parseFloat(e.booking) || 0,
          typeof e.rate === "number" ? e.rate : parseFloat(e.rate) || 0,
          typeof e.total === "number" ? e.total : parseFloat(e.total) || 0,
          typeof e.paid === "number" ? e.paid : parseFloat(e.paid) || 0,
          formatDateDDMMYYYY(e.paidDate),
          e.clientRef || "",
        ]),
        [],
        ["", "", "", "", "TOTAL", totalLeft, totalPaid, "", ""],
        [
          `${formatDateDDMMYYYY(new Date())} INR`,
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          `\u20B9 ${balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })} BALANCE`,
        ],
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: header.length - 1 } },
      ];

      ws["!cols"] = [
        { wch: 20 },
        { wch: 14 },
        { wch: 12 },
        { wch: 12 },
        { wch: 10 },
        { wch: 12 },
        { wch: 12 },
        { wch: 14 },
        { wch: 22 },
      ];

      const border = {
        top: { style: "thin", color: { rgb: "CBD5E1" } },
        bottom: { style: "thin", color: { rgb: "CBD5E1" } },
        left: { style: "thin", color: { rgb: "CBD5E1" } },
        right: { style: "thin", color: { rgb: "CBD5E1" } },
      };

      const setStyle = (cellAddr, style) => {
        if (!ws[cellAddr]) return;
        ws[cellAddr].s = style;
      };

      // Title row styles
      for (let c = 0; c < header.length; c += 1) {
        setStyle(XLSX.utils.encode_cell({ r: 0, c }), {
          font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
          fill: { patternType: "solid", fgColor: { rgb: "059669" } },
          alignment: { horizontal: "center", vertical: "center" },
        });
      }
      ws["!rows"] = [{ hpt: 26 }];

      // Header styles (row 3 / r=2)
      for (let c = 0; c < header.length; c += 1) {
        const isNumber = c >= 2 && c <= 6;
        setStyle(XLSX.utils.encode_cell({ r: 2, c }), {
          font: { bold: true, color: { rgb: "0F172A" } },
          fill: { patternType: "solid", fgColor: { rgb: "FDE68A" } },
          border,
          alignment: {
            horizontal: isNumber ? "right" : "left",
            vertical: "center",
            wrapText: true,
          },
        });
      }

      // Data styles
      const firstDataRow = 3;
      const lastDataRow = firstDataRow + (entries?.length || 0) - 1;
      for (let r = firstDataRow; r <= lastDataRow; r += 1) {
        for (let c = 0; c < header.length; c += 1) {
          const isNumber = c >= 2 && c <= 6;
          setStyle(XLSX.utils.encode_cell({ r, c }), {
            border,
            alignment: {
              horizontal: isNumber ? "right" : "left",
              vertical: "top",
              wrapText: true,
            },
            numFmt: isNumber ? "#,##0.00" : undefined,
          });
        }
      }

      // Totals and balance rows
      const totalsRow = lastDataRow + 2;
      const balanceRow = totalsRow + 1;
      for (let c = 0; c < header.length; c += 1) {
        const isNumber = c >= 2 && c <= 6;
        setStyle(XLSX.utils.encode_cell({ r: totalsRow, c }), {
          font: { bold: true },
          fill: { patternType: "solid", fgColor: { rgb: "F1F5F9" } },
          border,
          alignment: {
            horizontal: isNumber ? "right" : "left",
            vertical: "center",
          },
          numFmt: c === 5 || c === 6 ? "#,##0.00" : undefined,
        });
      }
      for (let c = 0; c < header.length; c += 1) {
        setStyle(XLSX.utils.encode_cell({ r: balanceRow, c }), {
          fill: { patternType: "solid", fgColor: { rgb: "FEF3C7" } },
          border,
          alignment: {
            horizontal: c === header.length - 1 ? "right" : "left",
            vertical: "center",
          },
        });
      }
      setStyle(XLSX.utils.encode_cell({ r: balanceRow, c: header.length - 1 }), {
        font: { bold: true, color: { rgb: "92400E" } },
        fill: { patternType: "solid", fgColor: { rgb: "FDE68A" } },
        border,
        alignment: { horizontal: "right", vertical: "center" },
      });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Ledger");
      XLSX.writeFile(wb, `${printFileBase}.xlsx`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-[1400px] h-[92vh] rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-900 truncate">
              {sheetTitle}
            </div>
            <div className="text-xs text-slate-500">
              Preview · {entries?.length || 0} entries
            </div>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={startPrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleDownloadExcel}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              Excel
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-6 print:bg-white print:p-0">
          <div
            ref={previewRef}
            className="bg-white border border-slate-200 shadow-sm print:shadow-none rounded-xl overflow-hidden max-w-[1100px] mx-auto print:max-w-none print:mx-0"
          >
            <div className="bg-emerald-600 text-white px-6 py-4">
              <h1 className="text-2xl font-black uppercase tracking-tight">
                {sheetTitle}
              </h1>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-amber-200 text-slate-900 border border-slate-300">
                    <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase whitespace-nowrap">
                      Supplier
                    </th>
                    <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase whitespace-nowrap">
                      Payment Date
                    </th>
                    <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap">
                      Amount
                    </th>
                    <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap">
                      Booking
                    </th>
                    <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap">
                      Rate
                    </th>
                    <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap">
                      Total
                    </th>
                    <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap">
                      Paid
                    </th>
                    <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase whitespace-nowrap">
                      Paid Date
                    </th>
                    <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase whitespace-nowrap">
                      Client
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(entries || []).map((e) => (
                    <tr key={e.id} className="border-b border-slate-200">
                      <td className="border border-slate-200 px-3 py-2 font-medium text-slate-800">
                        {e.supplier || "-"}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-slate-600 whitespace-nowrap">
                        {formatDateDDMMYYYY(e.paymentDate)}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap">
                        {((e.amount ?? "") + "").trim() || "-"}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap">
                        {((e.booking ?? "") + "").trim() || "-"}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap">
                        {((e.rate ?? "") + "").trim() || "-"}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-right font-medium whitespace-nowrap">
                        {(e.total ?? 0).toLocaleString("en-IN")}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap">
                        {(e.paid ?? 0).toLocaleString("en-IN")}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-slate-600 whitespace-nowrap">
                        {formatDateDDMMYYYY(e.paidDate)}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-slate-700">
                        {e.clientRef || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                    <td
                      colSpan="5"
                      className="border border-slate-300 px-3 py-2 text-right"
                    >
                      TOTAL
                    </td>
                    <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">
                      {"\u20B9"}{" "}
                      {totalLeft.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">
                      {"\u20B9"}{" "}
                      {totalPaid.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td colSpan="2" className="border border-slate-300"></td>
                  </tr>
                  <tr className="bg-amber-100 border-b border-slate-300">
                    <td className="border border-slate-300 px-3 py-2 text-slate-700 whitespace-nowrap">
                      {formatDateDDMMYYYY(new Date())} INR
                    </td>
                    <td colSpan="7" className="border border-slate-300"></td>
                    <td className="border border-slate-300 px-3 py-2 text-right font-black text-amber-800 bg-amber-200/80 whitespace-nowrap">
                      {"\u20B9"}{" "}
                      {balance.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      BALANCE
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { size: A4 landscape; margin: 8mm; }

          /* Use display:none so hidden UI doesn't consume layout space and create a blank first page */
          body.dinesh-printing > :not(#dinesh-print-root) { display: none !important; }

          body.dinesh-printing { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          body.dinesh-printing #dinesh-print-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: #fff !important;
          }
          body.dinesh-printing #dinesh-print-root .dinesh-print-page {
            width: 297mm;
            margin: 0 auto;
          }
          body.dinesh-printing #dinesh-print-root * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

          body.dinesh-printing #dinesh-print-root table { page-break-inside: auto; }
          body.dinesh-printing #dinesh-print-root thead { display: table-header-group; }
          body.dinesh-printing #dinesh-print-root tfoot { display: table-footer-group; }
          body.dinesh-printing #dinesh-print-root tr { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
