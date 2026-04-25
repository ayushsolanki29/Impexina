"use client";
import React, { useState, useRef } from "react";
import { X, Printer, Eye, EyeOff, ChevronDown, ChevronUp, Table, Image as ImageIcon, Loader2 } from "lucide-react";
import * as XLSX from "xlsx-js-style";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* ─── Toggleable financial columns ─────────────────────────── */
const FINANCIAL_COLS = [
    { key: "dollar", label: "Dollar ($)" },
    { key: "dollarRate", label: "Rate" },
    { key: "inr", label: "INR" },
    { key: "duty", label: "Duty" },
    { key: "total", label: "Total" },
    { key: "gst", label: "GST" },
    { key: "totalDuty", label: "Total Duty" },
    { key: "doCharge", label: "DO" },
    { key: "cfs", label: "CFS" },
    { key: "finalAmount", label: "Final" },
];

const TRACKING_COLS = [
    { key: "origin", label: "Origin" },
];

/* ─── Helpers ───────────────────────────────────────────────── */
function calc(c) {
    const dollar = Number(c.dollar) || 0;
    const rate = Number(c.dollarRate) || 89.7;
    const doCharge = Number(c.doCharge) || 0;
    const cfs = Number(c.cfs) || 0;
    const dutyPct = Number(c.dutyPercent) ?? 16.5;
    const gstPct = Number(c.gstPercent) ?? 18;
    
    const inr = dollar * rate;
    const duty = inr * (dutyPct / 100);
    const total = inr + duty;
    const gst = total * (gstPct / 100);
    const totalDuty = duty + gst;
    const finalAmount = totalDuty + doCharge + cfs;
    return { dollarRate: rate, inr, duty, total, gst, totalDuty, doCharge, cfs, finalAmount };
}

function fmt(n, decimals = 4) {
    if (n === undefined || n === null) return "";
    return Number(n).toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

function fmtDate(d) {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit", month: "2-digit", year: "2-digit",
    });
}

