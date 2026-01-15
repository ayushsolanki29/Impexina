"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Plus, Save, Trash2, X, Loader2, ArrowLeft, 
  Image as ImageIcon, Copy, RefreshCw, Eye,
  Package,
  Users,
  Box,
  Check,
  ChevronDown,
  Upload
} from 'lucide-react';
import API from '@/lib/api';
import { toast } from 'sonner';

import PreviewModal from '../_components/PreviewModal';

export default function LoadingSheetPage() {
  const params = useParams();
  const router = useRouter();
  const containerId = params.containerId;

  const [container, setContainer] = useState(null);
  const [loadingSheets, setLoadingSheets] = useState([]);
  const [activeSheet, setActiveSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [shippingMark, setShippingMark] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientId, setClientId] = useState('');
  const [items, setItems] = useState(() => [{
    id: `temp_${Date.now()}_${Math.random()}`,
    photo: null,
    particular: '',
    itemNo: '',
    ctn: 0,
    pcs: 0,
    unit: 'PCS',
    cbm: 0,
    wt: 0,
  }]);
  const [markSuggestions, setMarkSuggestions] = useState([]);
  const [clientSuggestions, setClientSuggestions] = useState([]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S: Save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Esc: Back
      if (e.key === 'Escape') {
        if (showPreview) setShowPreview(false);
        else router.push('/dashboard/loading');
      }
      // Ctrl+Enter: Add Item
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        addItem();
      }
      // Alt+N: New Mark
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        handleNewSheet();
        toast.info("New mark created");
      }
      // Alt+D: Duplicate Mark
      if (e.altKey && e.key === 'd') {
        e.preventDefault();
        duplicateSheet();
      }
      // Ctrl+Backspace: Delete Last Item
      if (e.ctrlKey && e.key === 'Backspace') {
        e.preventDefault();
        if (items.length > 1) {
          removeItem(items.length - 1);
          toast.info("Last item removed");
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shippingMark, clientName, items, showPreview]);

  useEffect(() => {
    fetchContainerData();
  }, [containerId]);

  const fetchContainerData = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/loading-sheets/container/${containerId}`);
      
      if (response.data.success) {
        setContainer(response.data.data.container);
        setLoadingSheets(response.data.data.loadingSheets || []);
        
        // Only load first sheet if we're not currently editing a specific one 
        if (!activeSheet && response.data.data.loadingSheets?.length > 0) {
          loadSheet(response.data.data.loadingSheets[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching container:', error);
      toast.error('Failed to load container data');
    } finally {
      setLoading(false);
    }
  };

  const loadSheet = (sheet) => {
    setActiveSheet(sheet);
    setShippingMark(sheet.shippingMark || '');
    setClientName(sheet.clientName || '');
    setClientId(sheet.clientId || '');
    setItems(sheet.items.length > 0 ? sheet.items : [createEmptyItem()]);
  };

  const duplicateSheet = () => {
    if (!activeSheet) return;
    setActiveSheet(null); // Detach ID so it creates new
    setShippingMark(`${shippingMark} (COPY)`);
    // Keep items and clientName
    toast.success("Sheet duplicated. Review and Save.");
  };

  const createEmptyItem = () => ({
    id: `temp_${Date.now()}_${Math.random()}`,
    photo: null,
    particular: '',
    mark: shippingMark || '',
    itemNo: '',
    ctn: 0,
    pcs: 0,
    unit: 'PCS',
    cbm: 0,
    wt: 0,
  });

  const addItem = () => {
    setItems([...items, createEmptyItem()]);
  };

  const duplicateLastItem = () => {
    if (items.length === 0) return;
    const lastItem = items[items.length - 1];
    const newItem = {
      ...lastItem,
      id: `temp_${Date.now()}_${Math.random()}`,
      particular: '',
      itemNo: '',
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index) => {
    if (items.length === 1) {
      toast.error('At least one item is required');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-sync PARTICULAR and ITEM NO.
    if (field === 'particular') {
      newItems[index].itemNo = value;
    }
    
    setItems(newItems);
  };

  const handlePhotoUpload = async (index, event) => {
    const file = event?.target?.files?.[0];
    
    if (!file) {
      toast.error('No file selected', {
        description: 'Please select an image file to upload.',
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file type', {
        description: 'Please select an image file (JPG, PNG, etc.).',
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File too large', {
        description: 'Please select an image smaller than 5MB.',
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('photo', file);

      // Check if container exists before accessing properties
      const cCode = container?.containerCode || 'UNKNOWN';

      const response = await API.post(
        `/loading-sheets/upload-photo?containerCode=${cCode}&shippingMark=${shippingMark || 'general'}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      if (response.data.success) {
        updateItem(index, 'photo', response.data.data.photo);
        toast.success('Photo uploaded successfully');
      } else {
        toast.error('Upload failed', {
          description: response.data.message || 'Could not upload the photo.',
        });
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      toast.error('Failed to upload photo', {
        description: errorMessage,
      });
    }
  };

  const calculateRowTotal = (ctn, pcs) => {
    const c = parseFloat(ctn) || 0;
    const p = parseFloat(pcs) || 0;
    return c * p;
  };

  const calculateTotals = () => {
    return items.reduce(
      (acc, item) => {
        const ctn = parseInt(item.ctn) || 0;
        const pcs = parseInt(item.pcs) || 0;
        const cbm = parseFloat(item.cbm) || 0;
        const wt = parseFloat(item.wt) || 0;

        acc.ctn += ctn;
        acc.tPcs += ctn * pcs;
        acc.tCbm += ctn * cbm;
        acc.tWt += ctn * wt;
        return acc;
      },
      { ctn: 0, tPcs: 0, tCbm: 0, tWt: 0 }
    );
  };

  const handleSave = async () => {
    if (!shippingMark?.trim()) {
      toast.error('Shipping mark is required');
      return;
    }

    // Remove empty items (where particular is empty)
    const validItems = items.filter(item => item.particular?.trim());

    if (validItems.length === 0) {
      toast.error('At least one item with description is required');
      return;
    }

    try {
      setSaving(true);

      const response = await API.post(`/loading-sheets/container/${containerId}`, {
        id: activeSheet?.id, // Send ID to allow renaming/updating
        shippingMark,
        clientName,
        clientId,
        items: validItems.map(({ id, ...item }) => item),
        status: activeSheet?.status || 'DRAFT', // Preserve status on save
      });

      if (response.data.success) {
        toast.success('Loading sheet saved successfully');
        fetchContainerData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleNewSheet = () => {
    setActiveSheet(null);
    setShippingMark('');
    setClientName('');
    setClientId('');
    setItems([createEmptyItem()]);
  };

  const fetchMarkSuggestions = async (search) => {
    if (!search) {
      setMarkSuggestions([]);
      return;
    }

    try {
      const response = await API.get('/loading-sheets/suggestions/shipping-marks', {
        params: { search },
      });
      if (response.data.success) {
        setMarkSuggestions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };
  
  const fetchClientSuggestions = async (search) => {
    if (!search) {
      setClientSuggestions([]);
      return;
    }

    try {
      const response = await API.get('/clients/search/suggestions', {
        params: { search },
      });
      if (response.data.success) {
        setClientSuggestions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching client suggestions:', error);
    }
  };

  const handleContainerStatusChange = async (newStatus) => {
    try {
      const response = await API.patch(`/containers/${containerId}`, { status: newStatus });
      if (response.data.success) {
        setContainer(prev => ({ ...prev, status: newStatus }));
        toast.success(`Container marked as ${newStatus}`);
      }
    } catch (error) {
      toast.error('Failed to update container status');
    }
  };

  const handleSheetStatusChange = async (newStatus) => {
    if (!activeSheet) {
      toast.error("Save the sheet first to change status");
      return;
    }
    try {
      const response = await API.patch(`/loading-sheets/${activeSheet.id}/status`, { status: newStatus });
      if (response.data.success) {
        // Update both the active sheet logic and the list (via fetch)
        setActiveSheet(prev => ({ ...prev, status: newStatus }));
        fetchContainerData(); 
        toast.success(`Mark status: ${newStatus}`);
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Derived stats for summary cards
  const stats = loadingSheets.reduce((acc, sheet) => {
    sheet.items.forEach(item => {
      acc.totalItems += 1;
      acc.totalCtn += (item.ctn || 0);
    });
    if (sheet.clientName && !acc.clients.includes(sheet.clientName)) {
      acc.clients.push(sheet.clientName);
    }
    return acc;
  }, { totalItems: 0, clients: [], totalCtn: 0 });

  const totals = calculateTotals();

  // Color logic for Sheet Status
  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800 border-green-200';
      case 'SENT': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-amber-100 text-amber-800 border-amber-200'; // DRAFT
    }
  };

  // --- SKELETONS ---
  if (loading && !container) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-8 animate-pulse">
            <div>
              <div className="h-8 bg-slate-200 rounded w-64 mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-48"></div>
            </div>
            <div className="flex gap-3">
              <div className="h-10 bg-slate-200 rounded w-32"></div>
              <div className="h-10 bg-slate-200 rounded w-32"></div>
            </div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-24 animate-pulse">
                <div className="flex items-center gap-4 h-full">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-slate-100 rounded w-20 mb-2"></div>
                    <div className="h-6 bg-slate-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Button Strip Skeleton */}
          <div className="mb-6 flex gap-2 overflow-hidden animate-pulse">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="w-36 h-16 bg-slate-200 rounded-lg flex-shrink-0"></div>
            ))}
          </div>

          {/* Form Skeleton */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 h-[500px] animate-pulse">
             <div className="h-8 bg-slate-100 rounded w-full mb-6"></div>
             <div className="grid grid-cols-2 gap-6 mb-6">
               <div className="h-12 bg-slate-100 rounded"></div>
               <div className="h-12 bg-slate-100 rounded"></div>
             </div>
             <div className="h-64 bg-slate-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {showPreview && activeSheet && container && (
        <PreviewModal 
          sheet={{...activeSheet, items}} 
          container={container}
          onClose={() => setShowPreview(false)}
          onUpdate={(newStatus) => {
            setActiveSheet(prev => ({ ...prev, status: newStatus }));
            fetchContainerData();
          }}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Container Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/loading')}
              className="p-2 hover:bg-white rounded-lg transition-colors"
              title="Back (Esc)"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">
                  {container?.containerCode}
                </h1>
                {/* Container Status Dropdown */}
                <div className="relative group z-10">
                  <button className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border transition-colors ${
                    container?.status === 'CONFIRMED' 
                      ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' 
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}>
                    {container?.status || 'OPEN'} <ChevronDown className="w-3 h-3" />
                  </button>
                  <div className="absolute top-full left-0 mt-1 w-32 bg-white rounded-lg shadow-xl border border-slate-100 hidden group-hover:block overflow-hidden z-20">
                    {['DRAFT', 'CONFIRMED'].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleContainerStatusChange(s)}
                        className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-slate-50 ${
                          container?.status === s ? 'text-blue-600 bg-blue-50' : 'text-slate-700'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-600">
                {container?.origin} • {new Date(container?.loadingDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
             {activeSheet && (
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 border border-slate-300 shadow-sm"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
            )}
            <button
              onClick={handleNewSheet}
              className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 border border-slate-300 shadow-sm"
              title="New Mark (Alt+N)"
            >
              <RefreshCw className="w-4 h-4" />
              New Mark
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 shadow-lg transition-all active:scale-95"
              title="Save (Ctrl+S)"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 transition-all hover:shadow-md hover:border-blue-100 group">
            <div className="p-4 bg-blue-50/50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">Total Items</div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{stats.totalItems}</div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 transition-all hover:shadow-md hover:border-purple-100 group">
            <div className="p-4 bg-purple-50/50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-all">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">Total Clients</div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{stats.clients.length}</div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 transition-all hover:shadow-md hover:border-orange-100 group">
             <div className="p-4 bg-orange-50/50 text-orange-600 rounded-2xl group-hover:bg-orange-600 group-hover:text-white transition-all">
              <Box className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">Total CTN</div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{stats.totalCtn}</div>
            </div>
          </div>
        </div>

        {/* Main Content Info */}
        {loadingSheets.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-slate-500 uppercase mb-3 px-1">Recent Loading Sheets</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
              {loadingSheets.map((sheet) => (
                <button
                  key={sheet.id}
                  onClick={() => loadSheet(sheet)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all shadow-sm flex flex-col items-start min-w-[140px] ${
                    activeSheet?.id === sheet.id
                      ? 'bg-slate-800 text-white shadow-md ring-2 ring-slate-800 ring-offset-2'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <div className="font-bold text-sm truncate w-full text-left">{sheet.shippingMark || 'Unnamed'}</div>
                  <div className="flex justify-between items-center w-full mt-1">
                    <span className="text-xs opacity-75">{sheet.items.length} items</span>
                    <span className={`text-[10px] font-bold px-1.5 rounded ${
                       sheet.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-700' :
                       sheet.status === 'SENT' ? 'bg-blue-500/20 text-blue-700' :
                       'bg-slate-200 text-slate-600'
                    }`}>
                      {sheet.status || 'Draft'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
          {/* Status Header Bar */}
          <div className={`px-6 py-4 flex justify-between items-center border-b ${
             getStatusColor(activeSheet?.status || 'DRAFT')
          }`}>
             <div className="flex items-center gap-3">
               <span className="text-[10px] font-medium uppercase tracking-widest opacity-60">Mark Status</span>
               <span className="text-sm font-bold uppercase tracking-widest hover:scale-105 transition-transform cursor-default">{activeSheet?.status || 'DRAFT'}</span>
             </div>
             <div className="flex gap-1.5">
               {['DRAFT', 'CONFIRMED', 'SENT'].map(status => (
                 <button 
                  key={status}
                  onClick={() => handleSheetStatusChange(status)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-medium uppercase transition-all ${
                    (activeSheet?.status || 'DRAFT') === status 
                      ? 'bg-white text-slate-900 shadow-md scale-105' 
                      : 'hover:bg-white/40 text-slate-600'
                  }`}
                 >
                   {status}
                 </button>
               ))}
             </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Shipping Mark / MARK *
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={shippingMark}
                    onChange={(e) => {
                      setShippingMark(e.target.value.toUpperCase());
                      fetchMarkSuggestions(e.target.value);
                    }}
                    placeholder="e.g., BB-AMD, SMW-INK"
                    className="flex-1 px-4 py-3 text-lg bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 focus:bg-white outline-none transition-all font-bold tracking-widest uppercase placeholder:text-slate-300"
                  />
                  {activeSheet && (
                     <button 
                      onClick={duplicateSheet}
                      className="px-3 bg-slate-100 border border-slate-300 rounded-lg text-slate-500 hover:bg-slate-200"
                      title="Duplicate Mark (Alt+D)"
                     >
                       <Copy className="w-5 h-5" />
                     </button>
                  )}
                </div>
                {markSuggestions.length > 0 && (
                  <div className="mt-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50 relative">
                    {markSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setShippingMark(suggestion.mark);
                          setClientName(suggestion.client || '');
                          setClientId(suggestion.clientId || '');
                          setMarkSuggestions([]);
                          
                          // If we have a name but no ID (from history), trigger client search
                          // to show suggestions for linking.
                          if (suggestion.client && !suggestion.clientId) {
                            fetchClientSuggestions(suggestion.client);
                          }
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg"
                      >
                        <div className="font-medium">{suggestion.mark}</div>
                        {suggestion.client && (
                          <div className="text-sm text-slate-600">{suggestion.client}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Client Name (Optional)
                </label>
                <div className="relative">
                  <div className="relative">
                    <Users className={`absolute left-3 top-3.5 w-5 h-5 z-10 ${clientId ? 'text-green-500' : 'text-slate-400'}`} />
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => {
                        setClientName(e.target.value);
                        setClientId(''); // Clear ID if user types manually
                        fetchClientSuggestions(e.target.value);
                      }}
                      placeholder="Search or enter client name"
                      className={`w-full pl-10 pr-12 py-3 text-lg bg-slate-50/50 border rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 focus:bg-white outline-none transition-all font-bold ${
                        clientId ? 'border-green-500 bg-green-50/30' : 'border-slate-200'
                      }`}
                    />
                    {clientId && (
                      <div className="absolute right-3 top-3.5 flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded uppercase tracking-wider">Linked</span>
                        <button 
                          onClick={() => {
                            setClientId('');
                            setClientName('');
                          }}
                          className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {(clientSuggestions.length > 0 || (clientName && !clientId)) && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-[60]">
                      {clientSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setClientName(suggestion.name);
                            setClientId(suggestion.id);
                            setClientSuggestions([]);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0 flex items-center justify-between group"
                        >
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {suggestion.name}
                            </div>
                            {suggestion.companyName && (
                              <div className="text-xs text-slate-500">{suggestion.companyName}</div>
                            )}
                          </div>
                          <div className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">
                            {suggestion.type}
                          </div>
                        </button>
                      ))}
                      
                      {/* Quick Add Option */}
                      {clientName && !clientId && !clientSuggestions.some(s => s.name.toLowerCase() === clientName.toLowerCase()) && (
                        <button
                          onClick={async () => {
                            try {
                              const response = await API.post('/clients', { name: clientName });
                              if (response.data.success) {
                                // Set the ID first to trigger the "Linked" UI
                                setClientId(response.data.data.id);
                                // Clear suggestions to close the dropdown
                                setClientSuggestions([]);
                                toast.success("Client added and linked");
                              }
                            } catch (error) {
                              const errorMsg = error.response?.data?.message || "Failed to add client";
                              toast.error(errorMsg);
                            }
                          }}
                          className="w-full px-4 py-3 text-left bg-blue-50 hover:bg-blue-100 flex items-center gap-2 text-blue-700 font-bold"
                        >
                          <Plus className="w-5 h-5" />
                          Add "{clientName}" as New Client
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase tracking-widest font-medium text-[10px]">
                    <th className="px-3 py-4 text-center min-w-[100px] border-b border-slate-100">No.</th>
                    <th className="px-3 py-4 text-center min-w-[100px] border-b border-slate-100">Photo</th>
                    <th className="px-3 py-4 text-left min-w-[150px] border-b border-slate-100">Particular</th>
                    <th className="px-3 py-4 text-center min-w-[120px] border-b border-slate-100">Mark</th>
                    <th className="px-3 py-4 text-center min-w-[120px] border-b border-slate-100">Item No</th>
                    <th className="px-3 py-4 text-center min-w-[100px] border-b border-slate-100">CTN</th>
                    <th className="px-3 py-4 text-center min-w-[100px] border-b border-slate-100">PCS</th>
                    <th className="px-3 py-4 text-center min-w-[120px] border-b border-slate-100">Total PCS</th>
                    <th className="px-3 py-4 text-center min-w-[100px] border-b border-slate-100">Unit</th>
                    <th className="px-3 py-4 text-center min-w-[100px] border-b border-slate-100">CBM</th>
                    <th className="px-3 py-4 text-center min-w-[120px] border-b border-slate-100">Total CBM</th>
                    <th className="px-3 py-4 text-center min-w-[100px] border-b border-slate-100">WT</th>
                    <th className="px-3 py-4 text-center min-w-[120px] border-b border-slate-100">Total WT</th>
                    <th className="min-w-[100px] border-b border-slate-100"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-2 py-1 border-r border-slate-200 text-center font-medium text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="px-1 py-1 border-r border-slate-200 text-center">
                         <div className="flex justify-center">
                          {item.photo ? (
                            <div className="relative group w-9 h-9">
                              <img
                                src={`${process.env.NEXT_PUBLIC_SERVER_URL}${item.photo}`}
                                alt="Item"
                                className="w-full h-full object-cover rounded border border-slate-300"
                              />
                               <button
                                onClick={() => updateItem(idx, 'photo', null)}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                              >
                                <X className="w-2 h-2" />
                              </button>
                            </div>
                          ) : (
                             <label className="w-9 h-9 flex items-center justify-center border border-dashed border-slate-300 rounded cursor-pointer hover:border-blue-500 text-slate-400 hover:text-blue-500 transition-colors">
                              <Upload className="w-4 h-4" />
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                  handlePhotoUpload(idx, e);
                                  e.target.value = ''; // Reset to allow re-selecting same file
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-1.5 border-b border-slate-50">
                        <textarea
                          value={item.particular}
                          onChange={(e) => updateItem(idx, 'particular', e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-100/60 hover:border-slate-300 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 outline-none rounded-lg resize-none h-12 transition-all font-normal text-slate-900 placeholder:text-slate-300"
                          placeholder="Item Description"
                          onKeyDown={(e) => handleKeyDown(e, idx)}
                          rows={1}
                        />
                      </td>
                      <td className="px-2 py-1.5 border-b border-slate-50">
                         <input
                          type="text"
                          value={item.mark || ''}
                          onChange={(e) => updateItem(idx, 'mark', e.target.value)}
                          className="w-full px-2 py-2 text-sm text-center bg-slate-50 border border-slate-100/60 hover:border-slate-300 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 outline-none rounded-lg font-normal tracking-widest uppercase text-slate-500 placeholder:text-slate-200 transition-all"
                          placeholder={activeSheet?.shippingMark || '-'}
                          onKeyDown={(e) => handleKeyDown(e, idx)}
                        />
                      </td>
                      <td className="px-2 py-1.5 border-b border-slate-50">
                         <input
                          type="text"
                          value={item.itemNo || ''}
                          onChange={(e) => updateItem(idx, 'itemNo', e.target.value)}
                          className="w-full px-2 py-2 text-sm text-center bg-slate-50 border border-slate-100/60 hover:border-slate-300 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 outline-none rounded-lg font-normal tracking-widest uppercase text-slate-700 placeholder:text-slate-200 transition-all"
                          placeholder="-"
                          onKeyDown={(e) => handleKeyDown(e, idx)}
                        />
                      </td>
                      <td className="px-2 py-1.5 border-b border-slate-50">
                        <input
                          type="number"
                          value={item.ctn}
                          onChange={(e) => updateItem(idx, 'ctn', e.target.value)}
                          className="w-full px-2 py-2 text-sm text-center bg-slate-50 border border-slate-100/60 hover:border-slate-300 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 outline-none rounded-lg font-normal text-slate-900 transition-all"
                          placeholder="0"
                          onKeyDown={(e) => handleKeyDown(e, idx)}
                        />
                      </td>
                      <td className="px-2 py-1.5 border-b border-slate-50">
                        <input
                          type="number"
                          value={item.pcs}
                          onChange={(e) => updateItem(idx, 'pcs', e.target.value)}
                          className="w-full px-2 py-2 text-sm text-center bg-slate-50 border border-slate-100/60 hover:border-slate-300 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 outline-none rounded-lg font-normal text-slate-700 transition-all"
                          placeholder="0"
                          onKeyDown={(e) => handleKeyDown(e, idx)}
                        />
                      </td>
                      <td className="px-2 py-1.5 border-b border-slate-50 text-center font-normal text-slate-400 bg-slate-50/30">
                        {calculateRowTotal(item.ctn, item.pcs)}
                      </td>
                      <td className="px-2 py-1.5 border-b border-slate-50">
                         <input
                          type="text"
                          value={item.unit || 'PCS'}
                          onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                          className="w-full px-2 py-2 text-[10px] text-center bg-slate-50 border border-slate-100/60 hover:border-slate-300 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 outline-none rounded-lg uppercase font-normal text-slate-400 transition-all"
                          onKeyDown={(e) => handleKeyDown(e, idx)}
                        />
                      </td>
                       <td className="px-2 py-1.5 border-b border-slate-50">
                        <input
                          type="number"
                          value={item.cbm}
                          onChange={(e) => updateItem(idx, 'cbm', e.target.value)}
                          className="w-full px-2 py-2 text-sm text-center bg-slate-50 border border-slate-100/60 hover:border-slate-300 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 outline-none rounded-lg font-normal text-slate-500 transition-all"
                          placeholder="0"
                          step="0.001"
                          onKeyDown={(e) => handleKeyDown(e, idx)}
                        />
                      </td>
                      <td className="px-2 py-1.5 border-b border-slate-50 text-center font-bold text-blue-600 bg-blue-50/30">
                        {(item.ctn * item.cbm || 0).toFixed(3)}
                      </td>
                      <td className="px-2 py-1.5 border-b border-slate-50">
                        <input
                          type="number"
                          value={item.wt}
                          onChange={(e) => updateItem(idx, 'wt', e.target.value)}
                          className="w-full px-2 py-2 text-sm text-center bg-slate-50 border border-slate-100/60 hover:border-slate-300 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 outline-none rounded-lg font-normal text-slate-500 transition-all"
                          placeholder="0"
                          step="0.01"
                          onKeyDown={(e) => handleKeyDown(e, idx)}
                        />
                      </td>
                      <td className="px-2 py-1.5 border-b border-slate-50 text-center font-bold text-orange-600 bg-orange-50/30">
                        {(item.ctn * item.wt || 0).toFixed(2)}
                      </td>
                      <td className="px-2 py-1.5 border-b border-slate-50 text-center">
                        <button
                          onClick={() => removeItem(idx)}
                          className="text-slate-200 hover:text-red-500 transition-all p-2 rounded-xl hover:bg-red-50 active:scale-95"
                          title="Delete Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-300">
                    <td colSpan={5} className="px-4 py-3 text-right font-bold text-slate-600 uppercase tracking-wider text-xs">
                      Totals
                    </td>
                    <td className="px-2 py-2 border-l border-slate-200 text-center font-bold text-slate-900 text-base">{totals.ctn}</td>
                    <td className="px-2 py-2 border-l border-slate-200 bg-slate-100"></td>
                    <td className="px-2 py-2 border-l border-slate-200 text-center font-bold text-blue-700 text-base shadow-sm bg-white">{totals.tPcs}</td>
                    <td className="px-2 py-2 border-l border-slate-200 bg-slate-100"></td>
                    <td className="px-2 py-2 border-l border-slate-200 bg-slate-100"></td>
                    <td className="px-2 py-2 border-l border-slate-200 text-center font-bold text-blue-700 text-base shadow-sm bg-white">{totals.tCbm.toFixed(3)}</td>
                    <td className="px-2 py-2 border-l border-slate-200 bg-slate-100"></td>
                    <td className="px-2 py-2 border-l border-slate-200 text-center font-bold text-orange-700 text-base shadow-sm bg-white">{totals.tWt.toFixed(2)}</td>
                    <td className="border-l border-slate-200 bg-slate-100"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors"
                title="Add Item (Ctrl+Enter)"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
              <button
                onClick={duplicateLastItem}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
              >
                <Copy className="w-4 h-4" /> Duplicate Last Item
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
