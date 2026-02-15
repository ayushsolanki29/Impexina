"use client";
import React, { useState, useEffect, useMemo } from "react";
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
    FileSpreadsheet
} from "lucide-react";
import { toast } from "sonner";
import API from "@/lib/api";

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
    shippingLine: "",
    bl: "",
    containerNo: "",
    simsStatus: false,
    simsComplete: false,
    simsNotComplete: false,
    pimsStatus: false,
    pimsComplete: false,
    pimsNotComplete: false,
};

export default function ContainerSummaryForm({
    initialData = null,
    isEdit = false,
    isCreate = false,
    onCancel
}) {
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
                eta: c.eta?.split('T')[0] || "",
                // Parse sims/pims strings back to checkboxes
                simsStatus: c.sims === "PENDING" || c.sims === "DONE" || c.sims === "FAIL",
                simsComplete: c.sims === "DONE",
                simsNotComplete: c.sims === "FAIL",
                pimsStatus: c.pims === "PENDING" || c.pims === "DONE" || c.pims === "FAIL",
                pimsComplete: c.pims === "DONE",
                pimsNotComplete: c.pims === "FAIL",
            }))
            : [{ ...EMPTY_CONTAINER }]
    );

    const [colorRules, setColorRules] = useState(DEFAULT_COLOR_RULES);
    const [showSettings, setShowSettings] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [activities, setActivities] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

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
        const duty = inr * 0.165;
        const total = inr + duty;
        const gst = total * 0.18;
        const totalDuty = duty + gst;
        const finalAmount = totalDuty + (Number(c.doCharge) || 0) + (Number(c.cfs) || 0);

        return {
            inr: inr.toLocaleString('en-IN', { maximumFractionDigits: 0 }),
            duty: duty.toLocaleString('en-IN', { maximumFractionDigits: 0 }),
            totalDuty: totalDuty.toLocaleString('en-IN', { maximumFractionDigits: 0 }),
            finalAmount: finalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })
        };
    };

    const totals = useMemo(() => {
        return containers.reduce((acc, c) => {
            const dollar = Number(c.dollar) || 0;
            const rate = Number(c.dollarRate) || 89.7;
            const inr = dollar * rate;
            const duty = inr * 0.165;
            const final = duty + (inr + duty) * 0.18 + (Number(c.doCharge) || 58000) + (Number(c.cfs) || 21830);
            return {
                ctn: acc.ctn + (Number(c.ctn) || 0),
                final: acc.final + final
            };
        }, { ctn: 0, final: 0 });
    }, [containers]);

    const handleContainerChange = (index, field, value) => {
        const next = [...containers];
        next[index] = { ...next[index], [field]: value };
        setContainers(next);
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
                    doCharge: Number(c.doCharge) || 0,
                    cfs: Number(c.cfs) || 0,
                    sims: c.simsComplete ? "DONE" : c.simsNotComplete ? "FAIL" : c.simsStatus ? "PENDING" : "",
                    pims: c.pimsComplete ? "DONE" : c.pimsNotComplete ? "FAIL" : c.pimsStatus ? "PENDING" : "",
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

    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, field: null });

    const handleContextMenu = (e, field) => {
        if (!field) return;
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            field
        });
    };

    const assignColor = (field, color) => {
        const next = [...colorRules];
        const existingIdx = next.findIndex(r => r.field === field);

        if (existingIdx > -1) {
            next[existingIdx].color = color;
        } else {
            next.push({ field, color, role: "Target" });
        }

        updateColorRules(next);
        setContextMenu({ ...contextMenu, visible: false });
        toast.success(`Color assigned to ${field}`);
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
                    <button
                        onClick={() => {
                            updateColorRules(colorRules.filter(r => r.field !== contextMenu.field));
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

            {/* Workspace */}
            <main className="flex-1 overflow-auto bg-slate-50/20">
                <div className="min-w-fit">
                    <table className="w-full border-collapse text-[11px]">
                        <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
                            <tr className="border-b border-slate-200">
                                <th className="px-5 py-4 w-12 text-center border-r border-slate-200 text-slate-400 font-bold uppercase tracking-wider bg-slate-50">#</th>
                                {[
                                    { label: 'Container Code', field: 'containerCode', width: 'min-w-[150px]' },
                                    { label: 'CTN', field: 'ctn', width: 'min-w-[100px] text-center' },
                                    { label: 'Loading', field: 'loadingDate', width: 'min-w-[110px]' },
                                    { label: 'ETA', field: 'eta', width: 'min-w-[110px] text-amber-600 font-bold' },
                                    { label: 'Dollar ($)', field: 'dollar', width: 'min-w-[110px] text-right' },
                                    { label: 'Duty', field: 'duty', width: 'min-w-[120px] text-right text-slate-700' },
                                    { label: 'T. Duty', field: 'totalDuty', width: 'min-w-[120px] text-right font-bold text-slate-900' },
                                    { label: 'Final Amt', field: 'finalAmount', width: 'min-w-[140px] text-right font-bold text-blue-600' },
                                    { label: 'Line', field: 'shippingLine', width: 'min-w-[130px]' },
                                    { label: 'BL Document', field: 'bl', width: 'min-w-[130px]' },
                                    { label: 'Unit No.', field: 'containerNo', width: 'min-w-[130px]' },
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
                                    SIMS HUB
                                </th>
                                <th
                                    onContextMenu={(e) => handleContextMenu(e, 'pims')}
                                    className="px-5 py-4 text-green-600 border-r border-slate-200 min-w-[160px] font-bold text-left uppercase tracking-widest cursor-default select-none"
                                    style={getStyleForField('pims')}
                                >
                                    PIMS HUB
                                </th>
                                {(isEdit || isCreate) && <th className="px-2 py-4 w-12 text-center bg-slate-50"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {containers.map((c, idx) => {
                                const calc = calculateFields(c);
                                return (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-5 py-3 text-center text-slate-300 font-bold border-r border-slate-100" style={getStyleForField('no')}>{idx + 1}</td>

                                        <td className="p-0 border-r border-slate-100" onContextMenu={(e) => handleContextMenu(e, 'containerCode')} style={getStyleForField('containerCode')}>
                                            <input
                                                className="w-full h-10 px-5 bg-transparent outline-none font-bold text-slate-800 border-0 focus:ring-1 focus:ring-inset focus:ring-blue-500/20 placeholder:text-slate-200"
                                                value={c.containerCode || ""}
                                                placeholder="CODE"
                                                onChange={e => handleContainerChange(idx, 'containerCode', e.target.value)}
                                                disabled={!isEdit && !isCreate}
                                            />
                                        </td>

                                        <td className="p-0 border-r border-slate-100" onContextMenu={(e) => handleContextMenu(e, 'ctn')} style={getStyleForField('ctn')}>
                                            <input
                                                type="number"
                                                className="w-full h-10 px-2 bg-transparent outline-none text-center font-bold text-slate-800 border-0 focus:ring-1 focus:ring-inset focus:ring-blue-500/20"
                                                value={c.ctn || 0}
                                                onChange={e => handleContainerChange(idx, 'ctn', e.target.value)}
                                                disabled={!isEdit && !isCreate}
                                            />
                                        </td>

                                        <td className="px-5 whitespace-nowrap border-r border-slate-100" onContextMenu={(e) => handleContextMenu(e, 'loadingDate')} style={getStyleForField('loadingDate')}>
                                            <input type="date" className="bg-transparent outline-none text-slate-400 font-medium" value={c.loadingDate || ""} onChange={e => handleContainerChange(idx, 'loadingDate', e.target.value)} disabled={!isEdit && !isCreate} />
                                        </td>

                                        <td className="px-5 whitespace-nowrap border-r border-slate-100" onContextMenu={(e) => handleContextMenu(e, 'eta')} style={getStyleForField('eta')}>
                                            <input type="date" className="bg-transparent outline-none font-bold text-amber-600" value={c.eta || ""} onChange={e => handleContainerChange(idx, 'eta', e.target.value)} disabled={!isEdit && !isCreate} />
                                        </td>

                                        <td className="p-0 border-r border-slate-100" onContextMenu={(e) => handleContextMenu(e, 'dollar')} style={getStyleForField('dollar')}>
                                            <input type="number" className="w-full h-10 px-4 bg-transparent outline-none text-right font-medium text-slate-600" value={c.dollar || 0} onChange={e => handleContainerChange(idx, 'dollar', e.target.value)} disabled={!isEdit && !isCreate} />
                                        </td>

                                        <td className="px-5 text-right font-bold text-slate-700 border-r border-slate-100 tabular-nums" onContextMenu={(e) => handleContextMenu(e, 'duty')} style={getStyleForField('duty')}>₹{calc.duty}</td>
                                        <td className="px-5 text-right font-bold text-slate-900 border-r border-slate-100 tabular-nums" onContextMenu={(e) => handleContextMenu(e, 'totalDuty')} style={getStyleForField('totalDuty')}>₹{calc.totalDuty}</td>
                                        <td className="px-5 text-right font-bold text-blue-600 border-r border-slate-100 tabular-nums" onContextMenu={(e) => handleContextMenu(e, 'finalAmount')} style={getStyleForField('finalAmount')}>₹{calc.finalAmount}</td>

                                        <td className="p-0 border-r border-slate-100" onContextMenu={(e) => handleContextMenu(e, 'shippingLine')} style={getStyleForField('shippingLine')}>
                                            <input className="w-full h-10 px-5 bg-transparent outline-none uppercase font-bold text-slate-500" value={c.shippingLine || ""} placeholder="SHIPPING" onChange={e => handleContainerChange(idx, 'shippingLine', e.target.value)} disabled={!isEdit && !isCreate} />
                                        </td>
                                        <td className="p-0 border-r border-slate-100" onContextMenu={(e) => handleContextMenu(e, 'bl')} style={getStyleForField('bl')}>
                                            <input className="w-full h-10 px-5 bg-transparent outline-none font-bold text-slate-400" value={c.bl || ""} placeholder="BL #" onChange={e => handleContainerChange(idx, 'bl', e.target.value)} disabled={!isEdit && !isCreate} />
                                        </td>
                                        <td className="p-0 border-r border-slate-100" onContextMenu={(e) => handleContextMenu(e, 'containerNo')} style={getStyleForField('containerNo')}>
                                            <input className="w-full h-10 px-5 bg-transparent outline-none text-slate-400 font-medium" value={c.containerNo || ""} placeholder="UNIT ID" onChange={e => handleContainerChange(idx, 'containerNo', e.target.value)} disabled={!isEdit && !isCreate} />
                                        </td>

                                        {/* Checkboxes */}
                                        {['sims', 'pims'].map(type => (
                                            <td key={type} className="px-5 py-2 border-r border-slate-100" onContextMenu={(e) => handleContextMenu(e, type)} style={getStyleForField(type)}>
                                                <div className="flex items-center gap-4">
                                                    {['Status', 'Done', 'Fail', 'Status', 'Done', 'Fail'].slice(0, 3).map((l, i) => {
                                                        const key = `${type}${i === 0 ? 'Status' : i === 1 ? 'Complete' : 'NotComplete'}`;
                                                        return (
                                                            <label key={key} className="flex flex-col items-center gap-0.5 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!c[key]}
                                                                    onChange={e => handleContainerChange(idx, key, e.target.checked)}
                                                                    disabled={!isEdit && !isCreate}
                                                                    className={`w-3.5 h-3.5 rounded border-slate-200 ${type === 'sims' ? 'text-blue-600' : 'text-emerald-600'}`}
                                                                />
                                                                <span className="text-[7px] text-slate-400 font-bold uppercase">{['STS', 'OK', 'X'][i]}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                        ))}

                                        {(isEdit || isCreate) && (
                                            <td className="px-2 text-center">
                                                <button onClick={() => setContainers(containers.filter((_, i) => i !== idx))} className="p-1.5 text-slate-200 hover:text-red-500 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
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
            {showSettings && (
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
            )}
            {/* Styled History Sidebar */}
            {showHistory && (
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
            )}
        </div>
    );
}
