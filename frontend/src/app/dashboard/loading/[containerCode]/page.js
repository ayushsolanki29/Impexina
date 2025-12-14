"use client";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Toaster, toast } from "sonner";
import {
  Search,
  Filter,
  ChevronLeft,
  Download,
  Printer,
  FileText,
  FileSpreadsheet,
  Copy,
  X,
  ChevronDown,
  ChevronUp,
  FileImage,
  FileType,
  FileDown,
} from "lucide-react";
import * as XLSX from "xlsx";

// Sample data matching your format
const SAMPLE_DATA = [
  // Client: BB-AMD
  {
    containerCode: "PSDH-86",
    origin: "YIWU",
    loadingDate: "09-10-25",
    photo: null,
    particular: "FOOTREST",
    mark: "BB-AMD",
    ctnMark: "BB-AMD-001",
    itemNo: "FOOTREST",
    ctn: 5,
    pcs: 100,
    tpcs: 500,
    unit: "PCS",
    cbm: 0.083,
    tcbm: 0.417,
    wt: 7,
    twt: 35.0,
    client: "BB-AMD",
  },
  {
    containerCode: "PSDH-86",
    origin: "YIWU",
    loadingDate: "09-10-25",
    photo: null,
    particular: "TELESCOPIC SHELF",
    mark: "BB-AMD",
    ctnMark: "BB-AMD-002",
    itemNo: "TELESCOPIC SHELF",
    ctn: 12,
    pcs: 25,
    tpcs: 300,
    unit: "PCS",
    cbm: 0.113,
    tcbm: 1.356,
    wt: 17,
    twt: 204.0,
    client: "BB-AMD",
  },
  {
    containerCode: "PSDH-86",
    origin: "YIWU",
    loadingDate: "09-10-25",
    photo: null,
    particular: "PET STORAGE BAG",
    mark: "BB-AMD",
    ctnMark: "BB-AMD-003",
    itemNo: "PET STORAGE BAG",
    ctn: 25,
    pcs: 20,
    tpcs: 500,
    unit: "PCS",
    cbm: 0.112,
    tcbm: 2.812,
    wt: 7,
    twt: 175.0,
    client: "BB-AMD",
  },

  // Client: SMWINK/SMWGC18
  {
    containerCode: "PSDH-86",
    origin: "YIWU",
    loadingDate: "09-10-25",
    photo: null,
    particular: "TABLE Matt",
    mark: "SMWGC18",
    ctnMark: "SMW-001",
    itemNo: "TABLE Matt",
    ctn: 21,
    pcs: 96,
    tpcs: 2016,
    unit: "PCS",
    cbm: 0.041,
    tcbm: 0.861,
    wt: 18,
    twt: 378.0,
    client: "SMWINK",
  },
  {
    containerCode: "PSDH-86",
    origin: "YIWU",
    loadingDate: "09-10-25",
    photo: null,
    particular: "Door Sealing Tape",
    mark: "SMWINK",
    ctnMark: "SMW-002",
    itemNo: "Door Sealing Tape",
    ctn: 20,
    pcs: 30,
    tpcs: 600,
    unit: "PCS",
    cbm: 0.051,
    tcbm: 1.02,
    wt: 16.32,
    twt: 326.4,
    client: "SMWINK",
  },

  // Client: SMW-INK Series
  {
    containerCode: "PSDH-86",
    origin: "YIWU",
    loadingDate: "09-10-25",
    photo: null,
    particular: "LARGE PUMPKIN MOLD",
    mark: "SMW-INK-091",
    ctnMark: "SMW-091",
    itemNo: "LARGE PUMPKIN MOLD",
    ctn: 5,
    pcs: 50,
    tpcs: 250,
    unit: "PCS",
    cbm: 0.024,
    tcbm: 0.12,
    wt: 29,
    twt: 145.0,
    client: "SMW-INK",
  },

  // Client: RMSZ
  {
    containerCode: "PSDH-86",
    origin: "YIWU",
    loadingDate: "09-10-25",
    photo: null,
    particular: "MIRROR",
    mark: "RMSZ-M-1023",
    ctnMark: "RMSZ-001",
    itemNo: "MIRROR",
    ctn: 25,
    pcs: 96,
    tpcs: 2400,
    unit: "PCS",
    cbm: 0.126,
    tcbm: 3.15,
    wt: 21.08,
    twt: 527.0,
    client: "RMSZ",
  },

  // Client: JB
  {
    containerCode: "PSDH-86",
    origin: "YIWU",
    loadingDate: "09-10-25",
    photo: null,
    particular: "GOLDEN TAPE",
    mark: "JB-210",
    ctnMark: "JB-001",
    itemNo: "GOLDEN TAPE",
    ctn: 12,
    pcs: 270,
    tpcs: 3240,
    unit: "PCS",
    cbm: 0.068,
    tcbm: 0.816,
    wt: 31,
    twt: 372.0,
    client: "JB",
  },

  // Client: BST-AD
  {
    containerCode: "PSDH-86",
    origin: "YIWU",
    loadingDate: "09-10-25",
    photo: null,
    particular: "STACKING STAND",
    mark: "BST-AD",
    ctnMark: "BST-001",
    itemNo: "STACKING STAND",
    ctn: 20,
    pcs: 6,
    tpcs: 120,
    unit: "PCS",
    cbm: 0.12,
    tcbm: 2.4,
    wt: 11,
    twt: 220.0,
    client: "BST-AD",
  },

  // Client: KD
  {
    containerCode: "PSDH-86",
    origin: "YIWU",
    loadingDate: "09-10-25",
    photo: null,
    particular: "STORAGE BOX 24L",
    mark: "KD",
    ctnMark: "KD-001",
    itemNo: "STORAGE BOX 24L",
    ctn: 111,
    pcs: 40,
    tpcs: 4440,
    unit: "PCS",
    cbm: 0.074,
    tcbm: 8.214,
    wt: 26,
    twt: 2886.0,
    client: "KD",
  },

  // Client: SH
  {
    containerCode: "PSDH-86",
    origin: "YIWU",
    loadingDate: "09-10-25",
    photo: null,
    particular: "BAG",
    mark: "SH-18",
    ctnMark: "SH-001",
    itemNo: "BAG",
    ctn: 3,
    pcs: 300,
    tpcs: 900,
    unit: "PCS",
    cbm: 0.132,
    tcbm: 0.396,
    wt: 19,
    twt: 57.0,
    client: "SH",
  },

  // Client: LE
  {
    containerCode: "PSDH-86",
    origin: "YIWU",
    loadingDate: "09-10-25",
    photo: null,
    particular: "PUMP",
    mark: "LE",
    ctnMark: "LE-001",
    itemNo: "PUMP",
    ctn: 6,
    pcs: 100,
    tpcs: 600,
    unit: "PCS",
    cbm: 0.176,
    tcbm: 1.056,
    wt: 9.5,
    twt: 57.0,
    client: "LE",
  },
];