/* ─── Main Component ────────────────────────────────────────── */
export default function ContainerSummaryPreview({ summary, containers, onClose }) {
    /* Which financial/tracking cols are visible */
    const [visible, setVisible] = useState(
        Object.fromEntries([...FINANCIAL_COLS, ...TRACKING_COLS].map(c => [c.key, c.key !== "dollar"]))
    );
    const [showSettings, setShowSettings] = useState(true);
    const printRef = useRef(null);
    const tableRef = useRef(null);
    const [imgLoading, setImgLoading] = useState(false);

    const toSafeFileBase = (value) => {
        const raw = String(value || "")
            .trim()
            .replace(/\s+/g, "_")
            .replace(/[\\/:*?"<>|]+/g, "-");
        return raw || "Container_Summary";
    };

    const toggle = key =>
        setVisible(prev => ({ ...prev, [key]: !prev[key] }));

    const toggleAll = (val) =>
        setVisible(Object.fromEntries([...FINANCIAL_COLS, ...TRACKING_COLS].map(c => [c.key, val])));

    /* All columns in order */
    const allCols = [
        { key: "no", label: "NO", always: true },
        { key: "containerCode", label: "CODE", always: true },
        { key: "ctn", label: "CTN", always: true },
        { key: "loadingDate", label: "LOADING", always: true },
        { key: "eta", label: "ETA", always: true },
        ...FINANCIAL_COLS,
        { key: "shippingLine", label: "LINE", always: true },
        { key: "bl", label: "BL", always: true },
        { key: "containerNo", label: "CONTAINER NO.", always: true },
        ...TRACKING_COLS,
        { key: "sims", label: "SIMS/PIMS", always: true },
    ];

    const visibleCols = allCols.filter(c => c.always || visible[c.key]);

    /* Compute summary totals */
    const totals = containers.reduce((acc, c) => {
        const f = calc(c);
        return {
            ctn: acc.ctn + (Number(c.ctn) || 0),
            dollar: acc.dollar + (Number(c.dollar) || 0),
            inr: acc.inr + f.inr,
            duty: acc.duty + f.duty,
            total: acc.total + f.total,
            gst: acc.gst + f.gst,
            totalDuty: acc.totalDuty + f.totalDuty,
            doCharge: acc.doCharge + f.doCharge,
            cfs: acc.cfs + f.cfs,
            finalAmount: acc.finalAmount + f.finalAmount,
        };
    }, { ctn: 0, dollar: 0, inr: 0, duty: 0, total: 0, gst: 0, totalDuty: 0, doCharge: 0, cfs: 0, finalAmount: 0 });

    const excelCellVal = (col, c, idx) => {
        const f = calc(c);
        switch (col.key) {
            case "no": return idx + 1;
            case "ctn": return Number(c.ctn) || 0;
            case "dollar": return Number(c.dollar) || 0;
            case "dollarRate": return Number(f.dollarRate) || 0;
            case "inr": return Number(f.inr) || 0;
            case "duty": return Number(f.duty) || 0;
            case "total": return Number(f.total) || 0;
            case "gst": return Number(f.gst) || 0;
            case "totalDuty": return Number(f.totalDuty) || 0;
            case "doCharge": return Number(f.doCharge) || 0;
            case "cfs": return Number(f.cfs) || 0;
            case "finalAmount": return Number(f.finalAmount) || 0;
            case "loadingDate": return c.loadingDate ? new Date(c.loadingDate).toLocaleDateString("en-GB") : "";
            case "eta": return c.eta ? new Date(c.eta).toLocaleDateString("en-GB") : "";
            default: return c[col.key] ?? "";
        }
    };

    const exportVisibleExcel = () => {
        try {
            const wb = XLSX.utils.book_new();
            const excelTotalVal = (col) => {
                switch (col.key) {
                    case "no": return "";
                    case "containerCode": return "TOTALS";
                    case "ctn": return totals.ctn;
                    case "dollar": return totals.dollar;
                    case "dollarRate": return "";
                    case "inr": return totals.inr;
                    case "duty": return totals.duty;
                    case "total": return totals.total;
                    case "gst": return totals.gst;
                    case "totalDuty": return totals.totalDuty;
                    case "doCharge": return totals.doCharge;
                    case "cfs": return totals.cfs;
                    case "finalAmount": return totals.finalAmount;
                    default: return "";
                }
            };

            const isNumericKey = new Set([
                "no",
                "ctn",
                "dollar",
                "dollarRate",
                "inr",
                "duty",
                "total",
                "gst",
                "totalDuty",
                "doCharge",
                "cfs",
                "finalAmount",
            ]);

            const numFmtForKey = (key) => {
                if (key === "no" || key === "ctn" || key === "doCharge" || key === "cfs") return "#,##0";
                if (key === "dollarRate") return "#,##0.0";
                if (key === "dollar") return "#,##0.00";
                // INR + duties etc
                if (["inr", "duty", "total", "gst", "totalDuty", "finalAmount"].includes(key)) return "#,##0.00";
                return "#,##0.00";
            };

            const wsData = [
                [`${summary?.month || "Container Summary"} (Export)`],
                [`Generated: ${new Date().toLocaleString("en-IN")}`],
                [],
                visibleCols.map(c => c.label),
            ];

            containers.forEach((c, idx) => {
                wsData.push(visibleCols.map(col => excelCellVal(col, c, idx)));
            });
            wsData.push([]);
            wsData.push(visibleCols.map(col => excelTotalVal(col)));

            const ws = XLSX.utils.aoa_to_sheet(wsData);

            // Merges for the title row (row 0)
            ws["!merges"] = ws["!merges"] || [];
            ws["!merges"].push({
                s: { r: 0, c: 0 },
                e: { r: 0, c: Math.max(visibleCols.length - 1, 0) },
            });

            const border = {
                top: { style: "thin", color: { rgb: "CBD5E1" } },
                bottom: { style: "thin", color: { rgb: "CBD5E1" } },
                left: { style: "thin", color: { rgb: "CBD5E1" } },
                right: { style: "thin", color: { rgb: "CBD5E1" } },
            };

            const setCellStyle = (r, c, style) => {
                const cellRef = XLSX.utils.encode_cell({ r, c });
                const cell = ws[cellRef];
                if (!cell) return;
                cell.s = style;
            };

            // Title row (green) - row 0
            for (let c = 0; c < visibleCols.length; c++) {
                setCellStyle(0, c, {
                    font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
                    fill: { patternType: "solid", fgColor: { rgb: "059669" } },
                    alignment: { vertical: "center", horizontal: "center" },
                });
            }
            ws["!rows"] = ws["!rows"] || [];
            ws["!rows"][0] = { hpt: 26 };

            // Header row (amber) - row index 3
            const headerRowIndex = 3;
            const range = XLSX.utils.decode_range(ws["!ref"]);
            for (let C = range.s.c; C <= range.e.c; C++) {
                const colKey = visibleCols[C]?.key;
                const isNumber = isNumericKey.has(colKey);
                setCellStyle(headerRowIndex, C, {
                    font: { bold: true, color: { rgb: "0F172A" } },
                    fill: { patternType: "solid", fgColor: { rgb: "FDE68A" } },
                    alignment: { vertical: "center", horizontal: isNumber ? "right" : "left", wrapText: true },
                    border,
                });
            }

            // Data rows (borders + num formats)
            const firstDataRow = headerRowIndex + 1;
            const lastDataRow = firstDataRow + containers.length - 1;
            for (let r = firstDataRow; r <= lastDataRow; r++) {
                for (let c = range.s.c; c <= range.e.c; c++) {
                    const colKey = visibleCols[c]?.key;
                    const isNumber = isNumericKey.has(colKey);
                    setCellStyle(r, c, {
                        border,
                        alignment: { vertical: "top", horizontal: isNumber ? "right" : "left", wrapText: true },
                        numFmt: isNumber ? numFmtForKey(colKey) : undefined,
                    });
                }
            }

            // Totals row styling (after blank row)
            const totalsRowIndex = lastDataRow + 2;
            for (let c = range.s.c; c <= range.e.c; c++) {
                const colKey = visibleCols[c]?.key;
                const isNumber = isNumericKey.has(colKey);
                setCellStyle(totalsRowIndex, c, {
                    font: { bold: true },
                    fill: { patternType: "solid", fgColor: { rgb: "F1F5F9" } },
                    border,
                    alignment: { vertical: "center", horizontal: isNumber ? "right" : "left", wrapText: true },
                    numFmt: isNumber ? numFmtForKey(colKey) : undefined,
                });
            }

            // Column widths
            ws["!cols"] = visibleCols.map((col, colIdx) => {
                const label = col.label || "";
                let max = label.length;
                for (let r = 4; r < 4 + containers.length; r++) {
                    const v = wsData[r]?.[colIdx];
                    max = Math.max(max, String(v ?? "").length);
                }
                return { wch: Math.min(Math.max(max + 2, 8), 40) };
            });

            XLSX.utils.book_append_sheet(wb, ws, "Container Summary");
            const fileBase = toSafeFileBase(summary?.month || "Container_Summary");
            XLSX.writeFile(wb, `${fileBase}_${new Date().toISOString().slice(0, 10)}.xlsx`);
        } catch (err) {
            console.error("Excel export failed:", err);
        }
    };

    /* Download as Image (PNG) — builds a fully inline-styled HTML table, no Tailwind needed */
    const handleDownloadImage = async () => {
        setImgLoading(true);
        const iframe = document.createElement("iframe");
        iframe.style.cssText = "position:fixed;left:-9999px;top:0;border:none;";
        document.body.appendChild(iframe);

        try {
            const fileBase = toSafeFileBase(summary?.month || "Container_Summary");

            // ── build inline-styled HTML ──────────────────────────────
            const thStyle = (isRight) => `
                padding:6px 10px;
                background:#fde68a;
                color:#0f172a;
                font:700 10px/1.3 Arial,sans-serif;
                border:1px solid #f59e0b;
                white-space:nowrap;
                text-transform:uppercase;
                letter-spacing:.05em;
                text-align:${isRight ? "right" : "left"};
            `;
            const tdStyle = (isRight, isBold, color, isEven) => `
                padding:5px 10px;
                background:${isEven ? "#f8fafc" : "#ffffff"};
                color:${color || "#334155"};
                font:${isBold ? "700" : "400"} 10px/1.4 Arial,sans-serif;
                border:1px solid #e2e8f0;
                white-space:nowrap;
                text-align:${isRight ? "right" : "left"};
            `;
            const totalTdStyle = (isRight) => `
                padding:6px 10px;
                background:#047857;
                color:#ffffff;
                font:700 10px/1.3 Arial,sans-serif;
                border:1px solid #065f46;
                white-space:nowrap;
                text-align:${isRight ? "right" : "left"};
            `;

            const headerHtml = visibleCols.map(col => {
                const isRight = rightAligned.has(col.key);
                return `<th style="${thStyle(isRight)}">${col.label}</th>`;
            }).join("");

            const rowsHtml = containers.map((c, idx) => {
                const f = calc(c);
                const isEven = idx % 2 === 1;
                const cells = visibleCols.map(col => {
                    const val = cellVal(col, c, idx);
                    const isRight = rightAligned.has(col.key);
                    const isBold = ["containerCode", "finalAmount", "totalDuty"].includes(col.key);
                    const color = col.key === "finalAmount" ? "#047857"
                        : col.key === "gst" ? "#7c3aed"
                        : col.key === "eta" ? "#b45309"
                        : col.key === "sims" ? "#047857"
                        : null;
                    return `<td style="${tdStyle(isRight, isBold, color, isEven)}">${val ?? ""}</td>`;
                }).join("");
                return `<tr>${cells}</tr>`;
            }).join("");

            const totalCells = visibleCols.map(col => {
                const val = totalVal(col);
                const isRight = rightAligned.has(col.key);
                return `<td style="${totalTdStyle(isRight)}">${val ?? ""}</td>`;
            }).join("");

            const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:16px;background:#fff;display:inline-block;">
                <div style="font:700 14px/1.4 Arial,sans-serif;color:#0f172a;margin-bottom:4px;text-transform:uppercase;">${summary?.month || "Container Summary"}</div>
                <div style="font:400 10px/1.4 Arial,sans-serif;color:#64748b;margin-bottom:12px;">Impexina Logistics · Generated ${new Date().toLocaleDateString("en-IN")}</div>
                <table style="border-collapse:collapse;font-family:Arial,sans-serif;">
                    <thead><tr>${headerHtml}</tr></thead>
                    <tbody>${rowsHtml}<tr>${totalCells}</tr></tbody>
                </table>
            </body></html>`;

            const doc = iframe.contentWindow.document;
            doc.open(); doc.write(html); doc.close();

            // wait for layout
            await new Promise(r => setTimeout(r, 200));

            const body = doc.body;
            const w = body.scrollWidth + 32;
            const h = body.scrollHeight + 32;
            iframe.style.width = `${w}px`;
            iframe.style.height = `${h}px`;

            const canvas = await html2canvas(body, {
                scale: 2, useCORS: true, backgroundColor: "#ffffff",
                logging: false, width: w, height: h,
                windowWidth: w, windowHeight: h,
            });

            const link = document.createElement("a");
            link.download = `${fileBase}_${new Date().toISOString().slice(0, 10)}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        } catch (err) {
            console.error("Image export failed:", err);
        } finally {
            document.body.removeChild(iframe);
            setImgLoading(false);
        }
    };

    /* Print (invoice-style: no popup, no blank first page) */
    const handlePrint = () => {
        if (!printRef.current || typeof document === "undefined") {
            window.print();
            return;
        }

        const fileBase = toSafeFileBase(summary?.month || "Container_Summary");

        const existing = document.getElementById("container-summary-print-root");
        if (existing) existing.remove();

        const root = document.createElement("div");
        root.id = "container-summary-print-root";
        root.style.background = "#ffffff";

        const clone = printRef.current.cloneNode(true);
        clone.className = "";
        root.appendChild(clone);
        document.body.appendChild(root);

        document.body.classList.add("container-summary-printing");
        const originalTitle = document.title;
        document.title = fileBase;

        let cleanedUp = false;
        const cleanup = () => {
            if (cleanedUp) return;
            cleanedUp = true;
            document.title = originalTitle;
            document.body.classList.remove("container-summary-printing");
            root.remove();
        };

        window.addEventListener("afterprint", cleanup, { once: true });
        setTimeout(cleanup, 30_000);
        requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
    };

    /* Cell value helper */
    const cellVal = (col, c, idx) => {
        const f = calc(c);
        switch (col.key) {
            case "no": return idx + 1;
            case "containerCode": return c.containerCode || "";
            case "ctn": return c.ctn || 0;
            case "loadingDate": return fmtDate(c.loadingDate);
            case "eta": return fmtDate(c.eta);
            case "dollar": return fmt(c.dollar, 2);
            case "dollarRate": return fmt(f.dollarRate, 1);
            case "inr": return fmt(f.inr, 4);
            case "duty": return fmt(f.duty, 4);
            case "total": return fmt(f.total, 4);
            case "gst": return fmt(f.gst, 4);
            case "totalDuty": return fmt(f.totalDuty, 4);
            case "doCharge": return fmt(f.doCharge, 0);
            case "cfs": return fmt(f.cfs, 0);
            case "finalAmount": return fmt(f.finalAmount, 4);
            case "shippingLine": return c.shippingLine || "";
            case "bl": return c.bl || "";
            case "containerNo": return c.containerNo || "";
            case "origin": return c.origin || "";
            case "sims": return c.sims || "";
            case "pims": return c.sims || ""; // merged into sims
            default: return "";
        }
    };

    /* Total row value */
    const totalVal = (col) => {
        switch (col.key) {
            case "no": return "";
            case "containerCode": return "TOTALS";
            case "ctn": return totals.ctn;
            case "dollar": return fmt(totals.dollar, 2);
            case "dollarRate": return "";
            case "inr": return fmt(totals.inr, 4);
            case "duty": return fmt(totals.duty, 4);
            case "total": return fmt(totals.total, 4);
            case "gst": return fmt(totals.gst, 4);
            case "totalDuty": return fmt(totals.totalDuty, 4);
            case "doCharge": return fmt(totals.doCharge, 0);
            case "cfs": return fmt(totals.cfs, 0);
            case "finalAmount": return fmt(totals.finalAmount, 4);
            default: return "";
        }
    };

    const rightAligned = new Set(["ctn", "dollar", "dollarRate", "inr", "duty", "total", "gst", "totalDuty", "doCharge", "cfs", "finalAmount"]);
    const centerAligned = new Set(["no"]);

    return (
        <>
            {/* ── Print-only HTML (hidden on screen) ── */}
            <div className="hidden" ref={printRef}>
                <h1>{summary?.month || "Container Summary"}</h1>
                <p className="sub">Impexina Logistics Record · Generated {new Date().toLocaleDateString("en-IN")}</p>
                <table>
                    <thead>
                        <tr>
                            {visibleCols.map(col => (
                                <th key={col.key} className={rightAligned.has(col.key) ? "right" : centerAligned.has(col.key) ? "center" : ""}>
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {containers.map((c, idx) => (
                            <tr key={idx}>
                                {visibleCols.map(col => (
                                    <td key={col.key} className={rightAligned.has(col.key) ? "right" : centerAligned.has(col.key) ? "center" : ""}>
                                        {cellVal(col, c, idx)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        <tr className="total-row">
                            {visibleCols.map(col => (
                                <td key={col.key} className={rightAligned.has(col.key) ? "right" : ""}>
                                    {totalVal(col)}
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* ── Modal Overlay ── */}
            <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-[96vw] h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">

                    {/* ── Modal Header ── */}
                    <div className="px-6 py-4 border-b border-slate-200 bg-emerald-50/60 flex items-center justify-between shrink-0">
                        <div>
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">
                                {summary?.month || "Container Summary"} — Preview
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                {containers.length} containers · Impexina Logistics
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Settings toggle */}
                            <button
                                onClick={() => setShowSettings(v => !v)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:border-emerald-400 transition-all"
                            >
                                <Eye className="w-3.5 h-3.5" />
                                Columns
                                {showSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            {/* Excel */}
                            <button
                                onClick={exportVisibleExcel}
                                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg"
                            >
                                <Table className="w-3.5 h-3.5" />
                                Excel
                            </button>
                            {/* Image */}
                            <button
                                onClick={() => handleDownloadImage()}
                                disabled={imgLoading}
                                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg disabled:opacity-60"
                            >
                                {imgLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                                Image
                            </button>
                            {/* Print */}
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                Print
                            </button>
                            {/* Close */}
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* ── Column Visibility Panel ── */}
                    {showSettings && (
                        <div className="px-6 py-3 border-b border-slate-100 bg-emerald-50/60 shrink-0">
                            <div className="flex items-center gap-4 flex-wrap">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] shrink-0">Financial:</span>
                                {FINANCIAL_COLS.map(col => (
                                    <button
                                        key={col.key}
                                        onClick={() => toggle(col.key)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all ${visible[col.key]
                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                            : "bg-white text-slate-400 border-slate-200 line-through"
                                            }`}
                                    >
                                        {visible[col.key] ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                        {col.label}
                                    </button>
                                ))}
                                <div className="w-full h-px bg-slate-100 my-1" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] shrink-0">Tracking:</span>
                                {TRACKING_COLS.map(col => (
                                    <button
                                        key={col.key}
                                        onClick={() => toggle(col.key)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all ${visible[col.key]
                                            ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                                            : "bg-white text-slate-400 border-slate-200 line-through"
                                            }`}
                                    >
                                        {visible[col.key] ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                        {col.label}
                                    </button>
                                ))}
                                <div className="ml-auto flex gap-2">
                                    <button onClick={() => toggleAll(true)} className="text-[9px] font-black text-blue-600 hover:underline uppercase tracking-wider">Show All</button>
                                    <span className="text-slate-300">|</span>
                                    <button onClick={() => toggleAll(false)} className="text-[9px] font-black text-slate-400 hover:underline uppercase tracking-wider">Hide All</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Table Preview ── */}
                    <div className="flex-1 overflow-auto bg-white">
                        <table ref={tableRef} className="border-collapse text-[11px] w-full min-w-fit">
                            <thead className="sticky top-0 z-10">
                                <tr>
                                    {visibleCols.map((col, i) => (
                                        <th
                                            key={col.key}
                                            className={`
                                                px-3 py-3 border border-amber-300 bg-amber-200 text-slate-900
                                                font-black uppercase tracking-widest whitespace-nowrap text-[9px]
                                                ${rightAligned.has(col.key) ? "text-right" : centerAligned.has(col.key) ? "text-center" : "text-left"}
                                            `}
                                        >
                                            {col.label}
                                            {/* hide button for financial cols */}
                                            {!col.always && (
                                                <button
                                                    onClick={() => toggle(col.key)}
                                                    className="ml-1.5 opacity-50 hover:opacity-100 transition-opacity"
                                                    title={`Hide ${col.label}`}
                                                >
                                                    <EyeOff className="w-2.5 h-2.5 inline" />
                                                </button>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {containers.map((c, idx) => (
                                    <tr
                                        key={idx}
                                        className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
                                    >
                                        {visibleCols.map(col => {
                                            const val = cellVal(col, c, idx);
                                            const isRight = rightAligned.has(col.key);
                                            const isCenter = centerAligned.has(col.key);
                                            return (
                                                <td
                                                    key={col.key}
                                                    className={`
                                                        px-3 py-2 border border-slate-200 whitespace-nowrap
                                                        ${isRight ? "text-right tabular-nums font-mono" : isCenter ? "text-center" : ""}
                                                        ${col.key === "containerCode" ? "font-bold text-slate-800" : ""}
                                                        ${col.key === "finalAmount" ? "font-black text-emerald-700" : ""}
                                                        ${col.key === "totalDuty" ? "font-bold text-slate-900" : ""}
                                                        ${col.key === "gst" ? "font-bold text-violet-700" : ""}
                                                        ${col.key === "eta" ? "font-bold text-amber-700" : ""}
                                                        ${col.key === "sims" ? "font-bold text-emerald-700 uppercase" : ""}
                                                        ${col.key === "no" ? "text-slate-400 font-bold text-center" : ""}
                                                        text-slate-700
                                                    `}
                                                >
                                                    {val}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}

                                {/* ── Totals row ── */}
                                <tr className="bg-emerald-700 text-white font-bold">
                                    {visibleCols.map(col => {
                                        const val = totalVal(col);
                                        const isRight = rightAligned.has(col.key);
                                        return (
                                            <td
                                                key={col.key}
                                                className={`
                                                    px-3 py-3 border border-emerald-800 whitespace-nowrap
                                                    ${isRight ? "text-right tabular-nums font-mono" : ""}
                                                    ${col.key === "finalAmount" ? "text-emerald-100 font-black" : ""}
                                                    ${col.key === "containerCode" ? "text-slate-300 font-black uppercase tracking-widest text-[9px]" : ""}
                                                `}
                                            >
                                                {val}
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* ── Footer Summary Chips ── */}
                    <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 shrink-0 flex items-center gap-6 flex-wrap">
                        {[
                            { label: "Containers", val: containers.length },
                            { label: "Total CTN", val: totals.ctn },
                            { label: "Total Dollar", val: `$${fmt(totals.dollar, 2)}` },
                            { label: "Total INR", val: `₹${fmt(totals.inr, 0)}`, show: visible.inr },
                            { label: "Total Duty", val: `₹${fmt(totals.totalDuty, 0)}`, show: visible.totalDuty },
                            { label: "Final Amount", val: `₹${fmt(totals.finalAmount, 4)}`, highlight: true },
                        ].filter(s => s.show !== false).map((s, i) => (
                            <div key={i} className={`text-center px-4 py-2 rounded-xl border ${s.highlight ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-slate-200"}`}>
                                <div className="text-[8px] font-black uppercase tracking-widest text-inherit opacity-70">{s.label}</div>
                                <div className={`text-sm font-black tabular-nums ${s.highlight ? "text-white" : "text-slate-900"}`}>{s.val}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page { size: A4 landscape; margin: 6mm; }

                    body.container-summary-printing > :not(#container-summary-print-root) { display: none !important; }
                    body.container-summary-printing { margin: 0 !important; padding: 0 !important; }

                    body.container-summary-printing #container-summary-print-root {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: #ffffff !important;
                    }

                    body.container-summary-printing #container-summary-print-root * {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        box-sizing: border-box;
                        font-family: Arial, sans-serif;
                    }

                    body.container-summary-printing #container-summary-print-root h1 {
                        font-size: 14px;
                        font-weight: 700;
                        text-transform: uppercase;
                        margin: 0 0 4px 0;
                    }

                    body.container-summary-printing #container-summary-print-root p.sub {
                        font-size: 10px;
                        color: #555;
                        margin: 0 0 14px 0;
                    }

                    body.container-summary-printing #container-summary-print-root table {
                        border-collapse: collapse;
                        width: 100%;
                        font-size: 8px;
                    }

                    body.container-summary-printing #container-summary-print-root th {
                        background: #fde68a;
                        color: #0f172a;
                        padding: 4px 6px;
                        border: 1px solid #f59e0b;
                        text-align: left;
                        font-weight: 700;
                        white-space: nowrap;
                        text-transform: uppercase;
                        letter-spacing: 0.04em;
                    }

                    body.container-summary-printing #container-summary-print-root td {
                        padding: 3px 6px;
                        border: 1px solid #cbd5e1;
                        vertical-align: middle;
                        white-space: nowrap;
                    }

                    body.container-summary-printing #container-summary-print-root tr:nth-child(even) td { background: #f8fafc; }
                    body.container-summary-printing #container-summary-print-root tr.total-row td {
                        background: #047857;
                        color: #fff;
                        font-weight: 700;
                        border-color: #065f46;
                    }

                    body.container-summary-printing #container-summary-print-root .right { text-align: right; }
                    body.container-summary-printing #container-summary-print-root .center { text-align: center; }
                }
            `}</style>
        </>
    );
}
