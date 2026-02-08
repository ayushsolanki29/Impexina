"use client";

import React, { useState, useEffect, useCallback } from 'react';
import API from '@/lib/api';
import { toast } from 'sonner';
import {
    Loader2, RefreshCw, ChevronLeft, ChevronRight,
    Search, Calendar, ChevronDown, ChevronUp, ExternalLink,
    Truck, FileText, Package, Waves, MapPin, X, Printer,
    Download, Settings, Info, Briefcase, ChevronsUpDown, Check,
    Eye, EyeOff, Camera, Trash2, Plus, History, Upload
} from 'lucide-react';
import Link from 'next/link';

// Reusable Combobox Component
const Combobox = ({ value, onChange, options, placeholder }) => {
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
                                No Ports found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Preview Modal Component
// Preview Modal Component
const WarehousePreviewModal = ({ isOpen, onClose, data }) => {
    const [showFinancials, setShowFinancials] = useState(true);

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
                loadingDate: item.loadingDate
            };
        }
        if (!groupedData[cCode].itemsByClient[client]) {
            groupedData[cCode].itemsByClient[client] = [];
        }
        groupedData[cCode].itemsByClient[client].push(item);
        groupedData[cCode].totalCtn += item.ctn;
    });

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-[1400px] h-[90vh] rounded-xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col font-sans">
                {/* Header */}
                <div className="px-6 py-4 border-b flex justify-between items-center bg-white print:hidden">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Warehouse Plan Preview</h2>
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
                            onClick={() => window.print()}
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
                <div className="flex-1 overflow-y-auto p-8 bg-slate-100 print:bg-white print:p-0">
                    <div className="print-area space-y-8 max-w-[1100px] mx-auto bg-white p-12 shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-4 min-h-[1000px]">

                        {/* Document Header */}
                        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Warehouse Plan</h1>
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
                            <div key={cCode} className="mb-10 last:mb-0 break-inside-avoid">
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
                                            <span className="text-slate-800">{container.totalCbm?.toFixed(3)}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 uppercase mr-1">T. WT:</span>
                                            <span className="text-slate-800">{container.totalWt?.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <table className="w-full border-collapse text-[10px]">
                                    <thead>
                                        <tr className="bg-slate-100 text-slate-600 font-bold text-left border-y border-slate-300 uppercase tracking-wide">
                                            <th className="px-3 py-2 w-12 text-center">#</th>
                                            <th className="px-3 py-2">Mark</th>
                                            <th className="px-3 py-2 text-center">CTN</th>
                                            <th className="px-3 py-2">Product</th>
                                            <th className="px-3 py-2 text-center text-blue-600">Transporter</th>
                                            <th className="px-3 py-2 text-right">CBM</th>
                                            <th className="px-3 py-2 text-right">Weight</th>
                                            <th className="px-3 py-2 text-center">Loading</th>
                                            <th className="px-3 py-2 text-center">Delivery</th>
                                            {showFinancials && (
                                                <>
                                                    <th className="px-3 py-2 text-center">Inv #</th>
                                                    <th className="px-3 py-2 text-right">GST</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {Object.entries(container.itemsByClient).map(([clientName, items], groupIdx) => (
                                            <React.Fragment key={clientName}>
                                                {/* Spacer between groups */}
                                                {groupIdx > 0 && (
                                                    <tr className="h-4 border-none">
                                                        <td colSpan={showFinancials ? "11" : "9"}></td>
                                                    </tr>
                                                )}

                                                {/* Client Selection Header */}
                                                {clientName && (
                                                    <tr className="bg-yellow-50/50 print:bg-slate-50 border-t border-slate-200">
                                                        <td colSpan={showFinancials ? "11" : "9"} className="px-3 py-2 border-l-4 border-yellow-400">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold text-slate-700 text-xs">{clientName}</span>
                                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest bg-white px-2 py-0.5 rounded border border-slate-200">
                                                                    {items.length} Items
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
                                                        <td className="px-3 py-2 text-slate-600 font-medium truncate max-w-[150px]">{item.product}</td>
                                                        <td className="px-3 py-2 text-center text-blue-600 font-semibold text-[9px] truncate max-w-[100px]">{item.transporter || '-'}</td>
                                                        <td className="px-3 py-2 text-right font-medium text-slate-600">{item.totalCbm?.toFixed(3)}</td>
                                                        <td className="px-3 py-2 text-right font-medium text-slate-600">{item.totalWt?.toFixed(0)}</td>
                                                        <td className="px-3 py-2 text-center text-slate-500">
                                                            {item.loadingDate ? new Date(item.loadingDate).toLocaleDateString('en-GB') : '-'}
                                                        </td>
                                                        <td className="px-3 py-2 text-center text-slate-500">
                                                            {item.deliveryDate ? new Date(item.deliveryDate).toLocaleDateString('en-GB') : '-'}
                                                        </td>
                                                        {showFinancials && (
                                                            <>
                                                                <td className="px-3 py-2 text-center font-bold text-slate-600">{item.invoiceNo || '-'}</td>
                                                                <td className="px-3 py-2 text-right font-medium text-slate-600">
                                                                    {item.gstAmount ? `₹${item.gstAmount}` : '-'}
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

                <div className="px-8 py-3 bg-white border-t text-[10px] text-slate-400 flex justify-between items-center print:hidden">
                    <span className="font-bold uppercase tracking-widest">Impexina Logistics Cloud</span>
                    <span className="font-medium italic">Confidential Document</span>
                </div>
            </div>
        </div>
    );
};

// Suggestion Editable Cell Component
const SuggestionEditableCell = ({ value, onSave, suggestions = [] }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value || '');
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        setCurrentValue(value || '');
    }, [value]);

    const filteredSuggestions = suggestions.filter(s =>
        s.toLowerCase().includes(currentValue.toLowerCase())
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

    if (isEditing) {
        return (
            <div className="relative w-full">
                <input
                    type="text"
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded outline-none bg-white font-medium text-slate-700 focus:border-blue-500"
                    value={currentValue}
                    onChange={(e) => {
                        setCurrentValue(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onBlur={handleBlur}
                    onFocus={() => setShowSuggestions(true)}
                    autoFocus
                />
                {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-100 rounded shadow-sm max-h-32 overflow-y-auto py-1">
                        {filteredSuggestions.map((s, idx) => (
                            <div
                                key={idx}
                                className="px-2 py-1 text-[10px] text-slate-600 hover:bg-slate-50 cursor-pointer font-medium"
                                onClick={() => {
                                    setCurrentValue(s);
                                    onSave(s);
                                    setIsEditing(false);
                                    setShowSuggestions(false);
                                }}
                            >
                                {s}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className="w-full h-full min-h-[28px] cursor-pointer hover:bg-slate-50 transition-colors flex items-center px-1 rounded gap-2 group"
        >
            <span className={`truncate text-xs ${value ? 'text-blue-600 font-semibold' : 'text-slate-300 italic'}`}>
                {value || 'Add Transporter'}
            </span>
            <Search className="w-2.5 h-2.5 text-slate-300 opacity-0 group-hover:opacity-100" />
        </div>
    );
};

// Enhanced editable cell component
const EditableCell = ({ value, type = "text", onSave, tabIndex }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

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
                className="w-full px-2 py-1 text-sm border-2 border-blue-500 rounded-md outline-none bg-white shadow-sm font-medium"
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
            onClick={() => setIsEditing(true)}
            className="w-full h-full min-h-[32px] cursor-pointer hover:bg-white/80 transition-colors flex items-center px-1 rounded hover:shadow-sm"
            tabIndex={tabIndex}
            onFocus={() => setIsEditing(true)}
        >
            {value ? (
                <span className="truncate font-medium text-slate-700">
                    {type === 'date' ? new Date(value).toLocaleDateString() : value}
                </span>
            ) : (
                <span className="text-slate-300 italic text-xs">Click to edit</span>
            )}
        </div>
    );
};


const ReferenceImagesSidebar = ({ container, isOpen, onClose }) => {
    const [images, setImages] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewHistory, setViewHistory] = useState(false);
    const [selectedFullImage, setSelectedFullImage] = useState(null);

    const fetchImages = async () => {
        if (!container?.containerId) return;
        try {
            setLoading(true);
            const [imgRes, histRes] = await Promise.all([
                API.get(`/containers/${container.containerId}/images`),
                API.get(`/containers/${container.containerId}/images/history`)
            ]);
            setImages(imgRes.data.data);
            setHistory(histRes.data.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load images");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchImages();
            setViewHistory(false);
        }
    }, [isOpen, container]);

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setLoading(true);
        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);

                const uploadRes = await API.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (uploadRes.data.success) {
                    await API.post(`/containers/${container.containerId}/images`, {
                        imageUrl: uploadRes.data.url,
                        fileName: file.name
                    });
                }
            }
            toast.success("Images uploaded successfully");
            fetchImages();
        } catch (error) {
            toast.error("Upload failed");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (imageId) => {
        if (!window.confirm("Are you sure you want to delete this image?")) return;
        try {
            await API.delete(`/containers/${container.containerId}/images/${imageId}`);
            toast.success("Image deleted");
            fetchImages();
        } catch (error) {
            toast.error("Delete failed");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <div className="p-6 border-b flex items-center justify-between bg-slate-50">
                    <div>
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <Camera className="w-4 h-4 text-blue-500" />
                            Warehouse Reference
                        </h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Container: {container.containerCode}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors border">
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>

                <div className="flex border-b text-[11px] font-bold uppercase tracking-wider">
                    <button
                        onClick={() => setViewHistory(false)}
                        className={`flex-1 py-3 border-b-2 transition-all ${!viewHistory ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-slate-400'}`}
                    >
                        Live Gallery
                    </button>
                    <button
                        onClick={() => setViewHistory(true)}
                        className={`flex-1 py-3 border-b-2 transition-all ${viewHistory ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-slate-400'}`}
                    >
                        Log History
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="h-40 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        </div>
                    ) : viewHistory ? (
                        <div className="space-y-4">
                            {history.length === 0 ? (
                                <p className="text-center text-slate-400 text-xs py-10">No activity recorded yet</p>
                            ) : (
                                history.map((item) => (
                                    <div key={item.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex gap-3">
                                        <div className="w-10 h-10 rounded-md bg-white border overflow-hidden shrink-0">
                                            <img src={item.imageUrl.startsWith('http') ? item.imageUrl : `${API.defaults.baseURL.replace('/api', '')}${item.imageUrl}`} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${item.deletedAt ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                    {item.deletedAt ? 'Deleted' : 'Uploaded'}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-800">
                                                    {item.deletedAt ? item.deletedBy?.name : item.uploadedBy?.name}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 truncate">{item.fileName || 'Reference Image'}</p>
                                            <p className="text-[9px] text-slate-400 mt-1">{new Date(item.deletedAt || item.createdAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <label className="aspect-square border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group">
                                <Plus className="w-6 h-6 text-slate-300 group-hover:text-blue-500" />
                                <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-500 uppercase tracking-widest text-center px-4">Add Warehouse Reference</span>
                                <input type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*" />
                            </label>
                            {images.map((img) => (
                                <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                                    <img
                                        src={img.imageUrl.startsWith('http') ? img.imageUrl : `${API.defaults.baseURL.replace('/api', '')}${img.imageUrl}`}
                                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
                                        onClick={() => setSelectedFullImage(img.imageUrl)}
                                    />
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleDelete(img.id)}
                                            className="p-1.5 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                            <span className="text-[8px] font-bold text-white uppercase">{img.uploadedBy?.name}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-slate-50 text-[10px] text-slate-400 font-medium">
                    Images are stored as official warehouse references. Upload limit 5MB per image.
                </div>
            </div>

            {selectedFullImage && (
                <div
                    className="fixed inset-0 z-[120] bg-slate-900/95 flex items-center justify-center p-8 animate-in fade-in"
                    onClick={() => setSelectedFullImage(null)}
                >
                    <button className="absolute top-8 right-8 p-3 text-white hover:bg-white/10 rounded-full">
                        <X className="w-8 h-8" />
                    </button>
                    <img
                        src={selectedFullImage.startsWith('http') ? selectedFullImage : `${API.defaults.baseURL.replace('/api', '')}${selectedFullImage}`}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    />
                </div>
            )}
        </div>
    );
};


export default function WarehouseModule() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [transporters, setTransporters] = useState([]);
    const [previewContainerCode, setPreviewContainerCode] = useState(null);
    const [selectedImagesContainer, setSelectedImagesContainer] = useState(null);

    // UI State
    const [expandedContainers, setExpandedContainers] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [origin, setOrigin] = useState('');
    const [origins, setOrigins] = useState([]);
    const [dateRange, setDateRange] = useState({ from: '', to: '' });

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

    const fetchOrigins = async () => {
        try {
            const response = await API.get('/containers/origins');
            if (response.data.success) {
                setOrigins(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch origins", error);
        }
    };

    const fetchTransporters = async () => {
        try {
            const response = await API.get('/warehouse/transporters');
            if (response.data.success) {
                setTransporters(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch transporters", error);
        }
    };

    const fetchData = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page,
                limit: 10,
                search: searchTerm,
                origin,
                dateFrom: dateRange.from,
                dateTo: dateRange.to
            });
            const response = await API.get(`/warehouse?${params.toString()}`);
            if (response.data.success) {
                setData(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load warehouse data");
        } finally {
            setLoading(false);
        }
    }, [searchTerm, dateRange, origin]);

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
            const payload = { transporter: value };
            await API.post(`/warehouse/${sheetId}`, payload);
            toast.success("Transporter updated");
        } catch (error) {
            toast.error("Failed to save transporter");
            setData(oldData);
        }
    };

    const toggleContainer = (code) => {
        setExpandedContainers(prev => ({
            ...prev,
            [code]: !prev[code]
        }));
    };

    useEffect(() => {
        fetchData();
        fetchTransporters();
        fetchOrigins();
    }, [searchTerm, origin, dateRange.from, dateRange.to]);

    const groupedData = groupByContainer(data);
    const containerCodes = Object.keys(groupedData).sort();

    return (
        <div className="p-4 bg-white min-h-screen font-sans antialiased text-slate-800">
            <div className="max-w-[1600px] mx-auto">
                <WarehousePreviewModal
                    isOpen={!!previewContainerCode}
                    onClose={() => setPreviewContainerCode(null)}
                    data={previewContainerCode ? groupedData[previewContainerCode] || [] : []}
                />

                <ReferenceImagesSidebar
                    container={selectedImagesContainer}
                    isOpen={!!selectedImagesContainer}
                    onClose={() => setSelectedImagesContainer(null)}
                />

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b pb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Warehouse Plan</h1>
                            <span className="text-[10px] text-slate-400 font-bold border rounded px-1.5 py-0.5 uppercase">
                                {data.length} Marks
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Logistics & Delivery Schedules</p>
                    </div>

                    <div className="flex items-center gap-2">

                        <button
                            onClick={() => fetchData(pagination.page)}
                            className="flex items-center gap-1.5 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors font-medium text-xs whitespace-nowrap"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Sync Data
                        </button>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="flex flex-col md:flex-row gap-3 mb-6 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search container or cargo mark..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

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

                {/* Main Content */}
                <div className="space-y-4 min-h-[400px]">
                    {loading && data.length === 0 ? (
                        <div className="flex h-64 items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                        </div>
                    ) : (
                        <>
                            {containerCodes.map(code => {
                                const items = groupedData[code];
                                const totalCtn = items.reduce((sum, i) => sum + i.ctn, 0);
                                const isExpanded = expandedContainers[code] !== false;

                                return (
                                    <div key={code} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                        {/* Container Header */}
                                        <div
                                            className="px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer hover:bg-slate-50 transition-colors border-b border-transparent hover:border-slate-100"
                                            onClick={() => toggleContainer(code)}
                                        >
                                            <div className="flex items-center gap-8 mb-4 md:mb-0">
                                                <div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Container</div>
                                                    <h2 className="text-xl font-black text-slate-800 tracking-tight">{code}</h2>
                                                </div>
                                                <div className="hidden md:block w-px h-8 bg-slate-200"></div>
                                                <div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Loading Date</div>
                                                    <p className="text-sm font-bold text-blue-600">
                                                        {items[0].loadingDate ? new Date(items[0].loadingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                                    </p>
                                                </div>
                                                <div className="hidden md:block w-px h-8 bg-slate-200"></div>
                                                <div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Origin</div>
                                                    <p className="text-sm font-bold text-slate-800 uppercase">
                                                        {items[0].origin || '-'}
                                                    </p>
                                                </div>
                                                <div className="hidden md:block w-px h-8 bg-slate-200"></div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPreviewContainerCode(code);
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors group"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                    <span className="text-xs font-bold uppercase tracking-wider">Print</span>
                                                </button>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedImagesContainer({
                                                            containerId: items[0].containerId,
                                                            containerCode: code
                                                        });
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors border border-slate-200"
                                                >
                                                    <Camera className="w-4 h-4" />
                                                    <span className="text-xs font-bold uppercase tracking-wider">Photos</span>
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-8 md:gap-12 w-full md:w-auto justify-between md:justify-end">
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total CTN</p>
                                                    <p className="text-lg font-black text-slate-800">{totalCtn}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total CBM</p>
                                                    <p className="text-lg font-black text-slate-800">{items[0].containerTotalCbm?.toFixed(3)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total WT</p>
                                                    <p className="text-lg font-black text-slate-800">{items[0].containerTotalWt?.toFixed(2)}</p>
                                                </div>
                                                <div className="pl-4">
                                                    {isExpanded ? <ChevronUp className="w-5 h-5 text-blue-500" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
                                                </div>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="overflow-x-auto border-t">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="bg-white text-slate-400 text-left uppercase text-[10px] font-bold tracking-widest border-b">
                                                            <th className="px-5 py-3 w-10 text-center">#</th>
                                                            <th className="px-5 py-3">Shipping Mark</th>
                                                            <th className="px-5 py-3 text-center">CTN</th>
                                                            <th className="px-5 py-3">Product Detail</th>
                                                            <th className="px-5 py-3 text-right">CBM</th>
                                                            <th className="px-5 py-3 text-right">WT</th>
                                                            <th className="px-5 py-3">From</th>
                                                            <th className="px-5 py-3">To</th>
                                                            <th className="px-5 py-3 text-blue-600">Transporter</th>
                                                            <th className="px-5 py-3 text-right">Delivery</th>
                                                            <th className="px-5 py-3 text-right">Inv No</th>
                                                            <th className="px-5 py-3 text-right">GST Amt</th>
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

                                                            const groupEntries = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));

                                                            return groupEntries.map(([client, clientItems], gIdx) => (
                                                                <React.Fragment key={client || 'none'}>
                                                                    {client && (
                                                                        <tr className="bg-blue-50/50">
                                                                            <td colSpan="12" className="px-5 py-2">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                                                    <span className="text-[11px] font-bold text-slate-500">Client:</span>
                                                                                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wide">{client}</span>
                                                                                    <span className="text-[10px] text-slate-400 font-medium ml-2">({clientItems.length} marks)</span>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                    {clientItems.map((item, iIdx) => (
                                                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-none">
                                                                            <td className="px-5 py-4 text-center text-blue-300 font-bold text-xs">{item.mark?.substring(0, 3) || '0.1'}</td>
                                                                            <td className="px-5 py-4 font-bold text-slate-800 text-xs w-[180px] leading-relaxed">{item.mark}</td>
                                                                            <td className="px-5 py-4 text-center font-black text-blue-600 text-xs">{item.ctn}</td>
                                                                            <td className="px-5 py-4 text-slate-600 text-xs font-semibold uppercase max-w-[200px] truncate">{item.product}</td>

                                                                            <td className="px-5 py-4 text-right">
                                                                                <span className="font-bold text-green-500 text-xs">{item.totalCbm.toFixed(3)}</span>
                                                                            </td>
                                                                            <td className="px-5 py-4 text-right">
                                                                                <span className="font-bold text-orange-500 text-xs">{item.totalWt.toFixed(2)}</span>
                                                                            </td>

                                                                            <td className="px-5 py-4 text-xs font-bold text-slate-700">{item.from}</td>
                                                                            <td className="px-5 py-4 text-xs font-bold text-slate-700">{item.to}</td>

                                                                            <td className="px-5 py-4">
                                                                                <SuggestionEditableCell
                                                                                    value={item.transporter}
                                                                                    onSave={(val) => {
                                                                                        handleUpdate(item.id, 'transporter', val);
                                                                                        fetchTransporters();
                                                                                    }}
                                                                                    suggestions={transporters}
                                                                                />
                                                                            </td>

                                                                            <td className="px-5 py-4 text-right text-xs font-bold text-slate-600">
                                                                                {item.deliveryDate ? new Date(item.deliveryDate).toLocaleDateString() : '-'}
                                                                            </td>

                                                                            <td className="px-5 py-4 text-right text-xs font-bold text-slate-700">
                                                                                {item.invoiceNo || '-'}
                                                                            </td>

                                                                            <td className="px-5 py-4 text-right">
                                                                                <span className="text-xs font-bold text-slate-400">₹ {item.gstAmount || '0'}</span>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </React.Fragment>
                                                            ));
                                                        })()}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {containerCodes.length === 0 && (
                                <div className="p-12 text-center border border-dashed rounded-xl">
                                    <Truck className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                    <p className="text-slate-400 text-sm font-medium">No results found</p>
                                </div>
                            )}

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="flex justify-between items-center bg-white px-5 py-3 rounded-lg border border-slate-200 shadow-sm mt-4">
                                    <button
                                        onClick={() => fetchData(pagination.page - 1)}
                                        disabled={pagination.page <= 1}
                                        className="p-1.5 border rounded disabled:opacity-20 hover:bg-slate-50 transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest uppercase">
                                        Page {pagination.page} / {pagination.totalPages}
                                    </div>
                                    <button
                                        onClick={() => fetchData(pagination.page + 1)}
                                        disabled={pagination.page >= pagination.totalPages}
                                        className="p-1.5 border rounded disabled:opacity-20 hover:bg-slate-50 transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
