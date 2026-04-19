"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import API from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
    Loader2, RefreshCw, Settings, ChevronLeft, ChevronRight,
    Search, Calendar, ChevronDown, ChevronUp, ExternalLink, History,
    Users, ChevronsUpDown, Check, X, FileSpreadsheet, Eye, EyeOff, Printer
} from 'lucide-react';
import Link from 'next/link';

// Reusable Combobox Component
const Combobox = ({ value, onChange, options, placeholder, onAddNew }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const wrapperRef = React.useRef(null);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt =>
        opt.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="relative w-full md:w-64" ref={wrapperRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-2 bg-slate-50/50 border border-slate-200 rounded-lg flex items-center justify-between cursor-pointer hover:border-blue-400 transition-all text-sm shadow-sm"
            >
                <span className={value ? "text-slate-900 font-medium" : "text-slate-400"}>
                    {value || placeholder}
                </span>
                <ChevronsUpDown className="w-4 h-4 text-slate-400" />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-slate-100">
                        <input
                            type="text"
                            className="w-full px-2 py-1 text-sm outline-none placeholder:text-slate-300 font-medium"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="overflow-y-auto flex-1">
                        {filteredOptions.map((opt) => (
                            <button
                                key={opt}
                                onClick={() => {
                                    onChange(opt);
                                    setIsOpen(false);
                                    setSearch('');
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between ${value === opt ? 'bg-slate-50 font-bold text-blue-600' : 'text-slate-700'
                                    }`}
                            >
                                {opt}
                                {value === opt && <Check className="w-3 h-3" />}
                            </button>
                        ))}

                        {filteredOptions.length === 0 && (
                            <div className="px-3 py-2 text-xs text-slate-400 text-center font-medium uppercase tracking-widest">
                                No options found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Enhanced editable cell component with Tab support
// Suggestion Editable Cell Component
const SuggestionEditableCell = ({ value, onSave, suggestions = [], placeholder = "Add...", tabIndex }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value || '');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const filteredSuggestions = suggestions.filter(s =>
        s?.toLowerCase().includes(currentValue?.toLowerCase())
    );

    const handleBlur = () => {
        setTimeout(() => {
            setIsEditing(false);
            setShowSuggestions(false);
            if (currentValue !== (value || '')) {
                onSave(currentValue);
            }
        }, 200);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleBlur();
        }
    };

    if (isEditing) {
        return (
            <div className="relative w-full">
                <input
                    type="text"
                    className="w-full px-2 py-1 text-xs border border-blue-400 rounded outline-none bg-white font-medium text-slate-700 focus:ring-4 focus:ring-blue-500/5 transition-all"
                    value={currentValue}
                    onChange={(e) => {
                        setCurrentValue(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSuggestions(true)}
                    autoFocus
                    tabIndex={tabIndex}
                />
                {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto py-1 animate-in fade-in zoom-in-95 duration-100">
                        {filteredSuggestions.map((s, idx) => (
                            <div
                                key={idx}
                                className="px-3 py-1.5 text-[11px] text-slate-600 hover:bg-slate-50 cursor-pointer font-medium flex items-center justify-between group"
                                onClick={() => {
                                    setCurrentValue(s);
                                    onSave(s);
                                    setIsEditing(false);
                                    setShowSuggestions(false);
                                }}
                            >
                                {s}
                                <Check className="w-3 h-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            onClick={() => {
                setCurrentValue(value || '');
                setIsEditing(true);
            }}
            className="w-full h-full min-h-[32px] cursor-pointer hover:bg-slate-50 transition-all flex items-center px-2 rounded-md border border-transparent hover:border-slate-200 group/cell"
            tabIndex={tabIndex}
            onFocus={() => {
                setCurrentValue(value || '');
                setIsEditing(true);
            }}
        >
            {value ? (
                <span className="truncate font-normal text-slate-700">
                    {value}
                </span>
            ) : (
                <span className="text-slate-300 italic text-[10px] uppercase tracking-wider font-medium group-hover/cell:text-slate-400">{placeholder}</span>
            )}
        </div>
    );
};

const EditableCell = ({ value, type = "text", onSave, tabIndex, className = "" }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);

    const handleBlur = () => {
        setIsEditing(false);
        if (currentValue !== value) {
            onSave(currentValue);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleBlur();
        }
    };

    if (isEditing) {
        return (
            <input
                type={type}
                className={`w-full bg-white border border-blue-400 focus:ring-4 focus:ring-blue-500/5 outline-none p-2 text-sm font-normal rounded shadow-sm transition-all ${className}`}
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                autoFocus
                tabIndex={tabIndex}
            />
        );
    }

    return (
        <div
            onClick={() => {
                setCurrentValue(value);
                setIsEditing(true);
            }}
            className={`w-full h-full min-h-[32px] cursor-pointer hover:bg-slate-50 transition-all flex items-center px-2 rounded-md border border-transparent hover:border-slate-200 group/cell ${className}`}
            tabIndex={tabIndex}
            onFocus={() => {
                setCurrentValue(value);
                setIsEditing(true);
            }}
        >
            {value ? (
                <span className="truncate font-normal text-slate-700">
                    {type === 'date' ? new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) : value}
                </span>
            ) : (
                <span className="text-slate-300 italic text-[10px] uppercase tracking-wider font-medium group-hover/cell:text-slate-400">Click to edit</span>
            )}
        </div>
    );
};

// Preview Modal Component
const BifurcationPreviewModal = ({ isOpen, onClose, data, settings = {} }) => {
    const [showFinancials, setShowFinancials] = useState(true);
    const [loading, setLoading] = useState(false);
    const previewRef = useRef(null);
    const { cbmVeryHighThreshold = 68, cbmHighThreshold = 69, weightVeryHighThreshold = 20, weightHighThreshold = 50 } = settings;

    if (!isOpen) return null;

    // First group by container, then by client
    const groupedData = {};
    data.forEach(item => {
        const cCode = item.containerCode;
        const client = item.clientName || '';
        if (!groupedData[cCode]) {
            groupedData[cCode] = {
                itemsByClient: {},
                totalCbm: item.containerTotalCbm || 0,
                totalWt: item.containerTotalWt || 0,
                totalCtn: 0,
                loadingDate: item.loadingDate,
                containerId: item.containerId,
                containerCode: item.containerCode
            };
        }
        if (!groupedData[cCode].itemsByClient[client]) {
            groupedData[cCode].itemsByClient[client] = [];
        }
        groupedData[cCode].itemsByClient[client].push(item);
        groupedData[cCode].totalCtn += item.ctn;
    });

    const firstContainer = Object.values(groupedData)[0] || {};
    const filename = `bifurcation-report-${firstContainer.containerCode || 'export'}`;

    const toSafeFileBase = (value) => {
        const raw = String(value || "")
            .trim()
            .replace(/\s+/g, "_")
            .replace(/[\\/:*?"<>|]+/g, "-");
        return raw || "bifurcation-report";
    };

    const handleDownloadExcel = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                containerId: firstContainer.containerId
            });

            const response = await API.get(`/bifurcation/export?${params.toString()}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${filename}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Excel exported successfully");
        } catch (error) {
            toast.error("Failed to export Excel");
        } finally {
            setLoading(false);
        }
    };

    const startPrint = (fileBase) => {
        const content = previewRef.current;
        if (!content || typeof document === "undefined") return;

        const existing = document.getElementById("bifurcation-print-root");
        if (existing) existing.remove();

        const root = document.createElement("div");
        root.id = "bifurcation-print-root";
        root.style.background = "#ffffff";

        const clone = content.cloneNode(true);
        clone.className = "";
        root.appendChild(clone);
        document.body.appendChild(root);

        document.body.classList.add("bifurcation-printing");
        const originalTitle = document.title;
        document.title = fileBase;

        let cleanedUp = false;
        const cleanup = () => {
            if (cleanedUp) return;
            cleanedUp = true;
            document.title = originalTitle;
            document.body.classList.remove("bifurcation-printing");
            root.remove();
        };

        window.addEventListener("afterprint", cleanup, { once: true });
        setTimeout(cleanup, 30_000);
        requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
    };

    const handlePrint = () => {
        const containerCode = firstContainer.containerCode || "export";
        startPrint(toSafeFileBase(`bifurcation-report-${containerCode}`));
    };

    return (
        <>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                <div className="bg-white w-full max-w-[1400px] h-[90vh] rounded-xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col font-sans">
                {/* Header */}
                <div className="px-6 py-4 border-b flex justify-between items-center bg-white print:hidden">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Bifurcation Report Preview</h2>
                        <p className="text-xs text-slate-500 font-medium">Professional Logistics Report View</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowFinancials(!showFinancials)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors font-bold text-[10px]"
                        >
                            {showFinancials ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            {showFinancials ? 'Hide Financials' : 'Show Financials'}
                        </button>

                        <button
                            onClick={handleDownloadExcel}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors font-semibold text-xs shadow-sm border border-emerald-200 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                            Excel Report
                        </button>

                        <div className="w-px h-6 bg-slate-200 mx-1" />

                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-semibold text-xs shadow-sm"
                        >
                            <Printer className="w-4 h-4" />
                            Print Report
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-100 print:bg-white print:p-0 print-content">
                    <div ref={previewRef} className="print-area space-y-8 max-w-[1100px] mx-auto bg-white p-12 shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-4 min-h-[1000px] print:max-w-full">

                        {/* Document Header */}
                        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Bifurcation Report</h1>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Confidential Logistics Document</p>
                            </div>
                            <div className="text-right">
                                <div className="inline-block bg-slate-100 px-3 py-1 rounded">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Generated</p>
                                    <p className="text-sm font-bold text-slate-800">{new Date().toLocaleDateString('en-GB')}</p>
                                </div>
                            </div>
                        </div>

                        {Object.entries(groupedData).map(([cCode, container]) => (
                            <div key={cCode} className="bifurcation-container-section mb-10 last:mb-0 break-inside-avoid">
                                {/* Container Header */}
                                <div className="flex items-center justify-between mb-4 bg-slate-50 p-3 rounded border border-slate-200">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-slate-900 text-white px-3 py-1 rounded text-sm font-bold">
                                            {cCode}
                                        </div>
                                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                            Loading: {container.loadingDate ? new Date(container.loadingDate).toLocaleDateString() : '-'}
                                        </div>
                                    </div>
                                    <div className="flex gap-6 text-xs font-bold">
                                        <div>
                                            <span className="text-slate-400 uppercase mr-1">T. Ctn:</span>
                                            <span className="text-slate-800">{container.totalCtn}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 uppercase mr-1">T. CBM:</span>
                                            <span className={`px-1 rounded ${container.totalCbm < cbmVeryHighThreshold ? 'text-red-600 bg-red-50' : container.totalCbm < cbmHighThreshold ? 'text-amber-600 bg-amber-50' : 'text-slate-800'}`}>
                                                {container.totalCbm?.toFixed(3)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 uppercase mr-1">T. WT:</span>
                                            <span className={`px-1 rounded ${container.totalWt < weightVeryHighThreshold ? 'text-red-600 bg-red-50' : container.totalWt < weightHighThreshold ? 'text-amber-600 bg-amber-50' : 'text-slate-800'}`}>
                                                {container.totalWt?.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <table className="w-full border-collapse text-[10px]">
                                    <thead>
                                        <tr className="bg-slate-100 text-slate-600 font-bold text-left border-y border-slate-300 uppercase tracking-wide">
                                            <th className="px-3 py-2 w-12 text-center">#</th>
                                            <th className="px-3 py-2">Mark</th>
                                            <th className="px-3 py-2 text-center">CTN</th>
                                            <th className="px-3 py-2">Product Detail</th>
                                            <th className="px-3 py-2 text-right">CBM</th>
                                            <th className="px-3 py-2 text-right">Weight</th>
                                            <th className="px-3 py-2 text-center">From</th>
                                            <th className="px-3 py-2 text-center">To</th>
                                            <th className="px-3 py-2 text-center">Delivery</th>
                                            {showFinancials && (
                                                <>
                                                    <th className="px-3 py-2 text-center">Inv #</th>
                                                    <th className="px-3 py-2 text-right">GST</th>
                                                    <th className="px-3 py-2 text-center">LR</th>
                                                    <th className="px-3 py-2 text-center">HISAB</th>
                                                    <th className="px-3 py-2 text-center">SENT</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {Object.entries(container.itemsByClient).map(([clientName, items], groupIdx) => (
                                            <React.Fragment key={clientName}>
                                                {/* Client row if needed */}
                                                {clientName && (
                                                    <tr className="bg-yellow-50/50 print:bg-slate-50 border-t border-slate-200">
                                                        <td colSpan={showFinancials ? "14" : "9"} className="px-3 py-2 border-l-4 border-yellow-400">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold text-slate-700 text-xs">{clientName}</span>
                                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest bg-white px-2 py-0.5 rounded border border-slate-200">
                                                                    {items.length} marks
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                                {items.map((item, idx) => (
                                                    <tr key={idx} className={`hover:bg-slate-50/50 transition-colors ${clientName && idx === items.length - 1 ? 'border-b border-slate-200' : ''}`}>
                                                        <td className="px-3 py-2 text-center text-slate-400 font-medium">{idx + 1}</td>
                                                        <td className="px-3 py-2 font-bold text-slate-700">{item.mark}</td>
                                                        <td className="px-3 py-2 text-center font-bold text-slate-700">{item.ctn}</td>
                                                        <td className="px-3 py-2 text-slate-600 font-medium truncate max-w-[200px]">{item.product}</td>
                                                        <td className="px-3 py-2 text-right font-medium text-slate-600">{item.totalCbm?.toFixed(3)}</td>
                                                        <td className={`px-3 py-2 text-right font-bold ${parseFloat(item.totalWt) < weightVeryHighThreshold
                                                            ? 'text-red-600 bg-red-50/50 rounded'
                                                            : parseFloat(item.totalWt) < weightHighThreshold
                                                                ? 'text-amber-600 bg-amber-50/50 rounded'
                                                                : 'text-slate-600'
                                                            }`}>{item.totalWt?.toFixed(2)}</td>
                                                        <td className="px-3 py-2 text-center text-slate-500">{item.from || '-'}</td>
                                                        <td className="px-3 py-2 text-center text-slate-500">{item.to || '-'}</td>
                                                        <td className="px-3 py-2 text-center text-slate-500">
                                                            {item.deliveryDate ? new Date(item.deliveryDate).toLocaleDateString('en-GB') : '-'}
                                                        </td>
                                                        {showFinancials && (
                                                            <>
                                                                <td className="px-3 py-2 text-center font-bold text-slate-600">{item.invoiceNo || '-'}</td>
                                                                <td className="px-3 py-2 text-right font-medium text-slate-600">
                                                                    {item.gstAmount ? `₹${item.gstAmount.toLocaleString('en-IN')}` : '-'}
                                                                </td>
                                                                <td className="px-3 py-2 text-center">
                                                                    {item.lrNo ? <Check className="w-3 h-3 mx-auto text-emerald-500" /> : <X className="w-3 h-3 mx-auto text-slate-300" />}
                                                                </td>
                                                                <td className="px-3 py-2 text-center">
                                                                    {item.hisab ? <Check className="w-3 h-3 mx-auto text-amber-500" /> : <X className="w-3 h-3 mx-auto text-slate-300" />}
                                                                </td>
                                                                <td className="px-3 py-2 text-center">
                                                                    {item.sent ? <Check className="w-3 h-3 mx-auto text-emerald-500" /> : <X className="w-3 h-3 mx-auto text-slate-300" />}
                                                                </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                </div>

        
                </div>
            </div>
            <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 8mm; }

                    body.bifurcation-printing > :not(#bifurcation-print-root) { display: none !important; }
                    body.bifurcation-printing { margin: 0 !important; padding: 0 !important; }

                    body.bifurcation-printing #bifurcation-print-root {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: #ffffff !important;
                    }

                    body.bifurcation-printing #bifurcation-print-root * {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                    body.bifurcation-printing .break-inside-avoid {
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }

                    /* Start each container block on a new page in print preview (for large datasets) */
                    body.bifurcation-printing .bifurcation-container-section + .bifurcation-container-section {
                        break-before: page;
                        page-break-before: always;
                    }
                }
            `}</style>
        </>
    );
};

export default function BifurcationPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [showSettings, setShowSettings] = useState(false);
    const [mixLimit, setMixLimit] = useState(5);
    const [weightVeryHighThreshold, setWeightVeryHighThreshold] = useState(20);
    const [weightHighThreshold, setWeightHighThreshold] = useState(50);
    const [cbmVeryHighThreshold, setCbmVeryHighThreshold] = useState(68);
    const [cbmHighThreshold, setCbmHighThreshold] = useState(69);
    const [savingSettings, setSavingSettings] = useState(false);
    const [previewContainerCode, setPreviewContainerCode] = useState(null);

    // UI State
    const [expandedContainers, setExpandedContainers] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [origin, setOrigin] = useState('');
    const [origins, setOrigins] = useState([]);
    const [locationSuggestions, setLocationSuggestions] = useState({ froms: [], tos: [] });

    // Grouping helper
    const groupByContainer = (list) => {
        const groups = {};
        list.forEach(item => {
            if (!groups[item.containerCode]) {
                groups[item.containerCode] = [];
            }
            groups[item.containerCode].push(item);
        });
        return groups;
    };

    const fetchData = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page,
                limit: 10,
                search: searchTerm,
                dateFrom: dateRange.from,
                dateTo: dateRange.to,
                origin: origin
            });
            const response = await API.get(`/bifurcation?${params.toString()}`);
            if (response.data.success) {
                setData(response.data.data);
                setPagination(response.data.pagination);
                if (response.data.settings) {
                    setMixLimit(response.data.settings.mixLimit);
                    setWeightVeryHighThreshold(response.data.settings.weightVeryHighThreshold);
                    setWeightHighThreshold(response.data.settings.weightHighThreshold);
                    setCbmVeryHighThreshold(response.data.settings.cbmVeryHighThreshold);
                    setCbmHighThreshold(response.data.settings.cbmHighThreshold);
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load bifurcation report");
        } finally {
            setLoading(false);
        }
    }, [searchTerm, dateRange, origin, pagination.page]);

    // Handle Ctrl+S for global refresh/save trigger
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                fetchData(pagination.page);
                toast.success("Data refreshed");
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [fetchData, pagination.page]);

    const handleUpdate = async (sheetId, field, value) => {
        const oldData = [...data];
        const newData = data.map(item => {
            if (item.id === sheetId) {
                return { ...item, [field]: value };
            }
            return item;
        });
        setData(newData);

        try {
            const item = newData.find(i => i.id === sheetId);
            const payload = {
                gst: item.gst,
                gstAmount: item.gstAmount,
                deliveryDate: item.deliveryDate,
                from: item.from,
                to: item.to,
                lrNo: item.lrNo,
                hisab: item.hisab,
                sent: item.sent,
                invoiceNo: item.invoiceNo
            };

            await API.post(`/bifurcation/${sheetId}`, payload);
            toast.success("Field updated");
            fetchLocations(); // Refresh suggestions if new one added
        } catch (error) {
            toast.error("Failed to save field");
            setData(oldData);
        }
    };

    const handleUpdateSetting = async () => {
        try {
            setSavingSettings(true);
            await API.post('/settings/bifurcation/update', {
                mixLimit: parseInt(mixLimit),
                weightVeryHighThreshold: parseFloat(weightVeryHighThreshold),
                weightHighThreshold: parseFloat(weightHighThreshold),
                cbmVeryHighThreshold: parseFloat(cbmVeryHighThreshold),
                cbmHighThreshold: parseFloat(cbmHighThreshold)
            });
            toast.success("Settings updated");
            setShowSettings(false);
            fetchData(pagination.page);
        } catch (error) {
            toast.error("Failed to update settings");
        } finally {
            setSavingSettings(false);
        }
    };

    const handleExportExcel = async () => {
        try {
            toast.info("Preparing Excel export...");
            const params = new URLSearchParams({
                search: searchTerm,
                dateFrom: dateRange.from,
                dateTo: dateRange.to,
                origin: origin
            });

            const response = await API.get(`/bifurcation/export?${params.toString()}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `bifurcation_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Excel exported successfully");
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Failed to export Excel");
        }
    };

    const toggleContainer = (code) => {
        setExpandedContainers(prev => ({
            ...prev,
            [code]: !prev[code]
        }));
    };

    useEffect(() => {
        fetchOrigins();
    }, []);

    const fetchOrigins = async () => {
        try {
            const response = await API.get('/containers/origins');
            if (response.data.success) {
                setOrigins(response.data.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchLocations = async () => {
        try {
            const response = await API.get('/bifurcation/locations');
            if (response.data.success) {
                setLocationSuggestions(response.data.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchData();
        fetchLocations();
    }, [searchTerm, dateRange.from, dateRange.to, origin]);

    const groupedData = groupByContainer(data);
    const containerCodes = Object.keys(groupedData).sort();

    return (
        <div className="p-4 bg-white min-h-screen font-sans antialiased text-slate-800">
            <BifurcationPreviewModal
                isOpen={!!previewContainerCode}
                onClose={() => setPreviewContainerCode(null)}
                data={previewContainerCode ? groupedData[previewContainerCode] || [] : []}
                settings={{
                    cbmVeryHighThreshold,
                    cbmHighThreshold,
                    weightVeryHighThreshold,
                    weightHighThreshold
                }}
            />
            <div className="max-w-[1600px] mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b pb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Bifurcation Report</h1>
                            <span className="text-[10px] text-slate-400 font-bold border rounded px-1.5 py-0.5 uppercase">
                                {data.length} Marks
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Logistics & Delivery Schedules</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/dashboard/bifurcation/activities"
                            className="flex items-center gap-2.5 bg-white border border-slate-200 text-slate-600 px-5 py-3 rounded-2xl hover:bg-slate-50 transition-all shadow-sm font-semibold text-sm group"
                        >
                            <History className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                            <span>Activities</span>
                        </Link>

                        <button
                            onClick={() => setShowSettings(true)}
                            className="inline-flex items-center gap-2.5 bg-white border border-slate-200 text-slate-400 p-3 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
                        >
                            <Settings className="w-4 h-4" />
                        </button>

                        <button
                            onClick={handleExportExcel}
                            className="flex items-center gap-2.5 bg-emerald-50 text-emerald-700 px-5 py-3 rounded-2xl hover:bg-emerald-100 transition-all border border-emerald-200 shadow-sm font-semibold text-sm group"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>Export All (Excel)</span>
                        </button>

                        <button
                            onClick={() => fetchData(pagination.page)}
                            className="inline-flex items-center gap-2.5 bg-white border border-slate-200 text-slate-400 p-3 rounded-2xl hover:bg-slate-50 transition-all shadow-sm group"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="flex flex-col md:flex-row gap-3 mb-6 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search container or shipping mark..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        <div className="flex items-center gap-2 bg-slate-50/50 border border-slate-200 px-3 py-1.5 rounded-lg">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="date"
                                className="bg-transparent text-xs font-medium text-slate-600 outline-none"
                                value={dateRange.from}
                                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                            />
                            <span className="text-slate-300 text-[10px] uppercase font-bold px-1">to</span>
                            <input
                                type="date"
                                className="bg-transparent text-xs font-medium text-slate-600 outline-none"
                                value={dateRange.to}
                                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                            />
                        </div>

                        <Combobox
                            options={origins}
                            value={origin}
                            onChange={(val) => setOrigin(val)}
                            placeholder="All Origins"
                        />

                        {(searchTerm || origin || dateRange.from || dateRange.to) && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setOrigin('');
                                    setDateRange({ from: '', to: '' });
                                }}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Clear all filters"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Content: Accordions */}
                <div className="space-y-4 min-h-[400px]">
                    {loading && data.length === 0 ? (
                        <div className="flex h-64 items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                <span className="text-sm text-slate-400 font-semibold animate-pulse">Loading report...</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            {containerCodes.map(code => {
                                const items = groupedData[code];
                                const containerId = items[0].containerId;
                                const containerTotalCbm = items[0]?.containerTotalCbm || 0;
                                const containerTotalWt = items[0]?.containerTotalWt || 0;
                                const totalCtn = items.reduce((sum, i) => sum + i.ctn, 0);
                                const isExpanded = expandedContainers[code] !== false; // Default expanded

                                return (
                                    <div key={code} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                        {/* Accordion Header */}
                                        <div
                                            className="px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer hover:bg-slate-50 transition-colors border-b border-transparent hover:border-slate-100"
                                            onClick={() => toggleContainer(code)}
                                        >
                                            <div className="flex items-center gap-8 mb-4 md:mb-0">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Container</span>
                                                    <div className="flex items-center gap-2.5 group/code">
                                                        <h2 className="text-xl font-black text-slate-800 tracking-tight">{code}</h2>
                                                        <Link
                                                            href={`/dashboard/loading/${containerId}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="p-1 opacity-0 group-hover/code:opacity-100 transition-all text-blue-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-blue-100 rounded-lg"
                                                            title="View details"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </Link>
                                                    </div>
                                                </div>

                                                <div className="hidden md:block w-px h-8 bg-slate-200"></div>

                                                <div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Loading Date</div>
                                                    <p className="text-sm font-bold text-blue-600">
                                                        {new Date(items[0].loadingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-8 md:gap-12 w-full md:w-auto justify-between md:justify-end">
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total CTN</p>
                                                    <p className="text-lg font-black text-slate-800">{totalCtn}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total CBM</p>
                                                    <p className={`text-lg font-black ${containerTotalCbm < cbmVeryHighThreshold
                                                        ? 'text-red-600'
                                                        : containerTotalCbm < cbmHighThreshold
                                                            ? 'text-amber-600'
                                                            : 'text-slate-800'
                                                        }`}>{containerTotalCbm.toFixed(3)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total WT</p>
                                                    <p className={`text-lg font-black ${containerTotalWt < weightVeryHighThreshold
                                                        ? 'text-red-600'
                                                        : containerTotalWt < weightHighThreshold
                                                            ? 'text-amber-600'
                                                            : 'text-slate-800'
                                                        }`}>{containerTotalWt.toFixed(2)}</p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPreviewContainerCode(code);
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors group/btn"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                    <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Print</span>
                                                </button>
                                                <div className="pl-4">
                                                    {isExpanded ? <ChevronUp className="w-5 h-5 text-blue-500" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Accordion Content */}
                                        {isExpanded && (
                                            <div className="animate-in slide-in-from-top-1 duration-200">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-xs">
                                                        <thead>
                                                            <tr className="bg-slate-100 text-slate-600 font-bold text-left border-y border-slate-300 uppercase tracking-wide">
                                                                <th className="px-3 py-2 w-12 text-center">#</th>
                                                                <th className="px-3 py-2">Shipping Mark</th>
                                                                <th className="px-3 py-2 text-center">CTN</th>
                                                                <th className="px-3 py-2">Product Detail</th>
                                                                <th className="px-3 py-2 text-right">CBM</th>
                                                                <th className="px-3 py-2 text-right">WT</th>
                                                                <th className="px-3 py-2 text-center">From</th>
                                                                <th className="px-3 py-2 text-center">To</th>
                                                                <th className="px-3 py-2 text-center">Delivery</th>
                                                                <th className="px-3 py-2 text-center">Inv #</th>
                                                                <th className="px-3 py-2 text-right">GST</th>
                                                                <th className="px-3 py-2 text-center">LR</th>
                                                                <th className="px-3 py-2 text-center">HISAB</th>
                                                                <th className="px-3 py-2 text-center">SENT</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {(() => {
                                                                const groups = {};
                                                                items.forEach(it => {
                                                                    const c = it.clientName || '';
                                                                    if (!groups[c]) groups[c] = [];
                                                                    groups[c].push(it);
                                                                });

                                                                const groupEntries = Object.entries(groups).sort(([a], [b]) => {
                                                                    if (!a) return -1;
                                                                    if (!b) return 1;
                                                                    return a.localeCompare(b);
                                                                });

                                                                return groupEntries.map(([client, clientItems], gIdx) => (
                                                                    <React.Fragment key={client || 'none'}>
                                                                        {client && (
                                                                            <tr className="bg-yellow-50/50 print:bg-slate-50 border-t border-slate-200">
                                                                                <td colSpan="14" className="px-3 py-2 border-l-4 border-yellow-400">
                                                                                    <div className="flex items-center gap-3 group/client">
                                                                                        <Users className="w-3.5 h-3.5 text-blue-500/60" />
                                                                                        <Link
                                                                                            href={`/dashboard/loading/${clientItems[0].containerId}?client=${encodeURIComponent(client)}`}
                                                                                            className="text-[11px] font-bold text-slate-800 uppercase tracking-tight hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-2 group-hover/client:underline"
                                                                                        >
                                                                                            {client}
                                                                                            <ExternalLink className="w-3 h-3 opacity-0 group-hover/client:opacity-100 transition-opacity text-blue-500" />
                                                                                        </Link>
                                                                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest bg-white px-2 py-0.5 rounded border border-slate-200">
                                                                                            {clientItems.length} {clientItems.length === 1 ? 'mark' : 'marks'}
                                                                                        </span>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        )}
                                                                        {clientItems.map((item, iIdx) => (
                                                                            <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors ${client && iIdx === clientItems.length - 1 ? 'border-b border-slate-200' : ''}`}>
                                                                                <td className="px-3 py-2 text-center text-slate-400 font-medium">
                                                                                    {client ? `${gIdx}.${iIdx + 1}` : iIdx + 1}
                                                                                </td>
                                                                                <td className="px-3 py-2 font-bold text-slate-700">{item.mark}</td>
                                                                                <td className="px-3 py-2 text-center font-bold text-slate-700">{item.ctn}</td>
                                                                                <td className="px-3 py-2 text-slate-600 font-medium truncate max-w-[250px]" title={item.product}>
                                                                                    {item.product}
                                                                                </td>
                                                                                <td className="px-3 py-2 text-right font-medium text-slate-600">
                                                                                    {item.totalCbm.toFixed(3)}
                                                                                </td>
                                                                                <td className={`px-3 py-2 text-right font-bold ${parseFloat(item.totalWt) < weightVeryHighThreshold
                                                                                    ? 'text-red-600 bg-red-50/50 rounded'
                                                                                    : parseFloat(item.totalWt) < weightHighThreshold
                                                                                        ? 'text-amber-600 bg-amber-50/50 rounded'
                                                                                        : 'text-slate-600'
                                                                                    }`}>
                                                                                    {item.totalWt.toFixed(2)}
                                                                                </td>

                                                                                <td className="px-3 py-2 text-center">
                                                                                    <SuggestionEditableCell
                                                                                        value={item.from}
                                                                                        suggestions={locationSuggestions.froms}
                                                                                        placeholder="From..."
                                                                                        onSave={(val) => handleUpdate(item.id, 'from', val)}
                                                                                        tabIndex={(gIdx * 1000) + (iIdx * 10) + 1}
                                                                                    />
                                                                                </td>
                                                                                <td className="px-3 py-2 text-center">
                                                                                    <SuggestionEditableCell
                                                                                        value={item.to}
                                                                                        suggestions={locationSuggestions.tos}
                                                                                        placeholder="To..."
                                                                                        onSave={(val) => handleUpdate(item.id, 'to', val)}
                                                                                        tabIndex={(gIdx * 1000) + (iIdx * 10) + 2}
                                                                                    />
                                                                                </td>

                                                                                <td className="px-3 py-2 text-center">
                                                                                    <EditableCell
                                                                                        value={item.deliveryDate}
                                                                                        type="date"
                                                                                        onSave={(val) => handleUpdate(item.id, 'deliveryDate', val)}
                                                                                        tabIndex={(gIdx * 1000) + (iIdx * 10) + 3}
                                                                                        className="text-slate-600 font-normal"
                                                                                    />
                                                                                </td>
                                                                                <td className="px-3 py-2 text-center">
                                                                                    <EditableCell
                                                                                        value={item.invoiceNo}
                                                                                        onSave={(val) => handleUpdate(item.id, 'invoiceNo', val)}
                                                                                        tabIndex={(gIdx * 1000) + (iIdx * 10) + 4}
                                                                                        className="text-slate-600 font-normal"
                                                                                    />
                                                                                </td>
                                                                                <td className="px-3 py-2 text-right">
                                                                                    <div className="flex items-center justify-end gap-1">
                                                                                        <span className="text-slate-300 font-medium text-[10px]">₹</span>
                                                                                        <EditableCell
                                                                                            value={item.gstAmount || 0}
                                                                                            type="number"
                                                                                            onSave={(val) => handleUpdate(item.id, 'gstAmount', val)}
                                                                                            tabIndex={(gIdx * 1000) + (iIdx * 10) + 5}
                                                                                            className="text-slate-600 font-normal text-right"
                                                                                        />
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-3 py-2 text-center">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        className="w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-4 focus:ring-blue-500/10 cursor-pointer transition-all"
                                                                                        checked={item.lrNo}
                                                                                        onChange={(e) => handleUpdate(item.id, 'lrNo', e.target.checked)}
                                                                                        tabIndex={(gIdx * 1000) + (iIdx * 10) + 6}
                                                                                    />
                                                                                </td>
                                                                                <td className="px-3 py-2 text-center">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        className="w-4 h-4 rounded-md border-slate-300 text-amber-600 focus:ring-4 focus:ring-amber-500/10 cursor-pointer transition-all"
                                                                                        checked={item.hisab}
                                                                                        onChange={(e) => handleUpdate(item.id, 'hisab', e.target.checked)}
                                                                                        tabIndex={(gIdx * 1000) + (iIdx * 10) + 7}
                                                                                    />
                                                                                </td>
                                                                                <td className="px-3 py-2 text-center">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        className="w-4 h-4 rounded-md border-slate-300 text-emerald-600 focus:ring-4 focus:ring-emerald-500/10 cursor-pointer transition-all"
                                                                                        checked={item.sent}
                                                                                        onChange={(e) => handleUpdate(item.id, 'sent', e.target.checked)}
                                                                                        tabIndex={(gIdx * 1000) + (iIdx * 10) + 8}
                                                                                    />
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </React.Fragment>
                                                                ));
                                                            })()}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {containerCodes.length === 0 && (
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-20 text-center">
                                    <div className="max-w-xs mx-auto flex flex-col items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                                            <Search className="w-6 h-6 text-slate-200" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-slate-800">No report data</h3>
                                            <p className="text-slate-400 text-xs">Try adjusting your filters or sync data.</p>
                                        </div>
                                        <button
                                            onClick={() => { setSearchTerm(''); setDateRange({ from: '', to: '' }) }}
                                            className="text-xs text-blue-500 font-bold hover:text-blue-700 transition-colors"
                                        >
                                            Clear filters
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="flex justify-between items-center bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm mt-8">
                                    <span className="text-xs font-semibold text-slate-400">
                                        Page <span className="text-slate-700">{pagination.page}</span> / {pagination.totalPages}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => fetchData(pagination.page - 1)}
                                            disabled={pagination.page <= 1}
                                            className="p-2 border border-slate-100 rounded-xl disabled:opacity-20 hover:bg-slate-50 transition-all font-bold text-slate-600"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <div className="flex items-center gap-1 mx-1">
                                            {[...Array(pagination.totalPages)].map((_, i) => (
                                                <button
                                                    key={i + 1}
                                                    onClick={() => fetchData(i + 1)}
                                                    className={`w-8 h-8 rounded-xl font-bold text-xs transition-all ${pagination.page === i + 1 ? 'bg-blue-600 text-white shadow-md shadow-blue-50' : 'text-slate-400 hover:bg-slate-50'}`}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => fetchData(pagination.page + 1)}
                                            disabled={pagination.page >= pagination.totalPages}
                                            className="p-2 border border-slate-100 rounded-xl disabled:opacity-20 hover:bg-slate-50 transition-all font-bold text-slate-600"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Compact Header */}
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Settings className="w-4 h-4 text-blue-600" />
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Report Configuration</h3>
                            </div>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="p-1.5 hover:bg-slate-200/50 rounded-lg transition-colors text-slate-400"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Product Layout Limit - Integrated */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                                    Product Layout Limit
                                    <span className="text-[9px] font-normal lowercase">(marks count)</span>
                                </label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-bold text-slate-700 text-sm"
                                    value={mixLimit}
                                    onChange={(e) => setMixLimit(e.target.value)}
                                />
                                <p className="text-[9px] text-slate-400 font-medium italic">Collapses product list into &quot;MIX ITEM&quot; if marks exceed this limit.</p>
                            </div>

                            {/* Efficiency Threshold Grid */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="h-px flex-1 bg-slate-100"></div>
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Efficiency Thresholds</span>
                                    <div className="h-px flex-1 bg-slate-100"></div>
                                </div>

                                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                    {/* Weight Settings */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                            <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Weight (KG)</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-400 focus:bg-white transition-all text-xs font-bold text-red-600"
                                                    value={weightVeryHighThreshold}
                                                    onChange={(e) => setWeightVeryHighThreshold(e.target.value)}
                                                />
                                                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-sm"></div>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-400 focus:bg-white transition-all text-xs font-bold text-amber-600"
                                                    value={weightHighThreshold}
                                                    onChange={(e) => setWeightHighThreshold(e.target.value)}
                                                />
                                                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-400 border-2 border-white shadow-sm"></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CBM Settings */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Volume (CBM)</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-400 focus:bg-white transition-all text-xs font-bold text-red-600"
                                                    value={cbmVeryHighThreshold}
                                                    onChange={(e) => setCbmVeryHighThreshold(e.target.value)}
                                                />
                                                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-sm"></div>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-400 focus:bg-white transition-all text-xs font-bold text-amber-600"
                                                    value={cbmHighThreshold}
                                                    onChange={(e) => setCbmHighThreshold(e.target.value)}
                                                />
                                                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-400 border-2 border-white shadow-sm"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Enhanced Visual Legend */}
                            <div className="bg-slate-900 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Efficiency Guide</span>
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-3 rounded-full bg-red-500"></div>
                                        <div className="w-1.5 h-3 rounded-full bg-amber-400"></div>
                                        <div className="w-1.5 h-3 rounded-full bg-emerald-500"></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                    <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/5">
                                        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                                        <p className="text-[10px] text-slate-300 font-medium">
                                            Value <span className="text-red-400 font-bold">&lt; {cbmVeryHighThreshold} CBM</span> or <span className="text-red-400 font-bold">&lt; {weightVeryHighThreshold} KG</span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/5">
                                        <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"></div>
                                        <p className="text-[10px] text-slate-300 font-medium">
                                            Value <span className="text-amber-400 font-bold">&lt; {cbmHighThreshold} CBM</span> or <span className="text-amber-400 font-bold">&lt; {weightHighThreshold} KG</span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                        <p className="text-[10px] text-slate-300 font-medium italic">
                                            Everything else remains normal/white.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Compact Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="px-4 py-3 text-[10px] font-bold text-slate-500 hover:text-slate-700 transition-colors uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateSetting}
                                    disabled={savingSettings}
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {savingSettings ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <>
                                            <Check className="w-3.5 h-3.5" />
                                            Update Report
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
