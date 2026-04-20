"use client";

import React, { useMemo, useRef, useState } from "react";
import { X, FileSpreadsheet, Loader2, Printer } from "lucide-react";
import * as XLSX from "xlsx-js-style";

export default function ShippingPreviewModal({
  isOpen,
  onClose,
  sheetName,
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
    return raw || "Shipping";
  };

  const fileBase = useMemo(() => {
    return toSafeFileBase(["Shipping", sheetName].filter(Boolean).join("_"));
  }, [sheetName]);

  if (!isOpen) return null;

  const safeEntries = entries || [];
  const safeStats = stats || {};

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

    const existing = document.getElementById("shipping-print-root");
    if (existing) existing.remove();

    const root = document.createElement("div");
    root.id = "shipping-print-root";
    root.style.background = "#ffffff";

    const page = document.createElement("div");
    page.className = "shipping-print-page";

    const clone = previewRef.current.cloneNode(true);
    page.appendChild(clone);
    root.appendChild(page);
    document.body.appendChild(root);

    document.body.classList.add("shipping-printing");

    const originalTitle = document.title;
    document.title = fileBase;

    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      document.title = originalTitle;
      document.body.classList.remove("shipping-printing");
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
        "CONT CODE",
        "CTN",
        "LOADING",
        "RMB/($)",
        "FRT ($)",
        "RATE",
        "FRT (INR)",
        "CHA",
        "FOB",
        "CFS",
        "SCAN",
        "SIMS",
        "DUTY",
        "PENALTY",
        "TRUCK",
        "H/C",
        "TOTAL",
      ];

      const wsData = [
        ["SHIPPING & LOGISTICS LEDGER"],
        [sheetName || "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", `DATE: ${formatDate(new Date())}`],
        [],
        header,
        ...safeEntries.map((e, idx) => {
          const cha = parseFloat(e.cha) || 0;
          const fobTerms = parseFloat(e.fobTerms) || 0;
          const cfsDoYard = parseFloat(e.cfsDoYard) || 0;
          const scanning = parseFloat(e.scanning) || 0;
          const simsPims = parseFloat(e.simsPims) || 0;
          const duty = parseFloat(e.duty) || 0;
          const penalty = parseFloat(e.penalty) || 0;
          const trucking = parseFloat(e.trucking) || 0;
          const loadingUnloading = parseFloat(e.loadingUnloading) || 0;
          const freightINR = parseFloat(e.freightINR) || 0;

          const local =
            cha +
            fobTerms +
            cfsDoYard +
            scanning +
            simsPims +
            duty +
            penalty +
            trucking +
            loadingUnloading;

          return [
            idx + 1,
            e.containerCode || "",
            parseFloat(e.ctn) || 0,
            e.loadingDate ? formatDate(e.loadingDate) : "",
            parseFloat(e.rmbRate) || 0,
            parseFloat(e.freightUSD) || 0,
            parseFloat(e.exchangeRate) || 0,
            freightINR,
            cha,
            fobTerms,
            cfsDoYard,
            scanning,
            simsPims,
            duty,
            penalty,
            trucking,
            loadingUnloading,
            freightINR + local,
          ];
        }),
        [],
        [
          "",
          "TOTAL",
          safeStats.totalCTN || 0,
          "",
          "",
          safeStats.totalFreightUSD || 0,
          "",
          safeStats.totalFreightINR || 0,
          safeStats.totalCHA || 0,
          safeStats.totalFOBTerms || 0,
          safeStats.totalCFSDoYard || 0,
          safeStats.totalScanning || 0,
          safeStats.totalSIMS_PIMS || 0,
          safeStats.totalDuty || 0,
          safeStats.totalPenalty || 0,
          safeStats.totalTrucking || 0,
          safeStats.totalLoadingUnloading || 0,
          safeStats.grandTotal || 0,
        ],
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      ws["!cols"] = [
        { wch: 5 },
        { wch: 14 },
        { wch: 6 },
        { wch: 12 },
        { wch: 10 },
        { wch: 12 },
        { wch: 10 },
        { wch: 14 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 14 },
      ];

      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 17 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 16 } },
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

      // Title style (r=0)
      for (let c = 0; c <= 17; c += 1) {
        setStyle(XLSX.utils.encode_cell({ r: 0, c }), {
          font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
          fill: { patternType: "solid", fgColor: { rgb: "059669" } },
          alignment: { horizontal: "center", vertical: "center" },
        });
      }
      ws["!rows"] = [{ hpt: 26 }];

      // Header style (r=3)
      for (let c = 0; c <= 17; c += 1) {
        const isNumber = c >= 2;
        setStyle(XLSX.utils.encode_cell({ r: 3, c }), {
          font: { bold: true, color: { rgb: "0F172A" } },
          fill: { patternType: "solid", fgColor: { rgb: "FDE68A" } },
          border,
          alignment: { horizontal: isNumber ? "right" : "left", vertical: "center", wrapText: true },
        });
      }

      // Data styles
      const firstDataRow = 4;
      const lastDataRow = firstDataRow + safeEntries.length - 1;
      for (let r = firstDataRow; r <= lastDataRow; r += 1) {
        for (let c = 0; c <= 17; c += 1) {
          const isNumber = c >= 2;
          setStyle(XLSX.utils.encode_cell({ r, c }), {
            border,
            alignment: { horizontal: isNumber ? "right" : "left", vertical: "top", wrapText: false },
            numFmt: isNumber ? "#,##0.00" : undefined,
          });
        }
      }

      // Totals row style
      const totalsRow = lastDataRow + 2;
      for (let c = 0; c <= 17; c += 1) {
        const isNumber = c >= 2;
        setStyle(XLSX.utils.encode_cell({ r: totalsRow, c }), {
          font: { bold: true },
          fill: { patternType: "solid", fgColor: { rgb: "F1F5F9" } },
          border,
          alignment: { horizontal: isNumber ? "right" : "left", vertical: "center" },
          numFmt: isNumber ? "#,##0.00" : undefined,
        });
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Shipping");
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
              Shipping · Preview
            </div>
            <div className="text-xs text-slate-500 truncate">
              {sheetName || "Shipping Ledger"} · {safeEntries.length} entries
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
                Shipping & Logistics Ledger
              </div>
              <div className="text-xs text-emerald-50/90 mt-1">
                {sheetName || "Shipping Ledger"} · Generated {formatDate(new Date())}
              </div>
            </div>

            <div className="p-6">
              <div className="rounded-xl border border-slate-200 bg-white p-4 mb-6">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Containers
                </div>
                <div className="mt-1 text-xl font-black text-slate-900">
                  {safeEntries.length}
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
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-20">
                        CTN
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase whitespace-nowrap w-28">
                        Loading
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-20">
                        RMB/($)
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-24">
                        Frt ($)
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-20">
                        Rate
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-28">
                        Freight (INR)
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-24">
                        CHA
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-24">
                        FOB
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-24">
                        CFS
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-24">
                        Scan
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-24">
                        SIMS
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-24">
                        Duty
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-24">
                        Penalty
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-24">
                        Truck
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-24">
                        H/C
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase whitespace-nowrap w-28">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {safeEntries.map((e, idx) => {
                      const cha = parseFloat(e.cha) || 0;
                      const fobTerms = parseFloat(e.fobTerms) || 0;
                      const cfsDoYard = parseFloat(e.cfsDoYard) || 0;
                      const scanning = parseFloat(e.scanning) || 0;
                      const simsPims = parseFloat(e.simsPims) || 0;
                      const duty = parseFloat(e.duty) || 0;
                      const penalty = parseFloat(e.penalty) || 0;
                      const trucking = parseFloat(e.trucking) || 0;
                      const loadingUnloading = parseFloat(e.loadingUnloading) || 0;
                      const freightINR = parseFloat(e.freightINR) || 0;
                      const local =
                        cha +
                        fobTerms +
                        cfsDoYard +
                        scanning +
                        simsPims +
                        duty +
                        penalty +
                        trucking +
                        loadingUnloading;
                      const total = freightINR + local;

                      return (
                        <tr key={e.id || idx} className="border-b border-slate-200">
                          <td className="border border-slate-200 px-3 py-2 text-slate-500 font-medium whitespace-nowrap">
                            {idx + 1}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-slate-900 font-semibold whitespace-nowrap">
                            {e.containerCode || "-"}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap">
                            {formatCurrency(e.ctn)}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-slate-600 whitespace-nowrap">
                            {formatDate(e.loadingDate)}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap text-slate-500">
                            {e.rmbRate || "-"}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap text-blue-600">
                            $ {formatCurrency(e.freightUSD)}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap text-slate-500">
                            {e.exchangeRate || "-"}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap">
                            {"\u20B9"} {formatCurrency(freightINR)}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap">
                            {"\u20B9"} {formatCurrency(cha)}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap">
                            {"\u20B9"} {formatCurrency(fobTerms)}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap">
                            {"\u20B9"} {formatCurrency(cfsDoYard)}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap">
                            {"\u20B9"} {formatCurrency(scanning)}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap">
                            {"\u20B9"} {formatCurrency(simsPims)}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap">
                            {"\u20B9"} {formatCurrency(duty)}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap">
                            {"\u20B9"} {formatCurrency(penalty)}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap">
                            {"\u20B9"} {formatCurrency(trucking)}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-right whitespace-nowrap">
                            {"\u20B9"} {formatCurrency(loadingUnloading)}
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-right font-black whitespace-nowrap">
                            {"\u20B9"} {formatCurrency(total)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                      <td
                        colSpan="2"
                        className="border border-slate-300 px-3 py-2 text-right text-slate-600 uppercase"
                      >
                        Total
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">
                        {formatCurrency(safeStats.totalCTN)}
                      </td>
                      <td colSpan="2" className="border border-slate-300 px-3 py-2"></td>
                      <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap text-blue-600">
                        $ {formatCurrency(safeStats.totalFreightUSD)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2"></td>
                      <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">
                        {"\u20B9"} {formatCurrency(safeStats.totalFreightINR)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">
                        {"\u20B9"} {formatCurrency(safeStats.totalCHA)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">
                        {"\u20B9"} {formatCurrency(safeStats.totalFOBTerms)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">
                        {"\u20B9"} {formatCurrency(safeStats.totalCFSDoYard)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">
                        {"\u20B9"} {formatCurrency(safeStats.totalScanning)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">
                        {"\u20B9"} {formatCurrency(safeStats.totalSIMS_PIMS)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">
                        {"\u20B9"} {formatCurrency(safeStats.totalDuty)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">
                        {"\u20B9"} {formatCurrency(safeStats.totalPenalty)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">
                        {"\u20B9"} {formatCurrency(safeStats.totalTrucking)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">
                        {"\u20B9"} {formatCurrency(safeStats.totalLoadingUnloading)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">
                        {"\u20B9"} {formatCurrency(safeStats.grandTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                <div>Impexina · Shipping</div>
                <div>Entries: {safeEntries.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { size: A4 landscape; margin: 8mm; }

          body.shipping-printing > :not(#shipping-print-root) { display: none !important; }
          body.shipping-printing { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          body.shipping-printing #shipping-print-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: #fff !important;
          }
          body.shipping-printing #shipping-print-root .shipping-print-page {
            width: 297mm;
            margin: 0 auto;
          }
          body.shipping-printing #shipping-print-root * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

          body.shipping-printing #shipping-print-root table { page-break-inside: auto; }
          body.shipping-printing #shipping-print-root thead { display: table-header-group; }
          body.shipping-printing #shipping-print-root tfoot { display: table-footer-group; }
          body.shipping-printing #shipping-print-root tr { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
