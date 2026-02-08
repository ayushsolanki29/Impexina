"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Plus, Save, Trash2, Loader2, ArrowLeft,
  Eye, Package, DollarSign, History, Building2, Landmark, Users, Upload, Image as ImageIcon
} from 'lucide-react';
import API from '@/lib/api';
import { toast } from 'sonner';
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

// Helper function to get image URL
const getImageUrl = (photoPath) => {
  if (!photoPath) return null;

  if (photoPath.startsWith("http://") || photoPath.startsWith("https://")) {
    return photoPath;
  }

  const normalizedPath = photoPath.startsWith("/") ? photoPath : `/${photoPath}`;
  const baseUrl = (process.env.NEXT_PUBLIC_SERVER_URL || "").replace(/\/$/, "");

  return `${baseUrl}${normalizedPath}`;
};

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

  // Templates
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Direct paste on hover state
  const [hoveredId, setHoveredId] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, itemId: null });

  // Form State
  const [formData, setFormData] = useState({
    invNo: '',
    invoiceNo: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    headerCompanyName: '',
    headerCompanyAddress: '',
    headerPhone: '',
    exporterCompanyName: '',
    exporterAddress: '',
    exporterIecNo: '',
    exporterGst: '',
    exporterEmail: '',
    consigneeName: '',
    consigneeAddress: '',
    consigneeCountry: '',
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
    to: ''
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
        exporterCompanyName: template.companyName,
        exporterAddress: template.companyAddress,
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
    if (!formData.exporterCompanyName) {
      toast.error("Company Name is required to create a template");
      return;
    }

    const toastId = toast.loading("Creating template...");
    try {
      const payload = {
        companyName: formData.exporterCompanyName,
        companyAddress: formData.exporterAddress,
        companyPhone: formData.headerPhone,
        companyEmail: formData.exporterEmail,
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

  // Global paste listener for hover functionality
  useEffect(() => {
    const handleGlobalPaste = (e) => {
      if (hoveredId !== null) {
        const clipboardItems = e.clipboardData.items;
        for (let i = 0; i < clipboardItems.length; i++) {
          if (clipboardItems[i].type.indexOf("image") !== -1) {
            const file = clipboardItems[i].getAsFile();
            uploadFile(file, hoveredId, 'photo');
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, [hoveredId]);

  // Handle right-click context menu paste
  const handlePasteFromMenu = async (itemId) => {
    try {
      setContextMenu(prev => ({ ...prev, visible: false }));
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith("image/")) {
            const blob = await item.getType(type);
            const file = new File([blob], "pasted_image.png", { type });
            uploadFile(file, itemId, 'photo');
            return;
          }
        }
      }
      toast.info("No image found in clipboard");
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
            headerCompanyName: inv.headerCompanyName || '',
            headerCompanyAddress: inv.headerCompanyAddress || '',
            headerPhone: inv.headerPhone || '',
            exporterCompanyName: inv.exporterCompanyName || '',
            exporterAddress: inv.exporterAddress || '',
            exporterIecNo: inv.exporterIecNo || '',
            exporterGst: inv.exporterGst || '',
            exporterEmail: inv.exporterEmail || '',
            consigneeName: inv.consigneeName || '',
            consigneeAddress: inv.consigneeAddress || '',
            consigneeCountry: inv.consigneeCountry || '',
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
            to: inv.to || ''
          });
          if (inv.items?.length > 0) {
            setItems(inv.items.map(i => ({ ...i, id: i.id || `item_${Math.random()}` })));
          } else {
            handleAutoImport();
          }
        } else {
          setFormData(prev => ({
            ...prev,
            invNo: `16P${response.data.data.container.containerCode}`,
            invoiceNo: `16PLEY86`,
            from: response.data.data.container.origin || '',
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
          updated.amountUsd = (parseInt(updated.tQty) || 0) * (parseFloat(updated.unitPrice) || 0);
        }

        // Recalculate if ctn or qtyPerCtn changed
        if (field === 'ctn' || field === 'qtyPerCtn') {
          updated.amountUsd = updated.tQty * (parseFloat(updated.unitPrice) || 0);
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

  const handleSave = async () => {
    if (!formData.invNo) {
      toast.error("Invoice Number is required");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...formData,
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

  const stats = {
    totalItems: items.length,
    totalCtn: items.reduce((s, i) => s + (parseInt(i.ctn) || 0), 0),
    totalQty: items.reduce((s, i) => s + (parseInt(i.tQty) || 0), 0),
    totalAmount: items.reduce((s, i) => s + (parseFloat(i.amountUsd) || 0), 0)
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
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors ${invoice ? 'bg-green-100 text-green-800 border-green-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                  }`}>
                  {invoice ? 'CONFIRMED' : 'DRAFT'}
                </span>
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
              <div className="text-2xl font-bold text-emerald-700">${stats.totalAmount.toFixed(2)}</div>
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
              <span className="font-bold uppercase tracking-wide text-xs">{invoice ? 'CONFIRMED' : 'DRAFT'}</span>
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

            {/* Ref & Shipping Header */}
            <div className="mb-8 pb-8 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Invoice & Shipping Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">INV NO.</label>
                  <input
                    type="text"
                    value={formData.invNo}
                    onChange={(e) => setFormData({ ...formData, invNo: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
                    placeholder="16PLEYB6"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Invoice Date</label>
                  <input
                    type="date"
                    value={formData.invoiceDate}
                    onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">From</label>
                  <input
                    type="text"
                    value={formData.from}
                    onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
                    placeholder="CHINA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">To</label>
                  <input
                    type="text"
                    value={formData.to}
                    onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
                    placeholder="NHAVA SHEVA INDIA"
                  />
                </div>
              </div>
            </div>

            {/* Accordion Sections */}
            {/* 2. Configuration Accordion (Collapsible) */}
            <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="space-y-4 mb-8">

              {/* Exporter Section */}
              <AccordionItem value="exporter" className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <AccordionTrigger className="hover:no-underline px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Building2 className="w-5 h-5" /></div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-slate-800 uppercase tracking-wider">1. Exporter Details</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{formData.exporterCompanyName || 'Not set'}</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-2">
                  <div className="pt-4 border-t border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Company Name</label>
                        <input
                          type="text"
                          value={formData.exporterCompanyName}
                          onChange={(e) => setFormData({ ...formData, exporterCompanyName: e.target.value.toUpperCase() })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          placeholder="IMPEXINA GLOBAL PVT LTD"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Address</label>
                        <textarea
                          value={formData.exporterAddress}
                          onChange={(e) => setFormData({ ...formData, exporterAddress: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          rows={3}
                          placeholder="Ground Floor, C-5, Gami Industrial Park Pawane..."
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">IEC NO.</label>
                        <input
                          type="text"
                          value={formData.exporterIecNo}
                          onChange={(e) => setFormData({ ...formData, exporterIecNo: e.target.value.toUpperCase() })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                          placeholder="AAHCI4621"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">GST NO.</label>
                        <input
                          type="text"
                          value={formData.exporterGst}
                          onChange={(e) => setFormData({ ...formData, exporterGst: e.target.value.toUpperCase() })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                          placeholder="27AAHCI4621JZG"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
                        <input
                          type="email"
                          value={formData.exporterEmail}
                          onChange={(e) => setFormData({ ...formData, exporterEmail: e.target.value.toLowerCase() })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          placeholder="impexina91@gmail.com"
                        />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Consignee Section */}
              <AccordionItem value="consignee" className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <AccordionTrigger className="hover:no-underline px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Users className="w-5 h-5" /></div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-slate-800 uppercase tracking-wider">2. Consignee Details</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{formData.consigneeName || 'Not set'}</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-2">
                  <div className="pt-4 border-t border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Company Name</label>
                        <input
                          type="text"
                          value={formData.consigneeName}
                          onChange={(e) => setFormData({ ...formData, consigneeName: e.target.value.toUpperCase() })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          placeholder="YIWU ZHOULAI TRADING CO., LIMITED"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Address</label>
                        <textarea
                          value={formData.consigneeAddress}
                          onChange={(e) => setFormData({ ...formData, consigneeAddress: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          rows={3}
                          placeholder="Room 801, Unit 3, Building 1, Jiuheyuan..."
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Country</label>
                        <input
                          type="text"
                          value={formData.consigneeCountry}
                          onChange={(e) => setFormData({ ...formData, consigneeCountry: e.target.value.toUpperCase() })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          placeholder="CHINA"
                        />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Bank Section */}
              <AccordionItem value="bank" className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <AccordionTrigger className="hover:no-underline px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Landmark className="w-5 h-5" /></div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-slate-800 uppercase tracking-wider">3. Bank Details</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{formData.bankName || 'Not set'}</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-2">
                  <div className="pt-4 border-t border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Bank Name</label>
                        <input
                          type="text"
                          value={formData.bankName}
                          onChange={(e) => setFormData({ ...formData, bankName: e.target.value.toUpperCase() })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          placeholder="ZHEJIANG TAILONG COMMERCIAL BANK"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Beneficiary Name</label>
                        <input
                          type="text"
                          value={formData.beneficiaryName}
                          onChange={(e) => setFormData({ ...formData, beneficiaryName: e.target.value.toUpperCase() })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          placeholder="YIWU ZHOULAI TRADING CO.,LIMITED"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">SWIFT BIC</label>
                        <input
                          type="text"
                          value={formData.swiftBic}
                          onChange={(e) => setFormData({ ...formData, swiftBic: e.target.value.toUpperCase() })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                          placeholder="ZJTLCNBHXXX"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Account Number</label>
                        <input
                          type="text"
                          value={formData.accountNumber}
                          onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                          placeholder="33080020201000155179"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Bank Address</label>
                        <textarea
                          value={formData.bankAddress}
                          onChange={(e) => setFormData({ ...formData, bankAddress: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          rows={2}
                          placeholder="ROOM 801, UNIT 3, BUILDING 1..."
                        />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Stamp Section */}
              <AccordionItem value="stamp" className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <AccordionTrigger className="hover:no-underline px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Upload className="w-5 h-5" /></div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-slate-800 uppercase tracking-wider">4. Stamp & Signature</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{formData.stampText || "Authorized Signatory"}</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-2">
                  <div className="pt-4 border-t border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Stamp Image</label>
                        <button
                          onClick={() => handleFileUpload(null, 'stamp')}
                          className="w-full px-4 py-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center gap-2 group"
                        >
                          {formData.stampImage ? (
                            <>
                              <div className="w-full h-24 relative mb-2">
                                <img
                                  src={getImageUrl(formData.stampImage)}
                                  alt="Stamp"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full group-hover:bg-blue-100 transition-colors">Change Stamp</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-6 h-6 text-slate-300 mb-2 group-hover:text-blue-500 transition-colors" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-blue-600 transition-colors">Upload Stamp</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Position</label>
                        <div className="flex gap-2">
                          {['BOTTOM_LEFT', 'BOTTOM_CENTER', 'BOTTOM_RIGHT'].map((pos) => (
                            <button
                              key={pos}
                              onClick={() => setFormData({ ...formData, stampPosition: pos })}
                              className={`flex-1 py-3 type="button" rounded-xl text-[10px] font-bold transition-all border ${formData.stampPosition === pos
                                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200'
                                : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-200'
                                }`}
                            >
                              {pos.replace('BOTTOM_', '')}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Size</label>
                        <div className="flex gap-2">
                          {['SM', 'M', 'LG'].map((sz) => (
                            <button
                              key={sz}
                              onClick={() => setFormData({ ...formData, stampSize: sz })}
                              className={`flex-1 py-3 type="button" rounded-xl text-[10px] font-bold transition-all border ${formData.stampSize === sz
                                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200'
                                : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-200'
                                }`}
                            >
                              {sz === 'SM' ? 'SMALL' : sz === 'M' ? 'MEDIUM' : 'LARGE'}
                            </button>
                          ))}
                        </div>
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
            <h2 className="text-lg font-bold text-slate-900">Invoice Items</h2>
            <button
              onClick={addItem}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-left">
                  <th className="px-4 py-3 w-12">#</th>
                  <th className="px-4 py-3 w-24">MARK</th>
                  <th className="px-4 py-3 w-24">Photo</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 w-20">Ctn</th>
                  <th className="px-4 py-3 w-24">Qty/Ctn</th>
                  <th className="px-4 py-3 w-20">Unit</th>
                  <th className="px-4 py-3 w-24">T-Qty</th>
                  <th className="px-4 py-3 w-24">U.Price</th>
                  <th className="px-4 py-3 w-32">Amount/USD</th>
                  {formData.showHsnColumn && <th className="px-4 py-3 w-32">HSN</th>}
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-center text-slate-500 font-semibold">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.itemNumber}
                        onChange={(e) => updateItem(item.id, 'itemNumber', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="BB-AMD"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleFileUpload(item.id, 'photo')}
                        className="w-16 h-16 border-2 border-dashed border-slate-300 rounded hover:border-blue-500 flex items-center justify-center relative overflow-hidden group"
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
                          const items = e.clipboardData.items;
                          for (let i = 0; i < items.length; i++) {
                            if (items[i].type.indexOf("image") !== -1) {
                              const file = items[i].getAsFile();
                              uploadFile(file, item.id, 'photo');
                              break;
                            }
                          }
                        }}
                      >
                        {item.photo ? (
                          <img src={getImageUrl(item.photo)} alt="" className="w-full h-full object-cover rounded" />
                        ) : (
                          <Upload className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="FOOTREST"
                        onMouseEnter={() => setHoveredId(item.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onContextMenu={(e) => onCellContextMenu(e, item.id)}
                        onPaste={(e) => {
                          const clipboardItems = e.clipboardData.items;
                          for (let i = 0; i < clipboardItems.length; i++) {
                            if (clipboardItems[i].type.indexOf("image") !== -1) {
                              const file = clipboardItems[i].getAsFile();
                              uploadFile(file, item.id, 'photo');
                              break;
                            }
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.ctn}
                        onChange={(e) => updateItem(item.id, 'ctn', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-center"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.qtyPerCtn}
                        onChange={(e) => updateItem(item.id, 'qtyPerCtn', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-center"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={item.unit}
                        onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="PCS">PCS</option>
                        <option value="KG">KG</option>
                        <option value="SET">SET</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.tQty}
                        readOnly
                        className="w-full px-2 py-1 border border-slate-200 rounded bg-slate-50 text-center font-semibold"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-right"
                        placeholder="0.06"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={item.amountUsd}
                        readOnly
                        className="w-full px-2 py-1 border border-slate-200 rounded bg-emerald-50 text-right font-bold text-emerald-700"
                      />
                    </td>
                    {formData.showHsnColumn && (
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.hsn}
                          onChange={(e) => updateItem(item.id, 'hsn', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="94036090"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Import Items from Loading Sheets?</DialogTitle>
            <DialogDescription className="text-slate-600">
              This will replace all current items with data from the loading sheets. Any unsaved changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 mt-6">
            <button
              onClick={() => setIsImportModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-all flex items-center gap-2"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Proceed & Import
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Preview Modal */}
      <InvoicePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        data={formData}
        items={items}
        container={container}
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
        </div>
      )}
    </div>
  );
}
