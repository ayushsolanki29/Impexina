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

export default function TukaramPreviewModal({
  isOpen,
  onClose,
  sheet,
  entries,
  totals,
  finalBalance,
}) {
  const previewRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const sheetTitle = sheet?.title || "TUKARAM";

  const toSafeFileBase = (value) => {
    const raw = String(value || "")
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[\\/:*?"<>|]+/g, "-");
    return raw || "Ledger";
  };

  const fileBase = useMemo(() => {
    return toSafeFileBase(["Tukaram", sheetTitle].filter(Boolean).join("_"));
  }, [sheetTitle]);

  if (!isOpen || !sheet) return null;

  const safeEntries = entries || [];
  const safeTotals = totals || {};

  const openingBalance = parseFloat(sheet?.openingBalance) || 0;
  const totalPayable = parseFloat(safeTotals.totalPayable) || 0;
  const totalPaid = parseFloat(safeTotals.totalPaid) || 0;
  const totalCharges = parseFloat(safeTotals.totalCharges) || 0;
  const totalScanning = parseFloat(safeTotals.totalScanning) || 0;
  const totalDc = parseFloat(safeTotals.totalDc) || 0;
  const computedFinalBalance =
    typeof finalBalance === "number"
      ? finalBalance
      : parseFloat(finalBalance) || totalPaid - totalPayable + openingBalance;

  const startPrint = () => {
    if (!previewRef.current || typeof document === "undefined") {
      window.print();
      return;
    }

    const existing = document.getElementById("tukaram-print-root");
    if (existing) existing.remove();

    const root = document.createElement("div");
    root.id = "tukaram-print-root";
    root.style.background = "#ffffff";

    const page = document.createElement("div");
    page.className = "tukaram-print-page";

    const clone = previewRef.current.cloneNode(true);
    page.appendChild(clone);
    root.appendChild(page);
    document.body.appendChild(root);

    document.body.classList.add("tukaram-printing");

    const originalTitle = document.title;
    document.title = fileBase;

    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      document.title = originalTitle;
      document.body.classList.remove("tukaram-printing");
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
        "CTN",
        "LOADING",
        "DELIVERY",
        "PARTICULAR",
        "CHARGES",
        "SCANNING",
        "DC",
        "TOTAL",
        "PAID",
        "PAYMENT DATE",
        "NOTE",
      ];

      const wsData = [
        [`${sheetTitle.toUpperCase()} LEDGER`],
        [sheet?.description || "", "", "", "", "", "", "", "", "", "", `DATE: ${formatDate(new Date())}`],
        [],
        ["OPENING BALANCE", "", "", "", "", "", "", "", "", openingBalance],
        [],
        header,
        ...safeEntries.map((e, idx) => [
          idx + 1,
          e.hisab ? "YES" : "NO",
          e.containerCode || "",
          parseFloat(e.totalCtn) || 0,
          e.loadingDate ? formatDate(e.loadingDate) : "",
          e.deliveryDate ? formatDate(e.deliveryDate) : "",
          e.particular || "",
          parseFloat(e.charges) || 0,
          parseFloat(e.scanning) || 0,
          parseFloat(e.dc) || 0,
          parseFloat(e.total) || 0,
          parseFloat(e.paid) || 0,
          e.paymentDate ? formatDate(e.paymentDate) : "",
          e.note || "",
        ]),
        [],
        [
          "",
          "",
          "TOTAL",
          "",
          "",
          "",
          "",
          totalCharges,
          totalScanning,
          totalDc,
          totalPayable,
          totalPaid,
          "",
          "",
        ],
        ["", "", "", "", "", "", "", "", "FINAL BALANCE", computedFinalBalance],
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      ws["!cols"] = [
        { wch: 5 },
        { wch: 8 },
        { wch: 14 },
        { wch: 6 },
        { wch: 12 },
        { wch: 12 },
        { wch: 26 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 12 },
        { wch: 12 },
        { wch: 14 },
        { wch: 24 },
      ];

      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 9 } },
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

      // Title row style
      for (let c = 0; c <= 13; c += 1) {
        setStyle(XLSX.utils.encode_cell({ r: 0, c }), {
          font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
          fill: { patternType: "solid", fgColor: { rgb: "059669" } },
          alignment: { horizontal: "center", vertical: "center" },
        });
      }
      ws["!rows"] = [{ hpt: 26 }];

      const headerRow = 5;
      for (let c = 0; c <= 13; c += 1) {
        const isNumber = [3, 7, 8, 9, 10, 11].includes(c);
        setStyle(XLSX.utils.encode_cell({ r: headerRow, c }), {
          font: { bold: true, color: { rgb: "0F172A" } },
          fill: { patternType: "solid", fgColor: { rgb: "FDE68A" } },
          border,
          alignment: { horizontal: isNumber ? "right" : "left", vertical: "center", wrapText: true },
        });
      }

      const firstDataRow = headerRow + 1;
      const lastDataRow = firstDataRow + safeEntries.length - 1;
      for (let r = firstDataRow; r <= lastDataRow; r += 1) {
        for (let c = 0; c <= 13; c += 1) {
          const isNumber = [3, 7, 8, 9, 10, 11].includes(c);
          setStyle(XLSX.utils.encode_cell({ r, c }), {
            border,
            alignment: { horizontal: isNumber ? "right" : "left", vertical: "top", wrapText: c === 13 },
            numFmt: isNumber ? "#,##0" : undefined,
          });
        }
      }

      const totalsRow = lastDataRow + 2;
      for (let c = 0; c <= 13; c += 1) {
        const isNumber = [3, 7, 8, 9, 10, 11].includes(c);
        setStyle(XLSX.utils.encode_cell({ r: totalsRow, c }), {
          font: { bold: true },
          fill: { patternType: "solid", fgColor: { rgb: "F1F5F9" } },
          border,
          alignment: { horizontal: isNumber ? "right" : "left", vertical: "center" },
          numFmt: isNumber ? "#,##0" : undefined,
        });
      }

      const balanceRow = totalsRow + 1;
      for (let c = 0; c <= 13; c += 1) {
        setStyle(XLSX.utils.encode_cell({ r: balanceRow, c }), {
          fill: { patternType: "solid", fgColor: { rgb: "FEF3C7" } },
          border,
          alignment: { horizontal: c >= 10 ? "right" : "left", vertical: "center" },
        });
      }
      setStyle(XLSX.utils.encode_cell({ r: balanceRow, c: 10 }), {
        font: { bold: true, color: { rgb: "92400E" } },
        fill: { patternType: "solid", fgColor: { rgb: "FDE68A" } },
        border,
        alignment: { horizontal: "right", vertical: "center" },
      });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Tukaram");
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
                {sheetTitle}
              </div>
              <div className="text-xs text-emerald-50/90 mt-1">
                Tukaram Logistics Ledger
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
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-16">
                        CTN
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase whitespace-nowrap w-28">
                        Loading
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase whitespace-nowrap w-28">
                        Delivery
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase whitespace-nowrap">
                        Particular
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-24">
                        Charges
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-24">
                        Scanning
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-20">
                        DC
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-28">
                        Total
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-24">
                        Paid
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase whitespace-nowrap w-28">
                        Date
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase whitespace-nowrap">
                        Note
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-slate-50 font-semibold">
                      <td className="border border-slate-200 px-3 py-2 text-slate-500 text-center">
                        -
                      </td>
                      <td
                        colSpan="10"
                        className="border border-slate-200 px-3 py-2 text-slate-600 uppercase tracking-wide"
                      >
                        Opening Balance Carried Forward
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-right font-black whitespace-nowrap">
                        {INR} {formatNumber(openingBalance)}
                      </td>
                      <td colSpan="2" className="border border-slate-200"></td>
                    </tr>

                    {safeEntries.map((e, idx) => (
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
                        <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap">
                          {e.totalCtn || "-"}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-slate-600 whitespace-nowrap">
                          {formatDate(e.loadingDate)}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-slate-600 whitespace-nowrap">
                          {formatDate(e.deliveryDate)}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-slate-900">
                          {e.particular || "-"}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap">
                          {INR} {formatNumber(e.charges)}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap">
                          {INR} {formatNumber(e.scanning)}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap">
                          {INR} {formatNumber(e.dc)}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-right font-black whitespace-nowrap">
                          {INR} {formatNumber(e.total)}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-right font-semibold whitespace-nowrap">
                          {INR} {formatNumber(e.paid)}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-slate-600 whitespace-nowrap">
                          {formatDate(e.paymentDate)}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-slate-600">
                          {e.note || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                      <td
                        colSpan="7"
                        className="border border-slate-300 px-3 py-2 text-right text-slate-600 uppercase"
                      >
                        Total
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">
                        {INR} {formatNumber(totalCharges)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">
                        {INR} {formatNumber(totalScanning)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">
                        {INR} {formatNumber(totalDc)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">
                        {INR} {formatNumber(totalPayable)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">
                        {INR} {formatNumber(totalPaid)}
                      </td>
                      <td colSpan="2" className="border border-slate-300"></td>
                    </tr>
                    <tr className="bg-amber-100 border-b border-slate-300">
                      <td
                        colSpan="10"
                        className="border border-slate-300 px-3 py-2 text-right font-black text-amber-900 uppercase"
                      >
                        Final Balance
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right font-black text-amber-900 whitespace-nowrap">
                        {INR} {formatNumber(computedFinalBalance)}
                      </td>
                      <td colSpan="3" className="border border-slate-300"></td>
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

          body.tukaram-printing > :not(#tukaram-print-root) { display: none !important; }
          body.tukaram-printing { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          body.tukaram-printing #tukaram-print-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: #fff !important;
          }
          body.tukaram-printing #tukaram-print-root .tukaram-print-page {
            width: 297mm;
            margin: 0 auto;
          }
          body.tukaram-printing #tukaram-print-root * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

          body.tukaram-printing #tukaram-print-root table { page-break-inside: auto; }
          body.tukaram-printing #tukaram-print-root thead { display: table-header-group; }
          body.tukaram-printing #tukaram-print-root tfoot { display: table-footer-group; }
          body.tukaram-printing #tukaram-print-root tr { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}

