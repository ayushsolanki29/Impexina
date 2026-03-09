"use client";
import React, { useState, useRef } from "react";
import { X, Printer, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";

/* ─── Toggleable financial columns ─────────────────────────── */
const FINANCIAL_COLS = [
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
    { key: "location", label: "Port" },
    { key: "shipper", label: "Shipper" },
    { key: "invoiceNo", label: "Inv No" },
    { key: "invoiceDate", label: "Inv Date" },
    { key: "deliveryDate", label: "Del Date" },
    { key: "workflowStatus", label: "Status" },
    { key: "pims", label: "PIMS" },
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
        Object.fromEntries([...FINANCIAL_COLS, ...TRACKING_COLS].map(c => [c.key, true]))
    );
    const [showSettings, setShowSettings] = useState(true);
    const printRef = useRef(null);

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
        { key: "dollar", label: "DOLLAR", always: true },
        ...FINANCIAL_COLS,
        { key: "shippingLine", label: "LINE", always: true },
        { key: "bl", label: "BL", always: true },
        { key: "containerNo", label: "CONTAINER NO.", always: true },
        ...TRACKING_COLS,
        { key: "sims", label: "SIMS", always: true },
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

    /* Print */
    const handlePrint = () => {
        const content = printRef.current?.innerHTML;
        if (!content) return;
        const win = window.open("", "_blank", "width=1200,height=700");
        win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${summary?.month || "Container Summary"}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }
    body { background: #fff; padding: 16px; }
    h1 { font-size: 14px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
    p.sub { font-size: 10px; color: #555; margin-bottom: 14px; }
    table { border-collapse: collapse; width: 100%; font-size: 10px; }
    th { background: #1e293b; color: #fff; padding: 5px 8px; border: 1px solid #334155; text-align: left; font-weight: 700; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 4px 8px; border: 1px solid #cbd5e1; vertical-align: middle; white-space: nowrap; }
    tr:nth-child(even) td { background: #f8fafc; }
    tr.total-row td { background: #1e293b; color: #fff; font-weight: 700; border-color: #334155; }
    .right { text-align: right; }
    .center { text-align: center; }
  </style>
</head>
<body>${content}</body>
</html>`);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 400);
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
            case "location": return c.location || "";
            case "shipper": return c.shipper || "";
            case "invoiceNo": return c.invoiceNo || "";
            case "invoiceDate": return fmtDate(c.invoiceDate);
            case "deliveryDate": return fmtDate(c.deliveryDate);
            case "workflowStatus": return c.workflowStatus || "";
            case "sims": return c.sims || "";
            case "pims": return c.pims || "";
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
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
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
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:border-blue-400 transition-all"
                            >
                                <Eye className="w-3.5 h-3.5" />
                                Columns
                                {showSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            {/* Print */}
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                Print / Export
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
                        <div className="px-6 py-3 border-b border-slate-100 bg-blue-50/50 shrink-0">
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
                                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
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
                        <table className="border-collapse text-[11px] w-full min-w-fit">
                            <thead className="sticky top-0 z-10">
                                <tr>
                                    {visibleCols.map((col, i) => (
                                        <th
                                            key={col.key}
                                            className={`
                                                px-3 py-3 border border-slate-300 bg-slate-800 text-white
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
                                                        ${col.key === "finalAmount" ? "font-black text-blue-700" : ""}
                                                        ${col.key === "totalDuty" ? "font-bold text-slate-900" : ""}
                                                        ${col.key === "gst" ? "font-bold text-violet-700" : ""}
                                                        ${col.key === "eta" ? "font-bold text-amber-700" : ""}
                                                        ${col.key === "sims" ? "font-bold text-blue-600 uppercase" : ""}
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
                                <tr className="bg-slate-900 text-white font-bold">
                                    {visibleCols.map(col => {
                                        const val = totalVal(col);
                                        const isRight = rightAligned.has(col.key);
                                        return (
                                            <td
                                                key={col.key}
                                                className={`
                                                    px-3 py-3 border border-slate-700 whitespace-nowrap
                                                    ${isRight ? "text-right tabular-nums font-mono" : ""}
                                                    ${col.key === "finalAmount" ? "text-blue-300 font-black" : ""}
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
                            <div key={i} className={`text-center px-4 py-2 rounded-xl border ${s.highlight ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-200"}`}>
                                <div className="text-[8px] font-black uppercase tracking-widest text-inherit opacity-70">{s.label}</div>
                                <div className={`text-sm font-black tabular-nums ${s.highlight ? "text-white" : "text-slate-900"}`}>{s.val}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
