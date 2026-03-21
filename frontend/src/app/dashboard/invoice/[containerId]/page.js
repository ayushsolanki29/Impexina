"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Plus, Save, Trash2, Loader2, ArrowLeft,
  Eye, Package, DollarSign, History, Building2, Landmark, Users, Upload, Image as ImageIcon, FileSpreadsheet,
  ChevronUp, ChevronDown, Info, Copy
} from 'lucide-react';
import API from '@/lib/api';
import { DEFAULT_COMPANY_DETAILS } from '@/lib/constants';
import { toast } from 'sonner';
import { getImageFileFromClipboardEvent, getImageFileFromClipboard } from '@/lib/clipboard-image';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import InvoicePreviewModal from '../_components/InvoicePreviewModal';
import { getImageUrl } from '@/lib/image-utils';

export default function InvoiceEntryPage() {
  const params = useParams();
  const router = useRouter();
  const containerId = params.containerId;

  const [container, setContainer] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [roundUsd, setRoundUsd] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("invoice_round_usd");
      if (saved === "0") return false;
      if (saved === "1") return true;
    }
    return true;
  });

  // Templates
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Direct paste on hover state
  const [hoveredId, setHoveredId] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, itemId: null });

  // Form State (same structure as packing: Exporter, Consignee, Bank, Stamp)
  const [formData, setFormData] = useState({
    invNo: '',
    invoiceNo: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    headerCompanyName: '',
    headerCompanyAddress: '',
    headerPhone: '',
    consigneeName: '',
    consigneeAddress: '',
    consigneeIecNo: '',
    consigneeGst: '',
    consigneeEmail: '',
    bankName: '',
    beneficiaryName: '',
    swiftBic: '',
    bankAddress: '',
    accountNumber: '',
    paymentTerms: 'TOTAL CIF USD 9010 AND 90 WITHIN DAYS AFTER DELIVERY',
    stampImage: '',
    stampPosition: 'BOTTOM_RIGHT',
    stampSize: 'M',
    stampText: 'Authorized Signatory',
    showHsnColumn: true,
    from: '',
    to: '',
    status: 'DRAFT'
  });

  const [openSections, setOpenSections] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('invoice_accordion_state');
      return saved ? JSON.parse(saved) : ["exporter", "consignee", "bank", "stamp"];
    }
    return ["exporter", "consignee", "bank", "stamp"];
  });

  useEffect(() => {
    localStorage.setItem('invoice_accordion_state', JSON.stringify(openSections));
  }, [openSections]);

  useEffect(() => {
    localStorage.setItem("invoice_round_usd", roundUsd ? "1" : "0");
  }, [roundUsd]);

  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchData();
    fetchTemplates();
  }, [containerId]);

  const fetchTemplates = async () => {
    try {
      const response = await API.get('/packing-list/templates');
      if (response.data.success) {
        setTemplates(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const applyTemplate = (templateId) => {
    if (!templateId) return;
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        headerCompanyName: template.companyName,
        headerCompanyAddress: template.companyAddress,
        headerPhone: template.companyPhone,
        bankName: template.bankName,
        beneficiaryName: template.beneficiaryName,
        swiftBic: template.swiftBic,
        bankAddress: template.bankAddress,
        accountNumber: template.accountNumber,
        stampImage: template.stampImage || '',
        stampSize: template.stampSize || 'M',
        stampText: template.signatureText || 'Authorized Signatory'
      }));
      setSelectedTemplateId(templateId);
      toast.success('Template applied');
    }
  };

  const createTemplate = async () => {
    if (!formData.headerCompanyName) {
      toast.error("Exporter Name is required to create a template");
      return;
    }

    const toastId = toast.loading("Creating template...");
    try {
      const payload = {
        companyName: formData.headerCompanyName,
        companyAddress: formData.headerCompanyAddress,
        companyPhone: formData.headerPhone,
        companyEmail: formData.consigneeEmail,
        bankName: formData.bankName,
        beneficiaryName: formData.beneficiaryName,
        swiftBic: formData.swiftBic,
        bankAddress: formData.bankAddress,
        accountNumber: formData.accountNumber,
        stampImage: formData.stampImage,
        stampSize: formData.stampSize,
        signatureText: formData.stampText
      };

      const response = await API.post('/packing-list/templates', payload);
      if (response.data.success) {
        toast.success("Template created successfully", { id: toastId });
        fetchTemplates();
        setSelectedTemplateId(response.data.data.id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create template", { id: toastId });
    }
  };
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.code === 'KeyS') {
        e.preventDefault();
        handleSave();
      }
      if (e.altKey && e.code === 'Space') {
        e.preventDefault();
        addItem();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, formData]);

  // Global paste listener for hover functionality (supports Excel/Office paste)
  useEffect(() => {
    const handleGlobalPaste = (e) => {
      if (hoveredId !== null) {
        const file = getImageFileFromClipboardEvent(e);
        if (file) {
          uploadFile(file, hoveredId, 'photo');
        }
      }
    };

    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, [hoveredId]);

  // Handle right-click context menu paste (supports Excel/Office paste)
  const handlePasteFromMenu = async (itemId) => {
    try {
      setContextMenu(prev => ({ ...prev, visible: false }));
      const file = await getImageFileFromClipboard();
      if (file) {
        uploadFile(file, itemId, 'photo');
      } else {
        toast.info("No image found in clipboard");
      }
    } catch (err) {
      console.error("Paste failed", err);
      toast.error("Clipboard access denied. Please click 'Allow' when prompted.");
    }
  };

  const onCellContextMenu = (e, itemId) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      itemId
    });
  };

  useEffect(() => {
    const handleClick = () => setContextMenu(prev => ({ ...prev, visible: false }));
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/invoice/container/${containerId}`);
      if (response.data.success) {
        setContainer(response.data.data.container);
        const inv = response.data.data.invoice;

        if (inv) {
          setInvoice(inv);
          setFormData({
            invNo: inv.invNo || '',
            invoiceNo: inv.invoiceNo || '',
            invoiceDate: inv.invoiceDate ? inv.invoiceDate.split('T')[0] : new Date().toISOString().split('T')[0],
            headerCompanyName: inv.headerCompanyName || inv.exporterCompanyName || '',
            headerCompanyAddress: inv.headerCompanyAddress || inv.exporterAddress || '',
            headerPhone: inv.headerPhone || '',
            consigneeName: inv.consigneeName || '',
            consigneeAddress: inv.consigneeAddress || '',
            consigneeIecNo: inv.consigneeIecNo || '',
            consigneeGst: inv.consigneeGst || '',
            consigneeEmail: inv.consigneeEmail || '',
            bankName: inv.bankName || '',
            beneficiaryName: inv.beneficiaryName || '',
            swiftBic: inv.swiftBic || '',
            bankAddress: inv.bankAddress || '',
            accountNumber: inv.accountNumber || '',
            paymentTerms: inv.paymentTerms || 'TOTAL CIF USD 9010 AND 90 WITHIN DAYS AFTER DELIVERY',
            stampImage: inv.stampImage || '',
            stampPosition: inv.stampPosition || 'BOTTOM_RIGHT',
            stampSize: inv.stampSize || 'M',
            stampText: inv.stampText || 'Authorized Signatory',
            showHsnColumn: inv.showHsnColumn ?? true,
            from: inv.from || response.data.data.container.origin || '',
            to: inv.to || response.data.data.container.destination || '',
            status: inv.status || 'DRAFT'
          });
          if (inv.items?.length > 0) {
            setItems(inv.items.map(i => ({ ...i, id: i.id || `item_${Math.random()}` })));
          } else {
            handleAutoImport();
          }
        } else {
          setFormData(prev => ({
            ...prev,
            ...DEFAULT_COMPANY_DETAILS,
            invNo: `16P${response.data.data.container.containerCode}`,
            invoiceNo: `16PLEY86`,
            from: response.data.data.container.origin || '',
            to: response.data.data.container.destination || DEFAULT_COMPANY_DETAILS.to,
            status: 'DRAFT'
          }));
          handleAutoImport();
        }
      }
    } catch (error) {
      toast.error('Failed to load invoice data');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoImport = async () => {
    try {
      setImporting(true);
      const response = await API.get(`/invoice/container/${containerId}/import`);
      if (response.data.success && response.data.data.length > 0) {
        setItems(response.data.data.map(i => ({ ...i, id: `temp_${Date.now()}_${Math.random()}` })));
      }
    } catch (error) {
      console.error('Auto-import failed:', error);
    } finally {
      setImporting(false);
    }
  };

  const handleImport = async () => {
    try {
      setImporting(true);
      const response = await API.get(`/invoice/container/${containerId}/import`);
      if (response.data.success) {
        setItems(response.data.data.map(i => ({ ...i, id: `temp_${Date.now()}_${Math.random()}` })));
        toast.success('Items imported from loading sheets');
        setIsImportModalOpen(false);
      }
    } catch (error) {
      toast.error('Failed to import items');
    } finally {
      setImporting(false);
    }
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      id: `temp_${Date.now()}_${Math.random()}`,
      itemNumber: '',
      description: '',
      ctn: 0,
      qtyPerCtn: 0,
      unit: 'PCS',
      tQty: 0,
      unitPrice: 0,
      amountUsd: 0,
      hsn: '',
      photo: null
    }]);
  };

  const removeItem = (id) => {
    if (items.length === 1) return;
    setItems(items.filter(i => i.id !== id));
  };

  const moveItem = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;

    const newItems = [...items];
    const item = newItems[index];
    newItems.splice(index, 1);
    newItems.splice(direction === 'up' ? index - 1 : index + 1, 0, item);
    setItems(newItems);
  };

  const duplicateRow = (index) => {
    const itemToDuplicate = items[index];
    const newItem = { ...itemToDuplicate, id: `temp_${Date.now()}_${Math.random()}` };
    const newItems = [...items];
    newItems.splice(index + 1, 0, newItem);
    setItems(newItems);
  };

  const COLUMN_SEQUENCE = ['itemNumber', 'description', 'ctn', 'qtyPerCtn', 'unit', 'unitPrice', 'hsn'];

  const handleInputKeyDown = (e, index, field) => {
    if (e.key === 'Tab') {
      const colIdx = COLUMN_SEQUENCE.indexOf(field);
      if (colIdx === -1) return;

      if (e.shiftKey) {
        // Shift + Tab
        if (colIdx > 0) {
          e.preventDefault();
          const prevField = COLUMN_SEQUENCE[colIdx - 1];
          document.getElementById(`cell-${index}-${prevField}`)?.focus();
        } else if (index > 0) {
          e.preventDefault();
          const lastField = COLUMN_SEQUENCE[COLUMN_SEQUENCE.length - 1];
          document.getElementById(`cell-${index - 1}-${lastField}`)?.focus();
        }
      } else {
        // Tab
        if (colIdx < COLUMN_SEQUENCE.length - 1) {
          e.preventDefault();
          const nextField = COLUMN_SEQUENCE[colIdx + 1];
          document.getElementById(`cell-${index}-${nextField}`)?.focus();
        } else if (index < items.length - 1) {
          e.preventDefault();
          document.getElementById(`cell-${index + 1}-${COLUMN_SEQUENCE[0]}`)?.focus();
        } else {
          // Last row, last field -> Add Row
          e.preventDefault();
          addItem();
          setTimeout(() => {
            const nextIdx = index + 1;
            document.getElementById(`cell-${nextIdx}-${COLUMN_SEQUENCE[0]}`)?.focus();
          }, 100);
        }
      }
    }
  };

  const updateItem = (id, field, value) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };

        // Auto-calculate tQty
        if (field === 'ctn' || field === 'qtyPerCtn') {
          updated.tQty = (parseInt(updated.ctn) || 0) * (parseInt(updated.qtyPerCtn) || 0);
        }

        // Auto-calculate amountUsd
        if (field === 'tQty' || field === 'unitPrice') {
          const raw = (parseInt(updated.tQty) || 0) * (parseFloat(updated.unitPrice) || 0);
          updated.amountUsd = Number.isFinite(raw) ? parseFloat(raw.toFixed(2)) : 0;
        }

        // Recalculate if ctn or qtyPerCtn changed
        if (field === 'ctn' || field === 'qtyPerCtn') {
          const raw = updated.tQty * (parseFloat(updated.unitPrice) || 0);
          updated.amountUsd = Number.isFinite(raw) ? parseFloat(raw.toFixed(2)) : 0;
        }

        return updated;
      }
      return item;
    }));
  };

  const uploadFile = async (file, itemId, type = 'photo') => {
    if (!file) return;

    const toastId = toast.loading(`Uploading ${type}...`);
    try {
      const uploadData = new FormData();
      const prefix = type === 'stamp' ? 'stamp_' : 'invoice_';
      const newFile = new File([file], `${prefix}${file.name}`, { type: file.type });
      uploadData.append('file', newFile);

      const response = await API.post('/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        if (type === 'stamp') {
          setFormData(prev => ({ ...prev, stampImage: response.data.url }));
        } else {
          updateItem(itemId, 'photo', response.data.url);
        }
        toast.success(`${type} uploaded`, { id: toastId });
      }
    } catch (error) {
      toast.error('Upload failed', { id: toastId });
    }
  };

  const handleFileUpload = async (itemId, type = 'photo') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => uploadFile(e.target.files[0], itemId, type);
    input.click();
  };

  const handleSave = async (overrideData = null) => {
    if (!formData.invNo) {
      toast.error("Invoice Number is required");
      return;
    }
    try {
      setSaving(true);
      const dataToSave = overrideData || formData;
      const payload = {
        ...dataToSave,
        items: items.filter(i => i.description || i.itemNumber)
      };
      const response = await API.post(`/invoice/container/${containerId}`, payload);
      if (response.data.success) {
        toast.success('Invoice saved successfully');
        setInvoice(response.data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleExportExcel = async () => {
    if (!invoice?.id) {
      toast.error("Please save the invoice first");
      return;
    }
    try {
      toast.info("Generating Excel...");
      const response = await API.get(`/invoice/${invoice.id}/export/excel`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${formData.invNo || 'draft'}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Excel generated successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export Excel");
    }
  };

  const stats = {
    totalItems: items.length,
    totalCtn: items.reduce((s, i) => s + (parseInt(i.ctn) || 0), 0),
    totalQty: items.reduce((s, i) => s + (parseInt(i.tQty) || 0), 0),
    totalAmountRaw: items.reduce((s, i) => s + (parseFloat(i.amountUsd) || 0), 0),
  };

  const formatUsd = (value) => {
    const num = parseFloat(value) || 0;
    if (roundUsd) return Math.round(num).toLocaleString();
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (loading && !container) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto">

        {/* Container Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/loading')}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 uppercase">
                  {container?.containerCode} - INVOICE
                </h1>
                <select
                  value={formData.status}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    setFormData(prev => ({ ...prev, status: newStatus }));
                    if (invoice) handleSave({ ...formData, status: newStatus });
                  }}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors outline-none cursor-pointer ${formData.status === 'CONFIRMED' ? 'bg-green-100 text-green-800 border-green-200' :
                    formData.status === 'PRINTED' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                      formData.status === 'CANCELLED' ? 'bg-red-100 text-red-800 border-red-200' :
                        'bg-amber-100 text-amber-800 border-amber-200'
                    }`}
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PRINTED">PRINTED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
                <label className="flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-white text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  <input
                    type="checkbox"
                    checked={roundUsd}
                    onChange={(e) => setRoundUsd(e.target.checked)}
                    className="h-3.5 w-3.5 accent-emerald-600"
                  />
                  Round USD
                </label>
              </div>
              <p className="text-sm text-slate-600">
                {container?.origin} • {new Date(container?.loadingDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 border border-slate-300 shadow-sm font-semibold transition-all"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              disabled={importing}
              className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 border border-slate-300 shadow-sm font-semibold transition-all"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <History className="w-4 h-4" />}
              Import
            </button>
            {invoice && (
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg hover:bg-emerald-100 border border-emerald-300 shadow-sm font-semibold transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 shadow-lg font-bold transition-all active:scale-95"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-widest">Items</div>
              <div className="text-2xl font-bold text-slate-800">{stats.totalItems}</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-widest">Total QTY</div>
              <div className="text-2xl font-bold text-slate-800">{stats.totalQty}</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-widest">Total CTN</div>
              <div className="text-2xl font-bold text-slate-800">{stats.totalCtn}</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-7 h-7" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-widest">Total USD</div>
              <div className="text-2xl font-bold text-emerald-700">${formatUsd(stats.totalAmountRaw)}</div>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          {/* Status Bar */}
          <div className={`px-6 py-3 flex justify-between items-center border-b ${invoice ? 'bg-green-50 text-green-800 border-green-100' : 'bg-slate-50 text-slate-600 border-slate-100'
            }`}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest opacity-75">Status:</span>
              <select
                value={formData.status}
                onChange={(e) => {
                  const newStatus = e.target.value;
                  setFormData(prev => ({ ...prev, status: newStatus }));
                  if (invoice) handleSave({ ...formData, status: newStatus });
                }}
                className={`ml-2 font-bold uppercase tracking-wide text-[10px] px-2 py-0.5 rounded border ${formData.status === 'CONFIRMED' ? 'bg-green-100 border-green-200 text-green-700' :
                  formData.status === 'PRINTED' ? 'bg-blue-100 border-blue-200 text-blue-700' :
                    formData.status === 'CANCELLED' ? 'bg-red-100 border-red-200 text-red-700' :
                      'bg-amber-100 border-amber-200 text-amber-700'
                  }`}
              >
                <option value="DRAFT">DRAFT</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="PRINTED">PRINTED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Template:</span>
              <div className="flex items-center gap-2">
                <select
                  value={selectedTemplateId}
                  onChange={(e) => applyTemplate(e.target.value)}
                  className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select Template...</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.companyName}</option>)}
                </select>
                <button
                  onClick={createTemplate}
                  className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100 shadow-sm"
                  title="Save current as template"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* 1. Quick Info & Shipping (same as packing) */}
            <div className="grid grid-cols-4 gap-6 mb-8 p-6 bg-slate-50/50 rounded-xl border border-slate-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Inv No. (Internal)</label>
                <input
                  type="text" value={formData.invNo}
                  onChange={(e) => setFormData({ ...formData, invNo: e.target.value.toUpperCase() })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-blue-800 outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Invoice Date</label>
                <input
                  type="date" value={formData.invoiceDate}
                  onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 transition-all font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">From (Origin)</label>
                <input
                  type="text" value={formData.from}
                  onChange={(e) => setFormData({ ...formData, from: e.target.value.toUpperCase() })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-all"
                  placeholder="e.g. CHINA"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">To (Destination)</label>
                <input
                  type="text" value={formData.to}
                  onChange={(e) => setFormData({ ...formData, to: e.target.value.toUpperCase() })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-all"
                  placeholder="e.g. NHAVA SHEVA"
                />
              </div>
            </div>

            {/* 2. Configuration Accordion (same UI as packing) */}
            <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="mb-8 border border-slate-200 rounded-xl overflow-hidden">

              {/* Exporter Section */}
              <AccordionItem value="exporter" className="border-b border-slate-200 px-6 py-1">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Building2 className="w-4 h-4" /></div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-slate-800 uppercase tracking-wider">1. Exporter Details</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{formData.headerCompanyName || 'Not set'}</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6">
                  <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Exporter Name *</label>
                      <input
                        type="text" value={formData.headerCompanyName}
                        onChange={(e) => setFormData({ ...formData, headerCompanyName: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                        placeholder="e.g. YIWU ZHOULAI TRADING CO., LIMITED"
                      />
                    </div>
                    <div className="row-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Address line</label>
                      <textarea
                        value={formData.headerCompanyAddress}
                        onChange={(e) => setFormData({ ...formData, headerCompanyAddress: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all h-[115px] resize-none"
                        placeholder="Room 801, Unit 3, Building 1, Jiuheyuan..."
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Header Phone / Tel</label>
                      <input
                        type="text" value={formData.headerPhone}
                        onChange={(e) => setFormData({ ...formData, headerPhone: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                        placeholder="13735751445"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Consignee Section */}
              <AccordionItem value="consignee" className="border-b border-slate-200 px-6 py-1">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Users className="w-4 h-4" /></div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-slate-800 uppercase tracking-wider">2. Consignee Details</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{formData.consigneeName || 'Not set'}</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6">
                  <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Consignee Name</label>
                        <input
                          type="text" value={formData.consigneeName}
                          onChange={(e) => setFormData({ ...formData, consigneeName: e.target.value.toUpperCase() })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                          placeholder="e.g. IMPEXINA GLOBAL PVT LTD"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">IEC Number</label>
                          <input
                            type="text" value={formData.consigneeIecNo}
                            onChange={(e) => setFormData({ ...formData, consigneeIecNo: e.target.value.toUpperCase() })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">GST Number</label>
                          <input
                            type="text" value={formData.consigneeGst}
                            onChange={(e) => setFormData({ ...formData, consigneeGst: e.target.value.toUpperCase() })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all font-mono"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Consignee Address</label>
                        <textarea
                          value={formData.consigneeAddress}
                          onChange={(e) => setFormData({ ...formData, consigneeAddress: e.target.value.toUpperCase() })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all h-[90px] resize-none"
                          placeholder="GROUND FLOOR, C-5, GAMI INDUSTRIAL PARK..."
                        ></textarea>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                        <input
                          type="email" value={formData.consigneeEmail}
                          onChange={(e) => setFormData({ ...formData, consigneeEmail: e.target.value.toLowerCase() })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                          placeholder="impexina91@gmail.com"
                        />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Bank Section */}
              <AccordionItem value="bank" className="border-b border-slate-200 px-6 py-1">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Landmark className="w-4 h-4" /></div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-slate-800 uppercase tracking-wider">3. Bank Details</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{formData.bankName || 'Not set'}</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6">
                  <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Bank Name</label>
                          <input
                            type="text" value={formData.bankName}
                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value.toUpperCase() })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Beneficiary Name</label>
                          <input
                            type="text" value={formData.beneficiaryName}
                            onChange={(e) => setFormData({ ...formData, beneficiaryName: e.target.value.toUpperCase() })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Swift BIC</label>
                          <input
                            type="text" value={formData.swiftBic}
                            onChange={(e) => setFormData({ ...formData, swiftBic: e.target.value.toUpperCase() })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">A/C No.</label>
                          <input
                            type="text" value={formData.accountNumber}
                            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.toUpperCase() })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all font-mono"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Bank Address</label>
                      <textarea
                        value={formData.bankAddress}
                        onChange={(e) => setFormData({ ...formData, bankAddress: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all h-[80px] resize-none"
                      ></textarea>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Stamp Section */}
              <AccordionItem value="stamp" className="border-none px-6 py-1">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Upload className="w-4 h-4" /></div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-slate-800 uppercase tracking-wider">4. Stamp & Signature</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{formData.stampText || "Authorized Signatory"}</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6">
                  <div className="flex items-start gap-8 pt-4 border-t border-slate-100">
                    <div
                      onClick={() => handleFileUpload(null, 'stamp')}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                        const file = e.dataTransfer.files[0];
                        if (file?.type?.startsWith('image/')) {
                          uploadFile(file, null, 'stamp');
                        } else {
                          toast.error('Please drop an image file');
                        }
                      }}
                      onPaste={(e) => {
                        const file = getImageFileFromClipboardEvent(e);
                        if (file) {
                          e.preventDefault();
                          uploadFile(file, null, 'stamp');
                        }
                      }}
                      tabIndex={0}
                      className="w-28 h-28 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all overflow-hidden relative group shrink-0 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      {formData.stampImage ? (
                        <>
                          <img src={getImageUrl(formData.stampImage)} className="w-full h-full object-contain" alt="Stamp" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-white text-[10px] font-bold">CHANGE</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-slate-300 mb-2" />
                          <span className="text-[9px] font-bold text-slate-400 uppercase text-center px-4 tracking-tighter">Upload Stamp</span>
                        </>
                      )}
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Position</label>
                          <select
                            value={formData.stampPosition}
                            onChange={(e) => setFormData({ ...formData, stampPosition: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                          >
                            <option value="BOTTOM_LEFT">Bottom Left</option>
                            <option value="BOTTOM_CENTER">Bottom Center</option>
                            <option value="BOTTOM_RIGHT">Bottom Right</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Size</label>
                          <div className="flex gap-2">
                            {['SM', 'M', 'LG'].map(sz => (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => setFormData({ ...formData, stampSize: sz })}
                                className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${formData.stampSize === sz
                                  ? 'bg-blue-600 text-white shadow-md'
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                  }`}
                              >
                                {sz}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Footer Signature Text</label>
                        <textarea
                          value={formData.stampText}
                          onChange={(e) => setFormData({ ...formData, stampText: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 h-[100px] resize-none"
                          placeholder="e.g. Authorized Signatory"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Invoice Items</h2>
            <button
              onClick={addItem}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 font-bold text-xs uppercase transition-all shadow-lg shadow-blue-100"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: '1200px' }}>
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                  <th className="w-10 text-center border-r border-slate-200 bg-slate-100/30"></th>
                  <th className="px-4 py-5 w-12 text-center border-r border-slate-200">S.N.</th>
                  <th className="px-2 py-5 w-24 text-center border-r border-slate-200">MARK</th>
                  <th className="px-2 py-5 w-16 text-center border-r border-slate-200">Photo</th>
                  <th className="px-4 py-5 min-w-[250px] border-r border-slate-200 text-left">Descriptions</th>
                  <th className="px-2 py-5 min-w-[80px] text-center border-r border-slate-200">Ctn.</th>
                  <th className="px-2 py-5 min-w-[80px] text-center border-r border-slate-200">Qty/Ctn</th>
                  <th className="px-2 py-5 min-w-[80px] text-center border-r border-slate-200">Unit</th>
                  <th className="px-2 py-5 min-w-[80px] text-center border-r border-slate-200 bg-blue-50/50 text-blue-700">T-Qty</th>
                  <th className="px-2 py-5 min-w-[90px] text-center border-r border-slate-200">U.Price</th>
                  <th className="px-2 py-5 min-w-[110px] text-center border-r border-slate-200 bg-emerald-50/50 text-emerald-700">Amount/USD</th>
                  {formData.showHsnColumn && <th className="px-2 py-5 min-w-[90px] text-center border-r border-slate-200">HSN</th>}
                  <th className="px-2 py-5 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="w-10 border-r border-slate-100 bg-slate-50/20">
                      <div className="flex flex-col items-center justify-center py-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => moveItem(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-slate-300 hover:text-blue-500 disabled:opacity-0"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveItem(idx, 'down')}
                          disabled={idx === items.length - 1}
                          className="p-1 text-slate-300 hover:text-blue-500 disabled:opacity-0"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center text-xs font-medium text-slate-400 border-r border-slate-100">{idx + 1}</td>
                    <td className="px-1 py-1 border-r border-slate-100">
                      <input
                        id={`cell-${idx}-itemNumber`}
                        type="text"
                        value={item.itemNumber}
                        onChange={(e) => updateItem(item.id, 'itemNumber', e.target.value.toUpperCase())}
                        onKeyDown={(e) => handleInputKeyDown(e, idx, 'itemNumber')}
                        className="w-full bg-transparent border-none px-1 py-1 text-sm font-bold text-slate-700 text-center outline-none uppercase"
                        placeholder="-"
                      />
                    </td>
                    <td className="px-1 py-1 border-r border-slate-100 text-center">
                      <label
                        className="w-10 h-10 mx-auto flex items-center justify-center border border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-blue-400 transition-all relative overflow-hidden group"
                        onMouseEnter={() => setHoveredId(item.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onContextMenu={(e) => onCellContextMenu(e, item.id)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.add("border-blue-500", "bg-blue-50");
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove("border-blue-500", "bg-blue-50");
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove("border-blue-500", "bg-blue-50");
                          const file = e.dataTransfer.files[0];
                          if (file && file.type.startsWith("image/")) {
                            uploadFile(file, item.id, 'photo');
                          }
                        }}
                        onPaste={(e) => {
                          const file = getImageFileFromClipboardEvent(e);
                          if (file) uploadFile(file, item.id, 'photo');
                        }}
                      >
                        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <Upload className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                        </span>
                        {item.photo && getImageUrl(item.photo) ? (
                          <img
                            src={getImageUrl(item.photo)}
                            alt="Item"
                            className="relative z-10 w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : null}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadFile(file, item.id, 'photo');
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </td>
                    <td className="px-1 py-1 border-r border-slate-100">
                      <textarea
                        id={`cell-${idx}-description`}
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value.toUpperCase())}
                        onKeyDown={(e) => handleInputKeyDown(e, idx, 'description')}
                        className="w-full bg-transparent border-none px-3 py-1 text-sm font-semibold text-slate-700 outline-none resize-none h-10"
                        placeholder="Description"
                        onMouseEnter={() => setHoveredId(item.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onContextMenu={(e) => onCellContextMenu(e, item.id)}
                        onPaste={(e) => {
                          const file = getImageFileFromClipboardEvent(e);
                          if (file) {
                            e.preventDefault();
                            uploadFile(file, item.id, 'photo');
                          }
                        }}
                      />
                    </td>
                    <td className="px-1 py-1 border-r border-slate-100">
                      <input
                        id={`cell-${idx}-ctn`}
                        type="number" value={item.ctn || ''}
                        onChange={(e) => updateItem(item.id, 'ctn', e.target.value)}
                        onKeyDown={(e) => handleInputKeyDown(e, idx, 'ctn')}
                        className="w-full bg-transparent border-none px-1 py-1 text-sm font-bold text-slate-900 text-center outline-none"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-1 py-1 border-r border-slate-100">
                      <input
                        id={`cell-${idx}-qtyPerCtn`}
                        type="number" value={item.qtyPerCtn || ''}
                        onChange={(e) => updateItem(item.id, 'qtyPerCtn', e.target.value)}
                        onKeyDown={(e) => handleInputKeyDown(e, idx, 'qtyPerCtn')}
                        className="w-full bg-transparent border-none px-1 py-1 text-sm font-semibold text-slate-700 text-center outline-none"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-1 py-1 border-r border-slate-100">
                      <input
                        id={`cell-${idx}-unit`}
                        value={item.unit || 'PCS'}
                        onChange={(e) => updateItem(item.id, 'unit', e.target.value.toUpperCase())}
                        onKeyDown={(e) => handleInputKeyDown(e, idx, 'unit')}
                        className="w-full bg-transparent border-none px-1 py-1 text-sm font-semibold text-slate-700 text-center outline-none"
                      />
                    </td>
                    <td className="px-1 py-1 border-r border-slate-100 text-center font-bold text-blue-600 bg-blue-50/20">{item.tQty}</td>
                    <td className="px-1 py-1 border-r border-slate-100">
                      <input
                        id={`cell-${idx}-unitPrice`}
                        type="number"
                        step="0.01"
                        value={item.unitPrice || ''}
                        onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                        onKeyDown={(e) => handleInputKeyDown(e, idx, 'unitPrice')}
                        className="w-full bg-transparent border-none px-1 py-1 text-sm font-semibold text-slate-700 text-center outline-none"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-1 py-1 border-r border-slate-100 text-center font-bold text-emerald-700 bg-emerald-50/20">
                      {formatUsd(item.amountUsd)}
                    </td>
                    {formData.showHsnColumn && (
                      <td className="px-1 py-1 border-r border-slate-100">
                        <input
                          id={`cell-${idx}-hsn`}
                          value={item.hsn || ''}
                          onChange={(e) => updateItem(item.id, 'hsn', e.target.value.toUpperCase())}
                          onKeyDown={(e) => handleInputKeyDown(e, idx, 'hsn')}
                          className="w-full bg-transparent border-none px-1 py-1 text-xs font-semibold text-slate-700 text-center outline-none"
                          placeholder="-"
                        />
                      </td>
                    )}
                    <td className="px-1 py-1 text-center flex items-center justify-center gap-2">
                      <button
                        onClick={() => duplicateRow(idx)}
                        className="p-2 text-slate-300 hover:text-blue-500 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Duplicate Row"
                        tabIndex={-1}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-slate-300 hover:text-red-500 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Delete Row"
                        tabIndex={-1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-4 bg-slate-50/50 flex justify-end items-center border-t border-slate-200">
              <div className="flex gap-10">
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total CTN</span>
                  <div className="text-xl font-bold text-slate-800">{items.reduce((s, i) => s + (parseInt(i.ctn) || 0), 0)}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total QTY</span>
                  <div className="text-xl font-bold text-slate-800">{items.reduce((s, i) => s + (parseInt(i.tQty) || 0), 0)}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Amount</span>
                  <div className="text-xl font-bold text-slate-800">
                    USD {formatUsd(items.reduce((s, i) => s + (parseFloat(i.amountUsd) || 0), 0))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Terms */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mt-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Payment Terms</h2>
          <textarea
            value={formData.paymentTerms}
            onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
            rows={2}
            placeholder="TOTAL CIF USD 9010 AND 90 WITHIN DAYS AFTER DELIVERY"
          />
        </div>
      </div>

      {/* Import Confirmation Modal */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-red-50 p-6 flex items-center gap-4 border-b border-red-100">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
              <Info className="w-8 h-8" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-red-900 uppercase">Harm Warning!</DialogTitle>
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-1">Data Overwrite Alert</p>
            </div>
          </div>

          <div className="p-8">
            <DialogDescription className="text-sm font-bold text-slate-600 leading-relaxed italic">
              "If you proceed you may lose your entries with realtime data with loading sheet"
            </DialogDescription>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  handleImport();
                }}
                disabled={importing}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-200 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
              >
                {importing && <Loader2 className="w-4 h-4 animate-spin" />}
                Proceed & Import
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Preview Modal */}
      <InvoicePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        data={formData}
        items={items}
        container={container}
        roundUsd={roundUsd}
      />

      {/* Custom Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed z-[100] bg-white border border-slate-200 shadow-xl rounded-lg py-1 min-w-[120px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handlePasteFromMenu(contextMenu.itemId)}
            className="w-full text-left px-4 py-2 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-all"
          >
            <ImageIcon className="w-4 h-4" />
            Paste Here
          </button>
          <button
            onClick={() => {
              updateItem(contextMenu.itemId, 'photo', null);
              setContextMenu(prev => ({ ...prev, visible: false }));
            }}
            className="w-full text-left px-4 py-2 text-sm font-bold text-slate-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Remove Image
          </button>
        </div>
      )}
    </div>
  );
}
