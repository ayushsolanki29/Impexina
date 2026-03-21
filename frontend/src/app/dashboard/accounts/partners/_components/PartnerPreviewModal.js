"use client";

import React, { useMemo, useRef, useState } from "react";
import { X, Printer, FileSpreadsheet, Loader2 } from "lucide-react";
import * as XLSX from "xlsx-js-style";

export default function PartnerPreviewModal({
  isOpen,
  onClose,
  sheetName,
  rows,
  totals,
  partnerName = "David",
}) {
  const previewRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const toSafeFileBase = (value) => {
    const raw = String(value || "")
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[\\/:*?"<>|]+/g, "-");
    return raw || "Ledger";
  };

  const printFileBase = useMemo(() => {
    return toSafeFileBase(
      ["Ledger", partnerName, sheetName].filter(Boolean).join("_")
    );
  }, [partnerName, sheetName]);

  if (!isOpen) return null;

  const safeRows = rows || [];
  const safeTotals = totals || { dRMB: 0, cRMB: 0, dUSD: 0, cUSD: 0 };
  const netRMB = (safeTotals.dRMB || 0) - (safeTotals.cRMB || 0);
  const netUSD = (safeTotals.dUSD || 0) - (safeTotals.cUSD || 0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const startPrint = () => {
    if (!previewRef.current || typeof document === "undefined") {
      window.print();
      return;
    }

    const existing = document.getElementById("partner-print-root");
    if (existing) existing.remove();

    const root = document.createElement("div");
    root.id = "partner-print-root";
    root.style.background = "#ffffff";

    const page = document.createElement("div");
    page.className = "partner-print-page";

    const clone = previewRef.current.cloneNode(true);
    page.appendChild(clone);
    root.appendChild(page);
    document.body.appendChild(root);

    document.body.classList.add("partner-printing");

    const originalTitle = document.title;
    document.title = printFileBase;

    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      document.title = originalTitle;
      document.body.classList.remove("partner-printing");
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
        "DATE",
        "PARTICULARS",
        "DEBIT (RMB)",
        "CREDIT (RMB)",
        "DEBIT (USD)",
        "CREDIT (USD)",
      ];

      const wsData = [
        [`${String(partnerName || "PARTNER").toUpperCase()} ACCOUNT LEDGER`],
        [sheetName || "", "", "", "", "", `DATE: ${formatDate(new Date())}`],
        [],
        header,
        ...safeRows.map((r) => [
          formatDate(r.date),
          r.particulars || "",
          typeof r.debitRMB === "number" ? r.debitRMB : parseFloat(r.debitRMB) || 0,
          typeof r.creditRMB === "number" ? r.creditRMB : parseFloat(r.creditRMB) || 0,
          typeof r.debitUSD === "number" ? r.debitUSD : parseFloat(r.debitUSD) || 0,
          typeof r.creditUSD === "number" ? r.creditUSD : parseFloat(r.creditUSD) || 0,
        ]),
        [],
        ["", "TOTALS", safeTotals.dRMB || 0, safeTotals.cRMB || 0, safeTotals.dUSD || 0, safeTotals.cUSD || 0],
        ["", "NET BALANCE", netRMB, "", netUSD, ""],
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
      ];

      ws["!cols"] = [
        { wch: 14 },
        { wch: 38 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
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

      // Title row (r=0)
      for (let c = 0; c <= 5; c += 1) {
        setStyle(XLSX.utils.encode_cell({ r: 0, c }), {
          font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
          fill: { patternType: "solid", fgColor: { rgb: "059669" } },
          alignment: { horizontal: "center", vertical: "center" },
        });
      }
      ws["!rows"] = [{ hpt: 26 }];

      // Header row (r=3)
      for (let c = 0; c <= 5; c += 1) {
        const isNumber = c >= 2;
        setStyle(XLSX.utils.encode_cell({ r: 3, c }), {
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

      // Data rows start at r=4
      const firstDataRow = 4;
      const lastDataRow = firstDataRow + safeRows.length - 1;
      for (let r = firstDataRow; r <= lastDataRow; r += 1) {
        for (let c = 0; c <= 5; c += 1) {
          const isNumber = c >= 2;
          setStyle(XLSX.utils.encode_cell({ r, c }), {
            border,
            alignment: { horizontal: isNumber ? "right" : "left", vertical: "top", wrapText: true },
            numFmt: isNumber ? "#,##0.00" : undefined,
          });
        }
      }

      // Totals and net rows
      const totalsRow = lastDataRow + 2;
      const netRow = totalsRow + 1;
      for (let c = 0; c <= 5; c += 1) {
        const isNumber = c >= 2;
        setStyle(XLSX.utils.encode_cell({ r: totalsRow, c }), {
          font: { bold: true },
          fill: { patternType: "solid", fgColor: { rgb: "F1F5F9" } },
          border,
          alignment: { horizontal: isNumber ? "right" : "left", vertical: "center" },
          numFmt: isNumber ? "#,##0.00" : undefined,
        });
      }
      for (let c = 0; c <= 5; c += 1) {
        const isNumber = c >= 2;
        setStyle(XLSX.utils.encode_cell({ r: netRow, c }), {
          font: c === 1 ? { bold: true } : undefined,
          fill: { patternType: "solid", fgColor: { rgb: "FEF3C7" } },
          border,
          alignment: { horizontal: isNumber ? "right" : "left", vertical: "center" },
          numFmt: isNumber ? "#,##0.00" : undefined,
        });
      }

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
              {partnerName} · Preview
            </div>
            <div className="text-xs text-slate-500 truncate">
              {sheetName || "Ledger"} · {safeRows.length} entries
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
              <div className="text-2xl font-black uppercase tracking-tight">
                {partnerName} Account Ledger
              </div>
              <div className="text-xs text-emerald-50/90 mt-1">
                {sheetName || "Ledger"} · Generated {formatDate(new Date())}
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Net RMB Balance
                  </div>
                  <div className="mt-1 text-2xl font-black text-slate-900">
                    {"\u00A5"} {formatCurrency(netRMB)}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Net USD Balance
                  </div>
                  <div className="mt-1 text-2xl font-black text-slate-900">
                    $ {formatCurrency(netUSD)}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-amber-200 text-slate-900 border border-slate-300">
                      <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase whitespace-nowrap">
                        Date
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase whitespace-nowrap">
                        Particulars
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap">
                        Debit (RMB)
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap">
                        Credit (RMB)
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap">
                        Debit (USD)
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap">
                        Credit (USD)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {safeRows.map((r, i) => (
                      <tr
                        key={r.id ?? i}
                        className="border-b border-slate-200"
                      >
                        <td className="border border-slate-200 px-3 py-2 text-slate-600 whitespace-nowrap">
                          {formatDate(r.date)}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-slate-900">
                          {r.particulars || "-"}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap">
                          {r.debitRMB ? formatCurrency(r.debitRMB) : "-"}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap">
                          {r.creditRMB ? formatCurrency(r.creditRMB) : "-"}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap">
                          {r.debitUSD ? formatCurrency(r.debitUSD) : "-"}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap">
                          {r.creditUSD ? formatCurrency(r.creditUSD) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                      <td
                        colSpan="2"
                        className="border border-slate-300 px-3 py-2 text-right"
                      >
                        TOTALS
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">
                        {"\u00A5"} {formatCurrency(safeTotals.dRMB)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">
                        {"\u00A5"} {formatCurrency(safeTotals.cRMB)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">
                        $ {formatCurrency(safeTotals.dUSD)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">
                        $ {formatCurrency(safeTotals.cUSD)}
                      </td>
                    </tr>
                    <tr className="bg-amber-100 border-b border-slate-300">
                      <td
                        colSpan="2"
                        className="border border-slate-300 px-3 py-2 text-right font-black text-amber-900"
                      >
                        NET BALANCE
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right font-black text-amber-900 whitespace-nowrap">
                        {"\u00A5"} {formatCurrency(netRMB)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2"></td>
                      <td className="border border-slate-300 px-3 py-2 text-right font-black text-amber-900 whitespace-nowrap">
                        $ {formatCurrency(netUSD)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { size: A4 landscape; margin: 8mm; }

          body.partner-printing > :not(#partner-print-root) { display: none !important; }
          body.partner-printing { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          body.partner-printing #partner-print-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: #fff !important;
          }
          body.partner-printing #partner-print-root .partner-print-page {
            width: 297mm;
            margin: 0 auto;
          }
          body.partner-printing #partner-print-root * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

          body.partner-printing #partner-print-root table { page-break-inside: auto; }
          body.partner-printing #partner-print-root thead { display: table-header-group; }
          body.partner-printing #partner-print-root tfoot { display: table-footer-group; }
          body.partner-printing #partner-print-root tr { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}

