"use client";

import React, { useMemo, useRef, useState } from "react";
import { X, FileSpreadsheet, Loader2, Printer } from "lucide-react";
import * as XLSX from "xlsx-js-style";

export default function CollectionPreviewModal({
  isOpen,
  onClose,
  sheetName,
  sheetDescription,
  entries,
  stats,
}) {
  const previewRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const toSafeFileBase = (value) => {
    const raw = String(value || "")
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[\\/:*?"<>|]+/g, "-");
    return raw || "Collection";
  };

  const fileBase = useMemo(() => {
    return toSafeFileBase(["Collection", sheetName].filter(Boolean).join("_"));
  }, [sheetName]);

  if (!isOpen) return null;

  const safeEntries = entries || [];
  const safeStats = stats || {
    total24_25: 0,
    totalAddCompany: 0,
    total25_26: 0,
    totalAdvance: 0,
    totalBalance: 0,
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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

    const existing = document.getElementById("collection-print-root");
    if (existing) existing.remove();

    const root = document.createElement("div");
    root.id = "collection-print-root";
    root.style.background = "#ffffff";

    const page = document.createElement("div");
    page.className = "collection-print-page";

    const clone = previewRef.current.cloneNode(true);
    page.appendChild(clone);
    root.appendChild(page);
    document.body.appendChild(root);

    document.body.classList.add("collection-printing");

    const originalTitle = document.title;
    document.title = fileBase;

    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      document.title = originalTitle;
      document.body.classList.remove("collection-printing");
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
        "S.No",
        "CLIENT NAME",
        "EXPECTED DATE",
        "24-25 AMT",
        "ADD CO.",
        "25-26 AMT",
        "ADVANCE",
        "BALANCE",
        "NOTES",
      ];

      const wsData = [
        ["PAYMENT COLLECTION MASTER LEDGER"],
        [sheetName || "", "", "", "", "", "", "", `DATE: ${formatDate(new Date())}`],
        ...(sheetDescription ? [[sheetDescription]] : []),
        [],
        header,
        ...safeEntries.map((e, idx) => {
          const amount25 = parseFloat(e.amount25_26) || 0;
          const advance = parseFloat(e.advance) || 0;
          const balance = amount25 - advance;
          return [
            idx + 1,
            e.clientName || "",
            e.expectedDate ? formatDate(e.expectedDate) : "",
            parseFloat(e.amount24_25) || 0,
            parseFloat(e.addCompany) || 0,
            amount25,
            advance,
            balance,
            e.notes || "",
          ];
        }),
        [],
        [
          "",
          "",
          "TOTAL",
          safeStats.total24_25 || 0,
          safeStats.totalAddCompany || 0,
          safeStats.total25_26 || 0,
          safeStats.totalAdvance || 0,
          safeStats.totalBalance || 0,
          "",
        ],
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Column widths
      ws["!cols"] = [
        { wch: 6 },
        { wch: 24 },
        { wch: 14 },
        { wch: 12 },
        { wch: 10 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 28 },
      ];

      // Merges
      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
      ];
      if (sheetDescription) {
        ws["!merges"].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 8 } });
      }

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

      // Title row style (r=0)
      for (let c = 0; c <= 8; c += 1) {
        setStyle(XLSX.utils.encode_cell({ r: 0, c }), {
          font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
          fill: { patternType: "solid", fgColor: { rgb: "059669" } },
          alignment: { horizontal: "center", vertical: "center" },
        });
      }
      ws["!rows"] = [{ hpt: 26 }];

      // Header style row index depends on sheetDescription
      const headerRow = sheetDescription ? 4 : 3;
      for (let c = 0; c <= 8; c += 1) {
        const isNumber = c >= 3 && c <= 7;
        const isNotes = c === 8;
        setStyle(XLSX.utils.encode_cell({ r: headerRow, c }), {
          font: { bold: true, color: { rgb: "0F172A" } },
          fill: { patternType: "solid", fgColor: { rgb: "FDE68A" } },
          border,
          alignment: {
            horizontal: isNumber ? "right" : "left",
            vertical: "center",
            wrapText: isNotes,
          },
        });
      }

      // Data style
      const firstDataRow = headerRow + 1;
      const lastDataRow = firstDataRow + safeEntries.length - 1;
      for (let r = firstDataRow; r <= lastDataRow; r += 1) {
        for (let c = 0; c <= 8; c += 1) {
          const isNumber = c >= 3 && c <= 7;
          setStyle(XLSX.utils.encode_cell({ r, c }), {
            border,
            alignment: {
              horizontal: isNumber ? "right" : "left",
              vertical: "top",
              wrapText: c === 8,
            },
            numFmt: isNumber ? "#,##0" : undefined,
          });
        }
      }

      // Totals row
      const totalsRow = lastDataRow + 2;
      for (let c = 0; c <= 8; c += 1) {
        const isNumber = c >= 3 && c <= 7;
        setStyle(XLSX.utils.encode_cell({ r: totalsRow, c }), {
          font: { bold: true },
          fill: { patternType: "solid", fgColor: { rgb: "F1F5F9" } },
          border,
          alignment: { horizontal: isNumber ? "right" : "left", vertical: "center" },
          numFmt: isNumber ? "#,##0" : undefined,
        });
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Collection");
      XLSX.writeFile(wb, `${fileBase}.xlsx`);
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
              Collection · Preview
            </div>
            <div className="text-xs text-slate-500 truncate">
              {sheetName || "Payment Collection"}{" "}
              {sheetDescription ? `· ${sheetDescription}` : ""} ·{" "}
              {safeEntries.length} entries
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
            className="bg-white border border-slate-200 shadow-sm print:shadow-none rounded-xl overflow-hidden max-w-[1200px] mx-auto print:max-w-none print:mx-0"
          >
            <div className="bg-emerald-600 text-white px-6 py-4">
              <div className="text-2xl font-black uppercase tracking-tight">
                Payment Collection Master Ledger
              </div>
              <div className="text-xs text-emerald-50/90 mt-1">
                {sheetName || "Payment Collection"}
                {sheetDescription ? ` · ${sheetDescription}` : ""} · Generated{" "}
                {formatDate(new Date())}
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    24-25 Amount
                  </div>
                  <div className="mt-1 text-xl font-black text-slate-900 whitespace-nowrap">
                    {"\u20B9"} {formatCurrency(safeStats.total24_25)}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Add Company
                  </div>
                  <div className="mt-1 text-xl font-black text-slate-900 whitespace-nowrap">
                    {"\u20B9"} {formatCurrency(safeStats.totalAddCompany)}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    25-26 Amount
                  </div>
                  <div className="mt-1 text-xl font-black text-slate-900 whitespace-nowrap">
                    {"\u20B9"} {formatCurrency(safeStats.total25_26)}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Net Balance
                  </div>
                  <div className="mt-1 text-xl font-black text-slate-900 whitespace-nowrap">
                    {"\u20B9"} {formatCurrency(safeStats.totalBalance)}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-amber-200 text-slate-900 border border-slate-300">
                      <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase whitespace-nowrap w-12">
                        S.No
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase whitespace-nowrap">
                        Client Name
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase whitespace-nowrap w-28">
                        Expected
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-28">
                        24-25 Amt
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-24">
                        Add Co.
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-28">
                        25-26 Amt
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-24">
                        Advance
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-28">
                        Balance
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase whitespace-nowrap">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {safeEntries.map((entry, idx) => {
                      const amount25 = parseFloat(entry.amount25_26) || 0;
                      const advance = parseFloat(entry.advance) || 0;
                      const balanceRow = amount25 - advance;
                      return (
                        <tr
                          key={entry.id || idx}
                          className={`border-b border-slate-200 ${
                            entry.highlight ? "bg-amber-50" : ""
                          }`}
                        >
                          <td className="border border-slate-200 px-3 py-2 text-slate-500 font-medium whitespace-nowrap">
                            {idx + 1}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-slate-900 font-semibold">
                            {entry.clientName || "-"}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-slate-600 whitespace-nowrap">
                            {formatDate(entry.expectedDate)}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap">
                            {"\u20B9"} {formatCurrency(entry.amount24_25)}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap">
                            {"\u20B9"} {formatCurrency(entry.addCompany)}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-right font-medium whitespace-nowrap">
                            {"\u20B9"} {formatCurrency(entry.amount25_26)}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap">
                            {"\u20B9"} {formatCurrency(entry.advance)}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-right font-black whitespace-nowrap">
                            {"\u20B9"} {formatCurrency(balanceRow)}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-slate-600">
                            {entry.notes || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                      <td
                        colSpan="3"
                        className="border border-slate-300 px-3 py-2 text-right text-slate-600 uppercase"
                      >
                        Total
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">
                        {"\u20B9"} {formatCurrency(safeStats.total24_25)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">
                        {"\u20B9"} {formatCurrency(safeStats.totalAddCompany)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">
                        {"\u20B9"} {formatCurrency(safeStats.total25_26)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">
                        {"\u20B9"} {formatCurrency(safeStats.totalAdvance)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">
                        {"\u20B9"} {formatCurrency(safeStats.totalBalance)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                <div>Impexina · Payment Tracking</div>
                <div>Entries: {safeEntries.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { size: A4 landscape; margin: 8mm; }

          body.collection-printing > :not(#collection-print-root) { display: none !important; }
          body.collection-printing { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          body.collection-printing #collection-print-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: #fff !important;
          }
          body.collection-printing #collection-print-root .collection-print-page {
            width: 297mm;
            margin: 0 auto;
          }
          body.collection-printing #collection-print-root * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

          body.collection-printing #collection-print-root table { page-break-inside: auto; }
          body.collection-printing #collection-print-root thead { display: table-header-group; }
          body.collection-printing #collection-print-root tfoot { display: table-footer-group; }
          body.collection-printing #collection-print-root tr { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}

