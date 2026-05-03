"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
    Plus,
    Trash2,
    Save,
    ChevronLeft,
    Loader2,
    X,
    Palette,
    Check,
    ChevronDown,
    ChevronUp,
    Keyboard,
    Command,
    History,
    Download,
    FileSpreadsheet,
    Eye,
    Calendar,
    PowerOff,
    Power,
    Search,
    ExternalLink,
    Filter,
} from "lucide-react";
import { toast } from "sonner";
import API from "@/lib/api";
import ContainerSummaryPreview from "./ContainerSummaryPreview";

const PRESET_COLORS = [
    "#ffffff", "#f8fafc", "#f1f5f9", "#e2e8f0",
    "#e0f2fe", "#bae6fd", "#dcfce7", "#bbf7d0",
    "#fef9c3", "#fef08a", "#ffedd5", "#fed7aa",
    "#fee2e2", "#fecaca"
];

const DEFAULT_COLOR_RULES = [
    { field: "ctn", color: "#f0f9ff", role: "Doc" },
    { field: "no", color: "#fff7ed", role: "Check" },
    { field: "containerCode", color: "#f0fdf4", role: "BL" },
    { field: "shippingLine", color: "#fefce8", role: "Mail" },
    { field: "bl", color: "#fff7ed", role: "WA" },
];

const EMPTY_CONTAINER = {
    containerCode: "",
    ctn: 0,
    loadingDate: new Date().toISOString().split("T")[0],
    eta: "",
    dollar: 0,
    dollarRate: 89.7,
    doCharge: 58000,
    cfs: 21830,
    dutyPercent: 16.5,
    gstPercent: 18,
    duty: undefined,  // optional override; when set, editable value is used
    gst: undefined,
    shippingLine: "",
    bl: "",
    containerNo: "",
    origin: "",
    location: "",
    shipper: "",
    invoiceNo: "",
    invoiceDate: "",
    deliveryDate: "",
    workflowStatus: "",
    sims: "",
    cellStyles: {},
};