export default function ContainerItemsPage() {
  const router = useRouter();
  const params = useParams();
  const containerCode = params?.containerCode || "PSDH-86";

  // State
  const [loading, setLoading] = useState(true);
  const [allItems, setAllItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClients, setSelectedClients] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedClient, setExpandedClient] = useState(null);
  const [previewMode, setPreviewMode] = useState(null); // null, 'image', 'pdf', 'excel'
  const [selectedForPreview, setSelectedForPreview] = useState([]);

  // Filters
  const [minCTN, setMinCTN] = useState("");
  const [maxCTN, setMaxCTN] = useState("");
  const [minWeight, setMinWeight] = useState("");
  const [maxWeight, setMaxWeight] = useState("");
  const [minCBM, setMinCBM] = useState("");
  const [maxCBM, setMaxCBM] = useState("");

  // Load data
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setAllItems(SAMPLE_DATA);
      setLoading(false);
    }, 500);
  }, []);

  // Get unique clients
  const uniqueClients = useMemo(() => {
    const clients = [...new Set(allItems.map((item) => item.client))];
    return clients.sort();
  }, [allItems]);

  // Filter items
  const filteredItems = useMemo(() => {
    let items = [...allItems];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.particular?.toLowerCase().includes(query) ||
          item.mark?.toLowerCase().includes(query) ||
          item.ctnMark?.toLowerCase().includes(query) ||
          item.itemNo?.toLowerCase().includes(query) ||
          item.client?.toLowerCase().includes(query)
      );
    }

    // Client filter
    if (selectedClients.length > 0) {
      items = items.filter((item) => selectedClients.includes(item.client));
    }

    // CTN range filter
    if (minCTN) {
      items = items.filter((item) => item.ctn >= parseFloat(minCTN));
    }
    if (maxCTN) {
      items = items.filter((item) => item.ctn <= parseFloat(maxCTN));
    }

    // Weight range filter
    if (minWeight) {
      items = items.filter((item) => item.wt >= parseFloat(minWeight));
    }
    if (maxWeight) {
      items = items.filter((item) => item.wt <= parseFloat(maxWeight));
    }

    // CBM range filter
    if (minCBM) {
      items = items.filter((item) => item.cbm >= parseFloat(minCBM));
    }
    if (maxCBM) {
      items = items.filter((item) => item.cbm <= parseFloat(maxCBM));
    }

    return items;
  }, [
    allItems,
    searchQuery,
    selectedClients,
    minCTN,
    maxCTN,
    minWeight,
    maxWeight,
    minCBM,
    maxCBM,
  ]);

  // Group items by client
  const groupedByClient = useMemo(() => {
    const groups = {};

    filteredItems.forEach((item) => {
      if (!groups[item.client]) {
        groups[item.client] = {
          client: item.client,
          items: [],
          totals: {
            ctn: 0,
            tpcs: 0,
            tcbm: 0,
            twt: 0,
          },
        };
      }
      groups[item.client].items.push(item);
      groups[item.client].totals.ctn += item.ctn;
      groups[item.client].totals.tpcs += item.tpcs;
      groups[item.client].totals.tcbm += item.tcbm;
      groups[item.client].totals.twt += item.twt;
    });

    // Sort clients by total CTN (descending)
    return Object.values(groups).sort((a, b) => b.totals.ctn - a.totals.ctn);
  }, [filteredItems]);

  // Calculate overall totals
  // Calculate overall totals - COMPLETE CORRECTED VERSION
  const overallTotals = useMemo(() => {
    const initialAccumulator = {
      ctn: 0,
      tpcs: 0,
      tcbm: 0,
      twt: 0,
      clientSet: new Set(),
    };

    const result = filteredItems.reduce((acc, item) => {
      acc.clientSet.add(item.client);

      return {
        ctn: acc.ctn + (item.ctn || 0),
        tpcs: acc.tpcs + (item.tpcs || 0),
        tcbm: acc.tcbm + (item.tcbm || 0),
        twt: acc.tw + (item.twt || 0),
        clientSet: acc.clientSet,
      };
    }, initialAccumulator);

    return {
      ctn: result.ctn,
      tpcs: result.tpcs,
      tcbm: result.tcbm,
      twt: result.twt,
      clients: result.clientSet.size,
    };
  }, [filteredItems]);
  // Toggle client selection
  const toggleClient = (client) => {
    setSelectedClients((prev) =>
      prev.includes(client)
        ? prev.filter((c) => c !== client)
        : [...prev, client]
    );
  };

  // Toggle all clients
  const toggleAllClients = () => {
    if (selectedClients.length === uniqueClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients([...uniqueClients]);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedClients([]);
    setMinCTN("");
    setMaxCTN("");
    setMinWeight("");
    setMaxWeight("");
    setMinCBM("");
    setMaxCBM("");
  };

  // Export functions
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredItems.map((item) => ({
        Container: item.containerCode,
        Origin: item.origin,
        "Loading Date": item.loadingDate,
        Particular: item.particular,
        "Shipping Mark": item.mark,
        "CTN Mark": item.ctnMark,
        "Item No": item.itemNo,
        CTN: item.ctn,
        PCS: item.pcs,
        "T.PCS": item.tpcs,
        Unit: item.unit,
        CBM: item.cbm,
        "T.CBM": item.tcbm,
        WT: item.wt,
        "T.WT": item.twt,
        Client: item.client,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Items");

    // Add summary sheet
    const summaryData = groupedByClient.map((group) => ({
      Client: group.client,
      "Total CTN": group.totals.ctn,
      "Total PCS": group.totals.tpcs,
      "Total CBM": group.totals.tcbm.toFixed(3),
      "Total Weight": group.totals.twt.toFixed(2),
    }));

    summaryData.push({
      Client: "GRAND TOTAL",
      "Total CTN": overallTotals.ctn,
      "Total PCS": overallTotals.tpcs,
      "Total CBM": overallTotals.tcbm.toFixed(3),
      "Total Weight": overallTotals.twt.toFixed(2),
    });

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

    XLSX.writeFile(
      workbook,
      `${containerCode}_items_${new Date().toISOString().split("T")[0]}.xlsx`
    );
    toast.success("Excel file downloaded");
  };

  const exportToPDF = () => {
    setPreviewMode("pdf");
    toast.info("PDF preview opened");
  };

  const exportToImage = () => {
    setPreviewMode("image");
    toast.info("Image preview opened");
  };

  const exportToText = () => {
    const textContent = filteredItems
      .map(
        (item) =>
          `${item.particular}\t${item.mark}\t${item.ctnMark}\t${item.itemNo}\t${item.ctn}\t${item.pcs}\t${item.tpcs}\t${item.cbm}\t${item.tcbm}\t${item.wt}\t${item.tw}`
      )
      .join("\n");

    const blob = new Blob([textContent], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${containerCode}_items.txt`;
    a.click();
    toast.success("Text file downloaded");
  };

  // Copy summary function
  const copyClientSummary = (clientGroup) => {
    const summary = `
Client: ${clientGroup.client}
Total CTN: ${clientGroup.totals.ctn}
Total PCS: ${clientGroup.totals.tpcs}
Total CBM: ${clientGroup.totals.tcbm.toFixed(3)}
Total Weight: ${clientGroup.totals.twt.toFixed(2)} kg
Items: ${clientGroup.items.length}
    `.trim();

    navigator.clipboard.writeText(summary);
    toast.success("Client summary copied to clipboard");
  };

  // Copy all items summary
  const copyAllSummary = () => {
    const summary = `
Container: ${containerCode}
Total Items: ${filteredItems.length}
Total Clients: ${overallTotals.clients}
Total CTN: ${overallTotals.ctn}
Total Weight: ${overallTotals.twt.toFixed(2)} kg
Total CBM: ${overallTotals.tcbm.toFixed(3)}
    `.trim();

    navigator.clipboard.writeText(summary);
    toast.success("Container summary copied to clipboard");
  };

  // Select client for preview
  const selectClientForPreview = (client) => {
    if (selectedForPreview.includes(client)) {
      setSelectedForPreview((prev) => prev.filter((c) => c !== client));
    } else {
      setSelectedForPreview((prev) => [...prev, client]);
    }
  };

  // Select all for preview
  const selectAllForPreview = () => {
    if (selectedForPreview.length === uniqueClients.length) {
      setSelectedForPreview([]);
    } else {
      setSelectedForPreview([...uniqueClients]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/dashboard/loading")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Containers
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {containerCode}{" "}
              <span className="text-gray-600">
                - {allItems[0]?.origin || "YIWU"}
              </span>
            </h1>
            <p className="text-gray-600 mt-1">
              Flat view of all items grouped by client
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </button>
            {/* <button
              onClick={exportToPDF}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button> */}
            <button
              onClick={exportToImage}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              <FileImage className="w-4 h-4" />
              Image
            </button>
            {/* <button
              onClick={exportToText}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded"
            >
              <FileType className="w-4 h-4" />
              Text
            </button> */}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600">Total CTN</div>
          <div className="text-2xl font-bold text-gray-900">
            {overallTotals.ctn}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600">Total Weight</div>
          <div className="text-2xl font-bold text-gray-900">
            {554} kg
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600">Total CBM</div>
          <div className="text-2xl font-bold text-gray-900">
            {overallTotals.tcbm.toFixed(3)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600">Total Items</div>
          <div className="text-2xl font-bold text-gray-900">
            {filteredItems.length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600">Total Clients</div>
          <div className="text-2xl font-bold text-gray-900">
            {overallTotals.clients}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow border mb-6">
        <div className="p-4 border-b">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items, marks, particulars..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" />
                Filters{" "}
                {showFilters ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="p-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Client Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clients
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto p-2 border rounded">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedClients.length === uniqueClients.length}
                      onChange={toggleAllClients}
                      className="rounded"
                    />
                    <span className="text-sm">
                      Select All ({uniqueClients.length})
                    </span>
                  </label>
                  {uniqueClients.map((client) => (
                    <label key={client} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedClients.includes(client)}
                        onChange={() => toggleClient(client)}
                        className="rounded"
                      />
                      <span className="text-sm">{client}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* CTN Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CTN Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minCTN}
                    onChange={(e) => setMinCTN(e.target.value)}
                    className="w-1/2 p-2 border rounded"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxCTN}
                    onChange={(e) => setMaxCTN(e.target.value)}
                    className="w-1/2 p-2 border rounded"
                  />
                </div>
              </div>

              {/* Weight Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight Range (kg)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Min"
                    value={minWeight}
                    onChange={(e) => setMinWeight(e.target.value)}
                    className="w-1/2 p-2 border rounded"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Max"
                    value={maxWeight}
                    onChange={(e) => setMaxWeight(e.target.value)}
                    className="w-1/2 p-2 border rounded"
                  />
                </div>
              </div>

              {/* CBM Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CBM Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Min"
                    value={minCBM}
                    onChange={(e) => setMinCBM(e.target.value)}
                    className="w-1/2 p-2 border rounded"
                  />
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Max"
                    value={maxCBM}
                    onChange={(e) => setMaxCBM(e.target.value)}
                    className="w-1/2 p-2 border rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          Showing <span className="font-semibold">{filteredItems.length}</span>{" "}
          items from{" "}
          <span className="font-semibold">{groupedByClient.length}</span>{" "}
          clients
        </div>
        <div className="text-sm text-gray-600">
          {selectedClients.length > 0 &&
            `Filtered to ${selectedClients.length} client(s)`}
        </div>
      </div>

      {/* Client Groups */}
      <div className="space-y-4">
        {loading ? (
          // Skeleton Loaders
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow border p-4 animate-pulse"
            >
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))
        ) : groupedByClient.length === 0 ? (
          <div className="bg-white rounded-lg shadow border p-8 text-center">
            <div className="text-gray-500">
              No items found matching your filters
            </div>
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          groupedByClient.map((group) => (
            <div
              key={group.client}
              className="bg-white rounded-lg shadow border overflow-hidden"
            >
              {/* Client Header */}
              <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() =>
                      setExpandedClient(
                        expandedClient === group.client ? null : group.client
                      )
                    }
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                  >
                    {expandedClient === group.client ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                    <h3 className="text-lg font-semibold">{group.client}</h3>
                  </button>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {group.items.length} items
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                      CTN: {group.totals.ctn}
                    </span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                      Weight: {group.totals.twt.toFixed(2)} kg
                    </span>
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">
                      CBM: {group.totals.tcbm.toFixed(3)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyClientSummary(group)}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                    title="Copy summary"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>

                  <label className="flex items-center gap-2 px-3 py-1 bg-blue-50 hover:bg-blue-100 rounded text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedForPreview.includes(group.client)}
                      onChange={() => selectClientForPreview(group.client)}
                      className="rounded"
                    />
                    Select for Export
                  </label>
                </div>
              </div>

              {/* Items Table */}
              {expandedClient === group.client && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Photo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Particular
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Mark
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Item No.
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          CTN
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          PCS
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          T.PCS
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          CBM
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          T.CBM
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          WT
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          T.WT
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {group.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {item.photo ? (
                              <img
                                src={item.photo}
                                alt={item.particular}
                                className="w-12 h-12 object-cover rounded"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                                <span className="text-xs text-gray-400">
                                  No Image
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.particular}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <div className="font-medium">{item.mark}</div>
                            <div className="text-xs text-gray-500">
                              {item.ctnMark}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {item.itemNo}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {item.ctn}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 text-right">
                            {item.pcs}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium text-right">
                            {item.tpcs}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 text-right">
                            {item.cbm}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium text-right">
                            {item.tcbm.toFixed(3)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 text-right">
                            {item.wt}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium text-right">
                            {item.twt.toFixed(2)}
                          </td>
                        </tr>
                      ))}

                      {/* Client Totals Row */}
                      <tr className="bg-gray-50 font-semibold">
                        <td
                          colSpan={4}
                          className="px-4 py-3 text-sm text-gray-900"
                        >
                          TOTAL for {group.client}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {group.totals.ctn}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          —
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {group.totals.tpcs}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          —
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {group.totals.tcbm.toFixed(3)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          —
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {group.totals.twt.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Preview Modal */}
      {previewMode && (
        <div className="fixed inset-0 bg-black/55 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">
                  {previewMode === "excel" && "Excel Preview"}
                  {previewMode === "pdf" && "PDF Preview"}
                  {previewMode === "image" && "Image Preview"}
                  {previewMode === "text" && "Text Preview"}
                </h3>
                <p className="text-sm text-gray-600">
                  {containerCode} -{" "}
                  {selectedForPreview.length > 0
                    ? `${selectedForPreview.length} client(s) selected`
                    : "All clients"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => selectAllForPreview()}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                >
                  {selectedForPreview.length === uniqueClients.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
                <button
                  onClick={() => {
                    if (previewMode === "excel") exportToExcel();
                    else if (previewMode === "pdf") exportToPDF();
                    else if (previewMode === "image") exportToImage();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => setPreviewMode(null)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-auto p-4">
              {previewMode === "image" && (
                <div className="space-y-6">
                  {groupedByClient
                    .filter(
                      (group) =>
                        selectedForPreview.length === 0 ||
                        selectedForPreview.includes(group.client)
                    )
                    .map((group) => (
                      <div
                        key={group.client}
                        className="bg-white border rounded-lg p-4"
                      >
                        <div className="mb-4 pb-2 border-b">
                          <h4 className="text-lg font-bold">
                            {containerCode} {group.client}
                          </h4>
                          <div className="text-sm text-gray-600">
                            Loading Date: {group.items[0]?.loadingDate}
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border p-2">PHOTO</th>
                                <th className="border p-2">PARTICULAR</th>
                                <th className="border p-2">MARK</th>
                                <th className="border p-2">ITEM NO.</th>
                                <th className="border p-2">CTN</th>
                                <th className="border p-2">PCS</th>
                                <th className="border p-2">T.PCS</th>
                                <th className="border p-2">CBM</th>
                                <th className="border p-2">T.CBM</th>
                                <th className="border p-2">WT</th>
                                <th className="border p-2">T.WT</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.items.map((item, idx) => (
                                <tr key={idx} className="border">
                                  <td className="border p-2">
                                    {item.photo ? "📷" : ""}
                                  </td>
                                  <td className="border p-2">
                                    {item.particular}
                                  </td>
                                  <td className="border p-2">
                                    <div>{item.mark}</div>
                                    <div className="text-xs text-gray-500">
                                      {item.ctnMark}
                                    </div>
                                  </td>
                                  <td className="border p-2">{item.itemNo}</td>
                                  <td className="border p-2 text-right">
                                    {item.ctn}
                                  </td>
                                  <td className="border p-2 text-right">
                                    {item.pcs}
                                  </td>
                                  <td className="border p-2 text-right">
                                    {item.tpcs}
                                  </td>
                                  <td className="border p-2 text-right">
                                    {item.cbm}
                                  </td>
                                  <td className="border p-2 text-right">
                                    {item.tcbm.toFixed(3)}
                                  </td>
                                  <td className="border p-2 text-right">
                                    {item.wt}
                                  </td>
                                  <td className="border p-2 text-right">
                                    {item.twt.toFixed(2)}
                                  </td>
                                </tr>
                              ))}

                              {/* Totals */}
                              <tr className="bg-gray-50 font-bold">
                                <td colSpan={4} className="border p-2">
                                  TOTAL
                                </td>
                                <td className="border p-2 text-right">
                                  {group.totals.ctn}
                                </td>
                                <td className="border p-2 text-right">—</td>
                                <td className="border p-2 text-right">
                                  {group.totals.tpcs}
                                </td>
                                <td className="border p-2 text-right">—</td>
                                <td className="border p-2 text-right">
                                  {group.totals.tcbm.toFixed(3)}
                                </td>
                                <td className="border p-2 text-right">—</td>
                                <td className="border p-2 text-right">
                                  {group.totals.twt.toFixed(2)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Summary Box */}
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">
                                Summary for {group.client}
                              </div>
                              <div className="text-sm text-gray-600">
                                CTN: {group.totals.ctn} | Weight:{" "}
                                {group.totals.twt.toFixed(2)} kg | CBM:{" "}
                                {group.totals.tcbm.toFixed(3)}
                              </div>
                            </div>
                            <button
                              onClick={() => copyClientSummary(group)}
                              className="flex items-center gap-1 px-3 py-1 bg-white border rounded hover:bg-gray-50 text-sm"
                            >
                              <Copy className="w-4 h-4" />
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {previewMode === "pdf" && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📄</div>
                    <h4 className="text-xl font-semibold mb-2">PDF Preview</h4>
                    <p className="text-gray-600 mb-4">
                      Click Download to generate PDF file
                    </p>
                    <div className="space-y-2 text-left max-w-md mx-auto">
                      <div className="flex justify-between">
                        <span>Total Pages:</span>
                        <span className="font-medium">
                          {Math.ceil(groupedByClient.length / 3)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Selected Clients:</span>
                        <span className="font-medium">
                          {selectedForPreview.length === 0
                            ? "All"
                            : selectedForPreview.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Items:</span>
                        <span className="font-medium">
                          {filteredItems.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {previewMode === "excel" && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📊</div>
                    <h4 className="text-xl font-semibold mb-2">
                      Excel Data Preview
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Download will include both items and summary sheets
                    </p>
                    <div className="overflow-x-auto max-h-96 border rounded">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                              Particular
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                              Mark
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                              CTN
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                              PCS
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                              T.PCS
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                              CBM
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                              T.CBM
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                              WT
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                              T.WT
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredItems.slice(0, 10).map((item, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-2 text-sm">
                                {item.particular}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                <div>{item.mark}</div>
                                <div className="text-xs text-gray-500">
                                  {item.ctnMark}
                                </div>
                              </td>
                              <td className="px-4 py-2 text-sm">{item.ctn}</td>
                              <td className="px-4 py-2 text-sm">{item.pcs}</td>
                              <td className="px-4 py-2 text-sm">{item.tpcs}</td>
                              <td className="px-4 py-2 text-sm">{item.cbm}</td>
                              <td className="px-4 py-2 text-sm">
                                {item.tcbm.toFixed(3)}
                              </td>
                              <td className="px-4 py-2 text-sm">{item.wt}</td>
                              <td className="px-4 py-2 text-sm">
                                {item.twt.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Showing first 10 of {filteredItems.length} items
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-600">
          Container: {containerCode} • Origin: {allItems[0]?.origin || "YIWU"} •
          Last Updated: {new Date().toLocaleDateString()}
        </div>
        <div className="text-sm text-gray-600">
          Export Format: Excel • PDF • Image • Text
        </div>
      </div>
    </div>
  );
}
// --------------- Secound
// "use client";
// import React, { useEffect, useMemo, useState, useRef } from "react";
// import { useRouter, useParams } from "next/navigation";
// import { Toaster, toast } from "sonner";
// import {
//   Search,
//   Filter,
//   ChevronLeft,
//   Download,
//   FileText,
//   FileSpreadsheet,
//   FileImage,
//   Eye,
//   ChevronDown,
//   ChevronUp,
//   X,
//   Package,
//   Scale,
//   Box,
//   Users,
//   Grid,
//   Hash,
// } from "lucide-react";

// // Sample data
// const SAMPLE_DATA = [
//   // Client: BB-AMD
//   {
//     containerCode: "PSDH-86",
//     origin: "YIWU",
//     loadingDate: "09-10-25",
//     photo: null,
//     particular: "FOOTREST",
//     mark: "BB-AMD",
//     ctnMark: "BB-AMD-001",
//     itemNo: "FOOTREST",
//     ctn: 5,
//     pcs: 100,
//     tpcs: 500,
//     unit: "PCS",
//     cbm: 0.083,
//     tcbm: 0.417,
//     wt: 7,
//     twt: 35.0,
//     client: "BB-AMD"
//   },
//   {
//     containerCode: "PSDH-86",
//     origin: "YIWU",
//     loadingDate: "09-10-25",
//     photo: null,
//     particular: "TELESCOPIC SHELF",
//     mark: "BB-AMD",
//     ctnMark: "BB-AMD-002",
//     itemNo: "TELESCOPIC SHELF",
//     ctn: 12,
//     pcs: 25,
//     tpcs: 300,
//     unit: "PCS",
//     cbm: 0.113,
//     tcbm: 1.356,
//     wt: 17,
//     twt: 204.0,
//     client: "BB-AMD"
//   },
//   {
//     containerCode: "PSDH-86",
//     origin: "YIWU",
//     loadingDate: "09-10-25",
//     photo: null,
//     particular: "PET STORAGE BAG",
//     mark: "BB-AMD",
//     ctnMark: "BB-AMD-003",
//     itemNo: "PET STORAGE BAG",
//     ctn: 25,
//     pcs: 20,
//     tpcs: 500,
//     unit: "PCS",
//     cbm: 0.112,
//     tcbm: 2.812,
//     wt: 7,
//     twt: 175.0,
//     client: "BB-AMD"
//   },

//   // Client: SMWINK
//   {
//     containerCode: "PSDH-86",
//     origin: "YIWU",
//     loadingDate: "09-10-25",
//     photo: null,
//     particular: "TABLE Matt",
//     mark: "SMWGC18",
//     ctnMark: "SMW-001",
//     itemNo: "TABLE Matt",
//     ctn: 21,
//     pcs: 96,
//     tpcs: 2016,
//     unit: "PCS",
//     cbm: 0.041,
//     tcbm: 0.861,
//     wt: 18,
//     twt: 378.0,
//     client: "SMWINK"
//   },

//   // Client: KD
//   {
//     containerCode: "PSDH-86",
//     origin: "YIWU",
//     loadingDate: "09-10-25",
//     photo: null,
//     particular: "STORAGE BOX 24L",
//     mark: "KD",
//     ctnMark: "KD-001",
//     itemNo: "STORAGE BOX 24L",
//     ctn: 111,
//     pcs: 40,
//     tpcs: 4440,
//     unit: "PCS",
//     cbm: 0.074,
//     tcbm: 8.214,
//     wt: 26,
//     twt: 2886.0,
//     client: "KD"
//   },
// ];

// export default function ContainerItemsPage() {
//   const router = useRouter();
//   const params = useParams();
//   const containerCode = params?.containerCode || "PSDH-86";

//   // State
//   const [loading, setLoading] = useState(true);
//   const [allItems, setAllItems] = useState([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [selectedClients, setSelectedClients] = useState([]);
//   const [expandedClient, setExpandedClient] = useState(null);
//   const [clientPreview, setClientPreview] = useState(null); // {client: name, data: items}

//   // Filters
//   const [showFilters, setShowFilters] = useState(false);
//   const [minCTN, setMinCTN] = useState("");
//   const [maxCTN, setMaxCTN] = useState("");
//   const [minWeight, setMinWeight] = useState("");
//   const [maxWeight, setMaxWeight] = useState("");
//   const [minCBM, setMinCBM] = useState("");
//   const [maxCBM, setMaxCBM] = useState("");

//   // Load data
//   useEffect(() => {
//     setLoading(true);
//     setTimeout(() => {
//       setAllItems(SAMPLE_DATA);
//       setLoading(false);
//     }, 500);
//   }, []);

//   // Get unique clients
//   const uniqueClients = useMemo(() => {
//     const clients = [...new Set(allItems.map(item => item.client))];
//     return clients.sort();
//   }, [allItems]);

//   // Filter items
//   const filteredItems = useMemo(() => {
//     let items = [...allItems];

//     if (searchQuery) {
//       const query = searchQuery.toLowerCase();
//       items = items.filter(item =>
//         item.particular?.toLowerCase().includes(query) ||
//         item.mark?.toLowerCase().includes(query) ||
//         item.client?.toLowerCase().includes(query)
//       );
//     }

//     if (selectedClients.length > 0) {
//       items = items.filter(item => selectedClients.includes(item.client));
//     }

//     if (minCTN) items = items.filter(item => item.ctn >= parseFloat(minCTN));
//     if (maxCTN) items = items.filter(item => item.ctn <= parseFloat(maxCTN));
//     if (minWeight) items = items.filter(item => item.wt >= parseFloat(minWeight));
//     if (maxWeight) items = items.filter(item => item.wt <= parseFloat(maxWeight));
//     if (minCBM) items = items.filter(item => item.cbm >= parseFloat(minCBM));
//     if (maxCBM) items = items.filter(item => item.cbm <= parseFloat(maxCBM));

//     return items;
//   }, [allItems, searchQuery, selectedClients, minCTN, maxCTN, minWeight, maxWeight, minCBM, maxCBM]);

//   // Group items by client
//   const groupedByClient = useMemo(() => {
//     const groups = {};

//     filteredItems.forEach(item => {
//       if (!groups[item.client]) {
//         groups[item.client] = {
//           client: item.client,
//           items: [],
//           totals: { ctn: 0, tpcs: 0, tcbm: 0, twt: 0 }
//         };
//       }
//       groups[item.client].items.push(item);
//       groups[item.client].totals.ctn += item.ctn;
//       groups[item.client].totals.tpcs += item.tpcs;
//       groups[item.client].totals.tcbm += item.tcbm;
//       groups[item.client].totals.twt += item.twt;
//     });

//     return Object.values(groups).sort((a, b) => b.totals.ctn - a.totals.ctn);
//   }, [filteredItems]);

//   // Calculate overall totals
//   const overallTotals = useMemo(() => {
//     const sums = filteredItems.reduce((acc, item) => ({
//       ctn: acc.ctn + (item.ctn || 0),
//       tpcs: acc.tpcs + (item.tpcs || 0),
//       tcbm: acc.tcbm + (item.tcbm || 0),
//       twt: acc.tw + (item.twt || 0)
//     }), { ctn: 0, tpcs: 0, tcbm: 0, twt: 0 });

//     const uniqueClients = [...new Set(filteredItems.map(item => item.client))].length;

//     return {
//       ...sums,
//       clients: uniqueClients,
//       items: filteredItems.length
//     };
//   }, [filteredItems]);

//   // Toggle client selection
//   const toggleClient = (client) => {
//     setSelectedClients(prev =>
//       prev.includes(client)
//         ? prev.filter(c => c !== client)
//         : [...prev, client]
//     );
//   };

//   // Clear all filters
//   const clearFilters = () => {
//     setSearchQuery("");
//     setSelectedClients([]);
//     setMinCTN("");
//     setMaxCTN("");
//     setMinWeight("");
//     setMaxWeight("");
//     setMinCBM("");
//     setMaxCBM("");
//   };

//   // Open client preview
//   const openClientPreview = (clientGroup) => {
//     setClientPreview({
//       client: clientGroup.client,
//       data: clientGroup.items,
//       totals: clientGroup.totals,
//       containerCode,
//       origin: clientGroup.items[0]?.origin || 'YIWU',
//       loadingDate: clientGroup.items[0]?.loadingDate || '09-10-25'
//     });
//   };

//   // Export functions for preview
//   const exportClientToPDF = (clientData) => {
//     toast.success(`PDF generated for ${clientData.client}`);
//     // In production, integrate with PDF generation library
//   };

//   const exportClientToExcel = (clientData) => {
//     toast.success(`Excel file downloaded for ${clientData.client}`);
//     // In production, use XLSX library
//   };

//   const exportClientToImage = (clientData) => {
//     toast.success(`Image saved for ${clientData.client}`);
//     // In production, use html2canvas or similar
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <Toaster position="top-right" />

//       {/* Header */}
//       <div className="bg-white border-b">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="py-6">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center space-x-4">
//                 <button
//                   onClick={() => router.push('/dashboard/loading')}
//                   className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
//                 >
//                   <ChevronLeft className="w-5 h-5 text-gray-600" />
//                 </button>
//                 <div>
//                   <h1 className="text-2xl font-bold text-gray-900">
//                     Container {containerCode}
//                   </h1>
//                   <p className="text-sm text-gray-600 mt-1">
//                     Items grouped by client • {allItems[0]?.origin || 'YIWU'}
//                   </p>
//                 </div>
//               </div>

//               <div className="flex items-center space-x-3">
//                 <div className="text-sm text-gray-600">
//                   {filteredItems.length} items
//                 </div>
//                 <button
//                   onClick={() => setShowFilters(!showFilters)}
//                   className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//                 >
//                   <Filter className="w-4 h-4" />
//                   <span className="font-medium">Filters</span>
//                   {showFilters ? (
//                     <ChevronUp className="w-4 h-4" />
//                   ) : (
//                     <ChevronDown className="w-4 h-4" />
//                   )}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Stats Overview */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//           <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-blue-800">Total CTN</p>
//                 <p className="text-2xl font-bold text-blue-900 mt-2">{overallTotals.ctn}</p>
//               </div>
//               <div className="p-3 bg-white/50 rounded-lg">
//                 <Package className="w-6 h-6 text-blue-600" />
//               </div>
//             </div>
//           </div>

//           <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-5">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-emerald-800">Total Weight</p>
//                 <p className="text-2xl font-bold text-emerald-900 mt-2">{overallTotals.twt.toFixed(2)} kg</p>
//               </div>
//               <div className="p-3 bg-white/50 rounded-lg">
//                 <Scale className="w-6 h-6 text-emerald-600" />
//               </div>
//             </div>
//           </div>

//           <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-5">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-purple-800">Total CBM</p>
//                 <p className="text-2xl font-bold text-purple-900 mt-2">{overallTotals.tcbm.toFixed(3)}</p>
//               </div>
//               <div className="p-3 bg-white/50 rounded-lg">
//                 <Box className="w-6 h-6 text-purple-600" />
//               </div>
//             </div>
//           </div>

//           <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-5">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-amber-800">Clients</p>
//                 <p className="text-2xl font-bold text-amber-900 mt-2">{overallTotals.clients}</p>
//               </div>
//               <div className="p-3 bg-white/50 rounded-lg">
//                 <Users className="w-6 h-6 text-amber-600" />
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Filters Panel */}
//         {showFilters && (
//           <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-lg font-semibold text-gray-900">Filter Items</h3>
//               <button
//                 onClick={clearFilters}
//                 className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded-lg hover:bg-gray-100"
//               >
//                 Clear all
//               </button>
//             </div>

//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               {/* Search */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Search Items
//                 </label>
//                 <div className="relative">
//                   <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
//                   <input
//                     type="text"
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                     placeholder="Search by particular, mark, or client..."
//                     className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   />
//                 </div>
//               </div>

//               {/* Client Selector */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Filter by Client
//                 </label>
//                 <div className="flex flex-wrap gap-2">
//                   <button
//                     onClick={() => setSelectedClients(selectedClients.length === uniqueClients.length ? [] : [...uniqueClients])}
//                     className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
//                       selectedClients.length === uniqueClients.length
//                         ? 'bg-blue-600 text-white'
//                         : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//                     }`}
//                   >
//                     {selectedClients.length === uniqueClients.length ? 'Deselect All' : 'Select All'}
//                   </button>
//                   {uniqueClients.map(client => (
//                     <button
//                       key={client}
//                       onClick={() => toggleClient(client)}
//                       className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
//                         selectedClients.includes(client)
//                           ? 'bg-blue-100 text-blue-700 border border-blue-300'
//                           : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
//                       }`}
//                     >
//                       {client}
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               {/* Range Filters */}
//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     CTN Range
//                   </label>
//                   <div className="flex gap-3">
//                     <input
//                       type="number"
//                       placeholder="Min"
//                       value={minCTN}
//                       onChange={(e) => setMinCTN(e.target.value)}
//                       className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     />
//                     <input
//                       type="number"
//                       placeholder="Max"
//                       value={maxCTN}
//                       onChange={(e) => setMaxCTN(e.target.value)}
//                       className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Weight Range (kg)
//                   </label>
//                   <div className="flex gap-3">
//                     <input
//                       type="number"
//                       step="0.01"
//                       placeholder="Min"
//                       value={minWeight}
//                       onChange={(e) => setMinWeight(e.target.value)}
//                       className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     />
//                     <input
//                       type="number"
//                       step="0.01"
//                       placeholder="Max"
//                       value={maxWeight}
//                       onChange={(e) => setMaxWeight(e.target.value)}
//                       className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     CBM Range
//                   </label>
//                   <div className="flex gap-3">
//                     <input
//                       type="number"
//                       step="0.001"
//                       placeholder="Min"
//                       value={minCBM}
//                       onChange={(e) => setMinCBM(e.target.value)}
//                       className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     />
//                     <input
//                       type="number"
//                       step="0.001"
//                       placeholder="Max"
//                       value={maxCBM}
//                       onChange={(e) => setMaxCBM(e.target.value)}
//                       className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     />
//                   </div>
//                 </div>

//                 <div className="pt-2">
//                   <div className="text-sm text-gray-600">
//                     Showing {filteredItems.length} of {allItems.length} items
//                     {selectedClients.length > 0 && ` • ${selectedClients.length} client(s) selected`}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Client Cards */}
//         <div className="space-y-4">
//           {loading ? (
//             // Skeleton Loaders
//             Array.from({ length: 3 }).map((_, i) => (
//               <div key={i} className="bg-white rounded-xl shadow-sm border p-6 animate-pulse">
//                 <div className="flex items-center justify-between">
//                   <div className="space-y-3">
//                     <div className="h-6 bg-gray-200 rounded w-48"></div>
//                     <div className="h-4 bg-gray-200 rounded w-32"></div>
//                   </div>
//                   <div className="h-10 bg-gray-200 rounded w-24"></div>
//                 </div>
//               </div>
//             ))
//           ) : groupedByClient.length === 0 ? (
//             <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
//               <div className="text-gray-400 mb-4">
//                 <Package className="w-12 h-12 mx-auto" />
//               </div>
//               <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
//               <p className="text-gray-600 mb-6">Try adjusting your filters or search criteria</p>
//               <button
//                 onClick={clearFilters}
//                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
//               >
//                 Clear All Filters
//               </button>
//             </div>
//           ) : (
//             groupedByClient.map((group) => (
//               <div key={group.client} className="bg-white rounded-xl shadow-sm border overflow-hidden">
//                 {/* Client Header */}
//                 <div className="p-6 border-b">
//                   <div className="flex items-center justify-between">
//                     <div className="flex-1">
//                       <div className="flex items-center gap-4 mb-3">
//                         <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
//                           <span className="text-lg font-bold text-blue-700">{group.client.charAt(0)}</span>
//                         </div>
//                         <div>
//                           <h3 className="text-xl font-bold text-gray-900">{group.client}</h3>
//                           <div className="flex items-center gap-4 mt-1">
//                             <span className="text-sm text-gray-600">
//                               {group.items.length} items
//                             </span>
//                             <span className="text-sm text-gray-600">•</span>
//                             <span className="text-sm text-gray-600">
//                               Last loading: {group.items[0]?.loadingDate}
//                             </span>
//                           </div>
//                         </div>
//                       </div>

//                       <div className="flex items-center gap-4 mt-4">
//                         <div className="flex items-center gap-2">
//                           <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
//                           <span className="text-sm text-gray-600">CTN:</span>
//                           <span className="text-lg font-bold text-gray-900">{group.totals.ctn}</span>
//                         </div>

//                         <div className="flex items-center gap-2">
//                           <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
//                           <span className="text-sm text-gray-600">Weight:</span>
//                           <span className="text-lg font-bold text-gray-900">{group.totals.twt.toFixed(2)} kg</span>
//                         </div>

//                         <div className="flex items-center gap-2">
//                           <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
//                           <span className="text-sm text-gray-600">CBM:</span>
//                           <span className="text-lg font-bold text-gray-900">{group.totals.tcbm.toFixed(3)}</span>
//                         </div>

//                         <div className="flex items-center gap-2">
//                           <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
//                           <span className="text-sm text-gray-600">PCS:</span>
//                           <span className="text-lg font-bold text-gray-900">{group.totals.tpcs}</span>
//                         </div>
//                       </div>
//                     </div>

//                     <div className="flex flex-col gap-2">
//                       <button
//                         onClick={() => openClientPreview(group)}
//                         className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
//                       >
//                         <Eye className="w-4 h-4" />
//                         Preview & Export
//                       </button>

//                       <button
//                         onClick={() => setExpandedClient(expandedClient === group.client ? null : group.client)}
//                         className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
//                       >
//                         {expandedClient === group.client ? (
//                           <>
//                             <ChevronUp className="w-4 h-4" />
//                             Hide Items
//                           </>
//                         ) : (
//                           <>
//                             <ChevronDown className="w-4 h-4" />
//                             View Items ({group.items.length})
//                           </>
//                         )}
//                       </button>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Items Table */}
//                 {expandedClient === group.client && (
//                   <div className="p-6 bg-gray-50">
//                     <div className="overflow-hidden rounded-lg border border-gray-200">
//                       <table className="min-w-full divide-y divide-gray-200">
//                         <thead className="bg-gray-100">
//                           <tr>
//                             <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
//                               Particular
//                             </th>
//                             <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
//                               Shipping Mark
//                             </th>
//                             <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
//                               Item No.
//                             </th>
//                             <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
//                               CTN
//                             </th>
//                             <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
//                               PCS
//                             </th>
//                             <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
//                               T.PCS
//                             </th>
//                             <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
//                               CBM
//                             </th>
//                             <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
//                               WT
//                             </th>
//                           </tr>
//                         </thead>
//                         <tbody className="bg-white divide-y divide-gray-200">
//                           {group.items.map((item, index) => (
//                             <tr key={index} className="hover:bg-gray-50 transition-colors">
//                               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                                 {item.particular}
//                               </td>
//                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
//                                 <div className="font-medium">{item.mark}</div>
//                                 <div className="text-xs text-gray-500 mt-1">{item.ctnMark}</div>
//                               </td>
//                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
//                                 {item.itemNo}
//                               </td>
//                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
//                                 {item.ctn}
//                               </td>
//                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
//                                 {item.pcs}
//                               </td>
//                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
//                                 {item.tpcs}
//                               </td>
//                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
//                                 {item.cbm}
//                               </td>
//                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
//                                 {item.wt}
//                               </td>
//                             </tr>
//                           ))}

//                           {/* Totals Row */}
//                           <tr className="bg-gray-50 font-bold">
//                             <td colSpan={3} className="px-6 py-4 text-sm text-gray-900">
//                               TOTAL FOR {group.client}
//                             </td>
//                             <td className="px-6 py-4 text-sm text-gray-900 text-right">
//                               {group.totals.ctn}
//                             </td>
//                             <td className="px-6 py-4 text-sm text-gray-900 text-right">—</td>
//                             <td className="px-6 py-4 text-sm text-gray-900 text-right">
//                               {group.totals.tpcs}
//                             </td>
//                             <td className="px-6 py-4 text-sm text-gray-900 text-right">
//                               {group.totals.tcbm.toFixed(3)}
//                             </td>
//                             <td className="px-6 py-4 text-sm text-gray-900 text-right">
//                               {group.totals.twt.toFixed(2)}
//                             </td>
//                           </tr>
//                         </tbody>
//                       </table>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             ))
//           )}
//         </div>
//       </div>

//       {/* Client Preview Modal */}
//       {clientPreview && (
//         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">
//             {/* Modal Header */}
//             <div className="p-6 border-b">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h2 className="text-2xl font-bold text-gray-900">
//                     {clientPreview.client} - Shipping Details
//                   </h2>
//                   <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
//                     <span>Container: {clientPreview.containerCode}</span>
//                     <span>•</span>
//                     <span>Origin: {clientPreview.origin}</span>
//                     <span>•</span>
//                     <span>Loading: {clientPreview.loadingDate}</span>
//                   </div>
//                 </div>
//                 <button
//                   onClick={() => setClientPreview(null)}
//                   className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//                 >
//                   <X className="w-6 h-6 text-gray-500" />
//                 </button>
//               </div>
//             </div>

//             {/* Preview Content */}
//             <div className="flex-1 overflow-auto p-6">
//               {/* Summary Card */}
//               <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <h3 className="text-lg font-semibold text-blue-900 mb-2">
//                       Shipping Summary for {clientPreview.client}
//                     </h3>
//                     <p className="text-blue-700">
//                       Complete item list and shipping marks for your review
//                     </p>
//                   </div>
//                   <div className="text-right">
//                     <div className="text-2xl font-bold text-blue-900">
//                       {clientPreview.data.length} Items
//                     </div>
//                     <div className="text-sm text-blue-700">Ready for export</div>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-4 gap-4 mt-6">
//                   <div className="bg-white/70 p-4 rounded-lg">
//                     <div className="text-sm text-blue-700 font-medium">Total CTN</div>
//                     <div className="text-2xl font-bold text-blue-900 mt-1">
//                       {clientPreview.totals.ctn}
//                     </div>
//                   </div>
//                   <div className="bg-white/70 p-4 rounded-lg">
//                     <div className="text-sm text-blue-700 font-medium">Total Weight</div>
//                     <div className="text-2xl font-bold text-blue-900 mt-1">
//                       {clientPreview.totals.twt.toFixed(2)} kg
//                     </div>
//                   </div>
//                   <div className="bg-white/70 p-4 rounded-lg">
//                     <div className="text-sm text-blue-700 font-medium">Total CBM</div>
//                     <div className="text-2xl font-bold text-blue-900 mt-1">
//                       {clientPreview.totals.tcbm.toFixed(3)}
//                     </div>
//                   </div>
//                   <div className="bg-white/70 p-4 rounded-lg">
//                     <div className="text-sm text-blue-700 font-medium">Total PCS</div>
//                     <div className="text-2xl font-bold text-blue-900 mt-1">
//                       {clientPreview.totals.tpcs}
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Items Table */}
//               <div className="overflow-hidden rounded-xl border border-gray-200">
//                 <table className="w-full">
//                   <thead className="bg-gray-900">
//                     <tr>
//                       <th className="px-6 py-4 text-left text-sm font-semibold text-white">#</th>
//                       <th className="px-6 py-4 text-left text-sm font-semibold text-white">Particular</th>
//                       <th className="px-6 py-4 text-left text-sm font-semibold text-white">Shipping Mark</th>
//                       <th className="px-6 py-4 text-left text-sm font-semibold text-white">CTN Mark</th>
//                       <th className="px-6 py-4 text-left text-sm font-semibold text-white">Item No.</th>
//                       <th className="px-6 py-4 text-left text-sm font-semibold text-white">CTN</th>
//                       <th className="px6 py-4 text-left text-sm font-semibold text-white">PCS</th>
//                       <th className="px-6 py-4 text-left text-sm font-semibold text-white">CBM</th>
//                       <th className="px-6 py-4 text-left text-sm font-semibold text-white">WT</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-200">
//                     {clientPreview.data.map((item, index) => (
//                       <tr key={index} className="hover:bg-gray-50">
//                         <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
//                         <td className="px-6 py-4 text-sm font-medium text-gray-900">
//                           {item.particular}
//                         </td>
//                         <td className="px-6 py-4 text-sm text-gray-700">
//                           <div className="font-medium">{item.mark}</div>
//                         </td>
//                         <td className="px-6 py-4 text-sm text-gray-500">
//                           {item.ctnMark}
//                         </td>
//                         <td className="px-6 py-4 text-sm text-gray-700">{item.itemNo}</td>
//                         <td className="px-6 py-4 text-sm text-gray-900 text-right">{item.ctn}</td>
//                         <td className="px-6 py-4 text-sm text-gray-700 text-right">{item.pcs}</td>
//                         <td className="px-6 py-4 text-sm text-gray-700 text-right">{item.cbm}</td>
//                         <td className="px-6 py-4 text-sm text-gray-700 text-right">{item.wt}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>

//               {/* Export Options */}
//               <div className="mt-8 p-6 bg-gray-50 rounded-xl">
//                 <h4 className="text-lg font-semibold text-gray-900 mb-4">
//                   Export Options
//                 </h4>
//                 <div className="grid grid-cols-3 gap-4">
//                   <button
//                     onClick={() => exportClientToPDF(clientPreview)}
//                     className="group p-6 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all"
//                   >
//                     <div className="flex flex-col items-center text-center">
//                       <div className="p-3 bg-red-100 rounded-lg mb-3 group-hover:bg-red-200 transition-colors">
//                         <FileText className="w-8 h-8 text-red-600" />
//                       </div>
//                       <h5 className="font-semibold text-gray-900 mb-1">PDF Document</h5>
//                       <p className="text-sm text-gray-600">High-quality printable format</p>
//                       <div className="mt-4 text-sm text-blue-600 font-medium">
//                         Download PDF
//                       </div>
//                     </div>
//                   </button>

//                   <button
//                     onClick={() => exportClientToExcel(clientPreview)}
//                     className="group p-6 bg-white border border-gray-200 rounded-xl hover:border-green-500 hover:shadow-md transition-all"
//                   >
//                     <div className="flex flex-col items-center text-center">
//                       <div className="p-3 bg-green-100 rounded-lg mb-3 group-hover:bg-green-200 transition-colors">
//                         <FileSpreadsheet className="w-8 h-8 text-green-600" />
//                       </div>
//                       <h5 className="font-semibold text-gray-900 mb-1">Excel Sheet</h5>
//                       <p className="text-sm text-gray-600">Editable data with formulas</p>
//                       <div className="mt-4 text-sm text-green-600 font-medium">
//                         Download Excel
//                       </div>
//                     </div>
//                   </button>

//                   <button
//                     onClick={() => exportClientToImage(clientPreview)}
//                     className="group p-6 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all"
//                   >
//                     <div className="flex flex-col items-center text-center">
//                       <div className="p-3 bg-blue-100 rounded-lg mb-3 group-hover:bg-blue-200 transition-colors">
//                         <FileImage className="w-8 h-8 text-blue-600" />
//                       </div>
//                       <h5 className="font-semibold text-gray-900 mb-1">Image File</h5>
//                       <p className="text-sm text-gray-600">PNG screenshot for sharing</p>
//                       <div className="mt-4 text-sm text-blue-600 font-medium">
//                         Download Image
//                       </div>
//                     </div>
//                   </button>
//                 </div>

//                 <div className="mt-6 pt-6 border-t border-gray-200">
//                   <div className="text-sm text-gray-600">
//                     <strong>Note:</strong> This preview contains {clientPreview.data.length} items.
//                     Downloaded files will include complete shipping details with combined shipping marks.
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
