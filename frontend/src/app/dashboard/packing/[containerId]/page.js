"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Plus, Save, Trash2, X, Loader2, ArrowLeft,
  Eye, Package, Building2, Landmark, History,
  Info, Box, Users, Upload, Image as ImageIcon, FileSpreadsheet
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
import PreviewModal from '../_components/PreviewModal';

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

export default function PackingListEntryPage() {
  const params = useParams();
  const router = useRouter();
  const containerId = params.containerId;

  const [container, setContainer] = useState(null);
  const [packingList, setPackingList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Templates
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Direct paste on hover state
  const [hoveredId, setHoveredId] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, itemId: null });

  // Form State
  const [formData, setFormData] = useState({
    invNo: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    headerCompanyName: '',
    headerCompanyAddress: '',
    headerPhone: '',
    sellerCompanyName: '',
    sellerAddress: '',
    sellerIecNo: '',
    sellerGst: '',
    sellerEmail: '',
    bankName: '',
    beneficiaryName: '',
    swiftBic: '',
    bankAddress: '',
    accountNumber: '',
    stampImage: '',
    stampPosition: 'BOTTOM_RIGHT',
    stampSize: 'M',
    stampText: 'Authorized Signatory',
    showMixColumn: true,
    showHsnColumn: true,
    from: '',
    to: 'NHAVA SHEVA'
  });

  const [openSections, setOpenSections] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('packing_accordion_state');
      return saved ? JSON.parse(saved) : ["exporter", "consignee", "bank", "stamp"];
    }
    return ["exporter", "consignee", "bank", "stamp"];
  });

  useEffect(() => {
    localStorage.setItem('packing_accordion_state', JSON.stringify(openSections));
  }, [openSections]);

  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchData();
    fetchTemplates();
  }, [containerId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S: Save
      if (e.ctrlKey && e.code === 'KeyS') {
        e.preventDefault();
        handleSave();
      }
      // Alt+Space: Add Item
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
            uploadFile(file, (url) => updateItem(hoveredId, 'photo', url));
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
            uploadFile(file, (url) => updateItem(itemId, 'photo', url));
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
      const response = await API.get(`/packing-list/container/${containerId}`);
      if (response.data.success) {
        setContainer(response.data.data.container);
        const pl = response.data.data.packingList;

        if (pl) {
          setPackingList(pl);
          setFormData({
            invNo: pl.invNo || '',
            invoiceDate: pl.invoiceDate ? pl.invoiceDate.split('T')[0] : new Date().toISOString().split('T')[0],
            headerCompanyName: pl.headerCompanyName || '',
            headerCompanyAddress: pl.headerCompanyAddress || '',
            headerPhone: pl.headerPhone || '',
            sellerCompanyName: pl.sellerCompanyName || '',
            sellerAddress: pl.sellerAddress || '',
            sellerIecNo: pl.sellerIecNo || '',
            sellerGst: pl.sellerGst || '',
            sellerEmail: pl.sellerEmail || '',
            bankName: pl.bankName || '',
            beneficiaryName: pl.beneficiaryName || '',
            swiftBic: pl.swiftBic || '',
            bankAddress: pl.bankAddress || '',
            accountNumber: pl.accountNumber || '',
            stampImage: pl.stampImage || '',
            stampPosition: pl.stampPosition || 'BOTTOM_RIGHT',
            stampSize: pl.stampSize || 'M',
            stampText: pl.stampText || 'Authorized Signatory',
            showMixColumn: pl.showMixColumn ?? true,
            showHsnColumn: pl.showHsnColumn ?? true,
            from: pl.from || response.data.data.container.origin || '',
            to: pl.to || response.data.data.container.destination || 'NHAVA SHEVA'
          });
          if (pl.items?.length > 0) {
            setItems(pl.items.map(i => ({ ...i, id: i.id || `item_${Math.random()}` })));
          } else {
            handleAutoImport();
          }
          if (pl.companyMasterId) {
            setSelectedTemplateId(pl.companyMasterId);
          }
        } else {
          setFormData(prev => ({
            ...prev,
            invNo: `IGP-${response.data.data.container.containerCode}`,
            from: response.data.data.container.origin || '',
            to: response.data.data.container.destination || 'NHAVA SHEVA'
          }));
          handleAutoImport();
        }
      }
    } catch (error) {
      toast.error('Failed to load packing list data');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoImport = async () => {
    try {
      setImporting(true);
      const response = await API.get(`/packing-list/container/${containerId}/import`);
      if (response.data.success && response.data.data.length > 0) {
        setItems(response.data.data.map(i => ({ ...i, id: `import_${Math.random()}` })));
        toast.info(`Auto-imported ${response.data.data.length} items from loading sheets`);
      } else if (items.length === 0) {
        addItem();
      }
    } catch (error) {
      console.error('Auto-import failed:', error);
      if (items.length === 0) addItem();
    } finally {
      setImporting(false);
    }
  };

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
        companyEmail: formData.sellerEmail,
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

  const addItem = () => {
    setItems(prev => [...prev, {
      id: `temp_${Date.now()}_${Math.random()}`,
      itemNumber: '',
      particular: '',
      ctn: 0,
      qtyPerCtn: 0,
      unit: 'PCS',
      tQty: 0,
      kg: 0,
      tKg: 0,
      mix: '',
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
        if (field === 'ctn' || field === 'qtyPerCtn') {
          updated.tQty = (parseInt(updated.ctn) || 0) * (parseInt(updated.qtyPerCtn) || 0);
        }
        if (field === 'ctn' || field === 'kg') {
          updated.tKg = (parseInt(updated.ctn) || 0) * (parseFloat(updated.kg) || 0);
        }
        return updated;
      }
      return item;
    }));
  };

  const uploadFile = async (file, setter, type = 'photo') => {
    if (!file) return;

    const toastId = toast.loading(`Uploading ${type}...`);
    try {
      const uploadData = new FormData();
      const prefix = type === 'stamp' ? 'stamp_' : 'packing_list_';
      const newFile = new File([file], `${prefix}${file.name}`, { type: file.type });
      uploadData.append('file', newFile);

      const response = await API.post('/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setter(response.data.url);
        toast.success(`${type} uploaded`, { id: toastId });
      }
    } catch (error) {
      toast.error('Upload failed', { id: toastId });
    }
  };

  const handleFileUpload = async (setter, type = 'photo') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => uploadFile(e.target.files[0], setter, type);
    input.click();
  };

  const handleSave = async () => {
    if (!formData.invNo) {
      toast.error("Internal Invoice Number is required");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...formData,
        items: items.filter(i => i.particular || i.itemNumber),
        companyMasterId: selectedTemplateId || null
      };
      const response = await API.post(`/packing-list/container/${containerId}`, payload);
      if (response.data.success) {
        toast.success('Packing list saved successfully');
        setPackingList(response.data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleExportExcel = async () => {
    if (!packingList?.id) {
      toast.error("Please save the packing list first");
      return;
    }
    try {
      toast.info("Generating Excel...");
      const response = await API.get(`/packing-list/${packingList.id}/export/excel`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `packing_list_${formData.invNo || 'draft'}_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
    totalQty: items.reduce((s, i) => s + (parseInt(i.tQty) || 0), 0)
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
              onClick={() => router.push('/dashboard/packing')}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 uppercase">
                  {container?.containerCode}
                </h1>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors ${packingList ? 'bg-green-100 text-green-800 border-green-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                  }`}>
                  {packingList ? 'CONFIRMED' : 'DRAFT'}
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
            {packingList && (
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-widest">Total Items</div>
              <div className="text-2xl font-bold text-slate-800">{stats.totalItems}</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-widest">Total QTY</div>
              <div className="text-2xl font-bold text-slate-800">{stats.totalQty}</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
              <Box className="w-7 h-7" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-widest">Total CTN</div>
              <div className="text-2xl font-bold text-slate-800">{stats.totalCtn}</div>
            </div>
          </div>
        </div>

        {/* Form Main Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden mb-8">
          {/* Status Bar */}
          <div className={`px-6 py-3 flex justify-between items-center border-b ${packingList ? 'bg-green-50 text-green-800 border-green-100' : 'bg-slate-50 text-slate-600 border-slate-100'
            }`}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest opacity-75">Status:</span>
              <span className="font-bold uppercase tracking-wide text-xs">{packingList ? 'CONFIRMED' : 'DRAFT'}</span>
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
            {/* 1. Quick Info & Shipping (Visible) */}
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

            {/* 2. Configuration Accordion (Collapsible) */}
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
                        placeholder="Add.: Room 801, Building 1..."
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Header Phone / Tel</label>
                      <input
                        type="text" value={formData.headerPhone}
                        onChange={(e) => setFormData({ ...formData, headerPhone: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                        placeholder="Tel.:13735751445"
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
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{formData.sellerCompanyName || 'Not set'}</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6">
                  <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Consignee Name</label>
                        <input
                          type="text" value={formData.sellerCompanyName}
                          onChange={(e) => setFormData({ ...formData, sellerCompanyName: e.target.value.toUpperCase() })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                          placeholder="e.g. IMPEXINA GLOBAL PVT LTD"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">IEC Number</label>
                          <input
                            type="text" value={formData.sellerIecNo}
                            onChange={(e) => setFormData({ ...formData, sellerIecNo: e.target.value.toUpperCase() })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">GST Number</label>
                          <input
                            type="text" value={formData.sellerGst}
                            onChange={(e) => setFormData({ ...formData, sellerGst: e.target.value.toUpperCase() })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all font-mono"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Consignee Address</label>
                        <textarea
                          value={formData.sellerAddress}
                          onChange={(e) => setFormData({ ...formData, sellerAddress: e.target.value.toUpperCase() })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all h-[90px] resize-none"
                        ></textarea>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                        <input
                          type="email" value={formData.sellerEmail}
                          onChange={(e) => setFormData({ ...formData, sellerEmail: e.target.value.toLowerCase() })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
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
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Beneficiary Name</label>
                          <input
                            type="text" value={formData.beneficiaryName}
                            onChange={(e) => setFormData({ ...formData, beneficiaryName: e.target.value.toUpperCase() })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all font-bold"
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
                      onClick={() => handleFileUpload((url) => setFormData({ ...formData, stampImage: url }), 'stamp')}
                      className="w-28 h-28 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all overflow-hidden relative group shrink-0"
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

            {/* Items Table Section */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                    <th className="px-4 py-5 w-12 text-center border-r border-slate-200">S.N.</th>
                    <th className="px-2 py-5 w-16 text-center border-r border-slate-200">Photo</th>
                    <th className="px-4 py-5 min-w-[200px] border-r border-slate-200 text-left">Descriptions</th>
                    <th className="px-2 py-5 w-24 text-center border-r border-slate-200">MARK</th>
                    <th className="px-2 py-5 w-16 text-center border-r border-slate-200">Ctn.</th>
                    <th className="px-2 py-5 w-20 text-center border-r border-slate-200">Qty/Ctn</th>
                    <th className="px-2 py-5 w-16 text-center border-r border-slate-200">Unit</th>
                    <th className="px-2 py-5 w-24 text-center border-r border-slate-200 bg-blue-50/50 text-blue-700">T-Qty</th>
                    <th className="px-2 py-5 w-16 text-center border-r border-slate-200 text-orange-600/80">KG</th>
                    <th className="px-2 py-5 w-24 text-center border-r border-slate-200 bg-orange-50/50 text-orange-700">T.KG</th>
                    <th className="px-2 py-5 w-20 text-center border-r border-slate-200">MIX</th>
                    <th className="px-2 py-5 w-20 text-center">HSN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-2 text-center text-xs font-medium text-slate-400 border-r border-slate-100">{idx + 1}</td>
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
                              uploadFile(file, (url) => updateItem(item.id, 'photo', url));
                            }
                          }}
                          onPaste={(e) => {
                            const items = e.clipboardData.items;
                            for (let i = 0; i < items.length; i++) {
                              if (items[i].type.indexOf("image") !== -1) {
                                const file = items[i].getAsFile();
                                uploadFile(file, (url) => updateItem(item.id, 'photo', url));
                                break;
                              }
                            }
                          }}
                        >
                          {item.photo ? (
                            <img src={getImageUrl(item.photo)} alt="Item" className="w-full h-full object-cover" />
                          ) : (
                            <Upload className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                          )}
                          <input
                            type="file" accept="image/*" className="hidden"
                            onChange={e => handleFileUpload((url) => updateItem(item.id, 'photo', url))}
                          />
                        </label>
                      </td>
                      <td className="px-1 py-1 border-r border-slate-100">
                        <textarea
                          value={item.particular}
                          onChange={e => updateItem(item.id, 'particular', e.target.value.toUpperCase())}
                          className="w-full bg-transparent border-none px-3 py-1 text-sm font-semibold text-slate-700 outline-none resize-none h-10 flex items-center"
                          placeholder="Description"
                          onMouseEnter={() => setHoveredId(item.id)}
                          onMouseLeave={() => setHoveredId(null)}
                          onContextMenu={(e) => onCellContextMenu(e, item.id)}
                          onPaste={(e) => {
                            const clipboardItems = e.clipboardData.items;
                            for (let i = 0; i < clipboardItems.length; i++) {
                              if (clipboardItems[i].type.indexOf("image") !== -1) {
                                const file = clipboardItems[i].getAsFile();
                                uploadFile(file, (url) => updateItem(item.id, 'photo', url));
                                break;
                              }
                            }
                          }}
                        />
                      </td>
                      <td className="px-1 py-1 border-r border-slate-100">
                        <input
                          value={item.itemNumber}
                          onChange={e => updateItem(item.id, 'itemNumber', e.target.value.toUpperCase())}
                          className="w-full bg-transparent border-none px-1 py-1 text-sm font-bold text-slate-700 text-center outline-none uppercase"
                          placeholder="-"
                        />
                      </td>
                      <td className="px-1 py-1 border-r border-slate-100">
                        <input
                          type="number" value={item.ctn || ''}
                          onChange={e => updateItem(item.id, 'ctn', e.target.value)}
                          className="w-full bg-transparent border-none px-1 py-1 text-sm font-bold text-slate-900 text-center outline-none"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-1 py-1 border-r border-slate-100">
                        <input
                          type="number" value={item.qtyPerCtn || ''}
                          onChange={e => updateItem(item.id, 'qtyPerCtn', e.target.value)}
                          className="w-full bg-transparent border-none px-1 py-1 text-sm font-semibold text-slate-700 text-center outline-none"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-1 py-1 border-r border-slate-100">
                        <input
                          value={item.unit || 'PCS'}
                          onChange={e => updateItem(item.id, 'unit', e.target.value.toUpperCase())}
                          className="w-full bg-transparent border-none px-1 py-1 text-sm font-semibold text-slate-700 text-center outline-none"
                        />
                      </td>
                      <td className="px-1 py-1 border-r border-slate-100 text-center font-bold text-blue-600 bg-blue-50/20">{item.tQty}</td>
                      <td className="px-1 py-1 border-r border-slate-100">
                        <input
                          type="number" value={item.kg || ''}
                          onChange={e => updateItem(item.id, 'kg', e.target.value)}
                          className="w-full bg-transparent border-none px-1 py-1 text-sm font-semibold text-slate-700 text-center outline-none"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-1 py-1 border-r border-slate-100 text-center font-bold text-orange-600 bg-orange-50/20">{(parseFloat(item.tKg) || 0).toFixed(2)}</td>
                      <td className="px-1 py-1 border-r border-slate-100">
                        <input
                          value={item.mix || ''}
                          onChange={e => updateItem(item.id, 'mix', e.target.value.toUpperCase())}
                          className="w-full bg-transparent border-none px-1 py-1 text-xs font-semibold text-slate-700 text-center outline-none"
                          placeholder="-"
                        />
                      </td>
                      <td className="px-1 py-1 border-r border-slate-100">
                        <input
                          value={item.hsn || ''}
                          onChange={e => updateItem(item.id, 'hsn', e.target.value.toUpperCase())}
                          className="w-full bg-transparent border-none px-1 py-1 text-xs font-semibold text-slate-700 text-center outline-none"
                          placeholder="-"
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button onClick={() => removeItem(item.id)} className="p-2 text-slate-300 hover:text-red-500 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="p-4 bg-slate-50/50 flex justify-between items-center border-t border-slate-200">
                <button
                  onClick={addItem}
                  className="flex items-center gap-2 px-6 py-2 bg-white text-slate-700 rounded-xl hover:bg-slate-800 hover:text-white transition-all border border-slate-200 font-bold text-xs uppercase tracking-widest shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  New Row
                </button>

                <div className="flex gap-10">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total QTY</span>
                    <div className="text-xl font-bold text-slate-800">{stats.totalQty}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Weight</span>
                    <div className="text-xl font-bold text-slate-800">{(items.reduce((s, i) => s + (parseFloat(i.tKg) || 0), 0)).toFixed(2)} KG</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <PreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          data={formData}
          items={items}
          container={container}
        />

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
                    handleAutoImport();
                  }}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-200 transition-all uppercase tracking-widest"
                >
                  Proceed & Import
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
