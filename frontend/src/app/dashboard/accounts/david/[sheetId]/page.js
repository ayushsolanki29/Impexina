"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Save, Search, FileDown } from "lucide-react";
import { toast } from "sonner";
import { forexAPI } from "@/services/forex.service";

export default function ForexSimple() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sheetId, setSheetId] = useState(""); // Or get from params

  // Load data
  useEffect(() => {
    // Load forex sheets to show or create new
    loadSheets();
  }, []);

  const loadSheets = async () => {
    try {
      const result = await forexAPI.getSheets({ limit: 1 });
      if (result.data.sheets.length > 0) {
        setSheetId(result.data.sheets[0].id);
        loadEntries(result.data.sheets[0].id);
      }
    } catch (error) {
      console.error("Error loading sheets:", error);
    }
  };

  const loadEntries = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const result = await forexAPI.getSheetEntries(id, { limit: 100 });
      setRows(result.data.entries || []);
    } catch (error) {
      toast.error("Failed to load entries");
    } finally {
      setLoading(false);
    }
  };

  const addRow = () => {
    const newRow = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      particulars: "",
      debitRMB: "",
      creditRMB: "",
      debitUSD: "",
      creditUSD: "",
    };
    setRows([...rows, newRow]);
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const deleteRow = (id) => {
    if (!confirm("Delete this entry?")) return;
    setRows(rows.filter((r) => r.id !== id));
  };

  const saveRow = async (row) => {
    if (!sheetId) {
      toast.error("No sheet selected");
      return;
    }

    const entryData = {
      date: row.date,
      particulars: row.particulars,
      debitRMB: row.debitRMB ? parseFloat(row.debitRMB) : null,
      creditRMB: row.creditRMB ? parseFloat(row.creditRMB) : null,
      debitUSD: row.debitUSD ? parseFloat(row.debitUSD) : null,
      creditUSD: row.creditUSD ? parseFloat(row.creditUSD) : null,
    };

    try {
      if (row.id.startsWith("temp_")) {
        // New entry
        await forexAPI.addEntry(sheetId, entryData);
        toast.success("Entry added");
        loadEntries(sheetId);
      } else {
        // Update existing
        await forexAPI.updateEntry(row.id, entryData);
        toast.success("Entry updated");
      }
    } catch (error) {
      toast.error("Failed to save");
    }
  };

  const handleExport = async () => {
    if (!sheetId) return;
    try {
      const blob = await forexAPI.exportSheet(sheetId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `forex_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      toast.success("Exported successfully");
    } catch (error) {
      toast.error("Export failed");
    }
  };

  // Calculate totals
  const totals = rows.reduce(
    (acc, r) => ({
      dRMB: acc.dRMB + (Number(r.debitRMB) || 0),
      cRMB: acc.cRMB + (Number(r.creditRMB) || 0),
      dUSD: acc.dUSD + (Number(r.debitUSD) || 0),
      cUSD: acc.cUSD + (Number(r.creditUSD) || 0),
    }),
    { dRMB: 0, cRMB: 0, dUSD: 0, cUSD: 0 }
  );

  const filteredRows = rows.filter((r) =>
    r.particulars?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-200 rounded"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">David Forex</h1>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <FileDown className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={addRow}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
            >
              <Plus className="w-4 h-4" />
              Add Row
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search particulars..."
            className="w-full pl-10 pr-4 py-2 border rounded"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Totals */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-600">RMB Debit</div>
            <div className="font-bold text-red-600">
              ¥{totals.dRMB.toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-600">RMB Credit</div>
            <div className="font-bold text-green-600">
              ¥{totals.cRMB.toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-600">USD Debit</div>
            <div className="font-bold text-red-600">
              ${totals.dUSD.toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-600">USD Credit</div>
            <div className="font-bold text-green-600">
              ${totals.cUSD.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr className="text-left text-sm">
              <th className="p-3 w-28">Date</th>
              <th className="p-3">Particulars</th>
              <th className="p-3 w-32 text-center">Debit RMB</th>
              <th className="p-3 w-32 text-center">Credit RMB</th>
              <th className="p-3 w-32 text-center">Debit USD</th>
              <th className="p-3 w-32 text-center">Credit USD</th>
              <th className="p-3 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  No entries found. Click "Add Row" to start.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id} className="border-b hover:bg-gray-50">
                  {/* Date */}
                  <td className="p-2">
                    <input
                      type="date"
                      className="w-full p-1 border rounded text-sm"
                      value={row.date}
                      onChange={(e) =>
                        updateRow(row.id, "date", e.target.value)
                      }
                    />
                  </td>

                  {/* Particulars */}
                  <td className="p-2">
                    <textarea
                      rows={2}
                      className="w-full p-1 border rounded text-sm"
                      placeholder="Enter description..."
                      value={row.particulars}
                      onChange={(e) =>
                        updateRow(row.id, "particulars", e.target.value)
                      }
                    />
                  </td>

                  {/* Debit RMB */}
                  <td className="p-2">
                    <div className="relative">
                      <span className="absolute left-2 top-2 text-sm">¥</span>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full pl-6 pr-2 py-1 border rounded text-right"
                        placeholder="0.00"
                        value={row.debitRMB}
                        onChange={(e) =>
                          updateRow(row.id, "debitRMB", e.target.value)
                        }
                      />
                    </div>
                  </td>

                  {/* Credit RMB */}
                  <td className="p-2">
                    <div className="relative">
                      <span className="absolute left-2 top-2 text-sm">¥</span>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full pl-6 pr-2 py-1 border rounded text-right"
                        placeholder="0.00"
                        value={row.creditRMB}
                        onChange={(e) =>
                          updateRow(row.id, "creditRMB", e.target.value)
                        }
                      />
                    </div>
                  </td>

                  {/* Debit USD */}
                  <td className="p-2">
                    <div className="relative">
                      <span className="absolute left-2 top-2 text-sm">$</span>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full pl-6 pr-2 py-1 border rounded text-right"
                        placeholder="0.00"
                        value={row.debitUSD}
                        onChange={(e) =>
                          updateRow(row.id, "debitUSD", e.target.value)
                        }
                      />
                    </div>
                  </td>

                  {/* Credit USD */}
                  <td className="p-2">
                    <div className="relative">
                      <span className="absolute left-2 top-2 text-sm">$</span>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full pl-6 pr-2 py-1 border rounded text-right"
                        placeholder="0.00"
                        value={row.creditUSD}
                        onChange={(e) =>
                          updateRow(row.id, "creditUSD", e.target.value)
                        }
                      />
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="p-2">
                    <div className="flex gap-1">
                      <button
                        onClick={() => saveRow(row)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                        title="Save"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteRow(row.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Summary Row */}
        <div className="bg-gray-800 text-white p-3">
          <div className="flex justify-between">
            <div>Total ({filteredRows.length} entries)</div>
            <div className="flex gap-6">
              <div>RMB: ¥{(totals.dRMB - totals.cRMB).toLocaleString()}</div>
              <div>USD: ${(totals.dUSD - totals.cUSD).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
