"use client";

import React, { useMemo, useRef, useState } from "react";
import { X, FileSpreadsheet, Loader2, Printer } from "lucide-react";
import * as XLSX from "xlsx-js-style";

const INR = "\u20B9";

function formatDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatNumber(amount) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export default function KavyaPreviewModal({
  isOpen,
  onClose,
  sheet,
  entries,
  totals,
  finalBalance,
}) {
  const previewRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const sheetTitle = sheet?.title || "KAVYA";

  const toSafeFileBase = (value) => {
    const raw = String(value || "")
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[\\/:*?"<>|]+/g, "-");
    return raw || "Ledger";
  };

  const fileBase = useMemo(() => {
    return toSafeFileBase(["Kavya", sheetTitle].filter(Boolean).join("_"));
  }, [sheetTitle]);

  if (!isOpen || !sheet) return null;

  const safeEntries = entries || [];
  const safeTotals = totals || {};

  const openingBalance = parseFloat(sheet?.openingBalance) || 0;
  const totalPayable = parseFloat(safeTotals.totalPayable) || 0;
  const totalPaid = parseFloat(safeTotals.totalPaid) || 0;
  const totalBalance =
    typeof safeTotals.totalBalance === "number"
      ? safeTotals.totalBalance
      : parseFloat(safeTotals.totalBalance) || totalPaid - totalPayable;
  const computedFinalBalance =
    typeof finalBalance === "number"
      ? finalBalance
      : parseFloat(finalBalance) || openingBalance + totalBalance;

  const startPrint = () => {
    if (!previewRef.current || typeof document === "undefined") {
      window.print();
      return;
    }

    const existing = document.getElementById("kavya-print-root");
    if (existing) existing.remove();

    const root = document.createElement("div");
    root.id = "kavya-print-root";
    root.style.background = "#ffffff";

    const page = document.createElement("div");
    page.className = "kavya-print-page";

    const clone = previewRef.current.cloneNode(true);
    page.appendChild(clone);
    root.appendChild(page);
    document.body.appendChild(root);

    document.body.classList.add("kavya-printing");

    const originalTitle = document.title;
    document.title = fileBase;

    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      document.title = originalTitle;
      document.body.classList.remove("kavya-printing");
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
        "SR",
        "HISAB",
        "CONT CODE",
        "LOADING",
        "DELIVERY",
        "MARK",
        "PARTICULAR",
        "RATE",
        "CBM/KG",
        "DUTY/FVB",
        "TOTAL",
        "PAID",
        "BALANCE",
      ];

      const wsData = [
        [`${sheetTitle.toUpperCase()} STATEMENT`],
        [sheet?.description || "", "", "", "", "", "", "", "", "", `DATE: ${formatDate(new Date())}`],
        [],
        header,
        ...safeEntries.map((e, idx) => {
          const total = parseFloat(e.total) || 0;
          const paid = parseFloat(e.paid) || 0;
          const balanceRow =
            typeof e.balance === "number" ? e.balance : total - paid;
          return [
            idx + 1,
            e.hisab ? "YES" : "NO",
            e.containerCode || "",
            e.loadingDate ? formatDate(e.loadingDate) : "",
            e.deliveryDate ? formatDate(e.deliveryDate) : "",
            e.shippingMark || "",
            e.particular || "",
            parseFloat(e.rateCbmWeight) || 0,
            parseFloat(e.cbmKg) || 0,
            parseFloat(e.dutyFvb) || 0,
            total,
            paid,
            balanceRow,
          ];
        }),
        [],
        ["", "", "", "", "", "", "TOTAL", "", "", "", totalPayable, totalPaid, totalBalance],
        ["", "", "", "", "", "", "OPENING", "", "", "", openingBalance],
        ["", "", "", "", "", "", "FINAL", "", "", "", computedFinalBalance],
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      ws["!cols"] = [
        { wch: 5 },
        { wch: 8 },
        { wch: 14 },
        { wch: 12 },
        { wch: 12 },
        { wch: 14 },
        { wch: 28 },
        { wch: 10 },
        { wch: 10 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
      ];

      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } },
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

      // Title style
      for (let c = 0; c <= 12; c += 1) {
        setStyle(XLSX.utils.encode_cell({ r: 0, c }), {
          font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
          fill: { patternType: "solid", fgColor: { rgb: "059669" } },
          alignment: { horizontal: "center", vertical: "center" },
        });
      }
      ws["!rows"] = [{ hpt: 26 }];

      // Header style (r=3)
      for (let c = 0; c <= 12; c += 1) {
        const isNumber = c >= 7;
        setStyle(XLSX.utils.encode_cell({ r: 3, c }), {
          font: { bold: true, color: { rgb: "0F172A" } },
          fill: { patternType: "solid", fgColor: { rgb: "FDE68A" } },
          border,
          alignment: { horizontal: isNumber ? "right" : "left", vertical: "center", wrapText: true },
        });
      }

      const firstDataRow = 4;
      const lastDataRow = firstDataRow + safeEntries.length - 1;
      for (let r = firstDataRow; r <= lastDataRow; r += 1) {
        for (let c = 0; c <= 12; c += 1) {
          const isNumber = c >= 7;
          setStyle(XLSX.utils.encode_cell({ r, c }), {
            border,
            alignment: { horizontal: isNumber ? "right" : "left", vertical: "top", wrapText: c === 6 },
            numFmt: isNumber ? "#,##0" : undefined,
          });
        }
      }

      const totalsRow = lastDataRow + 2;
      for (let c = 0; c <= 12; c += 1) {
        const isNumber = c >= 7;
        setStyle(XLSX.utils.encode_cell({ r: totalsRow, c }), {
          font: { bold: true },
          fill: { patternType: "solid", fgColor: { rgb: "F1F5F9" } },
          border,
          alignment: { horizontal: isNumber ? "right" : "left", vertical: "center" },
          numFmt: isNumber ? "#,##0" : undefined,
        });
      }

      // Opening and final rows
      const openingRow = totalsRow + 1;
      const finalRow = openingRow + 1;
      for (let r = openingRow; r <= finalRow; r += 1) {
        for (let c = 0; c <= 12; c += 1) {
          setStyle(XLSX.utils.encode_cell({ r, c }), {
            fill: { patternType: "solid", fgColor: { rgb: "FEF3C7" } },
            border,
            alignment: { horizontal: c >= 10 ? "right" : "left", vertical: "center" },
          });
        }
      }
      setStyle(XLSX.utils.encode_cell({ r: finalRow, c: 10 }), {
        font: { bold: true, color: { rgb: "92400E" } },
        fill: { patternType: "solid", fgColor: { rgb: "FDE68A" } },
        border,
        alignment: { horizontal: "right", vertical: "center" },
      });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Kavya");
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
              {sheetTitle} · Preview
            </div>
            <div className="text-xs text-slate-500 truncate">
              {safeEntries.length} entries · Generated {formatDate(new Date())}
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
            className="bg-white border border-slate-200 shadow-sm print:shadow-none rounded-xl overflow-hidden max-w-[1300px] mx-auto print:max-w-none print:mx-0"
          >
            <div className="bg-emerald-600 text-white px-6 py-4">
              <div className="text-2xl font-black uppercase tracking-tight">
                Statement of Account
              </div>
              <div className="text-xs text-emerald-50/90 mt-1">
                {sheetTitle} · Generated {formatDate(new Date())}
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Opening Balance
                  </div>
                  <div className="mt-1 text-xl font-black text-slate-900 whitespace-nowrap">
                    {INR} {formatNumber(openingBalance)}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Total Charges
                  </div>
                  <div className="mt-1 text-xl font-black text-slate-900 whitespace-nowrap">
                    {INR} {formatNumber(totalPayable)}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Total Paid
                  </div>
                  <div className="mt-1 text-xl font-black text-slate-900 whitespace-nowrap">
                    {INR} {formatNumber(totalPaid)}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Final Balance
                  </div>
                  <div className="mt-1 text-xl font-black text-slate-900 whitespace-nowrap">
                    {INR} {formatNumber(computedFinalBalance)}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-amber-200 text-slate-900 border border-slate-300">
                      <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase whitespace-nowrap w-12">
                        SR
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase whitespace-nowrap">
                        Cont Code
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-center font-bold uppercase whitespace-nowrap w-16">
                        HISAB
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase whitespace-nowrap w-28">
                        Loading
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase whitespace-nowrap w-28">
                        Delivery
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase whitespace-nowrap">
                        Mark
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase whitespace-nowrap">
                        Particular
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-20">
                        Rate
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-20">
                        CBM/KG
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-24">
                        Duty/FVB
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-24">
                        Total
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-24">
                        Paid
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-24">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {safeEntries.map((e, idx) => {
                      const total = parseFloat(e.total) || 0;
                      const paid = parseFloat(e.paid) || 0;
                      const balanceRow =
                        typeof e.balance === "number" ? e.balance : total - paid;

                      return (
                        <tr key={e.id || idx} className="border-b border-slate-200">
                          <td className="border border-slate-200 px-3 py-2 text-slate-500 font-medium whitespace-nowrap">
                            {idx + 1}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-slate-900 font-semibold whitespace-nowrap">
                            {e.containerCode || "-"}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-slate-600 whitespace-nowrap text-center font-bold">
                            {e.hisab ? "✔" : "-"}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-slate-600 whitespace-nowrap">
                            {formatDate(e.loadingDate)}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-slate-600 whitespace-nowrap">
                            {formatDate(e.deliveryDate)}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-slate-600 whitespace-nowrap">
                            {e.shippingMark || "-"}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-slate-900">
                            {e.particular || "-"}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap">
                            {formatNumber(e.rateCbmWeight)}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap">
                            {formatNumber(e.cbmKg)}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap">
                            {formatNumber(e.dutyFvb)}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-right font-black whitespace-nowrap">
                            {INR} {formatNumber(total)}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-right font-semibold whitespace-nowrap">
                            {INR} {formatNumber(paid)}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-right font-black whitespace-nowrap">
                            {INR} {formatNumber(balanceRow)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                      <td
                        colSpan="10"
                        className="border border-slate-300 px-3 py-2 text-right text-slate-600 uppercase"
                      >
                        Totals
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">
                        {INR} {formatNumber(totalPayable)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">
                        {INR} {formatNumber(totalPaid)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">
                        {INR} {formatNumber(totalBalance)}
                      </td>
                    </tr>
                    <tr className="bg-amber-100 border-b border-slate-300">
                      <td
                        colSpan="10"
                        className="border border-slate-300 px-3 py-2 text-right font-black text-amber-900 uppercase"
                      >
                        Final (Including Opening)
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right font-black text-amber-900 whitespace-nowrap">
                        {INR} {formatNumber(computedFinalBalance)}
                      </td>
                      <td colSpan="2" className="border border-slate-300"></td>
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

          body.kavya-printing > :not(#kavya-print-root) { display: none !important; }
          body.kavya-printing { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          body.kavya-printing #kavya-print-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: #fff !important;
          }
          body.kavya-printing #kavya-print-root .kavya-print-page {
            width: 297mm;
            margin: 0 auto;
          }
          body.kavya-printing #kavya-print-root * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

          body.kavya-printing #kavya-print-root table { page-break-inside: auto; }
          body.kavya-printing #kavya-print-root thead { display: table-header-group; }
          body.kavya-printing #kavya-print-root tfoot { display: table-footer-group; }
          body.kavya-printing #kavya-print-root tr { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}

