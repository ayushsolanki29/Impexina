"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Eye, PlusCircle, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import API from "@/lib/api";
import ShippingPreviewModal from "./_components/ShippingPreviewModal";

function formatDateDDMMYYYY(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export default function ShippingSheetPage() {
  const params = useParams();
  const router = useRouter();
  const sheetId = params.sheetId;

  const [sheet, setSheet] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [entry, setEntry] = useState({
    containerCode: "",
    loadingFrom: "YIWU / GUANGZHOU / FULL",
    ctn: "",
    loadingDate: new Date().toISOString().split("T")[0],
    rmbRate: "",
    freightUSD: "",
    exchangeRate: "",
    freightINR: "",
    usFreight: "",
    cha: "",
    fobTerms: "",
    cfsDoYard: "",
    scanning: "",
    simsPims: "",
    duty: "",
    penalty: "",
    trucking: "",
    loadingUnloading: "",
    deliveryStatus: "PENDING",
    notes: "",
    hisab: false,
  });

  useEffect(() => {
    if (sheetId && sheetId !== "new") {
      loadSheetData();
    }
  }, [sheetId]);

  const loadSheetData = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/accounts/shipping/${sheetId}`);
      if (response.data.success) {
        setSheet(response.data.data);
        setEntries(response.data.data.entries || []);
      }
    } catch (error) {
      toast.error("Failed to load shipping sheet");
    } finally {
      setLoading(false);
    }
  };

  // Keyboard: Ctrl+S save (add entry), Escape back
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (isPreviewOpen) {
          setIsPreviewOpen(false);
        } else {
          router.push("/dashboard/accounts");
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (entry.containerCode?.trim()) {
          handleAddEntry({ preventDefault: () => {} });
        } else {
          toast.success("All changes saved");
          loadSheetData(); // Refresh to be sure
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [entry.containerCode, isPreviewOpen, router]);

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!entry.containerCode) {
      toast.error("Container Code is required");
      return;
    }
    try {
      const response = await API.post(`/accounts/shipping/${sheetId}/entries`, {
        ...entry,
        ctn: parseInt(entry.ctn) || 0,
        rmbRate: parseFloat(entry.rmbRate) || 0,
        freightUSD: parseFloat(entry.freightUSD) || 0,
        exchangeRate: parseFloat(entry.exchangeRate) || 0,
        freightINR: parseFloat(entry.freightINR) || 0,
        usFreight: parseFloat(entry.usFreight) || 0,
        cha: parseFloat(entry.cha) || 0,
        fobTerms: parseFloat(entry.fobTerms) || 0,
        cfsDoYard: parseFloat(entry.cfsDoYard) || 0,
        scanning: parseFloat(entry.scanning) || 0,
        simsPims: parseFloat(entry.simsPims) || 0,
        duty: parseFloat(entry.duty) || 0,
        penalty: parseFloat(entry.penalty) || 0,
        trucking: parseFloat(entry.trucking) || 0,
        loadingUnloading: parseFloat(entry.loadingUnloading) || 0,
      });

      if (response.data.success) {
        toast.success("Entry added");
        setEntry({
          containerCode: "",
          loadingFrom: "YIWU / GUANGZHOU / FULL",
          ctn: "",
          loadingDate: new Date().toISOString().split("T")[0],
          rmbRate: "",
          freightUSD: "",
          exchangeRate: "",
          freightINR: "",
          usFreight: "",
          cha: "",
          fobTerms: "",
          cfsDoYard: "",
          scanning: "",
          simsPims: "",
          duty: "",
          penalty: "",
          trucking: "",
          loadingUnloading: "",
          deliveryStatus: "PENDING",
          notes: "",
          hisab: false,
        });
        loadSheetData();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.errors?.[0]?.message || error.response?.data?.message || "Failed to add entry";
      toast.error(errorMsg);
    }
  };

  const handleUpdateEntry = async (entryId, field, value) => {
    const row = entries.find((e) => e.id === entryId);
    if (!row) return;

    // Optimistic local update
    const updatedEntries = entries.map((e) =>
      e.id === entryId ? { ...e, [field]: value } : e
    );
    setEntries(updatedEntries);

    // Prepare data for API
    const updateData = { ...row, [field]: value };
    const numericFields = [
      "ctn", "rmbRate", "freightUSD", "exchangeRate", "freightINR", "usFreight", "cha",
      "fobTerms", "cfsDoYard", "scanning", "simsPims",
      "duty", "penalty", "trucking", "loadingUnloading"
    ];

    if (numericFields.includes(field)) {
      updateData[field] = value === "" ? 0 : parseFloat(value) || 0;
    }

    try {
      await API.put(`/accounts/shipping/entries/${entryId}`, updateData);
    } catch (error) {
      const errorMsg = error.response?.data?.errors?.[0]?.message || error.response?.data?.message || "Update failed";
      toast.error(errorMsg);
      console.error("Update failed", error);
      loadSheetData(); // Revert on failure
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!confirm("Delete this container entry?")) return;
    try {
      await API.delete(`/accounts/shipping/entries/${entryId}`);
      toast.success("Entry deleted");
      loadSheetData();
    } catch (error) {
      toast.error("Failed to delete entry");
    }
  };

  const totals = useMemo(() => {
    return entries.reduce(
      (acc, curr) => {
        const fINR = parseFloat(curr.freightINR) || 0;
        const usF = parseFloat(curr.usFreight) || 0;
        const cha = parseFloat(curr.cha) || 0;
        const fob = parseFloat(curr.fobTerms) || 0;
        const cfs = parseFloat(curr.cfsDoYard) || 0;
        const scan = parseFloat(curr.scanning) || 0;
        const sims = parseFloat(curr.simsPims) || 0;
        const duty = parseFloat(curr.duty) || 0;
        const pen = parseFloat(curr.penalty) || 0;
        const truck = parseFloat(curr.trucking) || 0;
        const lu = parseFloat(curr.loadingUnloading) || 0;

        const rowTotal = fINR + usF + cha + fob + cfs + scan + sims + duty + pen + truck + lu;

        return {
          totalCTN: acc.totalCTN + (parseInt(curr.ctn) || 0),
          totalFreightUSD: acc.totalFreightUSD + (parseFloat(curr.freightUSD) || 0),
          totalFreightINR: acc.totalFreightINR + fINR,
          totalCHA: acc.totalCHA + cha,
          totalFOBTerms: acc.totalFOBTerms + fob,
          totalCFSDoYard: acc.totalCFSDoYard + cfs,
          totalScanning: acc.totalScanning + scan,
          totalSIMS_PIMS: acc.totalSIMS_PIMS + sims,
          totalDuty: acc.totalDuty + duty,
          totalPenalty: acc.totalPenalty + pen,
          totalTrucking: acc.totalTrucking + truck,
          totalLoadingUnloading: acc.totalLoadingUnloading + lu,
          grandTotal: acc.grandTotal + rowTotal,
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
        grandTotal: 0,
      }
    );
  }, [entries]);

  if (loading && entries.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 font-medium">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/dashboard/accounts"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider hidden sm:inline">
              Ctrl+S Save · Esc Back
            </span>
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 text-sm font-medium"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
          </div>
        </div>
      </div>

      {/* Indigo title */}
      <div className="bg-indigo-600 text-white py-8">
        <div className="max-w-[1800px] mx-auto px-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black uppercase tracking-tight">
              Container Shipping
            </h1>
            <p className="text-indigo-100 text-sm font-medium">
              Track container costs, freight, duty, and local charges.
            </p>
          </div>
          
          <div className="mt-6 flex items-center gap-3">
            <div className="bg-indigo-700/50 rounded-lg px-3 py-2 flex items-center gap-3 border border-indigo-500/30">
              <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider whitespace-nowrap">
                Current Sheet:
              </span>
              <input
                className="bg-transparent border-0 outline-none text-sm font-bold uppercase w-64 placeholder:text-indigo-400"
                value={sheet?.name || ""}
                onChange={(e) => {
                  const newName = e.target.value;
                  setSheet({ ...sheet, name: newName });
                }}
                onBlur={async () => {
                  if (!sheet?.name) return;
                  try {
                    await API.put(`/accounts/shipping/${sheetId}`, { name: sheet.name });
                    toast.success("Sheet name updated");
                  } catch (error) {
                    toast.error("Failed to update sheet name");
                  }
                }}
                placeholder="UNNAMED SHEET"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="max-w-[1800px] mx-auto px-6 py-6 overflow-x-auto">
        <table className="w-full border-collapse text-[11px]" style={{ minWidth: "1850px" }}>
          <thead>
            <tr className="bg-amber-200 text-slate-900 border border-slate-300">
              <th className="border border-slate-300 px-2 py-2 text-left font-bold uppercase">Container</th>
              <th className="border border-slate-300 px-2 py-2 text-center font-bold uppercase w-16">HISAB</th>
              <th className="border border-slate-300 px-2 py-2 text-left font-bold uppercase">From</th>
              <th className="border border-slate-300 px-2 py-2 text-right font-bold uppercase w-16">CTN</th>
              <th className="border border-slate-300 px-2 py-2 text-left font-bold uppercase w-28">Load Date</th>
              <th className="border border-slate-300 px-1 py-2 text-right font-bold uppercase w-20 bg-amber-100">RMB/($)</th>
              <th className="border border-slate-300 px-2 py-2 text-right font-bold uppercase w-24">Frt($)</th>
              <th className="border border-slate-300 px-1 py-2 text-right font-bold uppercase w-20 bg-amber-100">Rate</th>
              <th className="border border-slate-300 px-2 py-2 text-right font-bold uppercase w-28">Frt(₹)</th>
              <th className="border border-slate-300 px-1 py-2 text-right font-bold uppercase w-20 bg-amber-300/30">U.Frt</th>
              <th className="border border-slate-300 px-1 py-2 text-right font-bold uppercase w-20 bg-amber-300/30">CHA</th>
              <th className="border border-slate-300 px-1 py-2 text-right font-bold uppercase w-20 bg-amber-300/30">FOB</th>
              <th className="border border-slate-300 px-1 py-2 text-right font-bold uppercase w-20 bg-amber-300/30">CFS</th>
              <th className="border border-slate-300 px-1 py-2 text-right font-bold uppercase w-20 bg-amber-300/30">Scan</th>
              <th className="border border-slate-300 px-1 py-2 text-right font-bold uppercase w-20 bg-amber-300/30">S/P</th>
              <th className="border border-slate-300 px-1 py-2 text-right font-bold uppercase w-24 bg-amber-300/30">Duty</th>
              <th className="border border-slate-300 px-1 py-2 text-right font-bold uppercase w-20 bg-amber-300/30">Pen</th>
              <th className="border border-slate-300 px-1 py-2 text-right font-bold uppercase w-20 bg-amber-300/30">Truck</th>
              <th className="border border-slate-300 px-1 py-2 text-right font-bold uppercase w-20 bg-amber-300/30">L/U</th>
              <th className="border border-slate-300 px-2 py-2 text-right font-bold uppercase w-32 bg-indigo-50">Total (₹)</th>
              <th className="border border-slate-300 px-2 py-2 text-left font-bold uppercase w-28">Status</th>
              <th className="border border-slate-300 px-2 py-2 text-left font-bold uppercase">Notes</th>
              <th className="border border-slate-300 px-1 py-2 w-8"></th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {entries.map((row) => (
              <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50/50">
                <td className="border border-slate-200 px-2 py-1">
                  <input
                    className="w-full bg-transparent border-0 outline-none py-0.5 font-bold text-indigo-900 uppercase"
                    value={row.containerCode || ""}
                    onChange={(e) => handleUpdateEntry(row.id, "containerCode", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-2 py-1 text-center">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                    checked={row.hisab || false} 
                    onChange={(e) => handleUpdateEntry(row.id, "hisab", e.target.checked)} 
                  />
                </td>
                <td className="border border-slate-200 px-2 py-1">
                  <input
                    className="w-full bg-transparent border-0 outline-none py-0.5 text-slate-700"
                    value={row.loadingFrom || ""}
                    onChange={(e) => handleUpdateEntry(row.id, "loadingFrom", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-2 py-1">
                  <input
                    type="number"
                    className="w-full text-right bg-transparent border-0 outline-none py-0.5"
                    value={row.ctn ?? ""}
                    onChange={(e) => handleUpdateEntry(row.id, "ctn", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-2 py-1">
                  <input
                    type="date"
                    className="w-full bg-transparent border-0 outline-none py-0.5 text-[10px]"
                    value={row.loadingDate ? new Date(row.loadingDate).toISOString().split("T")[0] : ""}
                    onChange={(e) => handleUpdateEntry(row.id, "loadingDate", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-1 py-1 bg-amber-50/30">
                  <input
                    type="number"
                    className="w-full text-right bg-transparent border-0 outline-none py-0.5 text-amber-800"
                    value={row.rmbRate ?? ""}
                    onChange={(e) => handleUpdateEntry(row.id, "rmbRate", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-2 py-1">
                  <input
                    type="number"
                    className="w-full text-right bg-transparent border-0 outline-none py-0.5 text-blue-700 font-medium"
                    value={row.freightUSD ?? ""}
                    onChange={(e) => handleUpdateEntry(row.id, "freightUSD", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-1 py-1 bg-amber-50/30">
                  <input
                    type="number"
                    className="w-full text-right bg-transparent border-0 outline-none py-0.5 text-amber-800"
                    value={row.exchangeRate ?? ""}
                    onChange={(e) => handleUpdateEntry(row.id, "exchangeRate", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-2 py-1">
                  <input
                    type="number"
                    className="w-full text-right bg-transparent border-0 outline-none py-0.5 font-bold text-slate-800"
                    value={row.freightINR ?? ""}
                    onChange={(e) => handleUpdateEntry(row.id, "freightINR", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-1 py-1 bg-slate-50/30">
                  <input type="number" className="w-full text-right bg-transparent border-0 outline-none py-0.5" value={row.usFreight ?? ""} onChange={(e) => handleUpdateEntry(row.id, "usFreight", e.target.value)} />
                </td>
                <td className="border border-slate-200 px-1 py-1 bg-slate-50/30">
                  <input type="number" className="w-full text-right bg-transparent border-0 outline-none py-0.5" value={row.cha ?? ""} onChange={(e) => handleUpdateEntry(row.id, "cha", e.target.value)} />
                </td>
                <td className="border border-slate-200 px-1 py-1 bg-slate-50/30">
                  <input type="number" className="w-full text-right bg-transparent border-0 outline-none py-0.5" value={row.fobTerms ?? ""} onChange={(e) => handleUpdateEntry(row.id, "fobTerms", e.target.value)} />
                </td>
                <td className="border border-slate-200 px-1 py-1 bg-slate-50/30">
                  <input type="number" className="w-full text-right bg-transparent border-0 outline-none py-0.5" value={row.cfsDoYard ?? ""} onChange={(e) => handleUpdateEntry(row.id, "cfsDoYard", e.target.value)} />
                </td>
                <td className="border border-slate-200 px-1 py-1 bg-slate-50/30">
                  <input type="number" className="w-full text-right bg-transparent border-0 outline-none py-0.5" value={row.scanning ?? ""} onChange={(e) => handleUpdateEntry(row.id, "scanning", e.target.value)} />
                </td>
                <td className="border border-slate-200 px-1 py-1 bg-slate-50/30">
                  <input type="number" className="w-full text-right bg-transparent border-0 outline-none py-0.5" value={row.simsPims ?? ""} onChange={(e) => handleUpdateEntry(row.id, "simsPims", e.target.value)} />
                </td>
                <td className="border border-slate-200 px-1 py-1 bg-slate-50/30">
                  <input type="number" className="w-full text-right bg-transparent border-0 outline-none py-0.5" value={row.duty ?? ""} onChange={(e) => handleUpdateEntry(row.id, "duty", e.target.value)} />
                </td>
                <td className="border border-slate-200 px-1 py-1 bg-slate-50/30">
                  <input type="number" className="w-full text-right bg-transparent border-0 outline-none py-0.5" value={row.penalty ?? ""} onChange={(e) => handleUpdateEntry(row.id, "penalty", e.target.value)} />
                </td>
                <td className="border border-slate-200 px-1 py-1 bg-slate-50/30">
                  <input type="number" className="w-full text-right bg-transparent border-0 outline-none py-0.5" value={row.trucking ?? ""} onChange={(e) => handleUpdateEntry(row.id, "trucking", e.target.value)} />
                </td>
                <td className="border border-slate-200 px-1 py-1 bg-slate-50/30">
                  <input type="number" className="w-full text-right bg-transparent border-0 outline-none py-0.5" value={row.loadingUnloading ?? ""} onChange={(e) => handleUpdateEntry(row.id, "loadingUnloading", e.target.value)} />
                </td>
                <td className="border border-slate-200 px-2 py-1 text-right font-black text-indigo-700 bg-indigo-50/30">
                  {(
                    (parseFloat(row.freightINR) || 0) +
                    (parseFloat(row.usFreight) || 0) +
                    (parseFloat(row.cha) || 0) +
                    (parseFloat(row.fobTerms) || 0) +
                    (parseFloat(row.cfsDoYard) || 0) +
                    (parseFloat(row.scanning) || 0) +
                    (parseFloat(row.simsPims) || 0) +
                    (parseFloat(row.duty) || 0) +
                    (parseFloat(row.penalty) || 0) +
                    (parseFloat(row.trucking) || 0) +
                    (parseFloat(row.loadingUnloading) || 0)
                  ).toLocaleString("en-IN")}
                </td>
                <td className="border border-slate-200 px-2 py-1">
                  <select
                    className="w-full bg-transparent border-0 outline-none py-0.5 text-[10px] font-bold"
                    value={row.deliveryStatus}
                    onChange={(e) => handleUpdateEntry(row.id, "deliveryStatus", e.target.value)}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="IN_TRANSIT">IN_TRANSIT</option>
                    <option value="ARRIVED">ARRIVED</option>
                    <option value="DELIVERED">DELIVERED</option>
                  </select>
                </td>
                <td className="border border-slate-200 px-2 py-1">
                  <input
                    className="w-full bg-transparent border-0 outline-none py-0.5 text-slate-500 italic"
                    placeholder="Notes..."
                    value={row.notes || ""}
                    onChange={(e) => handleUpdateEntry(row.id, "notes", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-1 py-1">
                  <button
                    type="button"
                    onClick={() => handleDeleteEntry(row.id)}
                    className="p-1 text-slate-300 hover:text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}

            {/* New Entry Row */}
            <tr className="bg-slate-50 border-t-2 border-slate-200">
              <td className="border border-slate-200 px-2 py-1.5">
                <input
                  className="w-full border border-slate-300 rounded px-1.5 py-1 text-[10px] font-bold"
                  placeholder="CONT CODE"
                  value={entry.containerCode}
                  onChange={(e) => setEntry({ ...entry, containerCode: e.target.value })}
                />
              </td>
              <td className="border border-slate-200 px-2 py-1.5 text-center">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                  checked={entry.hisab} 
                  onChange={(e) => setEntry({ ...entry, hisab: e.target.checked })} 
                />
              </td>
              <td className="border border-slate-200 px-2 py-1.5">
                <input
                  className="w-full border border-slate-300 rounded px-1.5 py-1 text-[10px]"
                  placeholder="FROM"
                  value={entry.loadingFrom}
                  onChange={(e) => setEntry({ ...entry, loadingFrom: e.target.value })}
                />
              </td>
              <td className="border border-slate-200 px-2 py-1.5">
                <input
                  type="number"
                  className="w-full border border-slate-300 rounded px-1.5 py-1 text-right text-[10px]"
                  placeholder="CTN"
                  value={entry.ctn}
                  onChange={(e) => setEntry({ ...entry, ctn: e.target.value })}
                />
              </td>
              <td className="border border-slate-200 px-2 py-1.5">
                <input
                  type="date"
                  className="w-full border border-slate-300 rounded px-1.5 py-1 text-[10px]"
                  value={entry.loadingDate}
                  onChange={(e) => setEntry({ ...entry, loadingDate: e.target.value })}
                />
              </td>
              <td className="border border-slate-200 px-1 py-1.5">
                <input
                  type="number"
                  className="w-full border border-slate-300 rounded px-1.5 py-1 text-right text-[10px]"
                  placeholder="RMB/$"
                  value={entry.rmbRate}
                  onChange={(e) => setEntry({ ...entry, rmbRate: e.target.value })}
                />
              </td>
              <td className="border border-slate-200 px-2 py-1.5">
                <input
                  type="number"
                  className="w-full border border-slate-300 rounded px-1.5 py-1 text-right text-[10px]"
                  placeholder="USD"
                  value={entry.freightUSD}
                  onChange={(e) => setEntry({ ...entry, freightUSD: e.target.value })}
                />
              </td>
              <td className="border border-slate-200 px-1 py-1.5">
                <input
                  type="number"
                  className="w-full border border-slate-300 rounded px-1.5 py-1 text-right text-[10px]"
                  placeholder="RATE"
                  value={entry.exchangeRate}
                  onChange={(e) => setEntry({ ...entry, exchangeRate: e.target.value })}
                />
              </td>
              <td className="border border-slate-200 px-2 py-1.5">
                <input
                  type="number"
                  className="w-full border border-slate-300 rounded px-1.5 py-1 text-right text-[10px]"
                  placeholder="INR"
                  value={entry.freightINR}
                  onChange={(e) => setEntry({ ...entry, freightINR: e.target.value })}
                />
              </td>
              {/* Local Charges Inputs */}
              <td className="border border-slate-200 px-1 py-1.5"><input type="number" className="w-full border border-slate-200 rounded px-1 py-0.5 text-right" placeholder="UF" value={entry.usFreight} onChange={(e) => setEntry({ ...entry, usFreight: e.target.value })} /></td>
              <td className="border border-slate-200 px-1 py-1.5"><input type="number" className="w-full border border-slate-200 rounded px-1 py-0.5 text-right" placeholder="CHA" value={entry.cha} onChange={(e) => setEntry({ ...entry, cha: e.target.value })} /></td>
              <td className="border border-slate-200 px-1 py-1.5"><input type="number" className="w-full border border-slate-200 rounded px-1 py-0.5 text-right" placeholder="FOB" value={entry.fobTerms} onChange={(e) => setEntry({ ...entry, fobTerms: e.target.value })} /></td>
              <td className="border border-slate-200 px-1 py-1.5"><input type="number" className="w-full border border-slate-200 rounded px-1 py-0.5 text-right" placeholder="CFS" value={entry.cfsDoYard} onChange={(e) => setEntry({ ...entry, cfsDoYard: e.target.value })} /></td>
              <td className="border border-slate-200 px-1 py-1.5"><input type="number" className="w-full border border-slate-200 rounded px-1 py-0.5 text-right" placeholder="SCAN" value={entry.scanning} onChange={(e) => setEntry({ ...entry, scanning: e.target.value })} /></td>
              <td className="border border-slate-200 px-1 py-1.5"><input type="number" className="w-full border border-slate-200 rounded px-1 py-0.5 text-right" placeholder="S/P" value={entry.simsPims} onChange={(e) => setEntry({ ...entry, simsPims: e.target.value })} /></td>
              <td className="border border-slate-200 px-1 py-1.5"><input type="number" className="w-full border border-slate-200 rounded px-1 py-0.5 text-right" placeholder="DUTY" value={entry.duty} onChange={(e) => setEntry({ ...entry, duty: e.target.value })} /></td>
              <td className="border border-slate-200 px-1 py-1.5"><input type="number" className="w-full border border-slate-200 rounded px-1 py-0.5 text-right" placeholder="PEN" value={entry.penalty} onChange={(e) => setEntry({ ...entry, penalty: e.target.value })} /></td>
              <td className="border border-slate-200 px-1 py-1.5"><input type="number" className="w-full border border-slate-200 rounded px-1 py-0.5 text-right" placeholder="TRUCK" value={entry.trucking} onChange={(e) => setEntry({ ...entry, trucking: e.target.value })} /></td>
              <td className="border border-slate-200 px-1 py-1.5"><input type="number" className="w-full border border-slate-200 rounded px-1 py-0.5 text-right" placeholder="L/U" value={entry.loadingUnloading} onChange={(e) => setEntry({ ...entry, loadingUnloading: e.target.value })} /></td>
              
              <td className="border border-slate-200 px-2 py-1.5 text-right font-black text-slate-400">ADD</td>
              <td className="border border-slate-200 px-2 py-1.5">
                <select className="w-full border border-slate-300 rounded px-1.5 py-1 text-[10px]" value={entry.deliveryStatus} onChange={(e) => setEntry({ ...entry, deliveryStatus: e.target.value })}>
                  <option value="PENDING">PENDING</option>
                  <option value="IN_TRANSIT">IN_TRANSIT</option>
                  <option value="ARRIVED">ARRIVED</option>
                  <option value="DELIVERED">DELIVERED</option>
                </select>
              </td>
              <td className="border border-slate-200 px-2 py-1.5">
                <input className="w-full border border-slate-300 rounded px-1.5 py-1 text-[10px]" placeholder="NOTES" value={entry.notes} onChange={(e) => setEntry({ ...entry, notes: e.target.value })} />
              </td>
              <td className="border border-slate-200 px-1 py-1.5">
                <button type="button" onClick={handleAddEntry} className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                  <PlusCircle className="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
          {/* Footer Totals */}
          <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold">
            <tr>
              <td colSpan="3" className="border border-slate-300 px-2 py-2 text-right">TOTAL</td>
              <td className="border border-slate-300 px-2 py-2 text-right">{totals.totalCTN}</td>
              <td colSpan="2" className="border border-slate-300 px-2 py-2"></td>
              <td className="border border-slate-300 px-2 py-2 text-right text-blue-700">${totals.totalFreightUSD.toLocaleString()}</td>
              <td className="border border-slate-300 px-2 py-2"></td>
              <td className="border border-slate-300 px-2 py-2 text-right">₹{totals.totalFreightINR.toLocaleString()}</td>
              <td colSpan="10" className="border border-slate-300 px-2 py-2 text-right text-slate-500 uppercase">Grand Total (Incl. Charges)</td>
              <td className="border border-slate-300 px-2 py-2 text-right text-indigo-700 text-sm">₹{totals.grandTotal.toLocaleString("en-IN")}</td>
              <td colSpan="3" className="border border-slate-300"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <ShippingPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        sheetName={sheet?.name}
        entries={entries}
        stats={totals}
      />
    </div>
  );
}
