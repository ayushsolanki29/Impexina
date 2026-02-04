"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Trash2, Check, Package, ArrowRight, RefreshCw, FileSpreadsheet, ArrowRightLeft, Eye } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { get, post, put, del } from "@/lib/api";
import AccountsPreviewModal from "./_components/PreviewModal";

// --- Components ---

const HeaderMetric = ({ label, value, colorClass = "text-gray-900" }) => (
    <div className="flex flex-col items-end">
        <span className="text-[10px]   uppercase tracking-widest text-gray-400 mb-1">{label}</span>
        <span className={`text-2xl  tracking-tight ${colorClass}`}>{value}</span>
    </div>
);

// Tab Switch Component
const TabSwitch = ({ activeTab, onChange }) => {
    return (
        <div className="relative flex bg-slate-100 rounded-xl p-1 gap-1">
            {/* Sliding Background */}
            <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-all duration-300 ease-out ${activeTab === 'expense'
                    ? 'left-1 bg-blue-500 shadow-lg shadow-blue-500/30'
                    : 'left-[calc(50%+2px)] bg-amber-500 shadow-lg shadow-amber-500/30'
                    }`}
            />

            <button
                onClick={() => onChange('expense')}
                className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 ${activeTab === 'expense'
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
            >
                <FileSpreadsheet className="w-4 h-4" />
                EXPENSE
            </button>

            <button
                onClick={() => onChange('trf')}
                className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 ${activeTab === 'trf'
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
            >
                <ArrowRightLeft className="w-4 h-4" />
                TRF
            </button>
        </div>
    );
};

// Minimal Editable Cell
const EditableCell = ({
    value,
    onChange,
    onKeyDown,
    onBlur,
    type = "text",
    className = "",
    placeholder = "",
    autoFocus = false,
    id,
    disabled = false
}) => {
    return (
        <input
            id={id}
            type={type}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
            disabled={disabled}
            className={`w-full bg-slate-50 border border-slate-100/60 hover:border-slate-300 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 outline-none p-2 text-sm placeholder:text-slate-300 rounded transition-all ${className}`}
            placeholder={placeholder}
            autoFocus={autoFocus}
            autoComplete="off"
            style={{ minWidth: className.includes('min-w-') ? undefined : '200px' }}
        />
    );
};

export default function ExcelLedgerPage() {
    const { id } = useParams();
    const searchParams = useSearchParams();
    const containerCode = searchParams.get("containerCode");
    const querySheetName = searchParams.get("sheetName");

    const router = useRouter();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    const [trfTransactions, setTrfTransactions] = useState([]);
    const [availableSheets, setAvailableSheets] = useState([]);
    const [sheetName, setSheetName] = useState("");
    const [formattedContainer, setFormattedContainer] = useState("");
    const [defaultDeliveryDate, setDefaultDeliveryDate] = useState("");
    const [defaultParticulars, setDefaultParticulars] = useState("");
    const [defaultCbm, setDefaultCbm] = useState("");
    const [defaultWeight, setDefaultWeight] = useState("");
    const [mixLimit, setMixLimit] = useState(5);
    const [activeTab, setActiveTab] = useState('expense');
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id, containerCode, querySheetName]);

    // Global Keyboard Shortcuts
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                // Try to save focused row if any
                const active = document.activeElement;
                if (active && active.id && active.id.startsWith('cell-')) {
                    const rowIndex = parseInt(active.id.split('-')[1]);
                    saveRow(rowIndex);
                } else {
                    toast.info("All rows are synced or will auto-save on blur");
                }
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                router.push(`/dashboard/accounts/clients/${id}/containers`);
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [router]);

    const fetchContainerInfo = async (code, clientName) => {
        if (!code || !clientName) return null;
        try {
            const baseCode = code.replace(/[ -]?\d+$/, "").trim();
            const res = await get(`/bifurcation?search=${encodeURIComponent(code)}`);

            if (res.success && res.data && res.data.length > 0) {
                const clientData = res.data.filter(item =>
                    item.clientName?.toLowerCase().includes(clientName.toLowerCase()) ||
                    clientName.toLowerCase().includes(item.clientName?.toLowerCase())
                );

                if (clientData.length > 0) {
                    const totalCtn = clientData.reduce((sum, item) => sum + (item.ctn || 0), 0);
                    const totalCbm = clientData.reduce((sum, item) => sum + (item.totalCbm || 0), 0);
                    const totalWeight = clientData.reduce((sum, item) => sum + (item.totalWt || 0), 0);
                    const totalGstAmount = clientData.reduce((sum, item) => sum + (item.gstAmount || 0), 0);
                    const invoiceNo = [...new Set(clientData.map(d => d.invoiceNo).filter(Boolean))].join(', ');
                    const gstText = [...new Set(clientData.map(d => d.gst).filter(Boolean))].join(', ');

                    // Get FROM and TO from bifurcation
                    const fromLocations = [...new Set(clientData.map(d => d.from).filter(Boolean))];
                    const toLocations = [...new Set(clientData.map(d => d.to).filter(Boolean))];
                    const fromLocation = fromLocations.length > 0 ? fromLocations[0] : '';
                    const toLocation = toLocations.length > 0 ? toLocations[0] : '';

                    const formatted = `${baseCode} ${totalCtn} CTN`.toUpperCase();

                    // Particulars
                    const allProducts = clientData.map(d => d.product).filter(Boolean);
                    const uniqueItems = [...new Set(allProducts.flatMap(p => p.split(', ').map(item => item.trim())))];
                    let particulars = "";

                    // Use latest mixLimit from settings if provided
                    const currentMixLimit = res.settings?.mixLimit ? parseInt(res.settings.mixLimit) : mixLimit;
                    if (res.settings?.mixLimit) setMixLimit(currentMixLimit);

                    if (uniqueItems.length > currentMixLimit || allProducts.includes("MIX ITEM")) {
                        particulars = "MIX ITEM";
                    } else {
                        particulars = uniqueItems.join(', ');
                    }

                    // Delivery Date
                    const delDateObj = clientData.find(d => d.deliveryDate);
                    const delDateStr = delDateObj ? new Date(delDateObj.deliveryDate).toISOString().split('T')[0] : "";

                    return {
                        formatted,
                        particulars,
                        delDateStr,
                        totalCbm: parseFloat(totalCbm.toFixed(3)),
                        totalWeight: parseFloat(totalWeight.toFixed(2)),
                        invoiceNo,
                        gstText,
                        totalGstAmount: parseFloat(totalGstAmount.toFixed(2)),
                        from: fromLocation,
                        to: toLocation
                    };
                }
            }
        } catch (error) {
            console.error("Error fetching container data:", error);
        }
        return null;
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (containerCode) params.set("containerCode", containerCode);
            if (querySheetName) params.set("sheetName", querySheetName);

            const res = await get(`/accounts/clts/${id}?${params.toString()}`);
            if (res.success) {
                setClient(res.data);
                const mapTxns = (res.data.transactions || []).map(t => ({ ...t, isNew: false }));
                setTransactions(mapTxns);

                // Fetch TRF transactions
                const trfTxns = (res.data.trfTransactions || []).map(t => ({ ...t, isNew: false }));
                setTrfTransactions(trfTxns);

                setAvailableSheets(res.data.availableSheets || []);

                // Naming Logic & Container Prefetch
                if (containerCode) {
                    const date = new Date();
                    const month = date.toLocaleString('en-US', { month: 'long' });
                    setSheetName(`${res.data.name} ${containerCode} ${month}`.toUpperCase());

                    const info = await fetchContainerInfo(containerCode, res.data.name);
                    if (info) {
                        setFormattedContainer(info.formatted);
                        setDefaultParticulars(info.particulars);
                        setDefaultDeliveryDate(info.delDateStr);
                        setDefaultCbm(info.totalCbm.toString());
                        setDefaultWeight(info.totalWeight.toString());

                        setTransactions(prev => {
                            const updated = prev.map(t => {
                                if (t.containerCode === containerCode || !t.containerCode) {
                                    // Update GST INV line with FROM/TO format
                                    let updatedParticulars = t.particulars;
                                    if (t.particulars?.startsWith("GST INV")) {
                                        const fromPart = info.from ? ` FROM: ${info.from}` : '';
                                        const toPart = info.to ? ` TO: ${info.to}` : '';
                                        updatedParticulars = `GST INV - ${info.invoiceNo} |${fromPart}${toPart}`;
                                    }

                                    return {
                                        ...t,
                                        containerCode: info.formatted,
                                        particulars: (!t.particulars || t.particulars === "Description" || !t.particulars.trim()) ? info.particulars : updatedParticulars,
                                        deliveryDate: (!t.deliveryDate) ? info.delDateStr : t.deliveryDate,
                                        quantity: (!t.quantity) ? info.totalCbm : t.quantity,
                                        weight: (!t.weight) ? info.totalWeight : t.weight,
                                        from: info.from || t.from || '',
                                        to: info.to || t.to || ''
                                    };
                                }
                                // Also update GST INV rows even if container code doesn't match
                                if (t.particulars?.startsWith("GST INV") && info.invoiceNo) {
                                    const fromPart = info.from ? ` FROM: ${info.from}` : '';
                                    const toPart = info.to ? ` TO: ${info.to}` : '';
                                    return {
                                        ...t,
                                        particulars: `GST INV - ${info.invoiceNo} |${fromPart}${toPart}`,
                                        from: info.from || t.from || '',
                                        to: info.to || t.to || ''
                                    };
                                }
                                return t;
                            });

                            if (updated.length === 0) {
                                const newRows = [
                                    {
                                        id: `temp-${Date.now()}`,
                                        isNew: true,
                                        containerCode: info.formatted,
                                        deliveryDate: info.delDateStr || new Date().toISOString().split('T')[0],
                                        particulars: info.particulars,
                                        quantity: info.totalCbm,
                                        rate: "",
                                        amount: "",
                                        paid: "",
                                        paymentDate: "",
                                        paymentMode: "",
                                        from: info.from || '',
                                        to: info.to || '',
                                        clientId: id,
                                        billingType: "CBM",
                                        sheetName: querySheetName || ""
                                    }
                                ];

                                if (info.invoiceNo || info.totalGstAmount > 0) {
                                    const fromPart = info.from ? ` FROM: ${info.from}` : '';
                                    const toPart = info.to ? ` TO: ${info.to}` : '';
                                    newRows.push({
                                        id: `temp-${Date.now() + 1}`,
                                        isNew: true,
                                        containerCode: "",
                                        deliveryDate: "",
                                        particulars: `GST INV - ${info.invoiceNo} |${fromPart}${toPart}`,
                                        quantity: "",
                                        rate: "",
                                        amount: info.totalGstAmount,
                                        paid: "",
                                        paymentDate: "",
                                        paymentMode: "",
                                        from: info.from || '',
                                        to: info.to || '',
                                        clientId: id,
                                        billingType: "FLAT",
                                        sheetName: querySheetName || ""
                                    });
                                }
                                return newRows;
                            }
                            return updated;
                        });
                    }
                } else if (querySheetName) {
                    setSheetName(querySheetName.toUpperCase());
                } else {
                    setSheetName("ENTIRE LEDGER");
                }
            }
        } catch (error) {
            toast.error("Failed to load ledger");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRow = (rowIndex, field, value) => {
        const updatedTxns = [...transactions];
        const txn = { ...updatedTxns[rowIndex], [field]: value };

        // Auto-calculate amount if basis is CBM or WEIGHT
        if (['quantity', 'weight', 'rate', 'billingType'].includes(field)) {
            const rate = parseFloat(txn.rate || 0);
            const cbm = parseFloat(txn.quantity || 0);
            const weight = parseFloat(txn.weight || 0);

            if (txn.billingType === "CBM") {
                txn.amount = (rate * cbm).toFixed(2);
            } else if (txn.billingType === "WEIGHT") {
                txn.amount = (rate * weight).toFixed(2);
            }
        }

        if (field === 'amount' || field === 'paid' || ['quantity', 'weight', 'rate', 'billingType'].includes(field)) {
            const amt = parseFloat(txn.amount || 0);
            const pd = parseFloat(txn.paid || 0);
            txn.balance = (amt - pd).toFixed(2);
        }

        updatedTxns[rowIndex] = txn;
        setTransactions(updatedTxns);
    };

    const lastSavedData = useRef({});

    const saveRow = async (rowIndex) => {
        const txn = transactions[rowIndex];
        if (!txn) return;

        const { isNew, id: txnId, ...dataToSave } = txn;

        // Redundancy Check: Compare with last saved state of this specific row
        const currentStateString = JSON.stringify(dataToSave);
        if (lastSavedData.current[txnId] === currentStateString && !isNew) {
            return; // No changes
        }

        try {
            let res;
            const payload = {
                ...dataToSave,
                transactionDate: dataToSave.transactionDate ? new Date(dataToSave.transactionDate) : new Date(),
                deliveryDate: dataToSave.deliveryDate ? new Date(dataToSave.deliveryDate) : undefined,
                paymentDate: dataToSave.paymentDate ? new Date(dataToSave.paymentDate) : undefined
            };

            if (isNew) {
                res = await post(`/accounts/clts/${id}/transactions`, payload);
                const updated = [...transactions];
                updated[rowIndex] = { ...res.data, isNew: false };
                setTransactions(updated);
                lastSavedData.current[res.data.id] = JSON.stringify(res.data);

                // Automatically add sheet to available sheets if it's new
                if (sheetName && !availableSheets.includes(sheetName)) {
                    setAvailableSheets(prev => [...prev, sheetName]);
                }

                toast.success(sheetName ? `Row Added to ${sheetName}` : "Row Created", { duration: 2000 });
            } else {
                res = await put(`/accounts/clts/${id}/transactions/${txnId}`, payload);
                lastSavedData.current[txnId] = currentStateString;
                toast.success("Row Updated Details Saved", { duration: 2000 });
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to save row: " + (e.response?.data?.message || e.message));
        }
    };

    const handleContainerBlur = async (rowIndex, originalValue) => {
        if (!originalValue || originalValue.includes("CTN")) return;

        const info = await fetchContainerInfo(originalValue, client.name);
        if (info) {
            handleUpdateRow(rowIndex, 'containerCode', info.formatted);
            handleUpdateRow(rowIndex, 'particulars', info.particulars);
            handleUpdateRow(rowIndex, 'deliveryDate', info.delDateStr);
            handleUpdateRow(rowIndex, 'quantity', info.totalCbm);
            handleUpdateRow(rowIndex, 'weight', info.totalWeight);
            handleUpdateRow(rowIndex, 'from', info.from || '');
            handleUpdateRow(rowIndex, 'to', info.to || '');

            // Save the row
            setTimeout(() => saveRow(rowIndex), 0);
        }
    };

    const handleAddRow = () => {
        const newTxn = {
            id: `temp-${Date.now()}`,
            isNew: true,
            containerCode: formattedContainer || containerCode || "",
            deliveryDate: defaultDeliveryDate || new Date().toISOString().split('T')[0],
            particulars: defaultParticulars || "",
            quantity: defaultCbm || "",
            weight: defaultWeight || "",
            rate: "",
            amount: "",
            paid: "",
            paymentDate: "",
            paymentMode: "",
            from: "",
            to: "",
            clientId: id,
            billingType: "CBM",
            sheetName: querySheetName || ""
        };
        setTransactions(prev => [...prev, newTxn]);

        setTimeout(() => {
            const lastIdx = transactions.length;
            const el = document.getElementById(`cell-${lastIdx}-containerCode`);
            if (el) el.focus();
        }, 50);
    };

    const handleDeleteRow = async (rowIndex) => {
        const txn = transactions[rowIndex];
        if (!confirm("Delete this row?")) return;

        if (!txn.isNew) {
            try {
                await del(`/accounts/clts/${id}/transactions/${txn.id}`);
                toast.success("Deleted");
            } catch (e) {
                toast.error("Failed to delete");
                return;
            }
        }
        const updated = transactions.filter((_, i) => i !== rowIndex);
        setTransactions(updated);
    };

    // ===== TRF Sheet Functions =====
    const lastSavedTrfData = useRef({});

    const handleUpdateTrfRow = (rowIndex, field, value) => {
        const updated = [...trfTransactions];
        updated[rowIndex] = { ...updated[rowIndex], [field]: value };

        // Auto-calculate total: amount * rate (or just amount if no rate)
        if (field === 'amount' || field === 'rate' || field === 'booking') {
            const amt = parseFloat(updated[rowIndex].amount || 0);
            const booking = parseFloat(updated[rowIndex].booking || 0);
            const rate = parseFloat(updated[rowIndex].rate || 0);
            updated[rowIndex].total = rate > 0 ? (amt + booking) * rate : (amt + booking);
        }

        // Calculate balance
        if (field === 'total' || field === 'paid') {
            const total = parseFloat(updated[rowIndex].total || 0);
            const paid = parseFloat(updated[rowIndex].paid || 0);
            updated[rowIndex].balance = total - paid;
        }

        setTrfTransactions(updated);
    };

    const saveTrfRow = async (rowIndex) => {
        const txn = trfTransactions[rowIndex];
        if (!txn) return;

        const { isNew, id: txnId, ...dataToSave } = txn;

        const currentStateString = JSON.stringify(dataToSave);
        if (lastSavedTrfData.current[txnId] === currentStateString && !isNew) {
            return;
        }

        try {
            let res;
            const payload = {
                ...dataToSave,
                transactionDate: dataToSave.transactionDate ? new Date(dataToSave.transactionDate) : new Date(),
                paymentDate: dataToSave.paymentDate ? new Date(dataToSave.paymentDate) : undefined,
                sheetName: querySheetName || sheetName || ""
            };

            if (isNew) {
                res = await post(`/accounts/clts/${id}/trf-transactions`, payload);
                const updated = [...trfTransactions];
                updated[rowIndex] = { ...res.data, isNew: false };
                setTrfTransactions(updated);
                lastSavedTrfData.current[res.data.id] = JSON.stringify(res.data);
                toast.success("TRF Row Added", { duration: 2000 });
            } else {
                res = await put(`/accounts/clts/${id}/trf-transactions/${txnId}`, payload);
                lastSavedTrfData.current[txnId] = currentStateString;
                toast.success("TRF Row Updated", { duration: 2000 });
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to save TRF row: " + (e.response?.data?.message || e.message));
        }
    };

    const handleAddTrfRow = () => {
        const newTxn = {
            id: `temp-trf-${Date.now()}`,
            isNew: true,
            particular: "",
            transactionDate: new Date().toISOString().split('T')[0],
            amount: "",
            booking: "",
            rate: "",
            total: "",
            paid: "",
            paymentDate: "",
            paymentMode: "",
            clientId: id,
            sheetName: querySheetName || ""
        };
        setTrfTransactions(prev => [...prev, newTxn]);

        setTimeout(() => {
            const lastIdx = trfTransactions.length;
            const el = document.getElementById(`trf-cell-${lastIdx}-particular`);
            if (el) el.focus();
        }, 50);
    };

    const handleDeleteTrfRow = async (rowIndex) => {
        const txn = trfTransactions[rowIndex];
        if (!confirm("Delete this TRF row?")) return;

        if (!txn.isNew) {
            try {
                await del(`/accounts/clts/${id}/trf-transactions/${txn.id}`);
                toast.success("Deleted");
            } catch (e) {
                toast.error("Failed to delete");
                return;
            }
        }
        const updated = trfTransactions.filter((_, i) => i !== rowIndex);
        setTrfTransactions(updated);
    };

    const handleTrfKeyDown = (e, rowIndex, colKey) => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            handleAddTrfRow();
            return;
        }

        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveTrfRow(rowIndex);
            toast.success("Saved");
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextEl = document.getElementById(`trf-cell-${rowIndex + 1}-${colKey}`);
            if (nextEl) nextEl.focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevEl = document.getElementById(`trf-cell-${rowIndex - 1}-${colKey}`);
            if (prevEl) prevEl.focus();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            saveTrfRow(rowIndex);
            const nextEl = document.getElementById(`trf-cell-${rowIndex + 1}-${colKey}`);
            if (nextEl) nextEl.focus();
            else handleAddTrfRow();
        }
    };

    const handleRenameSheet = async (newName) => {
        const capsName = newName.toUpperCase();
        try {
            await post(`/accounts/clts/${id}/rename-sheet`, {
                oldSheetName: sheetName,
                newSheetName: capsName
            });
            setSheetName(capsName);

            // Update available sheets list
            setAvailableSheets(prev => {
                if (prev.includes(sheetName)) {
                    return prev.map(s => s === sheetName ? capsName : s);
                } else {
                    return [...prev, capsName];
                }
            });

            // Also update the URL so if they refresh they stay on the same renamed sheet
            const params = new URLSearchParams(window.location.search);
            params.set('sheetName', capsName);
            window.history.replaceState(null, '', `?${params.toString()}`);
            toast.success("Sheet Renamed");
        } catch (e) {
            toast.error("Failed to rename sheet");
        }
    };

    const handleKeyDown = (e, rowIndex, colKey) => {
        // Allow default tab behavior but keep arrow keys
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            handleAddRow();
            return;
        }

        // Save current row on Ctrl+S as well
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveRow(rowIndex);
            toast.success("Saved");
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextEl = document.getElementById(`cell-${rowIndex + 1}-${colKey}`);
            if (nextEl) nextEl.focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevEl = document.getElementById(`cell-${rowIndex - 1}-${colKey}`);
            if (prevEl) prevEl.focus();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            saveRow(rowIndex);
            // Logic: If on last column, go to next row start? Or just save and stay?
            // Let's just go down for Excel feel
            const nextEl = document.getElementById(`cell-${rowIndex + 1}-${colKey}`);
            if (nextEl) nextEl.focus();
            else handleAddRow();
        }
    };

    // Expense totals
    const totalAmount = transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const totalPaid = transactions.reduce((sum, t) => sum + (parseFloat(t.paid) || 0), 0);
    const balance = totalAmount - totalPaid;

    // TRF totals
    const trfTotalAmount = trfTransactions.reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0);
    const trfTotalPaid = trfTransactions.reduce((sum, t) => sum + (parseFloat(t.paid) || 0), 0);
    const trfBalance = trfTotalAmount - trfTotalPaid;

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>;
    if (!client) return <div className="p-12 text-center text-slate-500">Client not found</div>;

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden bg-white font-sans text-slate-900">

            {/* Clean Header */}
            <div className="flex-none px-6 py-4 border-b border-slate-200 bg-white">
                <div className="flex items-center justify-between gap-4">
                    {/* Left: Client Info & Sheet Selector */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <button
                            onClick={() => router.push(`/dashboard/accounts/clients/${id}/containers`)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-900 shrink-0"
                            title="Go Back"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <h1 className="text-xl font-bold text-slate-900 truncate">
                                {client.name}
                            </h1>

                            <div className="relative">
                                <select
                                    value={querySheetName ? querySheetName.toUpperCase() : (containerCode ? containerCode : "ENTIRE LEDGER")}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "NEW") {
                                            const newName = prompt("ENTER NEW SHEET NAME:");
                                            if (newName) {
                                                const cleanName = newName.toUpperCase().trim();
                                                router.push(`/dashboard/accounts/clients/${id}?sheetName=${encodeURIComponent(cleanName)}`);
                                            }
                                        } else if (val === "ENTIRE LEDGER") {
                                            router.push(`/dashboard/accounts/clients/${id}`);
                                        } else {
                                            router.push(`/dashboard/accounts/clients/${id}?sheetName=${encodeURIComponent(val)}`);
                                        }
                                    }}
                                    className="bg-blue-50 text-blue-600 font-semibold px-3 py-1.5 rounded-lg border border-blue-200 focus:border-blue-400 outline-none appearance-none cursor-pointer pr-8 text-sm"
                                >
                                    <option value="ENTIRE LEDGER">ENTIRE LEDGER</option>
                                    <optgroup label="SHEETS">
                                        {availableSheets.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </optgroup>
                                    <option value="NEW" className="text-emerald-600 font-bold">+ NEW SHEET</option>
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>

                            {containerCode && (
                                <button
                                    onClick={async () => {
                                        const info = await fetchContainerInfo(containerCode, client.name);
                                        if (info) {
                                            setTransactions(prev => {
                                                const existingGstRow = prev.find(t => t.particulars?.startsWith("GST INV"));
                                                const updated = prev.map(t => {
                                                    if (t.particulars?.startsWith("GST INV")) {
                                                        // Update GST INV line with FROM/TO format
                                                        const fromPart = info.from ? ` FROM: ${info.from}` : '';
                                                        const toPart = info.to ? ` TO: ${info.to}` : '';
                                                        return {
                                                            ...t,
                                                            particulars: `GST INV - ${info.invoiceNo} |${fromPart}${toPart}`,
                                                            amount: info.totalGstAmount,
                                                            from: info.from || t.from || '',
                                                            to: info.to || t.to || ''
                                                        };
                                                    }
                                                    return {
                                                        ...t,
                                                        containerCode: info.formatted,
                                                        particulars: info.particulars,
                                                        deliveryDate: info.delDateStr,
                                                        quantity: info.totalCbm,
                                                        weight: info.totalWeight,
                                                        from: info.from || t.from || '',
                                                        to: info.to || t.to || ''
                                                    };
                                                });

                                                if (!existingGstRow && (info.invoiceNo || info.totalGstAmount > 0)) {
                                                    const fromPart = info.from ? ` FROM: ${info.from}` : '';
                                                    const toPart = info.to ? ` TO: ${info.to}` : '';
                                                    updated.push({
                                                        id: `temp-${Date.now()}`,
                                                        isNew: true,
                                                        containerCode: "",
                                                        deliveryDate: "",
                                                        particulars: `GST INV - ${info.invoiceNo} |${fromPart}${toPart}`,
                                                        amount: info.totalGstAmount,
                                                        paid: "",
                                                        clientId: id,
                                                        billingType: "FLAT",
                                                        sheetName: querySheetName || "",
                                                        from: info.from || '',
                                                        to: info.to || ''
                                                    });
                                                }
                                                return updated;
                                            });
                                            toast.success("Details Updated from Bifurcation");
                                        }
                                    }}
                                    className="bg-emerald-50 text-emerald-600 font-semibold px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-all text-xs flex items-center gap-2 shrink-0"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    SYNC
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right: Actions & Metrics */}
                    <div className="flex items-center gap-4 shrink-0">
                        <button
                            onClick={() => setShowPreview(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-semibold text-xs shadow-sm"
                            title="Preview Account Sheets"
                        >
                            <Eye className="w-4 h-4" />
                            Preview
                        </button>

                        <div className="h-8 w-px bg-slate-200" />

                        <TabSwitch activeTab={activeTab} onChange={setActiveTab} />

                        <div className="h-8 w-px bg-slate-200" />

                        {activeTab === 'expense' ? (
                            <>
                                <HeaderMetric label="Billed" value={`₹${totalAmount.toLocaleString()}`} />
                                <HeaderMetric label="Paid" value={`₹${totalPaid.toLocaleString()}`} colorClass="text-emerald-500" />
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Balance</span>
                                    <div className={`text-xl tracking-tight px-3 py-1 rounded-lg ${balance > 0 ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"}`}>
                                        ₹{balance.toLocaleString()}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <HeaderMetric label="Total" value={`₹${trfTotalAmount.toLocaleString()}`} />
                                <HeaderMetric label="Paid" value={`₹${trfTotalPaid.toLocaleString()}`} colorClass="text-emerald-500" />
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Balance</span>
                                    <div className={`text-xl tracking-tight px-3 py-1 rounded-lg ${trfBalance > 0 ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"}`}>
                                        ₹{trfBalance.toLocaleString()}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Animated Table Area */}
            <div className="relative flex-1 overflow-hidden">
                {/* EXPENSE Sheet (Blue) */}
                <div
                    className={`absolute inset-0 overflow-x-auto overflow-y-auto transition-all duration-500 ease-out ${activeTab === 'expense'
                        ? 'opacity-100 translate-x-0'
                        : 'opacity-0 -translate-x-full pointer-events-none'
                        }`}
                >
                    <div className="min-w-max p-1">
                        {/* Header Row - Blue Theme */}
                        <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-white z-20 grid grid-cols-[140px_90px_250px_70px_70px_70px_80px_100px_100px_110px_100px_140px_140px_60px] border-b border-blue-100 shadow-sm">
                            {['Container', 'Delivery', 'Particulars', 'CBM', 'Weight', 'Rate', 'Basis', 'Total', 'Paid', 'Payment Date', 'Mode', 'FROM', 'TO', ''].map((h, i) => (
                                <div key={i} className={`px-2 py-3 text-[10px] font-bold uppercase tracking-wider text-blue-600 flex items-center ${['CBM', 'Weight', 'Rate', 'Total', 'Paid'].includes(h) ? 'justify-end text-right' : 'justify-start'}`}>
                                    {h}
                                </div>
                            ))}
                        </div>

                        {/* Data Rows */}
                        <div className="divide-y divide-slate-50 bg-white">
                            {transactions.map((txn, idx) => (
                                <div
                                    key={txn.id}
                                    className={`grid grid-cols-[140px_90px_250px_70px_70px_70px_80px_100px_100px_110px_100px_140px_140px_60px] hover:bg-blue-50/40 transition-colors group text-sm ${txn.isNew ? 'bg-blue-50/10' : ''} ${txn.particulars?.startsWith("GST INV") ? 'bg-amber-50/30' : ''}`}
                                >
                                    <div className="px-2 py-0.5">
                                        <EditableCell
                                            id={`cell-${idx}-containerCode`}
                                            value={txn.containerCode}
                                            onChange={v => handleUpdateRow(idx, 'containerCode', v)}
                                            onKeyDown={(e) => handleKeyDown(e, idx, 'containerCode')}
                                            onBlur={() => handleContainerBlur(idx, txn.containerCode)}
                                            placeholder="--"
                                            className="text-slate-600 font-medium min-w-full"
                                        />
                                    </div>
                                    <div className="px-2 py-0.5">
                                        <input
                                            id={`cell-${idx}-deliveryDate`}
                                            type="date"
                                            value={txn.deliveryDate ? new Date(txn.deliveryDate).toISOString().split('T')[0] : ''}
                                            onChange={e => handleUpdateRow(idx, 'deliveryDate', e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, idx, 'deliveryDate')}
                                            className="w-full bg-slate-50 border border-slate-100/60 hover:border-slate-300 hover:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 outline-none p-2 text-[11px] text-slate-400 font-medium rounded transition-all"
                                        />
                                    </div>
                                    <div className="px-2 py-0.5">
                                        <EditableCell
                                            id={`cell-${idx}-particulars`}
                                            value={txn.particulars}
                                            onChange={v => handleUpdateRow(idx, 'particulars', v)}
                                            onKeyDown={(e) => handleKeyDown(e, idx, 'particulars')}
                                            placeholder="Description"
                                            className="text-slate-900 font-bold min-w-full"
                                        />
                                    </div>
                                    <div className="px-2 py-0.5 text-right">
                                        <EditableCell
                                            id={`cell-${idx}-quantity`}
                                            value={txn.quantity?.toString()}
                                            type="number"
                                            onChange={v => handleUpdateRow(idx, 'quantity', v)}
                                            onKeyDown={(e) => handleKeyDown(e, idx, 'quantity')}
                                            className="text-right text-slate-600 font-semibold min-w-full"
                                        />
                                    </div>
                                    <div className="px-2 py-0.5 text-right">
                                        <EditableCell
                                            id={`cell-${idx}-weight`}
                                            value={txn.weight?.toString()}
                                            type="number"
                                            onChange={v => handleUpdateRow(idx, 'weight', v)}
                                            onKeyDown={(e) => handleKeyDown(e, idx, 'weight')}
                                            className="text-right text-slate-500 min-w-full"
                                        />
                                    </div>
                                    <div className="px-2 py-0.5 text-right">
                                        <EditableCell
                                            id={`cell-${idx}-rate`}
                                            value={txn.rate?.toString()}
                                            type="number"
                                            onChange={v => handleUpdateRow(idx, 'rate', v)}
                                            onKeyDown={(e) => handleKeyDown(e, idx, 'rate')}
                                            className="text-right text-slate-500 min-w-full"
                                        />
                                    </div>

                                    <div className="px-2 py-0.5">
                                        <select
                                            id={`cell-${idx}-billingType`}
                                            value={txn.billingType || 'FLAT'}
                                            onChange={e => handleUpdateRow(idx, 'billingType', e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, idx, 'billingType')}
                                            className="w-full h-full bg-slate-50 border border-slate-100/60 hover:border-blue-300 hover:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 outline-none p-1.5 text-[10px] font-bold text-blue-600 rounded transition-all uppercase tracking-tight"
                                        >
                                            <option value="FLAT">Flat</option>
                                            <option value="CBM">CBM</option>
                                            <option value="WEIGHT">Weight</option>
                                        </select>
                                    </div>

                                    {/* Total Column with Blue Bg */}
                                    <div className="px-2 py-0.5 bg-blue-50/50 border-x border-blue-100/50 text-right">
                                        <EditableCell
                                            id={`cell-${idx}-amount`}
                                            value={txn.amount}
                                            type="number"
                                            onChange={v => handleUpdateRow(idx, 'amount', v)}
                                            onKeyDown={(e) => handleKeyDown(e, idx, 'amount')}
                                            className="text-right font-bold text-slate-900 bg-transparent min-w-full"
                                        />
                                    </div>

                                    <div className="px-2 py-0.5 text-right">
                                        <EditableCell
                                            id={`cell-${idx}-paid`}
                                            value={txn.paid?.toString()}
                                            type="number"
                                            onChange={v => handleUpdateRow(idx, 'paid', v)}
                                            onKeyDown={(e) => handleKeyDown(e, idx, 'paid')}
                                            className="text-right text-emerald-600 font-bold min-w-full"
                                        />
                                    </div>
                                    <div className="px-2 py-0.5">
                                        <input
                                            id={`cell-${idx}-paymentDate`}
                                            type="date"
                                            value={txn.paymentDate ? new Date(txn.paymentDate).toISOString().split('T')[0] : ''}
                                            onChange={e => handleUpdateRow(idx, 'paymentDate', e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, idx, 'paymentDate')}
                                            className="w-full bg-slate-50 border border-slate-100/60 hover:border-slate-300 hover:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 outline-none p-2 text-[11px] text-slate-400 rounded transition-all"
                                        />
                                    </div>
                                    <div className="px-2 py-0.5">
                                        <select
                                            id={`cell-${idx}-paymentMode`}
                                            value={txn.paymentMode || ''}
                                            onChange={e => handleUpdateRow(idx, 'paymentMode', e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, idx, 'paymentMode')}
                                            className="w-full h-full bg-slate-50 border border-slate-100/60 hover:border-slate-300 hover:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 outline-none p-2 text-xs font-medium text-slate-500 rounded transition-all"
                                        >
                                            <option value="">-</option>
                                            <option value="CASH">Cash</option>
                                            <option value="CHEQUE">Cheque</option>
                                            <option value="UPI">UPI</option>
                                            <option value="BANK_TRANSFER">Bank</option>
                                        </select>
                                    </div>
                                    <div className="px-2 py-0.5">
                                        <EditableCell
                                            id={`cell-${idx}-from`}
                                            value={txn.from || ''}
                                            onChange={v => handleUpdateRow(idx, 'from', v)}
                                            onKeyDown={(e) => handleKeyDown(e, idx, 'from')}
                                            placeholder="FROM::"
                                            className="text-slate-600 font-medium min-w-full"
                                        />
                                    </div>
                                    <div className="px-2 py-0.5">
                                        <EditableCell
                                            id={`cell-${idx}-to`}
                                            value={txn.to || ''}
                                            onChange={v => handleUpdateRow(idx, 'to', v)}
                                            onKeyDown={(e) => handleKeyDown(e, idx, 'to')}
                                            placeholder="TO::"
                                            className="text-slate-600 font-medium min-w-full"
                                        />
                                    </div>
                                    <div className="px-2 py-0.5 flex items-center justify-center gap-1">
                                        <button onClick={() => saveRow(idx)} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded transition-colors" title="Save Row">
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteRow(idx)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors" tabIndex={-1} title="Delete Row">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Row Button Area */}
                        <div className="p-4 border-t border-slate-50 bg-blue-50/20">
                            <button onClick={handleAddRow} className="flex items-center gap-2 text-sm font-medium text-blue-500 hover:text-blue-700 transition-colors">
                                <Plus className="w-4 h-4" />
                                Add Row (Ctrl + Enter)
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    className={`absolute inset-0 overflow-x-auto overflow-y-auto transition-all duration-500 ease-out ${activeTab === 'trf'
                        ? 'opacity-100 translate-x-0'
                        : 'opacity-0 translate-x-full pointer-events-none'
                        }`}
                >
                    <div className="min-w-max p-1">
                        {/* Header Row - Yellow/Amber Theme */}
                        <div className="sticky top-0 bg-gradient-to-r from-amber-50 to-white z-20 grid grid-cols-[300px_100px_100px_100px_90px_120px_120px_100px_100px_60px] border-b border-amber-200 shadow-sm">
                            {['Particular', 'Date', 'Amount', 'Booking', 'Rate', 'Total', 'Paid', 'Date', 'Mode', ''].map((h, i) => (
                                <div key={i} className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center ${['Amount', 'Booking', 'Rate', 'Total', 'Paid'].includes(h) ? 'justify-end text-right' : 'justify-start'}`}>
                                    {h}
                                </div>
                            ))}
                        </div>

                        {/* TRF Data Rows */}
                        <div className="divide-y divide-amber-50 bg-white">
                            {trfTransactions.map((txn, idx) => (
                                <div
                                    key={txn.id}
                                    className={`grid grid-cols-[300px_100px_100px_100px_90px_120px_120px_100px_100px_60px] hover:bg-amber-50/30 transition-colors group text-sm ${txn.isNew ? 'bg-amber-50/10' : ''}`}
                                >
                                    <div className="px-2 py-1">
                                        <EditableCell
                                            id={`trf-cell-${idx}-particular`}
                                            value={txn.particular}
                                            onChange={v => handleUpdateTrfRow(idx, 'particular', v)}
                                            onKeyDown={(e) => handleTrfKeyDown(e, idx, 'particular')}
                                            placeholder="Description"
                                            className="text-slate-900 font-bold"
                                        />
                                    </div>
                                    <div className="px-2 py-1">
                                        <input
                                            id={`trf-cell-${idx}-transactionDate`}
                                            type="date"
                                            value={txn.transactionDate ? new Date(txn.transactionDate).toISOString().split('T')[0] : ''}
                                            onChange={e => handleUpdateTrfRow(idx, 'transactionDate', e.target.value)}
                                            onKeyDown={(e) => handleTrfKeyDown(e, idx, 'transactionDate')}
                                            className="w-full bg-slate-50 border border-slate-100/60 hover:border-amber-300 hover:bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-500/5 outline-none p-2 text-sm text-slate-500 font-medium rounded transition-all"
                                        />
                                    </div>
                                    <div className="px-2 py-1">
                                        <EditableCell
                                            id={`trf-cell-${idx}-amount`}
                                            value={txn.amount?.toString()}
                                            type="number"
                                            onChange={v => handleUpdateTrfRow(idx, 'amount', v)}
                                            onKeyDown={(e) => handleTrfKeyDown(e, idx, 'amount')}
                                            className="text-right text-slate-600 font-semibold"
                                        />
                                    </div>
                                    <div className="px-2 py-1">
                                        <EditableCell
                                            id={`trf-cell-${idx}-booking`}
                                            value={txn.booking?.toString()}
                                            type="number"
                                            onChange={v => handleUpdateTrfRow(idx, 'booking', v)}
                                            onKeyDown={(e) => handleTrfKeyDown(e, idx, 'booking')}
                                            className="text-right text-slate-500"
                                        />
                                    </div>
                                    <div className="px-2 py-1">
                                        <EditableCell
                                            id={`trf-cell-${idx}-rate`}
                                            value={txn.rate?.toString()}
                                            type="number"
                                            onChange={v => handleUpdateTrfRow(idx, 'rate', v)}
                                            onKeyDown={(e) => handleTrfKeyDown(e, idx, 'rate')}
                                            className="text-right text-slate-500"
                                        />
                                    </div>

                                    {/* Total Column with Yellow Bg */}
                                    <div className="px-2 py-1 bg-amber-100/50 border-x border-amber-200/50">
                                        <EditableCell
                                            id={`trf-cell-${idx}-total`}
                                            value={txn.total?.toString()}
                                            type="number"
                                            onChange={v => handleUpdateTrfRow(idx, 'total', v)}
                                            onKeyDown={(e) => handleTrfKeyDown(e, idx, 'total')}
                                            className="text-right font-bold text-slate-900 bg-transparent"
                                        />
                                    </div>

                                    <div className="px-2 py-1">
                                        <EditableCell
                                            id={`trf-cell-${idx}-paid`}
                                            value={txn.paid?.toString()}
                                            type="number"
                                            onChange={v => handleUpdateTrfRow(idx, 'paid', v)}
                                            onKeyDown={(e) => handleTrfKeyDown(e, idx, 'paid')}
                                            className="text-right text-emerald-600 font-bold"
                                        />
                                    </div>
                                    <div className="px-2 py-1">
                                        <input
                                            id={`trf-cell-${idx}-paymentDate`}
                                            type="date"
                                            value={txn.paymentDate ? new Date(txn.paymentDate).toISOString().split('T')[0] : ''}
                                            onChange={e => handleUpdateTrfRow(idx, 'paymentDate', e.target.value)}
                                            onKeyDown={(e) => handleTrfKeyDown(e, idx, 'paymentDate')}
                                            className="w-full bg-slate-50 border border-slate-100/60 hover:border-amber-300 hover:bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-500/5 outline-none p-2 text-sm text-slate-400 rounded transition-all"
                                        />
                                    </div>
                                    <div className="px-2 py-1">
                                        <select
                                            id={`trf-cell-${idx}-paymentMode`}
                                            value={txn.paymentMode || ''}
                                            onChange={e => handleUpdateTrfRow(idx, 'paymentMode', e.target.value)}
                                            onKeyDown={(e) => handleTrfKeyDown(e, idx, 'paymentMode')}
                                            className="w-full h-full bg-slate-50 border border-slate-100/60 hover:border-amber-300 hover:bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-500/5 outline-none p-2 text-xs font-medium text-slate-500 rounded transition-all"
                                        >
                                            <option value="">-</option>
                                            <option value="HDFC IGPL">HDFC IGPL</option>
                                            <option value="INR">INR</option>
                                            <option value="CASH">Cash</option>
                                            <option value="UPI">UPI</option>
                                            <option value="BANK_TRANSFER">Bank</option>
                                            <option value="BALANCE">Balance</option>
                                        </select>
                                    </div>
                                    <div className="px-2 py-1 flex items-center justify-center gap-1">
                                        <button onClick={() => saveTrfRow(idx)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded transition-colors" title="Save Row">
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteTrfRow(idx)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors" tabIndex={-1} title="Delete Row">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add TRF Row Button Area */}
                        <div className="p-4 border-t border-amber-100 bg-amber-50/20">
                            <button onClick={handleAddTrfRow} className="flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors">
                                <Plus className="w-4 h-4" />
                                Add TRF Row (Ctrl + Enter)
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            <AccountsPreviewModal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                client={client}
                expenseTransactions={transactions}
                trfTransactions={trfTransactions}
                sheetName={sheetName}
            />
        </div>
    );
}