export default function ContainerSummaryForm({
    initialData = null,
    isEdit = false,
    isCreate = false,
    onCancel,
    initialSearchParams = null,
}) {
    // ── URL-synced filters ──────────────────────────────────────────────
    const getParam = (key, fallback = "") =>
        initialSearchParams ? (initialSearchParams.get(key) || fallback) : fallback;

    const [rowFilters, setRowFilters] = useState({
        search: getParam("search") || (getParam("highlight") ? getParam("highlight") : ""),
        status: getParam("status"),
        origin: getParam("origin"),
        shippingLine: getParam("shippingLine"),
        showInactive: getParam("showInactive") === "true",
        dateType: getParam("dateType", "loadingDate"),
        dateFrom: getParam("dateFrom"),
        dateTo: getParam("dateTo"),
    });

    // Container to highlight (from ?highlight= param)
    const highlightCode = getParam("highlight");
    const [highlightedIdx, setHighlightedIdx] = useState(null);
    const highlightRowRef = useRef(null);

    const syncRowFiltersToURL = (f) => {
        const p = new URLSearchParams();
        if (f.search) p.set("search", f.search);
        if (f.status) p.set("status", f.status);
        if (f.origin) p.set("origin", f.origin);
        if (f.shippingLine) p.set("shippingLine", f.shippingLine);
        if (f.showInactive) p.set("showInactive", "true");
        if (f.dateType && f.dateType !== "loadingDate") p.set("dateType", f.dateType);
        if (f.dateFrom) p.set("dateFrom", f.dateFrom);
        if (f.dateTo) p.set("dateTo", f.dateTo);
        window.history.replaceState(null, "", p.toString() ? `?${p}` : window.location.pathname);
    };

    const updateRowFilter = (key, value) => {
        setRowFilters(prev => {
            const next = { ...prev, [key]: value };
            syncRowFiltersToURL(next);
            return next;
        });
    };

    const clearRowFilters = () => {
        const empty = { search: "", status: "", origin: "", shippingLine: "", showInactive: false, dateType: "loadingDate", dateFrom: "", dateTo: "" };
        setRowFilters(empty);
        window.history.replaceState(null, "", window.location.pathname);
    };

    const hasActiveRowFilters = rowFilters.search || rowFilters.status || rowFilters.origin ||
        rowFilters.shippingLine || rowFilters.dateFrom || rowFilters.dateTo || rowFilters.showInactive;
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        month: initialData?.month || "",
        status: initialData?.status || "DRAFT",
    });
    const [containers, setContainers] = useState(
        initialData?.containers?.length > 0
            ? initialData.containers.map(c => ({
                ...EMPTY_CONTAINER,
                ...c,
                loadingDate: c.loadingDate?.split('T')[0] || EMPTY_CONTAINER.loadingDate,
                eta: c.eta?.split('T')[0] || c.eta || "",
                sims: c.sims || "",
                containerNo: c.containerNoField || "",
                duty: c.duty != null ? c.duty : undefined,
                gst: c.gst != null ? c.gst : undefined,
                dutyPercent: c.dutyPercent ?? 16.5,
                gstPercent: c.gstPercent ?? 18.0,
            }))
            : [{ ...EMPTY_CONTAINER }]
    );

    const [colorRules, setColorRules] = useState(DEFAULT_COLOR_RULES);
    const [showSettings, setShowSettings] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [activities, setActivities] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    // legacy dateFilter kept for backward compat — now driven by rowFilters
    const dateFilter = {
        from: rowFilters.dateFrom,
        to: rowFilters.dateTo,
        type: rowFilters.dateType,
    };
    const setDateFilter = () => {}; // no-op, handled via rowFilters

    // Fetch global themes on mount
    useEffect(() => {
        const fetchThemes = async () => {
            try {
                const res = await API.get("/container-summaries/themes");
                if (res.data.success && res.data.data.length > 0) {
                    setColorRules(res.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch themes", err);
            }
        };
        fetchThemes();
    }, []);

    // Scroll to and highlight the container from ?highlight= param
    useEffect(() => {
        if (!highlightCode || containers.length === 0) return;
        const idx = containers.findIndex(
            c => c.containerCode === highlightCode || c.id === highlightCode
        );
        if (idx === -1) return;
        setHighlightedIdx(idx);
        // Scroll after a short delay to let the table render
        setTimeout(() => {
            const el = document.getElementById(`cs-row-${idx}`);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }, 300);
        // Clear highlight after 4s
        const t = setTimeout(() => setHighlightedIdx(null), 4000);
        return () => clearTimeout(t);
    }, [highlightCode, containers]);

    // Save global themes when they change
    const syncThemes = async (rules) => {
        try {
            await API.post("/container-summaries/themes", { themes: rules });
        } catch (err) {
            console.error("Failed to sync themes", err);
        }
    };

    const updateColorRules = (next) => {
        setColorRules(next);
        syncThemes(next);
        // Refresh logs if sidebar is open
        if (showHistory) fetchLogs();
    };

    const fetchLogs = async () => {
        setLoadingLogs(true);
        try {
            const url = initialData?.id
                ? `/container-summaries/${initialData.id}/activities`
                : `/container-summaries/activities/global`; // We'll need this endpoint
            const res = await API.get(url);
            if (res.data.success) {
                setActivities(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch logs", err);
        } finally {
            setLoadingLogs(false);
        }
    };

    useEffect(() => {
        if (showHistory) fetchLogs();
    }, [showHistory]);

    const calculateFields = (c) => {
        const dollar = Number(c.dollar) || 0;
        const rate = Number(c.dollarRate) || 89.7;
        const inr = dollar * rate;

        const dutyPct = Number(c.dutyPercent) ?? 16.5;
        const gstPct = Number(c.gstPercent) ?? 18;

        const dutyCalc = inr * (dutyPct / 100);
        const totalCalc = inr + dutyCalc;
        const gstCalc = totalCalc * (gstPct / 100);

        // Use editable duty/gst when set, else calculated
        const duty = c.duty != null && c.duty !== "" ? Number(c.duty) : dutyCalc;
        const total = inr + duty;
        const gst = c.gst != null && c.gst !== "" ? Number(c.gst) : total * (gstPct / 100);
        const totalDuty = duty + gst;
        const finalAmount = totalDuty + (Number(c.doCharge) || 0) + (Number(c.cfs) || 0);

        return {
            inr: inr.toLocaleString('en-IN', { maximumFractionDigits: 0 }),
            duty: duty.toLocaleString('en-IN', { maximumFractionDigits: 0 }),
            dutyRaw: duty,
            total: total.toLocaleString('en-IN', { maximumFractionDigits: 0 }),
            gst: gst.toLocaleString('en-IN', { maximumFractionDigits: 0 }),
            gstRaw: gst,
            totalDuty: totalDuty.toLocaleString('en-IN', { maximumFractionDigits: 0 }),
            finalAmount: finalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })
        };
    };

    const filteredContainers = useMemo(() => {
        const withIndices = containers.map((c, i) => ({ ...c, originalIndex: i }));
        return withIndices.filter(c => {
            // Active/inactive
            const rowActive = c.isActive !== false;
            if (!rowFilters.showInactive && !rowActive) return false;

            // Search
            if (rowFilters.search) {
                const s = rowFilters.search.toLowerCase();
                const matches =
                    c.containerCode?.toLowerCase().includes(s) ||
                    c.bl?.toLowerCase().includes(s) ||
                    c.containerNoField?.toLowerCase().includes(s) ||
                    c.shippingLine?.toLowerCase().includes(s) ||
                    c.origin?.toLowerCase().includes(s) ||
                    c.invoiceNo?.toLowerCase().includes(s) ||
                    c.shipper?.toLowerCase().includes(s) ||
                    c.location?.toLowerCase().includes(s) ||
                    c.sims?.toLowerCase().includes(s) ||
                    c.workflowStatus?.toLowerCase().includes(s);
                if (!matches) return false;
            }

            // Status
            if (rowFilters.status && c.status !== rowFilters.status) return false;

            // Origin
            if (rowFilters.origin && c.origin !== rowFilters.origin) return false;

            // Shipping line
            if (rowFilters.shippingLine && c.shippingLine !== rowFilters.shippingLine) return false;

            // Date range
            if (rowFilters.dateFrom || rowFilters.dateTo) {
                let val = c[rowFilters.dateType];
                if (!val) return false;
                val = new Date(val);
                if (isNaN(val.getTime())) return false;
                if (rowFilters.dateFrom) {
                    const from = new Date(rowFilters.dateFrom);
                    from.setHours(0, 0, 0, 0);
                    if (val < from) return false;
                }
                if (rowFilters.dateTo) {
                    const to = new Date(rowFilters.dateTo);
                    to.setHours(23, 59, 59, 999);
                    if (val > to) return false;
                }
            }

            return true;
        });
    }, [containers, rowFilters]);

    const isFiltered = !!(rowFilters.search || rowFilters.status || rowFilters.origin ||
        rowFilters.shippingLine || rowFilters.dateFrom || rowFilters.dateTo || rowFilters.showInactive);

    // Unique values for filter dropdowns — from ALL containers (not filtered)
    const uniqueStatuses = useMemo(() => [...new Set(containers.map(c => c.status).filter(Boolean))].sort(), [containers]);
    const uniqueOrigins = useMemo(() => [...new Set(containers.map(c => c.origin).filter(Boolean))].sort(), [containers]);
    const uniqueShippingLines = useMemo(() => [...new Set(containers.map(c => c.shippingLine).filter(Boolean))].sort(), [containers]);

    const totals = useMemo(() => {
        return filteredContainers.reduce((acc, c) => {
            const dollar = Number(c.dollar) || 0;
            const rate = Number(c.dollarRate) || 89.7;
            const inr = dollar * rate;
            const dutyPct = Number(c.dutyPercent) ?? 16.5;
            const gstPct = Number(c.gstPercent) ?? 18;
            const dutyCalc = inr * (dutyPct / 100);
            const totalCalc = inr + dutyCalc;
            const gstCalc = totalCalc * (gstPct / 100);
            const duty = c.duty != null && c.duty !== "" ? Number(c.duty) : dutyCalc;
            const total = inr + duty;
            const gst = c.gst != null && c.gst !== "" ? Number(c.gst) : total * (gstPct / 100);
            const final = duty + gst + (Number(c.doCharge) || 58000) + (Number(c.cfs) || 21830);
            return {
                ctn: acc.ctn + (Number(c.ctn) || 0),
                dollar: acc.dollar + dollar,
                final: acc.final + final
            };
        }, { ctn: 0, dollar: 0, final: 0 });
    }, [filteredContainers]);

    const handleContainerChange = (index, field, value) => {
        const next = [...containers];
        next[index] = { ...next[index], [field]: value };
        setContainers(next);
    };

    const handleInputKeyDown = (e, rowIndex, fieldName) => {
        if (e.key === 'Enter' || e.key === 'ArrowDown') {
            e.preventDefault();
            const nextRow = rowIndex + 1;
            if (nextRow < containers.length) {
                const el = document.getElementById(`cs-cell-${nextRow}-${fieldName}`);
                if (el) {
                    el.focus();
                    if (el.select) el.select();
                }
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevRow = rowIndex - 1;
            if (prevRow >= 0) {
                const el = document.getElementById(`cs-cell-${prevRow}-${fieldName}`);
                if (el) {
                    el.focus();
                    if (el.select) el.select();
                }
            }
        }
    };


    const moveContainer = (index, direction) => {
        const next = [...containers];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= next.length) return;

        const [movedItem] = next.splice(index, 1);
        next.splice(targetIndex, 0, movedItem);
        setContainers(next);
        toast.success(`Container moved ${direction}`);
    };

    const exportSummaryExcel = async () => {
        if (!initialData?.id) return;
        try {
            await API.download(
                `/container-summaries/${initialData.id}/export/excel`,
                {},
                `${formData.month.replace(/\s+/g, "_") || 'summary'}_${new Date().toISOString().slice(0, 10)}.xlsx`
            );
            toast.success("Excel export completed successfully");
        } catch (error) {
            console.error("Error exporting to Excel:", error);
            toast.error("Failed to export to Excel");
        }
    };

    const handleSave = async () => {
        if (!formData.month) {
            toast.error("Please enter a month name");
            return;
        }
        setSaving(true);
        try {
            const payload = {
                month: formData.month,
                status: formData.status,
                containers: containers.map(c => ({
                    ...c,
                    containerCode: String(c.containerCode || ""),
                    shippingLine: String(c.shippingLine || ""),
                    bl: String(c.bl || ""),
                    containerNo: String(c.containerNo || ""),
                    ctn: Number(c.ctn) || 0,
                    dollar: Number(c.dollar) || 0,
                    dollarRate: Number(c.dollarRate) || 0,
                    dutyPercent: Number(c.dutyPercent) || 16.5,
                    gstPercent: Number(c.gstPercent) || 18.0,
                    duty: c.duty != null && c.duty !== "" ? Number(c.duty) : undefined,
                    gst: c.gst != null && c.gst !== "" ? Number(c.gst) : undefined,
                    doCharge: Number(c.doCharge) || 0,
                    cfs: Number(c.cfs) || 0,
                    origin: String(c.origin || ""),
                    sims: String(c.sims || ""),
                    isActive: c.isActive !== false,
                }))
            };

            const res = isCreate
                ? await API.post("/container-summaries", payload)
                : await API.patch(`/container-summaries/${initialData?.id}`, payload);

            if (res.data.success) {
                toast.success("Summary saved successfully");
                if (onCancel) onCancel();
            }
        } catch (err) {
            const errorData = err.response?.data;
            if (errorData?.errors?.length > 0) {
                errorData.errors.forEach(e => {
                    toast.error(`${e.field}: ${e.message}`);
                });
            } else {
                toast.error(errorData?.message || "Operation failed. Please check your network.");
            }
            console.error("Save Error:", err);
        } finally {
            setSaving(false);
        }
    };

    const getStyleForField = (fieldName) => {
        const rule = colorRules.find(r => r.field === fieldName);
        return rule ? { backgroundColor: rule.color } : {};
    };

    const getStyleForCell = (idx, fieldName) => {
        const c = containers[idx];
        if (c?.cellStyles && c.cellStyles[fieldName]) {
            return { backgroundColor: c.cellStyles[fieldName] };
        }
        return getStyleForField(fieldName);
    };

    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, field: '', containerIdx: null });

    const [togglingContainerId, setTogglingContainerId] = useState(null);

    const handleToggleContainerActive = async (container, idx) => {
        // Optimistic update
        const next = [...containers];
        next[idx] = { ...next[idx], isActive: !(container.isActive !== false) };
        setContainers(next);

        if (!container.id || !initialData?.id) return; // new unsaved row — just toggle locally

        setTogglingContainerId(container.id);
        try {
            const res = await API.patch(`/container-summaries/${initialData.id}/containers/${container.id}/toggle-active`);
            if (res.data.success) {
                const updated = [...containers];
                updated[idx] = { ...updated[idx], isActive: res.data.data.isActive };
                setContainers(updated);
                toast.success(res.data.data.isActive ? "Container activated" : "Container deactivated");
            }
        } catch (err) {
            // Revert on error
            const reverted = [...containers];
            reverted[idx] = { ...reverted[idx], isActive: container.isActive !== false };
            setContainers(reverted);
            toast.error("Failed to update container status");
        } finally {
            setTogglingContainerId(null);
        }
    };

    const handleContextMenu = (e, field, containerIdx = null) => {
        if (!field) return;
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            field,
            containerIdx
        });
    };

    const assignColor = (field, color) => {
        if (contextMenu.containerIdx !== null) {
            const idx = contextMenu.containerIdx;
            const next = [...containers];
            const cellStyles = { ...(next[idx].cellStyles || {}) };
            cellStyles[field] = color;
            next[idx] = { ...next[idx], cellStyles };
            setContainers(next);
            setContextMenu({ ...contextMenu, visible: false });
            toast.success(`Theme assigned to single cell`);
        } else {
            const next = [...colorRules];
            const existingIdx = next.findIndex(r => r.field === field);

            if (existingIdx > -1) {
                next[existingIdx].color = color;
            } else {
                next.push({ field, color, role: "Target" });
            }

            updateColorRules(next);
            setContextMenu({ ...contextMenu, visible: false });
            toast.success(`Theme assigned to ${field} column`);
        }
    };

    // Keyboard Shortcuts & Close menu
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl + S: Save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
            // Alt + N: New Row
            if (e.altKey && e.key === 'n') {
                e.preventDefault();
                setContainers(prev => [...prev, { ...EMPTY_CONTAINER }]);
                toast.info("New row added (Alt + N)");
            }
            // Escape: Back/Cancel
            if (e.key === 'Escape') {
                if (showSettings) {
                    setShowSettings(false);
                } else if (onCancel) {
                    onCancel();
                }
            }
        };

        const closeMenu = () => setContextMenu(prev => ({ ...prev, visible: false }));

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('click', closeMenu);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('click', closeMenu);
        };
    }, [containers, formData, saving, showSettings, isEdit, isCreate]);

    const usedColors = colorRules.map(r => r.color.toLowerCase());
    const availableColors = PRESET_COLORS.filter(c => !usedColors.includes(c.toLowerCase()));

    return (
        <>
            <div className="flex flex-col h-full bg-white text-slate-900 font-sans antialiased overflow-hidden relative">

                {/* Context Menu Overlay */}
                {contextMenu.visible && (
                    <div
                        className="fixed z-[200] bg-white border border-slate-200 shadow-2xl rounded-xl p-3 w-48 animate-in zoom-in-95 duration-100"
                        style={{ left: contextMenu.x, top: contextMenu.y }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Assign Theme To {contextMenu.field}</div>
                        <div className="grid grid-cols-5 gap-2 pb-3 border-b border-slate-100">
                            {availableColors.map(c => (
                                <button
                                    key={c}
                                    className="w-6 h-6 rounded-full border border-slate-200 hover:scale-110 transition-transform shadow-sm"
                                    style={{ backgroundColor: c }}
                                    onClick={() => assignColor(contextMenu.field, c)}
                                />
                            ))}
                        </div>
                        {availableColors.length === 0 && (
                            <div className="py-2 text-[10px] text-slate-400 italic text-center">No colors available</div>
                        )}
                        <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 mt-1">
                            <div className="flex items-center gap-3 px-1">
                                <input
                                    type="color"
                                    className="w-8 h-8 cursor-pointer rounded bg-transparent border-0 outline-none p-0"
                                    onChange={(e) => assignColor(contextMenu.field, e.target.value)}
                                />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Custom Color</span>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                if (contextMenu.containerIdx !== null) {
                                    const next = [...containers];
                                    const cellStyles = { ...(next[contextMenu.containerIdx].cellStyles || {}) };
                                    delete cellStyles[contextMenu.field];
                                    next[contextMenu.containerIdx] = { ...next[contextMenu.containerIdx], cellStyles };
                                    setContainers(next);
                                } else {
                                    updateColorRules(colorRules.filter(r => r.field !== contextMenu.field));
                                }
                                setContextMenu({ ...contextMenu, visible: false });
                            }}
                            className="w-full mt-2 py-1.5 text-[10px] font-bold text-red-500 hover:bg-red-50 rounded transition-colors text-left px-2 flex items-center gap-2"
                        >
                            <Trash2 className="w-3 h-3" />
                            Clear Formatting
                        </button>
                    </div>
                )}

                {/* Header - Simple & Clean & STICKY */}
                <header className="sticky top-0 px-6 py-5 border-b flex items-center justify-between bg-white/80 backdrop-blur-md z-[100] shadow-sm">
                    <div className="flex items-center gap-6">
                        <button onClick={onCancel} className="p-2 hover:bg-slate-50 transition-colors border border-slate-200 rounded text-slate-400">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <input
                                    className="text-xl font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-500 outline-none w-64 transition-all"
                                    value={formData.month || ""}
                                    onChange={e => setFormData({ ...formData, month: e.target.value.toUpperCase() })}
                                    placeholder="JAN 2026 SUMMARY"
                                    disabled={!isEdit && !isCreate}
                                />
                                <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-2 py-0.5 rounded uppercase">{containers.length} Marks</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Impexina Logistics Record</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-10 mr-6 py-2 px-6 bg-slate-50 border border-slate-200 rounded-lg">
                            <div className="text-right">
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Ctn</div>
                                <div className="text-sm font-bold text-slate-800 tabular-nums">{totals.ctn}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Budget Est.</div>
                                <div className="text-sm font-bold text-blue-600 tabular-nums">₹{totals.final.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                            </div>
                        </div>


                        {!isCreate && initialData?.id && (
                            <button
                                onClick={exportSummaryExcel}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-[10px] font-bold text-emerald-700 transition-all font-sans uppercase tracking-wider"
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                Excel
                            </button>
                        )}

                        {/* View in Containers list */}
                        {!isCreate && initialData?.id && (
                            <a
                                href="/dashboard/containers"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 hover:border-blue-400 hover:text-blue-600 rounded text-[10px] font-bold text-slate-500 transition-all uppercase tracking-wider"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Containers
                            </a>
                        )}

                        {/* Preview button — always visible */}
                        <button
                            onClick={() => setShowPreview(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded text-xs font-bold text-blue-700 transition-all font-sans uppercase tracking-wider"
                        >
                            <Eye className="w-4 h-4" />
                            Preview
                        </button>

                        <button
                            onClick={() => setShowSettings(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-blue-500 rounded text-xs font-bold text-slate-600 transition-all font-sans uppercase tracking-wider"
                        >
                            <Palette className="w-4 h-4" />
                            Theme
                        </button>

                        {(isEdit || isCreate) && (
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 uppercase tracking-widest"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Data
                            </button>
                        )}
                    </div>
                </header>

                {/* Filter Bar */}
                <div className="px-4 py-2.5 border-b bg-slate-50/50 shrink-0">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Search */}
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm min-w-[200px] flex-1 max-w-xs">
                            <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <input
                                type="text"
                                placeholder="Search code, BL, origin, shipper..."
                                className="bg-transparent text-[11px] font-medium text-slate-700 outline-none w-full placeholder:text-slate-300"
                                value={rowFilters.search}
                                onChange={e => updateRowFilter("search", e.target.value)}
                            />
                            {rowFilters.search && (
                                <button onClick={() => updateRowFilter("search", "")} className="text-slate-300 hover:text-red-400 flex-shrink-0"><X className="w-3 h-3" /></button>
                            )}
                        </div>

                        {/* Status */}
                        <select
                            value={rowFilters.status}
                            onChange={e => updateRowFilter("status", e.target.value)}
                            className={`bg-white px-3 py-1.5 rounded-lg border shadow-sm text-[11px] font-bold outline-none cursor-pointer transition-colors ${rowFilters.status ? "border-blue-400 text-blue-700" : "border-slate-200 text-slate-500"}`}
                        >
                            <option value="">All Status</option>
                            {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>

                        {/* Origin */}
                        <select
                            value={rowFilters.origin}
                            onChange={e => updateRowFilter("origin", e.target.value)}
                            className={`bg-white px-3 py-1.5 rounded-lg border shadow-sm text-[11px] font-bold outline-none cursor-pointer transition-colors ${rowFilters.origin ? "border-blue-400 text-blue-700" : "border-slate-200 text-slate-500"}`}
                        >
                            <option value="">All Origins</option>
                            {uniqueOrigins.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>

                        {/* Shipping Line */}
                        <select
                            value={rowFilters.shippingLine}
                            onChange={e => updateRowFilter("shippingLine", e.target.value)}
                            className={`bg-white px-3 py-1.5 rounded-lg border shadow-sm text-[11px] font-bold outline-none cursor-pointer transition-colors ${rowFilters.shippingLine ? "border-blue-400 text-blue-700" : "border-slate-200 text-slate-500"}`}
                        >
                            <option value="">All Lines</option>
                            {uniqueShippingLines.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>

                        {/* Date type + range */}
                        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <select
                                value={rowFilters.dateType}
                                onChange={e => updateRowFilter("dateType", e.target.value)}
                                className="bg-transparent text-[10px] font-black text-slate-500 uppercase tracking-widest outline-none cursor-pointer hover:text-blue-600"
                            >
                                <option value="loadingDate">Loading</option>
                                <option value="eta">ETA</option>
                                <option value="createdAt">Created</option>
                            </select>
                            <input
                                type="date"
                                className="bg-transparent text-[10px] font-bold text-slate-600 outline-none w-28"
                                value={rowFilters.dateFrom}
                                onChange={e => updateRowFilter("dateFrom", e.target.value)}
                            />
                            <span className="text-[10px] font-black text-slate-300">—</span>
                            <input
                                type="date"
                                className="bg-transparent text-[10px] font-bold text-slate-600 outline-none w-28"
                                value={rowFilters.dateTo}
                                onChange={e => updateRowFilter("dateTo", e.target.value)}
                            />
                            {(rowFilters.dateFrom || rowFilters.dateTo) && (
                                <button onClick={() => { updateRowFilter("dateFrom", ""); updateRowFilter("dateTo", ""); }} className="text-slate-300 hover:text-red-400"><X className="w-3 h-3" /></button>
                            )}
                        </div>

                        {/* Show inactive toggle */}
                        <button
                            onClick={() => updateRowFilter("showInactive", !rowFilters.showInactive)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm ${rowFilters.showInactive ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"}`}
                        >
                            <PowerOff className="w-3 h-3" />
                            {rowFilters.showInactive ? "Hiding Active" : "Show Inactive"}
                        </button>

                        {/* Clear all */}
                        {hasActiveRowFilters && (
                            <button
                                onClick={clearRowFilters}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-500 text-[10px] font-bold uppercase tracking-wider hover:bg-red-100 transition-all shadow-sm"
                            >
                                <X className="w-3 h-3" />
                                Clear All
                            </button>
                        )}

                        {/* Result count */}
                        <div className="ml-auto flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                            {isFiltered && (
                                <div className="flex items-center gap-2 py-1 px-3 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    {filteredContainers.length} / {containers.length} rows
                                </div>
                            )}
                            {!isFiltered && (
                                <span className="hidden sm:block text-slate-300">Filter View Only — Saving preserves all {containers.length} rows</span>
                            )}
                        </div>
                    </div>
                </div>


                {/* Workspace */}
                <main className="flex-1 overflow-auto bg-slate-50/20 relative">
                    <div className="min-w-fit">
                        <table className="w-full border-collapse text-[11px]">
                            <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
                                <tr className="border-b border-slate-200">
                                    <th className="w-10 text-center border-r border-slate-200 bg-slate-100/30"></th>
                                    <th className="px-5 py-4 w-12 text-center border-r border-slate-200 text-slate-400 font-bold uppercase tracking-wider bg-slate-50" onContextMenu={(e) => handleContextMenu(e, 'no')} style={getStyleForField('no')}>#</th>
                                    {[
                                        { label: 'Container Code', field: 'containerCode', width: 'min-w-[150px]' },
                                        { label: 'CTN', field: 'ctn', width: 'min-w-[80px] text-center' },
                                        { label: 'Loading', field: 'loadingDate', width: 'min-w-[110px]' },
                                        { label: 'ETA', field: 'eta', width: 'min-w-[110px] text-amber-600 font-bold' },
                                        { label: 'Dollar ($)', field: 'dollar', width: 'min-w-[100px] text-right' },
                                        { label: 'Rate', field: 'dollarRate', width: 'min-w-[80px] text-right' },
                                        { label: 'INR', field: 'inr', width: 'min-w-[110px] text-right text-slate-600' },
                                        { label: 'Duty', field: 'duty', width: 'min-w-[130px] text-right text-slate-700' },
                                        { label: 'Total', field: 'total', width: 'min-w-[110px] text-right text-slate-700' },
                                        { label: 'GST', field: 'gst', width: 'min-w-[130px] text-right text-violet-700' },
                                        { label: 'Total Duty', field: 'totalDuty', width: 'min-w-[120px] text-right font-bold text-slate-900' },
                                        { label: 'DO Charge', field: 'doCharge', width: 'min-w-[100px] text-right' },
                                        { label: 'CFS', field: 'cfs', width: 'min-w-[90px] text-right' },
                                        { label: 'Final Amt', field: 'finalAmount', width: 'min-w-[140px] text-right font-bold text-blue-600' },
                                        { label: 'Line', field: 'shippingLine', width: 'min-w-[120px]' },
                                        { label: 'BL Doc', field: 'bl', width: 'min-w-[120px]' },
                                        { label: 'Container No.', field: 'containerNo', width: 'min-w-[120px]' },
                                        { label: 'Origin Port', field: 'origin', width: 'min-w-[130px] text-blue-600 font-bold' },
                                    ].map((h, i) => (
                                        <th
                                            key={i}
                                            onContextMenu={(e) => handleContextMenu(e, h.field)}
                                            className={`px-5 py-4 border-r border-slate-200 last:border-r-0 text-slate-500 font-bold text-left uppercase tracking-widest cursor-default select-none ${h.width}`}
                                            style={h.field ? getStyleForField(h.field) : {}}
                                        >
                                            {h.label}
                                        </th>
                                    ))}
                                    <th
                                        onContextMenu={(e) => handleContextMenu(e, 'sims')}
                                        className="px-5 py-4 text-blue-600 border-r border-slate-200 min-w-[160px] font-bold text-left uppercase tracking-widest cursor-default select-none"
                                        style={getStyleForField('sims')}
                                    >
                                        SIMS / PIMS
                                    </th>
                                    {(isEdit || isCreate) && <th className="px-2 py-4 w-12 text-center bg-slate-50"></th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {filteredContainers.map((c, visibleIdx) => {
                                    const calc = calculateFields(c);
                                    const idx = c.originalIndex;
                                    const rowActive = c.isActive !== false;
                                    const isHighlighted = highlightedIdx === idx;
                                    return (
                                        <tr
                                            key={idx}
                                            id={`cs-row-${idx}`}
                                            className={`transition-all duration-500 group ${
                                                isHighlighted
                                                    ? "bg-blue-100 ring-2 ring-inset ring-blue-400 animate-pulse"
                                                    : rowActive
                                                        ? "hover:bg-slate-50/50"
                                                        : "bg-slate-100/60 opacity-60 grayscale"
                                            }`}
                                        >
                                            <td className="w-10 border-r border-slate-100 bg-slate-50/20">
                                                {!isFiltered && (
                                                    <div className="flex flex-col items-center justify-center py-1 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button
                                                            onClick={() => moveContainer(idx, 'up')}
                                                            disabled={idx === 0}
                                                            className="p-1 text-slate-300 hover:text-blue-500 disabled:opacity-0"
                                                        >
                                                            <ChevronUp className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => moveContainer(idx, 'down')}
                                                            disabled={idx === containers.length - 1}
                                                            className="p-1 text-slate-300 hover:text-blue-500 disabled:opacity-0"
                                                        >
                                                            <ChevronDown className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-center text-slate-300 font-bold border-r border-slate-100" onContextMenu={(e) => handleContextMenu(e, 'no', idx)} style={getStyleForCell(idx, 'no')}>{visibleIdx + 1}</td>

                                            <td className="p-0 border-r border-slate-100" onContextMenu={(e) => handleContextMenu(e, 'containerCode', idx)} style={getStyleForCell(idx, 'containerCode')}>
                                                <input
                                                    id={`cs-cell-${idx}-containerCode`}
                                                    className="w-full h-10 px-5 bg-transparent outline-none font-bold text-slate-800 border-0 focus:ring-1 focus:ring-inset focus:ring-blue-500/20 placeholder:text-slate-200"
                                                    value={c.containerCode || ""}
                                                    placeholder="CODE"
                                                    onChange={e => handleContainerChange(idx, 'containerCode', e.target.value)}
                                                    onKeyDown={e => handleInputKeyDown(e, idx, 'containerCode')}
                                                    disabled={!isEdit && !isCreate}
                                                />
                                            </td>

                                            <td className="p-0 border-r border-slate-100" onContextMenu={(e) => handleContextMenu(e, 'ctn', idx)} style={getStyleForCell(idx, 'ctn')}>
                                                <input
                                                    type="number"
                                                    className="w-full h-10 px-2 bg-transparent outline-none text-center font-bold text-slate-800 border-0 focus:ring-1 focus:ring-inset focus:ring-blue-500/20"
                                                    value={c.ctn || 0}
                                                    onChange={e => handleContainerChange(idx, 'ctn', e.target.value)}
                                                    disabled={!isEdit && !isCreate}
                                                />
                                            </td>

                                            <td className="px-5 whitespace-nowrap border-r border-slate-100" onContextMenu={(e) => handleContextMenu(e, 'loadingDate', idx)} style={getStyleForCell(idx, 'loadingDate')}>
                                                <input type="date" className="bg-transparent outline-none text-slate-400 font-medium" value={c.loadingDate || ""} onChange={e => handleContainerChange(idx, 'loadingDate', e.target.value)} disabled={!isEdit && !isCreate} />
                                            </td>

                                            <td className="px-5 whitespace-nowrap border-r border-slate-100" onContextMenu={(e) => handleContextMenu(e, 'eta', idx)} style={getStyleForCell(idx, 'eta')}>
                                                <input type="date" className="bg-transparent outline-none font-bold text-amber-600" value={c.eta || ""} onChange={e => handleContainerChange(idx, 'eta', e.target.value)} disabled={!isEdit && !isCreate} />
                                            </td>

                                            <td className="p-0 border-r border-slate-100" onContextMenu={(e) => handleContextMenu(e, 'dollar', idx)} style={getStyleForCell(idx, 'dollar')}>
                                                <input type="number" className="w-full h-10 px-4 bg-transparent outline-none text-right font-medium text-slate-600" value={c.dollar || 0} onChange={e => handleContainerChange(idx, 'dollar', e.target.value)} disabled={!isEdit && !isCreate} />
                                            </td>

                                            <td className="p-0 border-r border-slate-100" onContextMenu={(e) => handleContextMenu(e, 'dollarRate', idx)} style={getStyleForCell(idx, 'dollarRate')}>
                                                <input type="number" step="0.1" className="w-full h-10 px-3 bg-transparent outline-none text-right font-medium text-slate-600" value={c.dollarRate || 89.7} onChange={e => handleContainerChange(idx, 'dollarRate', e.target.value)} disabled={!isEdit && !isCreate} />
                                            </td>

                                            <td className="px-4 text-right font-medium text-slate-600 border-r border-slate-100 tabular-nums" onContextMenu={(e) => handleContextMenu(e, 'inr', idx)} style={getStyleForCell(idx, 'inr')}>₹{calc.inr}</td>
                                            <td className="p-0 border-r border-slate-100" onContextMenu={(e) => handleContextMenu(e, 'duty', idx)} style={getStyleForCell(idx, 'duty')}>
                                                {(isEdit || isCreate) ? (
                                                    <div className="flex flex-col group/cell">
                                                        <div className="flex items-center justify-end gap-1 pr-3 pt-1 border-b border-slate-50/50 bg-slate-50/30">
                                                            <input
                                                                id={`cs-cell-${idx}-dutyPercent`}
                                                                type="number"
                                                                step="0.1"
                                                                className="w-12 text-[9px] text-right font-black text-slate-400 bg-transparent outline-none focus:text-blue-600 transition-colors"
                                                                value={c.dutyPercent ?? 16.5}
                                                                onChange={e => handleContainerChange(idx, 'dutyPercent', e.target.value)}
                                                                onKeyDown={e => handleInputKeyDown(e, idx, 'dutyPercent')}
                                                            />
                                                            <span className="text-[9px] font-black text-slate-300">%</span>
                                                        </div>
                                                        <input
                                                            type="number"
                                                            className="w-full h-10 px-3 bg-transparent outline-none text-right font-bold text-slate-700 border-0 focus:ring-1 focus:ring-inset focus:ring-blue-500/20 tabular-nums"
                                                            value={c.duty != null && c.duty !== "" ? c.duty : calc.dutyRaw}
                                                            onChange={e => handleContainerChange(idx, 'duty', e.target.value)}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col py-2 px-4 gap-0.5">
                                                        <span className="text-[9px] font-black text-slate-300 text-right uppercase tracking-wider">{c.dutyPercent}% Tax</span>
                                                        <span className="block text-right font-bold text-slate-700 tabular-nums">₹{calc.duty}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 text-right font-bold text-slate-700 border-r border-slate-100 tabular-nums" onContextMenu={(e) => handleContextMenu(e, 'total', idx)} style={getStyleForCell(idx, 'total')}>₹{calc.total}</td>
                                            <td className="p-0 border-r border-slate-100" onContextMenu={(e) => handleContextMenu(e, 'gst', idx)} style={getStyleForCell(idx, 'gst')}>
                                                {(isEdit || isCreate) ? (
                                                    <div className="flex flex-col group/cell">
                                                        <div className="flex items-center justify-end gap-1 pr-3 pt-1 border-b border-slate-50/50 bg-slate-50/30">
                                                            <input
                                                                id={`cs-cell-${idx}-gstPercent`}
                                                                type="number"
                                                                step="0.1"
                                                                className="w-12 text-[9px] text-right font-black text-slate-400 bg-transparent outline-none focus:text-violet-600 transition-colors"
                                                                value={c.gstPercent ?? 18}
                                                                onChange={e => handleContainerChange(idx, 'gstPercent', e.target.value)}
                                                                onKeyDown={e => handleInputKeyDown(e, idx, 'gstPercent')}
                                                            />
                                                            <span className="text-[9px] font-black text-slate-300">%</span>
                                                        </div>
                                                        <input
                                                            type="number"
                                                            className="w-full h-10 px-3 bg-transparent outline-none text-right font-bold text-violet-700 border-0 focus:ring-1 focus:ring-inset focus:ring-blue-500/20 tabular-nums"
                                                            value={c.gst != null && c.gst !== "" ? c.gst : calc.gstRaw}
                                                            onChange={e => handleContainerChange(idx, 'gst', e.target.value)}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col py-2 px-4 gap-0.5">
                                                        <span className="text-[9px] font-black text-slate-300 text-right uppercase tracking-wider">{c.gstPercent}% Tax</span>
                                                        <span className="block text-right font-bold text-violet-700 tabular-nums">₹{calc.gst}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 text-right font-bold text-slate-900 border-r border-slate-100 tabular-nums" onContextMenu={(e) => handleContextMenu(e, 'totalDuty', idx)} style={getStyleForCell(idx, 'totalDuty')}>₹{calc.totalDuty}</td>

                                            <td className="p-0 border-r border-slate-100" onContextMenu={(e) => handleContextMenu(e, 'doCharge', idx)} style={getStyleForCell(idx, 'doCharge')}>
                                                <input type="number" className="w-full h-10 px-3 bg-transparent outline-none text-right font-medium text-slate-600" value={c.doCharge ?? 58000} onChange={e => handleContainerChange(idx, 'doCharge', e.target.value)} disabled={!isEdit && !isCreate} />
                                            </td>

                                            <td className="p-0 border-r border-slate-100" onContextMenu={(e) => handleContextMenu(e, 'cfs', idx)} style={getStyleForCell(idx, 'cfs')}>
                                                <input type="number" className="w-full h-10 px-3 bg-transparent outline-none text-right font-medium text-slate-600" value={c.cfs ?? 21830} onChange={e => handleContainerChange(idx, 'cfs', e.target.value)} disabled={!isEdit && !isCreate} />
                                            </td>

                                            <td className="px-4 text-right font-bold text-blue-600 border-r border-slate-100 tabular-nums" onContextMenu={(e) => handleContextMenu(e, 'finalAmount', idx)} style={getStyleForCell(idx, 'finalAmount')}>₹{calc.finalAmount}</td>

                                            <td className="p-0 border-r border-slate-100" onContextMenu={(e) => handleContextMenu(e, 'shippingLine', idx)} style={getStyleForCell(idx, 'shippingLine')}>
                                                <input id={`cs-cell-${idx}-shippingLine`} className="w-full h-10 px-5 bg-transparent outline-none uppercase font-bold text-slate-500" value={c.shippingLine || ""} placeholder="SHIPPING" onChange={e => handleContainerChange(idx, 'shippingLine', e.target.value)} onKeyDown={e => handleInputKeyDown(e, idx, 'shippingLine')} disabled={!isEdit && !isCreate} />
                                            </td>
                                            <td className="p-0 border-r border-slate-100" onContextMenu={(e) => handleContextMenu(e, 'bl', idx)} style={getStyleForCell(idx, 'bl')}>
                                                <input id={`cs-cell-${idx}-bl`} className="w-full h-10 px-5 bg-transparent outline-none font-bold text-slate-400" value={c.bl || ""} placeholder="BL #" onChange={e => handleContainerChange(idx, 'bl', e.target.value)} onKeyDown={e => handleInputKeyDown(e, idx, 'bl')} disabled={!isEdit && !isCreate} />
                                            </td>
                                            <td className="p-0 border-r border-slate-100" onContextMenu={(e) => handleContextMenu(e, 'containerNo', idx)} style={getStyleForCell(idx, 'containerNo')}>
                                                <input id={`cs-cell-${idx}-containerNo`} className="w-full h-10 px-5 bg-transparent outline-none text-slate-400 font-medium" value={c.containerNo || ""} placeholder="CONTAINER NO." onChange={e => handleContainerChange(idx, 'containerNo', e.target.value)} onKeyDown={e => handleInputKeyDown(e, idx, 'containerNo')} disabled={!isEdit && !isCreate} />
                                            </td>

                                            <td className="p-0 border-r border-slate-100" onContextMenu={(e) => handleContextMenu(e, 'origin', idx)} style={getStyleForCell(idx, 'origin')}>
                                                <input id={`cs-cell-${idx}-origin`} className="w-full h-10 px-5 bg-transparent outline-none font-bold text-blue-600 uppercase" value={c.origin || ""} placeholder="ORIGIN" onChange={e => handleContainerChange(idx, 'origin', e.target.value)} onKeyDown={e => handleInputKeyDown(e, idx, 'origin')} disabled={!isEdit && !isCreate} />
                                            </td>

                                            <td className="p-0 border-r border-slate-100" onContextMenu={(e) => handleContextMenu(e, 'sims', idx)} style={getStyleForCell(idx, 'sims')}>
                                                <input
                                                    id={`cs-cell-${idx}-sims`}
                                                    className="w-full h-10 px-5 bg-transparent outline-none font-bold text-blue-600 uppercase placeholder:text-slate-200"
                                                    value={c.sims || ""}
                                                    placeholder="SIMS / PIMS"
                                                    onChange={e => handleContainerChange(idx, 'sims', e.target.value)}
                                                    onKeyDown={e => handleInputKeyDown(e, idx, 'sims')}
                                                    disabled={!isEdit && !isCreate}
                                                />
                                            </td>

                                            {(isEdit || isCreate) && (
                                                <td className="px-2 text-center">
                                                    <div className="flex items-center gap-1 justify-center">
                                                        <button
                                                            onClick={() => handleToggleContainerActive(c, idx)}
                                                            disabled={togglingContainerId === c.id}
                                                            title={rowActive ? "Deactivate container" : "Activate container"}
                                                            className={`p-1.5 rounded transition-colors ${rowActive ? "text-slate-300 hover:text-amber-500" : "text-amber-400 hover:text-green-500"}`}
                                                            tabIndex={-1}
                                                        >
                                                            {togglingContainerId === c.id
                                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                                : rowActive
                                                                    ? <PowerOff className="w-4 h-4" />
                                                                    : <Power className="w-4 h-4" />
                                                            }
                                                        </button>
                                                        <button onClick={() => setContainers(containers.filter((_, i) => i !== idx))} className="p-1.5 text-slate-200 hover:text-red-500 transition-colors" tabIndex={-1}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {(isEdit || isCreate) && (
                            <div className="p-8 pb-12 border-t border-slate-100 bg-white">
                                <button
                                    onClick={() => setContainers([...containers, { ...EMPTY_CONTAINER }])}
                                    className="flex items-center gap-2 px-8 py-3 bg-slate-50 border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-500 font-bold text-[10px] rounded-lg uppercase tracking-widest transition-all group"
                                >
                                    <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    Add Row <span className="ml-2 text-[8px] opacity-40 px-1.5 py-0.5 border border-slate-200 rounded">ALT + N</span>
                                </button>
                                {isFiltered && (
                                    <div className="mt-4 flex items-center gap-2 py-2 px-4 bg-amber-50 rounded-lg border border-amber-100 text-[10px] font-bold text-amber-600 uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2">
                                        <History className="w-3.5 h-3.5" />
                                        Sorting is disabled while filter is active
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>

                {/* Premium Refined Footer */}
                <footer className="px-6 py-2.5 border-t bg-white/95 backdrop-blur-sm z-50 flex items-center justify-between shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center gap-10 font-sans">
                        {/* Compact Shortcuts - High Visibility */}
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 group">
                                <span className="px-1.5 py-0.5 bg-slate-900 rounded text-[9px] font-black text-white border border-slate-900 shadow-sm transition-transform group-hover:-translate-y-0.5">CTRL S</span>
                                <span className="text-[9px] text-slate-600 font-bold uppercase tracking-tight">Save</span>
                            </div>
                            <div className="flex items-center gap-2 group">
                                <span className="px-1.5 py-0.5 bg-white rounded text-[9px] font-black text-slate-900 border border-slate-300 shadow-sm transition-transform group-hover:-translate-y-0.5">ALT N</span>
                                <span className="text-[9px] text-slate-600 font-bold uppercase tracking-tight">Add Row</span>
                            </div>
                            <div className="flex items-center gap-2 group">
                                <span className="px-1.5 py-0.5 bg-white rounded text-[9px] font-black text-slate-400 border border-slate-200 shadow-sm transition-transform group-hover:-translate-y-0.5">ESC</span>
                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">Close</span>
                            </div>
                        </div>

                        <div className="h-4 w-px bg-slate-200" />

                        {/* Integrated Theme Map - Clean Layout */}
                        <div className="flex items-center gap-3 overflow-hidden">
                            <Palette className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
                                {colorRules.filter(r => r.role).map((rule, idx) => (
                                    <div key={idx} className="flex items-center gap-1.5 shrink-0 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full shadow-sm hover:border-slate-400 transition-colors">
                                        <div className="w-2 h-2 rounded-full shadow-[inset_0_0_2px_rgba(0,0,0,0.1)]" style={{ backgroundColor: rule.color }} />
                                        <span className="text-[9px] text-slate-700 font-black uppercase tracking-tight">
                                            {rule.role}
                                            <span className="text-slate-400 font-medium lowercase ml-1">({rule.field})</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest leading-none">
                                {isEdit ? 'Active Edition' : 'Live Sync'}
                            </span>
                        </div>
                    </div>
                </footer>

                {/* Styled Settings Sidebar */}
                {
                    showSettings && (
                        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/10 backdrop-blur-[1px]">
                            <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300 font-sans">
                                <div className="p-6 border-b flex items-center justify-between bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <Palette className="w-5 h-5 text-blue-500" />
                                        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Interface Styles</h3>
                                    </div>
                                    <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white rounded border border-slate-200 text-slate-400"><X className="w-4 h-4" /></button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {colorRules.map((rule, idx) => (
                                        <div key={idx} className="p-5 border border-slate-100 rounded-lg bg-white shadow-sm space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: rule.color }} />
                                                    <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">{rule.field}</span>
                                                </div>
                                                <button onClick={() => updateColorRules(colorRules.filter((_, i) => i !== idx))} className="text-slate-200 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {PRESET_COLORS.map(c => {
                                                        const isUsed = colorRules.some(r => r.color.toLowerCase() === c.toLowerCase() && r.field !== rule.field);
                                                        if (isUsed) return null;
                                                        return (
                                                            <button key={c} onClick={() => { const nr = [...colorRules]; nr[idx].color = c; updateColorRules(nr); }} className={`w-6 h-6 rounded-full border transition-all ${rule.color === c ? 'border-blue-500 ring-2 ring-blue-50' : 'border-white'}`} style={{ backgroundColor: c }} />
                                                        );
                                                    })}
                                                    <div className="flex items-center justify-center w-6 h-6 rounded-full border border-slate-200 relative overflow-hidden">
                                                        <input
                                                            type="color"
                                                            className="absolute inset-[-10px] w-[200%] h-[200%] cursor-pointer border-0 p-0"
                                                            value={rule.color}
                                                            onChange={(e) => { const nr = [...colorRules]; nr[idx].color = e.target.value; updateColorRules(nr); }}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Color Role</label>
                                                    <input className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded px-3 py-2 uppercase outline-none focus:border-blue-500 transition-all" value={rule.role || ""} onChange={e => { const nr = [...colorRules]; nr[idx].role = e.target.value; updateColorRules(nr); }} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={() => {
                                        const unusedColor = PRESET_COLORS.find(c => !colorRules.some(r => r.color.toLowerCase() === c.toLowerCase()));
                                        if (!unusedColor) {
                                            toast.error("No available colors remaining");
                                            return;
                                        }
                                        updateColorRules([...colorRules, { field: "Custom", color: unusedColor, role: "Label" }]);
                                    }} className="w-full py-6 border-2 border-dashed border-slate-100 rounded-lg text-slate-300 hover:text-blue-500 hover:border-blue-100 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                                        <Plus className="w-4 h-4" /> Add Rule
                                    </button>
                                </div>

                                <div className="p-6 bg-slate-50 border-t flex gap-3">
                                    <button onClick={() => updateColorRules(DEFAULT_COLOR_RULES)} className="flex-1 py-3 border border-slate-200 text-slate-400 font-bold text-[10px] rounded uppercase tracking-widest hover:bg-white transition-all">Reset</button>
                                    <button onClick={() => setShowSettings(false)} className="flex-1 py-3 bg-slate-900 text-white font-bold text-[10px] rounded uppercase tracking-widest hover:bg-slate-800 shadow-md transition-all">Done</button>
                                </div>
                            </div>
                        </div>
                    )
                }
                {/* Styled History Sidebar */}
                {
                    showHistory && (
                        <div className="fixed inset-0 z-[150] flex justify-end bg-slate-900/10 backdrop-blur-[1px]">
                            <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
                                <div className="p-6 border-b flex items-center justify-between bg-slate-50 sticky top-0 z-10">
                                    <div className="flex items-center gap-3">
                                        <History className="w-5 h-5 text-slate-900" />
                                        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Activity Stream</h3>
                                    </div>
                                    <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-white rounded border border-slate-200 text-slate-400"><X className="w-4 h-4" /></button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                                    {loadingLogs ? (
                                        <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Loading Logs...</span>
                                        </div>
                                    ) : activities.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-300">
                                            <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center">
                                                <History className="w-5 h-5 opacity-20" />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest">No activity recorded yet</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {activities.map((log, idx) => (
                                                <div key={log.id} className="relative pl-6 pb-6 border-l border-slate-200 last:border-0 last:pb-0">
                                                    <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-900 border-2 border-white shadow-sm" />
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">{log.user?.name || 'System'}</span>
                                                            <span className="text-[8px] font-bold text-slate-400 tabular-nums">{new Date(log.createdAt).toLocaleString()}</span>
                                                        </div>
                                                        <div className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-[0.1em] ${log.type === 'THEME_UPDATED' ? 'bg-blue-50 text-blue-600' :
                                                                    log.type === 'CREATED' ? 'bg-emerald-50 text-emerald-600' :
                                                                        'bg-slate-100 text-slate-600'
                                                                    }`}>
                                                                    {log.type.replace('_', ' ')}
                                                                </span>
                                                                <span className="text-[10px] text-slate-600 font-medium">{log.note}</span>
                                                            </div>

                                                            {log.type === 'THEME_UPDATED' && log.newValue && (
                                                                <div className="mt-2 flex flex-wrap gap-2 pt-2 border-t border-slate-50">
                                                                    {log.newValue.filter(n => n.role).slice(0, 3).map((n, i) => (
                                                                        <div key={i} className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: n.color }} />
                                                                            <span className="text-[7px] font-bold text-slate-400 uppercase">{n.role}</span>
                                                                        </div>
                                                                    ))}
                                                                    {log.newValue.length > 3 && <span className="text-[7px] font-bold text-slate-300">+{log.newValue.length - 3} more</span>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>

            {/* Preview Modal */}
            {
                showPreview && (
                    <ContainerSummaryPreview
                        summary={formData}
                        containers={filteredContainers}
                        onClose={() => setShowPreview(false)}
                    />
                )
            }
        </>
    );
}
