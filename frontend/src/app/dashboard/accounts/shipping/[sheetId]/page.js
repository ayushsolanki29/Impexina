"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Ship,
  Container,
  Edit,
  Save,
  X,
  Loader2,
  Download,
  Trash2,
  FileText,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Calculator,
  Package,
  Truck,
  FileDigit,
  Shield,
  Scale,
  Receipt,
  IndianRupee,
  Settings,
  Copy,
  ChevronDown,
  ChevronUp,
  Hash,
  Clock,
  Landmark,
  Grid,
  List,
  BarChart3,
  Import,
  Export,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import API from "@/lib/api";
import ShippingPreviewModal from "./_components/ShippingPreviewModal";

export default function ShippingSheetPage() {
  const router = useRouter();
  const params = useParams();
  const sheetId = params.sheetId;

  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState("");
  const [sheetName, setSheetName] = useState("");
  const [sheetDescription, setSheetDescription] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [sheetDetails, setSheetDetails] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [viewMode, setViewMode] = useState("table");
  const [activeTab, setActiveTab] = useState("overview");
  const [showAllCharges, setShowAllCharges] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [costBreakdownModal, setCostBreakdownModal] = useState(false);

  useEffect(() => {
    if (sheetId === "new") {
      setSheetName("New Shipping Sheet");
      setSheetDescription("");
      setEntries([
        {
          id: 1,
          containerCode: `CONT${Date.now().toString().slice(-6)}`,
          loadingFrom: "YIWU / GUANGZHOU / FULL",
          ctn: 0,
          loadingDate: new Date().toISOString().split("T")[0],
          deliveryDate: "",
          freightUSD: 0,
          freightINR: 0,
          cha: 0,
          fobTerms: 0,
          cfsDoYard: 0,
          scanning: 0,
          simsPims: 0,
          duty: 0,
          penalty: 0,
          trucking: 0,
          loadingUnloading: 0,
          deliveryStatus: "PENDING",
          notes: "",
        },
      ]);
      setIsLoading(false);
    } else {
      loadSheet();
    }
  }, [sheetId]);

  const loadSheet = async () => {
    setIsLoading(true);
    try {
      const response = await API.get(`/accounts/shipping/${sheetId}`);
      if (response.data.success) {
        const sheet = response.data.data;
        setSheetDetails(sheet);
        setSheetName(sheet.name || "");
        setSheetDescription(sheet.description || "");
        setEntries(sheet.entries || []);
        setLastSaved(new Date(sheet.updatedAt));
      }
    } catch (error) {
      console.error("Error loading sheet:", error);
      toast.error("Failed to load shipping sheet");
      router.push("/dashboard/accounts/shipping");
    } finally {
      setIsLoading(false);
    }
  };

  const saveSheet = async () => {
    if (sheetId === "new") {
      await createAndSaveNewSheet();
      return;
    }

    setIsSaving(true);
    try {
      if (sheetName !== sheetDetails?.name || sheetDescription !== sheetDetails?.description) {
        await API.put(`/accounts/shipping/${sheetId}`, {
          name: sheetName,
          description: sheetDescription,
        });
      }

      const response = await API.put(
        `/accounts/shipping/${sheetId}/bulk-entries`,
        entries.map((entry) => ({
          containerCode: entry.containerCode || "",
          loadingFrom: entry.loadingFrom || "YIWU / GUANGZHOU / FULL",
          ctn: parseInt(entry.ctn) || 0,
          loadingDate: entry.loadingDate || new Date().toISOString().split("T")[0],
          deliveryDate: entry.deliveryDate || null,
          freightUSD: parseFloat(entry.freightUSD) || 0,
          freightINR: parseFloat(entry.freightINR) || 0,
          cha: parseFloat(entry.cha) || 0,
          fobTerms: parseFloat(entry.fobTerms) || 0,
          cfsDoYard: parseFloat(entry.cfsDoYard) || 0,
          scanning: parseFloat(entry.scanning) || 0,
          simsPims: parseFloat(entry.simsPims) || 0,
          duty: parseFloat(entry.duty) || 0,
          penalty: parseFloat(entry.penalty) || 0,
          trucking: parseFloat(entry.trucking) || 0,
          loadingUnloading: parseFloat(entry.loadingUnloading) || 0,
          deliveryStatus: entry.deliveryStatus || "PENDING",
          notes: entry.notes || "",
        }))
      );

      if (response.data.success) {
        toast.success("Shipping sheet saved successfully");
        setLastSaved(new Date());
        if (sheetName !== sheetDetails?.name || sheetDescription !== sheetDetails?.description) {
          loadSheet();
        }
      }
    } catch (error) {
      console.error("Error saving sheet:", error);
      toast.error("Failed to save sheet");
    } finally {
      setIsSaving(false);
    }
  };

  const createAndSaveNewSheet = async () => {
    setIsSaving(true);
    try {
      const response = await API.post("/accounts/shipping/", {
        name: sheetName || "New Shipping Sheet",
        description: sheetDescription,
        fiscalYear: "2024-2025",
        tags: ["shipping", "logistics"],
      });

      if (response.data.success) {
        const newSheet = response.data.data;
        await API.put(
          `/accounts/shipping/${newSheet.id}/bulk-entries`,
          entries.filter(entry => entry.containerCode.trim() !== "").map((entry) => ({
            containerCode: entry.containerCode || "",
            loadingFrom: entry.loadingFrom || "YIWU / GUANGZHOU / FULL",
            ctn: parseInt(entry.ctn) || 0,
            loadingDate: entry.loadingDate || new Date().toISOString().split("T")[0],
            deliveryDate: entry.deliveryDate || null,
            freightUSD: parseFloat(entry.freightUSD) || 0,
            freightINR: parseFloat(entry.freightINR) || 0,
            cha: parseFloat(entry.cha) || 0,
            fobTerms: parseFloat(entry.fobTerms) || 0,
            cfsDoYard: parseFloat(entry.cfsDoYard) || 0,
            scanning: parseFloat(entry.scanning) || 0,
            simsPims: parseFloat(entry.simsPims) || 0,
            duty: parseFloat(entry.duty) || 0,
            penalty: parseFloat(entry.penalty) || 0,
            trucking: parseFloat(entry.trucking) || 0,
            loadingUnloading: parseFloat(entry.loadingUnloading) || 0,
            deliveryStatus: entry.deliveryStatus || "PENDING",
            notes: entry.notes || "",
          }))
        );

        toast.success("Shipping sheet created successfully");
        router.push(`/dashboard/accounts/shipping/${newSheet.id}`);
      }
    } catch (error) {
      console.error("Error creating sheet:", error);
      toast.error("Failed to create sheet");
    } finally {
      setIsSaving(false);
    }
  };

  const addRow = () => {
    const newRow = {
      id: Date.now(),
      containerCode: "",
      loadingFrom: "YIWU / GUANGZHOU / FULL",
      ctn: 0,
      loadingDate: new Date().toISOString().split("T")[0],
      deliveryDate: "",
      freightUSD: 0,
      freightINR: 0,
      cha: 0,
      fobTerms: 0,
      cfsDoYard: 0,
      scanning: 0,
      simsPims: 0,
      duty: 0,
      penalty: 0,
      trucking: 0,
      loadingUnloading: 0,
      deliveryStatus: "PENDING",
      notes: "",
    };
    setEntries([...entries, newRow]);
  };

  const updateRow = (id, field, value) => {
    const updated = entries.map((entry) =>
      entry.id === id ? { ...entry, [field]: value } : entry
    );
    setEntries(updated);
  };

  const deleteRow = (id) => {
    if (confirm("Are you sure you want to delete this container entry?")) {
      setEntries(entries.filter((entry) => entry.id !== id));
      toast.success("Entry removed");
    }
  };

  const updateDeliveryStatus = (id, status) => {
    const updated = entries.map((entry) =>
      entry.id === id ? { ...entry, deliveryStatus: status } : entry
    );
    setEntries(updated);
  };

  const filteredEntries = entries.filter((entry) =>
    entry.containerCode?.toLowerCase().includes(search.toLowerCase()) ||
    entry.loadingFrom?.toLowerCase().includes(search.toLowerCase()) ||
    entry.notes?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = useMemo(() => {
    return entries.reduce(
      (acc, curr) => {
        const freightINR = parseFloat(curr.freightINR) || 0;
        const freightUSD = parseFloat(curr.freightUSD) || 0;
        const cha = parseFloat(curr.cha) || 0;
        const fobTerms = parseFloat(curr.fobTerms) || 0;
        const cfsDoYard = parseFloat(curr.cfsDoYard) || 0;
        const scanning = parseFloat(curr.scanning) || 0;
        const simsPims = parseFloat(curr.simsPims) || 0;
        const duty = parseFloat(curr.duty) || 0;
        const penalty = parseFloat(curr.penalty) || 0;
        const trucking = parseFloat(curr.trucking) || 0;
        const loadingUnloading = parseFloat(curr.loadingUnloading) || 0;

        const localCharges = cha + fobTerms + cfsDoYard + scanning + simsPims + duty + penalty + trucking + loadingUnloading;
        const totalAmount = freightINR + localCharges;

        return {
          totalCTN: acc.totalCTN + (parseInt(curr.ctn) || 0),
          totalFreightUSD: acc.totalFreightUSD + freightUSD,
          totalFreightINR: acc.totalFreightINR + freightINR,
          totalCHA: acc.totalCHA + cha,
          totalFOBTerms: acc.totalFOBTerms + fobTerms,
          totalCFSDoYard: acc.totalCFSDoYard + cfsDoYard,
          totalScanning: acc.totalScanning + scanning,
          totalSIMS_PIMS: acc.totalSIMS_PIMS + simsPims,
          totalDuty: acc.totalDuty + duty,
          totalPenalty: acc.totalPenalty + penalty,
          totalTrucking: acc.totalTrucking + trucking,
          totalLoadingUnloading: acc.totalLoadingUnloading + loadingUnloading,
          totalLocalCharges: acc.totalLocalCharges + localCharges,
          grandTotal: acc.grandTotal + totalAmount,
          pendingCount: acc.pendingCount + (curr.deliveryStatus === "PENDING" ? 1 : 0),
          inTransitCount: acc.inTransitCount + (curr.deliveryStatus === "IN_TRANSIT" ? 1 : 0),
          deliveredCount: acc.deliveredCount + (curr.deliveryStatus === "DELIVERED" ? 1 : 0),
        };
      },
      {
        totalCTN: 0,
        totalFreightUSD: 0,
        totalFreightINR: 0,
        totalCHA: 0,
        totalFOBTerms: 0,
        totalCFSDoYard: 0,
        totalScanning: 0,
        totalSIMS_PIMS: 0,
        totalDuty: 0,
        totalPenalty: 0,
        totalTrucking: 0,
        totalLoadingUnloading: 0,
        totalLocalCharges: 0,
        grandTotal: 0,
        pendingCount: 0,
        inTransitCount: 0,
        deliveredCount: 0,
      }
    );
  }, [entries]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatCurrencyUSD = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      IN_TRANSIT: "bg-blue-100 text-blue-800 border-blue-200",
      ARRIVED: "bg-green-100 text-green-800 border-green-200",
      DELIVERED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    };
    return colors[status] || colors.PENDING;
  };

  const calculateEntryTotal = (entry) => {
    const freightINR = parseFloat(entry.freightINR) || 0;
    const cha = parseFloat(entry.cha) || 0;
    const fobTerms = parseFloat(entry.fobTerms) || 0;
    const cfsDoYard = parseFloat(entry.cfsDoYard) || 0;
    const scanning = parseFloat(entry.scanning) || 0;
    const simsPims = parseFloat(entry.simsPims) || 0;
    const duty = parseFloat(entry.duty) || 0;
    const penalty = parseFloat(entry.penalty) || 0;
    const trucking = parseFloat(entry.trucking) || 0;
    const loadingUnloading = parseFloat(entry.loadingUnloading) || 0;

    return freightINR + cha + fobTerms + cfsDoYard + scanning + simsPims + duty + penalty + trucking + loadingUnloading;
  };

  const CostBreakdownModal = ({ entry, onClose }) => {
    if (!entry) return null;

    const total = calculateEntryTotal(entry);

    const costItems = [
      { label: "Freight (INR)", value: entry.freightINR, color: "text-blue-600", icon: <Ship className="w-4 h-4" /> },
      { label: "CHA", value: entry.cha, color: "text-indigo-600", icon: <FileDigit className="w-4 h-4" /> },
      { label: "FOB Terms", value: entry.fobTerms, color: "text-purple-600", icon: <Receipt className="w-4 h-4" /> },
      { label: "CFS/DO/Yard", value: entry.cfsDoYard, color: "text-amber-600", icon: <Package className="w-4 h-4" /> },
      { label: "Scanning", value: entry.scanning, color: "text-orange-600", icon: <Settings className="w-4 h-4" /> },
      { label: "SIMS/PIMS", value: entry.simsPims, color: "text-red-600", icon: <Shield className="w-4 h-4" /> },
      { label: "Duty", value: entry.duty, color: "text-pink-600", icon: <Landmark className="w-4 h-4" /> },
      { label: "Penalty", value: entry.penalty, color: "text-rose-600", icon: <AlertTriangle className="w-4 h-4" /> },
      { label: "Trucking", value: entry.trucking, color: "text-teal-600", icon: <Truck className="w-4 h-4" /> },
      { label: "Loading/Unloading", value: entry.loadingUnloading, color: "text-emerald-600", icon: <Scale className="w-4 h-4" /> },
    ];

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Cost Breakdown</h3>
                <p className="text-slate-600 text-sm">{entry.containerCode || "Container"}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {costItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg">
                      {item.icon}
                    </div>
                    <div>
                      <div className="font-medium text-slate-700">{item.label}</div>
                    </div>
                  </div>
                  <div className={`font-bold ${item.color}`}>
                    ₹{formatCurrency(item.value || 0)}
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-slate-900">Total Cost</div>
                  <div className="text-2xl font-bold text-indigo-700">
                    ₹{formatCurrency(total)}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedEntry(entry);
                  onClose();
                }}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
              >
                Edit Entry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const QuickAddForm = () => {
    const [formData, setFormData] = useState({
      containerCode: "",
      loadingFrom: "YIWU / GUANGZHOU / FULL",
      ctn: "",
      freightINR: "",
      freightUSD: "",
      cha: "",
      fobTerms: "",
      cfsDoYard: "",
      scanning: "",
      simsPims: "",
      duty: "",
      penalty: "",
      trucking: "",
      loadingUnloading: "",
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      const newEntry = {
        id: Date.now(),
        containerCode: formData.containerCode,
        loadingFrom: formData.loadingFrom,
        ctn: parseInt(formData.ctn) || 0,
        loadingDate: new Date().toISOString().split("T")[0],
        deliveryDate: "",
        freightUSD: parseFloat(formData.freightUSD) || 0,
        freightINR: parseFloat(formData.freightINR) || 0,
        cha: parseFloat(formData.cha) || 0,
        fobTerms: parseFloat(formData.fobTerms) || 0,
        cfsDoYard: parseFloat(formData.cfsDoYard) || 0,
        scanning: parseFloat(formData.scanning) || 0,
        simsPims: parseFloat(formData.simsPims) || 0,
        duty: parseFloat(formData.duty) || 0,
        penalty: parseFloat(formData.penalty) || 0,
        trucking: parseFloat(formData.trucking) || 0,
        loadingUnloading: parseFloat(formData.loadingUnloading) || 0,
        deliveryStatus: "PENDING",
        notes: "",
      };

      setEntries([...entries, newEntry]);
      setFormData({
        containerCode: "",
        loadingFrom: "YIWU / GUANGZHOU / FULL",
        ctn: "",
        freightINR: "",
        freightUSD: "",
        cha: "",
        fobTerms: "",
        cfsDoYard: "",
        scanning: "",
        simsPims: "",
        duty: "",
        penalty: "",
        trucking: "",
        loadingUnloading: "",
      });
      toast.success("Container added!");
    };

    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
        <h3 className="font-bold text-lg text-slate-900 mb-4">Quick Add Container</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Container Code</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g., MSCU123456"
                value={formData.containerCode}
                onChange={(e) => setFormData({ ...formData, containerCode: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Loading From</label>
              <select
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.loadingFrom}
                onChange={(e) => setFormData({ ...formData, loadingFrom: e.target.value })}
              >
                <option value="YIWU / GUANGZHOU / FULL">YIWU / GUANGZHOU / FULL</option>
                <option value="NINGBO / SHANGHAI / FULL">NINGBO / SHANGHAI / FULL</option>
                <option value="SHENZHEN / HONG KONG / FULL">SHENZHEN / HONG KONG / FULL</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CTN Count</label>
              <input
                type="number"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.ctn}
                onChange={(e) => setFormData({ ...formData, ctn: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Freight (INR)</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="0"
                  value={formData.freightINR}
                  onChange={(e) => setFormData({ ...formData, freightINR: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Freight (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="0"
                  value={formData.freightUSD}
                  onChange={(e) => setFormData({ ...formData, freightUSD: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium text-slate-700 mb-3">Local Charges (INR)</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">CHA</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                  placeholder="CHA"
                  value={formData.cha}
                  onChange={(e) => setFormData({ ...formData, cha: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">FOB Terms</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                  placeholder="FOB Terms"
                  value={formData.fobTerms}
                  onChange={(e) => setFormData({ ...formData, fobTerms: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">CFS/DO/Yard</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                  placeholder="CFS/DO/Yard"
                  value={formData.cfsDoYard}
                  onChange={(e) => setFormData({ ...formData, cfsDoYard: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Scanning</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                  placeholder="Scanning"
                  value={formData.scanning}
                  onChange={(e) => setFormData({ ...formData, scanning: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">SIMS/PIMS</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                  placeholder="SIMS/PIMS"
                  value={formData.simsPims}
                  onChange={(e) => setFormData({ ...formData, simsPims: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Duty</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                  placeholder="Duty"
                  value={formData.duty}
                  onChange={(e) => setFormData({ ...formData, duty: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Penalty</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                  placeholder="Penalty"
                  value={formData.penalty}
                  onChange={(e) => setFormData({ ...formData, penalty: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Trucking</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                  placeholder="Trucking"
                  value={formData.trucking}
                  onChange={(e) => setFormData({ ...formData, trucking: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Loading/Unloading</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                  placeholder="Loading/Unloading"
                  value={formData.loadingUnloading}
                  onChange={(e) => setFormData({ ...formData, loadingUnloading: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setFormData({
                containerCode: "",
                loadingFrom: "YIWU / GUANGZHOU / FULL",
                ctn: "",
                freightINR: "",
                freightUSD: "",
                cha: "",
                fobTerms: "",
                cfsDoYard: "",
                scanning: "",
                simsPims: "",
                duty: "",
                penalty: "",
                trucking: "",
                loadingUnloading: "",
              })}
              className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
            >
              Clear
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
            >
              Add Container
            </button>
          </div>
        </form>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-slate-600">Loading shipping sheet...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/dashboard/accounts")}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        value={sheetName}
                        onChange={(e) => setSheetName(e.target.value)}
                        className="px-3 py-1.5 border border-indigo-500 rounded-lg text-lg font-bold text-slate-900 outline-none min-w-[300px]"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={sheetDescription}
                        onChange={(e) => setSheetDescription(e.target.value)}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-600 outline-none min-w-[300px]"
                        placeholder="Description"
                      />
                    </div>
                    <button
                      onClick={() => setIsEditingName(false)}
                      className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSheetName(sheetDetails?.name || "");
                        setSheetDescription(sheetDetails?.description || "");
                        setIsEditingName(false);
                      }}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div>
                      <h1
                        className="text-xl font-bold text-slate-900 cursor-pointer hover:text-indigo-600 truncate max-w-[400px]"
                        onClick={() => setIsEditingName(true)}
                      >
                        {sheetName}
                      </h1>
                      {sheetDescription && (
                        <p className="text-sm text-slate-500 mt-1">
                          {sheetDescription}
                        </p>
                      )}
                    </div>
                    <Edit
                      className="w-4 h-4 text-slate-400 cursor-pointer hover:text-indigo-500"
                      onClick={() => setIsEditingName(true)}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase">Total</div>
                  <div className="font-mono font-bold text-indigo-700">
                    ₹{formatCurrency(stats.grandTotal)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPreviewOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-medium text-sm shadow-sm transition-all"
                >
                  <FileText className="w-4 h-4" />
                  Preview
                </button>
                <button
                  onClick={saveSheet}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm rounded-lg shadow transition-all ${isSaving
                      ? "bg-indigo-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Sheet
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 md:p-6">
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === "overview"
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
              }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab("quick-add")}
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === "quick-add"
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
              }`}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Quick Add
          </button>
          <button
            onClick={() => setActiveTab("table")}
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === "table"
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
              }`}
          >
            <List className="w-4 h-4 inline mr-2" />
            Table View
          </button>
        </div>

        {activeTab === "quick-add" && <QuickAddForm />}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase mb-1">
                  Total Value
                </div>
                <div className="text-2xl font-bold text-indigo-700">
                  ₹{formatCurrency(stats.grandTotal)}
                </div>
              </div>
              <Calculator className="w-6 h-6 text-indigo-600" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase mb-1">
                  Freight Cost
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  ₹{formatCurrency(stats.totalFreightINR)}
                </div>
                <div className="text-sm text-slate-600">
                  {formatCurrencyUSD(stats.totalFreightUSD)}
                </div>
              </div>
              <Ship className="w-6 h-6 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase mb-1">
                  Local Charges
                </div>
                <div className="text-2xl font-bold text-emerald-600">
                  ₹{formatCurrency(stats.totalLocalCharges)}
                </div>
              </div>
              <Receipt className="w-6 h-6 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase mb-1">
                  Containers
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {entries.length}
                </div>
                <div className="text-sm text-slate-600">
                  {stats.totalCTN} CTNs
                </div>
              </div>
              <Container className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Search containers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <button
                onClick={() => setShowAllCharges(!showAllCharges)}
                className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-300"
              >
                {showAllCharges ? <EyeOff className="w-4 h-4 inline mr-2" /> : <Eye className="w-4 h-4 inline mr-2" />}
                {showAllCharges ? "Hide Charges" : "Show Charges"}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  if (confirm("Clear all entries?")) {
                    setEntries([]);
                    toast.success("Sheet cleared");
                  }
                }}
                className="px-4 py-2.5 bg-white border border-red-200 text-red-600 font-medium text-sm rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 inline mr-2" />
                Clear All
              </button>

              <button
                onClick={addRow}
                className="px-5 py-2.5 bg-slate-900 text-white font-medium text-sm rounded-lg hover:bg-slate-800"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Add Container
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="p-4 text-left min-w-[180px]">Container Details</th>
                  <th className="p-4 text-left min-w-[120px]">Dates</th>
                  <th className="p-4 text-right min-w-[120px]">Freight (INR)</th>
                  {showAllCharges && (
                    <>
                      <th className="p-4 text-right min-w-[100px]">CHA</th>
                      <th className="p-4 text-right min-w-[100px]">FOB Terms</th>
                      <th className="p-4 text-right min-w-[100px]">CFS/DO/Yard</th>
                      <th className="p-4 text-right min-w-[100px]">Scanning</th>
                      <th className="p-4 text-right min-w-[100px]">SIMS/PIMS</th>
                      <th className="p-4 text-right min-w-[100px]">Duty</th>
                      <th className="p-4 text-right min-w-[100px]">Penalty</th>
                      <th className="p-4 text-right min-w-[100px]">Trucking</th>
                      <th className="p-4 text-right min-w-[100px]">Unloading</th>
                    </>
                  )}
                  <th className="p-4 text-right min-w-[120px]">Total</th>
                  <th className="p-4 text-center min-w-[120px]">Status</th>
                  <th className="p-4 text-center min-w-[100px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={showAllCharges ? 15 : 6} className="text-center py-12 text-slate-400">
                      <Container className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <div className="mb-2">No containers found</div>
                      <button
                        onClick={addRow}
                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                      >
                        Add your first container
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => {
                    const total = calculateEntryTotal(entry);
                    const isOverdue = entry.deliveryDate && new Date(entry.deliveryDate) < new Date();

                    return (
                      <tr key={entry.id} className="hover:bg-slate-50 group">
                        <td className="p-4">
                          <div className="space-y-2">
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent outline-none font-bold text-slate-900"
                              placeholder="Container Code"
                              value={entry.containerCode}
                              onChange={(e) => updateRow(entry.id, "containerCode", e.target.value)}
                            />
                            <div className="flex items-center gap-3">
                              <select
                                className="flex-1 px-3 py-1.5 text-xs border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent outline-none text-slate-600 rounded"
                                value={entry.loadingFrom}
                                onChange={(e) => updateRow(entry.id, "loadingFrom", e.target.value)}
                              >
                                <option value="YIWU / GUANGZHOU / FULL">YIWU / GUANGZHOU / FULL</option>
                                <option value="NINGBO / SHANGHAI / FULL">NINGBO / SHANGHAI / FULL</option>
                                <option value="SHENZHEN / HONG KONG / FULL">SHENZHEN / HONG KONG / FULL</option>
                              </select>
                              <div className="relative">
                                <Hash className="absolute left-2 top-1.5 w-3 h-3 text-slate-400" />
                                <input
                                  type="number"
                                  className="w-20 pl-7 pr-2 py-1.5 text-xs border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent outline-none text-slate-600 rounded"
                                  placeholder="CTN"
                                  value={entry.ctn || ""}
                                  onChange={(e) => updateRow(entry.id, "ctn", e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="space-y-2">
                            <div className="relative">
                              <Calendar className="absolute left-2 top-1.5 w-3 h-3 text-slate-400" />
                              <input
                                type="date"
                                className="w-full pl-7 pr-2 py-1.5 text-xs border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent outline-none text-slate-600 rounded"
                                value={entry.loadingDate || ""}
                                onChange={(e) => updateRow(entry.id, "loadingDate", e.target.value)}
                              />
                            </div>
                            <div className="relative">
                              <Calendar className="absolute left-2 top-1.5 w-3 h-3 text-slate-400" />
                              <input
                                type="date"
                                className={`w-full pl-7 pr-2 py-1.5 text-xs border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent outline-none rounded ${isOverdue ? 'text-red-600' : 'text-slate-600'
                                  }`}
                                value={entry.deliveryDate || ""}
                                onChange={(e) => updateRow(entry.id, "deliveryDate", e.target.value)}
                              />
                              {isOverdue && (
                                <div className="absolute -right-1 top-1 w-2 h-2 bg-red-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="space-y-1">
                            <input
                              type="number"
                              step="0.01"
                              className="w-full px-3 py-2 text-right border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent outline-none font-mono font-bold text-blue-700"
                              placeholder="0"
                              value={entry.freightINR || ""}
                              onChange={(e) => updateRow(entry.id, "freightINR", e.target.value)}
                            />
                            <div className="text-xs text-slate-500 text-right">
                              {formatCurrencyUSD(entry.freightUSD || 0)}
                            </div>
                          </div>
                        </td>

                        {showAllCharges && (
                          <>
                            <td className="p-4">
                              <input
                                type="number"
                                step="0.01"
                                className="w-full px-3 py-2 text-right border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent outline-none font-mono"
                                placeholder="0"
                                value={entry.cha || ""}
                                onChange={(e) => updateRow(entry.id, "cha", e.target.value)}
                              />
                            </td>
                            <td className="p-4">
                              <input
                                type="number"
                                step="0.01"
                                className="w-full px-3 py-2 text-right border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent outline-none font-mono"
                                placeholder="0"
                                value={entry.fobTerms || ""}
                                onChange={(e) => updateRow(entry.id, "fobTerms", e.target.value)}
                              />
                            </td>
                            <td className="p-4">
                              <input
                                type="number"
                                step="0.01"
                                className="w-full px-3 py-2 text-right border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent outline-none font-mono"
                                placeholder="0"
                                value={entry.cfsDoYard || ""}
                                onChange={(e) => updateRow(entry.id, "cfsDoYard", e.target.value)}
                              />
                            </td>
                            <td className="p-4">
                              <input
                                type="number"
                                step="0.01"
                                className="w-full px-3 py-2 text-right border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent outline-none font-mono"
                                placeholder="0"
                                value={entry.scanning || ""}
                                onChange={(e) => updateRow(entry.id, "scanning", e.target.value)}
                              />
                            </td>
                            <td className="p-4">
                              <input
                                type="number"
                                step="0.01"
                                className="w-full px-3 py-2 text-right border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent outline-none font-mono"
                                placeholder="0"
                                value={entry.simsPims || ""}
                                onChange={(e) => updateRow(entry.id, "simsPims", e.target.value)}
                              />
                            </td>
                            <td className="p-4">
                              <input
                                type="number"
                                step="0.01"
                                className="w-full px-3 py-2 text-right border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent outline-none font-mono"
                                placeholder="0"
                                value={entry.duty || ""}
                                onChange={(e) => updateRow(entry.id, "duty", e.target.value)}
                              />
                            </td>
                            <td className="p-4">
                              <input
                                type="number"
                                step="0.01"
                                className="w-full px-3 py-2 text-right border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent outline-none font-mono"
                                placeholder="0"
                                value={entry.penalty || ""}
                                onChange={(e) => updateRow(entry.id, "penalty", e.target.value)}
                              />
                            </td>
                            <td className="p-4">
                              <input
                                type="number"
                                step="0.01"
                                className="w-full px-3 py-2 text-right border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent outline-none font-mono"
                                placeholder="0"
                                value={entry.trucking || ""}
                                onChange={(e) => updateRow(entry.id, "trucking", e.target.value)}
                              />
                            </td>
                            <td className="p-4">
                              <input
                                type="number"
                                step="0.01"
                                className="w-full px-3 py-2 text-right border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent outline-none font-mono"
                                placeholder="0"
                                value={entry.loadingUnloading || ""}
                                onChange={(e) => updateRow(entry.id, "loadingUnloading", e.target.value)}
                              />
                            </td>
                          </>
                        )}

                        <td className="p-4">
                          <div className="text-right">
                            <div className="px-3 py-2 bg-indigo-50 text-indigo-700 font-bold font-mono rounded-lg inline-block">
                              ₹{formatCurrency(total)}
                            </div>
                            <button
                              onClick={() => {
                                setSelectedEntry(entry);
                                setCostBreakdownModal(true);
                              }}
                              className="mt-1 text-xs text-slate-400 hover:text-indigo-600"
                            >
                              View breakdown
                            </button>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex justify-center">
                            <select
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${getStatusColor(entry.deliveryStatus || "PENDING")}`}
                              value={entry.deliveryStatus || "PENDING"}
                              onChange={(e) => updateDeliveryStatus(entry.id, e.target.value)}
                            >
                              <option value="PENDING">Pending</option>
                              <option value="IN_TRANSIT">In Transit</option>
                              <option value="ARRIVED">Arrived</option>
                              <option value="DELIVERED">Delivered</option>
                            </select>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedEntry(entry);
                                setCostBreakdownModal(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteRow(entry.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td className="p-4 font-medium text-slate-700" colSpan={showAllCharges ? 3 : 2}>
                    Total ({entries.length} containers)
                  </td>
                  <td className="p-4 text-right">
                    <div className="font-bold text-blue-600">₹{formatCurrency(stats.totalFreightINR)}</div>
                  </td>

                  {showAllCharges && (
                    <>
                      <td className="p-4 text-right">
                        <div className="font-mono">₹{formatCurrency(stats.totalCHA)}</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-mono">₹{formatCurrency(stats.totalFOBTerms)}</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-mono">₹{formatCurrency(stats.totalCFSDoYard)}</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-mono">₹{formatCurrency(stats.totalScanning)}</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-mono">₹{formatCurrency(stats.totalSIMS_PIMS)}</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-mono">₹{formatCurrency(stats.totalDuty)}</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-mono">₹{formatCurrency(stats.totalPenalty)}</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-mono">₹{formatCurrency(stats.totalTrucking)}</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-mono">₹{formatCurrency(stats.totalLoadingUnloading)}</div>
                      </td>
                    </>
                  )}

                  <td className="p-4 text-right">
                    <div className="font-bold text-2xl text-indigo-700">₹{formatCurrency(stats.grandTotal)}</div>
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="text-sm text-slate-600">
              Showing {filteredEntries.length} of {entries.length} containers
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={saveSheet}
                disabled={isSaving}
                className={`px-4 py-2.5 bg-indigo-600 text-white font-medium text-sm rounded-lg hover:bg-indigo-700 ${isSaving ? "opacity-50 cursor-not-allowed" : ""
                  }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 inline mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-6 right-6 z-20">
        <button
          onClick={addRow}
          className="p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700"
          title="Add Container"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {costBreakdownModal && (
        <CostBreakdownModal
          entry={selectedEntry}
          onClose={() => setCostBreakdownModal(false)}
        />
      )}

      {/* Preview Modal */}
      <ShippingPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        sheetName={sheetName}
        entries={entries}
        stats={stats}
      />
    </div>
  );
}