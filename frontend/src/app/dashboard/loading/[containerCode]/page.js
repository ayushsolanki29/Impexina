"use client";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Toaster, toast } from "sonner";
import {
  Trash2,
  Edit3,
  Check,
  Printer,
  Download,
  Mail,
  Image as ImageIcon,
  Search as SearchIcon,
  Filter,
} from "lucide-react";

/**
 * Client-first Container Detail
 * - Groups sheets by clientName
 * - Debounced search + multi filters (origin, status, date range, minCTN)
 * - Pagination at client-group level (clients per page)
 * - Avoids heavy work with useMemo and early slicing (helps with large lists)
 * - Preview modal & print remain
 *
 * Production: replace localStorage reads with server APIs:
 *  - /api/containers/:code/clients?page=...&q=...&filters=...
 *  - Server should aggregate sheets per client and return counts/totals.
 */

// Demo seed (unchanged)
const DEMO_SEED = [
  {
    id: "sheet-1",
    containerCode: "PSDH-86",
    origin: "YIWU",
    loadingDate: "2025-10-09",
    deliveryDate: "2025-11-01",
    invoiceNo: "968",
    clientName: "BB-AMD",
    status: "draft",
    tctn: 42,
    tpcs: 1300,
    tcbm: 4.585,
    twt: 414,
    items: [
      {
        id: "i1",
        photo: null,
        particular: "FOOTREST",
        mark: "BB-AMD",
        itemNo: "FOOTREST",
        ctn: 5,
        pcs: 100,
        tpcs: 500,
        unit: "PCS",
        cbm: 0.083,
        tcbm: 0.417,
        wt: 7,
        twt: 35,
      },
      {
        id: "i2",
        photo: null,
        particular: "TELESCOPIC SHELF",
        mark: "BB-AMD",
        itemNo: "TELESHELF",
        ctn: 12,
        pcs: 25,
        tpcs: 300,
        unit: "PCS",
        cbm: 0.113,
        tcbm: 1.356,
        wt: 17,
        twt: 204,
      },
      {
        id: "i3",
        photo: null,
        particular: "PET STORAGE BAG",
        mark: "BB-AMD",
        itemNo: "PETBAG",
        ctn: 25,
        pcs: 20,
        tpcs: 500,
        unit: "PCS",
        cbm: 0.112,
        tcbm: 2.812,
        wt: 7,
        twt: 175,
      },
    ],
  },
  {
    id: "sheet-2",
    containerCode: "PSDH-86",
    origin: "YIWU",
    loadingDate: "2025-10-09",
    deliveryDate: "2025-10-20",
    invoiceNo: "643",
    clientName: "BST-AD",
    status: "completed",
    tctn: 170,
    tpcs: 5000,
    tcbm: 11.2,
    twt: 1200,
    items: [
      {
        id: "i4",
        photo: null,
        particular: "STACKING STAND",
        mark: "BST-AD",
        itemNo: "STACK-1",
        ctn: 20,
        pcs: 6,
        tpcs: 120,
        unit: "PCS",
        cbm: 1.78,
        tcbm: 35.6,
        wt: 10,
        twt: 200,
      },
    ],
  },
];

function seedLocalIfEmpty(key = "igpl_loading", seed = DEMO_SEED) {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || "null");
    if (!raw || !Array.isArray(raw) || raw.length === 0) {
      localStorage.setItem(key, JSON.stringify(seed));
    }
  } catch (e) {
    localStorage.setItem(key, JSON.stringify(seed));
  }
}

function buildPrintableHTML(sheet) {
  // same printable builder as before (kept minimal)
  const itemsHtml = (sheet.items || [])
    .map((it, i) => {
      const imgHtml = it.photo
        ? `<td style="padding:6px;border:1px solid #e6eef8"><img src="${it.photo}" style="max-width:60px;max-height:40px;object-fit:cover;border-radius:4px" /></td>`
        : `<td style="padding:6px;border:1px solid #e6eef8"> </td>`;
      return `
      <tr>
        <td style="padding:6px;border:1px solid #e6eef8">${i + 1}</td>
        ${imgHtml}
        <td style="padding:6px;border:1px solid #e6eef8">${
          it.particular || ""
        }</td>
        <td style="padding:6px;border:1px solid #e6eef8">${it.mark || ""}</td>
        <td style="padding:6px;border:1px solid #e6eef8">${it.itemNo || ""}</td>
        <td style="padding:6px;border:1px solid #e6eef8;text-align:right">${
          it.ctn || 0
        }</td>
        <td style="padding:6px;border:1px solid #e6eef8;text-align:right">${
          it.pcs || 0
        }</td>
        <td style="padding:6px;border:1px solid #e6eef8;text-align:right">${
          it.tpcs || 0
        }</td>
        <td style="padding:6px;border:1px solid #e6eef8;text-align:right">${Number(
          it.cbm || 0
        ).toFixed(3)}</td>
        <td style="padding:6px;border:1px solid #e6eef8;text-align:right">${Number(
          it.tcbm || 0
        ).toFixed(3)}</td>
        <td style="padding:6px;border:1px solid #e6eef8;text-align:right">${Number(
          it.wt || 0
        ).toFixed(2)}</td>
        <td style="padding:6px;border:1px solid #e6eef8;text-align:right">${Number(
          it.twt || 0
        ).toFixed(2)}</td>
      </tr>
    `;
    })
    .join("");

  const totals = `
    <tr>
      <td colspan="5" style="padding:8px;border:1px solid #dbeefb;font-weight:600">TOTAL</td>
      <td style="padding:8px;border:1px solid #dbeefb;text-align:right">${(
        sheet.items || []
      ).reduce((a, b) => a + (b.ctn || 0), 0)}</td>
      <td style="padding:8px;border:1px solid #dbeefb"></td>
      <td style="padding:8px;border:1px solid #dbeefb;text-align:right">${(
        sheet.items || []
      ).reduce((a, b) => a + (b.tpcs || 0), 0)}</td>
      <td style="padding:8px;border:1px solid #dbeefb;text-align:right">${Number(
        (sheet.items || []).reduce((a, b) => a + (b.cbm || 0), 0)
      ).toFixed(3)}</td>
      <td style="padding:8px;border:1px solid #dbeefb"></td>
      <td style="padding:8px;border:1px solid #dbeefb;text-align:right">${Number(
        (sheet.items || []).reduce((a, b) => a + (b.wt || 0), 0)
      ).toFixed(2)}</td>
      <td style="padding:8px;border:1px solid #dbeefb;text-align:right">${Number(
        (sheet.items || []).reduce((a, b) => a + (b.twt || 0), 0)
      ).toFixed(2)}</td>
    </tr>
  `;

  return `<!doctype html><html><head><meta charset="utf-8"/><title>Loading Sheet ${
    sheet.id
  }</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Inter,Roboto,Arial,sans-serif;color:#0f172a;padding:18px}th{background:#f1f9ff;padding:8px;border:1px solid #dbeefb;text-align:left;font-weight:600}td{padding:8px;border:1px solid #e6eef8;font-size:13px}</style></head><body><h1>Loading Sheet — ${
    sheet.id
  }</h1><div>Container: ${sheet.containerCode} • Client: ${
    sheet.clientName || sheet.items?.[0]?.mark || "—"
  }</div><table style="width:100%;border-collapse:collapse;margin-top:12px"><thead><tr><th>#</th><th>Photo</th><th>Particular</th><th>Mark</th><th>Item No</th><th style="text-align:right">CTN</th><th style="text-align:right">PCS</th><th style="text-align:right">T.PCS</th><th style="text-align:right">CBM</th><th style="text-align:right">T.CBM</th><th style="text-align:right">WT</th><th style="text-align:right">T.WT</th></tr></thead><tbody>${itemsHtml}${totals}</tbody></table></body></html>`;
}

/* ----------------- Component ----------------- */

export default function ContainerDetailByClientPage() {
  seedLocalIfEmpty("igpl_loading", DEMO_SEED);

  const router = useRouter();
  const params = useParams();
  const containerCode = params?.containerCode || "";

  // UI state: powerful filters + search
  const [loading, setLoading] = useState(true);
  const [rawSheets, setRawSheets] = useState([]); // all sheets for container
  const [clientPage, setClientPage] = useState(1);
  const CLIENTS_PAGE_SIZE = 10; // clients per page (tuneable)
  const [q, setQ] = useState("");
  const qRef = useRef("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [originFilter, setOriginFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [minCtnFilter, setMinCtnFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // preview & other modals
  const [previewHtml, setPreviewHtml] = useState(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteFor, setDeleteFor] = useState(null);
  const [completeFor, setCompleteFor] = useState(null);

  // load once (localStorage demo)
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      try {
        const raw = JSON.parse(localStorage.getItem("igpl_loading") || "[]");
        const filtered = (raw || [])
          .filter((s) => s.containerCode === containerCode)
          .map((s) => ({
            ...s,
            items: s.items || s.rows || [],
            clientName: s.clientName || s.items?.[0]?.mark || "Unknown",
          }));
        // add any demo seed entries missing (helps new hires)
        DEMO_SEED.forEach((d) => {
          if (
            d.containerCode === containerCode &&
            !filtered.find((x) => x.id === d.id)
          ) {
            filtered.push(d);
          }
        });
        setRawSheets(filtered);
      } catch (e) {
        setRawSheets(
          DEMO_SEED.filter((d) => d.containerCode === containerCode)
        );
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [containerCode]);

  // debounced search
  useEffect(() => {
    qRef.current = q;
    const id = setTimeout(() => setDebouncedQ(qRef.current.trim()), 300);
    return () => clearTimeout(id);
  }, [q]);

  // Efficient filtering & grouping
  // 1) apply lightweight filters and search to rawSheets
  // 2) group by clientName and compute aggregates
  // 3) slice clients for pagination
  const groupedClients = useMemo(() => {
    if (loading) return [];
    // Early exit: if server will provide aggregated results, do server call instead.
    const qLower = debouncedQ.toLowerCase();

    // parse date filters
    const fromTs = dateFrom ? new Date(dateFrom).setHours(0, 0, 0, 0) : null;
    const toTs = dateTo ? new Date(dateTo).setHours(23, 59, 59, 999) : null;
    const minCtnNum = minCtnFilter ? Number(minCtnFilter) : null;

    // filter sheets first (NOTE: this is linear O(n) on sheets)
    const filteredSheets = rawSheets.filter((s) => {
      if (
        originFilter &&
        s.origin &&
        !s.origin.toLowerCase().includes(originFilter.toLowerCase())
      )
        return false;
      if (
        statusFilter &&
        (!s.status || s.status.toLowerCase() !== statusFilter.toLowerCase())
      )
        return false;
      if (minCtnNum !== null && Number(s.tctn || 0) < minCtnNum) return false;
      if (fromTs || toTs) {
        const ld = s.loadingDate ? new Date(s.loadingDate).getTime() : null;
        if (fromTs && (!ld || ld < fromTs)) return false;
        if (toTs && (!ld || ld > toTs)) return false;
      }
      if (qLower) {
        // search in multiple high-value fields
        const fields = [
          s.clientName || "",
          s.id || "",
          s.containerCode || "",
          s.origin || "",
          s.invoiceNo || "",
          String(s.tctn || ""),
          String(s.tpcs || ""),
        ]
          .join(" ")
          .toLowerCase();
        if (!fields.includes(qLower)) {
          // fallback: search inside item lines (stop early)
          const foundInItems = (s.items || []).some((it) => {
            return `${it.particular || ""} ${it.mark || ""} ${it.itemNo || ""}`
              .toLowerCase()
              .includes(qLower);
          });
          if (!foundInItems) return false;
        }
      }
      return true;
    });

    // group by clientName
    const map = new Map();
    for (const s of filteredSheets) {
      const client = s.clientName || s.items?.[0]?.mark || "Unknown";
      if (!map.has(client))
        map.set(client, {
          clientName: client,
          sheets: [],
          totals: { tctn: 0, tpcs: 0, tcbm: 0, twt: 0 },
          lastLoadingDate: s.loadingDate || null,
        });
      const g = map.get(client);
      g.sheets.push(s);
      g.totals.tctn += Number(s.tctn || 0);
      g.totals.tpcs += Number(s.tpcs || 0);
      g.totals.tcbm += Number(s.tcbm || 0);
      g.totals.twt += Number(s.twt || 0);
      if (
        !g.lastLoadingDate ||
        new Date(s.loadingDate) > new Date(g.lastLoadingDate)
      )
        g.lastLoadingDate = s.loadingDate;
    }

    // convert to array and sort by totals or name (tune as needed)
    const arr = Array.from(map.values()).sort((a, b) => {
      // show clients with highest CTN first
      return (
        b.totals.tctn - a.totals.tctn ||
        a.clientName.localeCompare(b.clientName)
      );
    });

    return arr;
  }, [
    rawSheets,
    debouncedQ,
    originFilter,
    statusFilter,
    dateFrom,
    dateTo,
    minCtnFilter,
    loading,
  ]);

  // clients pagination (slice)
  const clientPageCount = Math.max(
    1,
    Math.ceil(groupedClients.length / CLIENTS_PAGE_SIZE)
  );
  const paginatedClients = useMemo(() => {
    const start = (clientPage - 1) * CLIENTS_PAGE_SIZE;
    return groupedClients.slice(start, start + CLIENTS_PAGE_SIZE);
  }, [groupedClients, clientPage]);

  // overall totals (for displayed clients)
  const visibleTotals = useMemo(
    () =>
      paginatedClients.reduce(
        (acc, c) => {
          acc.tctn += Number(c.totals.tctn || 0);
          acc.tpcs += Number(c.totals.tpcs || 0);
          acc.tcbm += Number(c.totals.tcbm || 0);
          acc.twt += Number(c.totals.twt || 0);
          return acc;
        },
        { tctn: 0, tpcs: 0, tcbm: 0, twt: 0 }
      ),
    [paginatedClients]
  );

  // persist helpers
  function persistAll(nextAll) {
    try {
      const existing = JSON.parse(localStorage.getItem("igpl_loading") || "[]");
      const filtered = (existing || []).filter(
        (x) => !nextAll.some((n) => n.id === x.id)
      );
      const next = [...nextAll, ...filtered];
      localStorage.setItem("igpl_loading", JSON.stringify(next));
    } catch (e) {
      localStorage.setItem("igpl_loading", JSON.stringify(nextAll));
    }
  }

  function doDelete(id) {
    // remove sheet from rawSheets & persist
    const nextRaw = rawSheets.filter((s) => s.id !== id);
    setRawSheets(nextRaw);
    persistAll(nextRaw);
    toast.success("Deleted sheet");
    setDeleteFor(null);
  }

  function doComplete(id) {
    const nextRaw = rawSheets.map((s) =>
      s.id === id ? { ...s, status: "completed" } : s
    );
    setRawSheets(nextRaw);
    persistAll(nextRaw);
    toast.success("Marked completed");
    setCompleteFor(null);
  }

  // preview
  function openPreviewModal(sheet) {
    const html = buildPrintableHTML(sheet);
    setPreviewHtml(html);
    setPreviewTitle(
      `${sheet.clientName || sheet.items?.[0]?.mark || "Client"} — ${sheet.id}`
    );
    setPreviewOpen(true);
  }
  function printPreview() {
    const iframe = document.getElementById("igpl-preview-iframe");
    if (!iframe) {
      toast.error("Preview iframe not found");
      return;
    }
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      const w = window.open("", "_blank", "noopener,noreferrer");
      if (!w) return toast.error("Popup blocked");
      w.document.open();
      w.document.write(previewHtml || "");
      w.document.write(`<script>setTimeout(()=>window.print(),200);</script>`);
      w.document.close();
    }
  }
  function downloadFromPreview() {
    printPreview();
  }

  // go back
  function goBack() {
    router.push("/dashboard/loading");
  }

  // quick helpers for filtering UI
  const clearFilters = () => {
    setOriginFilter("");
    setStatusFilter("");
    setMinCtnFilter("");
    setDateFrom("");
    setDateTo("");
    setQ("");
    setClientPage(1);
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        {/* header + search + filters */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <button onClick={goBack} className="text-sm text-slate-600 mb-1">
              ← Back
            </button>
            <h1 className="text-2xl font-semibold text-slate-900">
              Container — {containerCode}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Grouped by client for quick scanning. Use search & filters for
              large datasets (server recommended for production).
            </p>
          </div>

          <div className="w-full md:w-auto flex flex-col md:flex-row gap-2 items-stretch">
            <div className="relative w-full md:w-80">
              <SearchIcon className="absolute left-3 top-3 text-slate-400" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setClientPage(1);
                }}
                placeholder="Search clients, sheet id, item..."
                className="pl-10 pr-3 py-2 border rounded-md w-full focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <button
              onClick={() =>
                document
                  .getElementById("filters-panel")
                  ?.classList.toggle("hidden")
              }
              className="px-3 py-2 rounded bg-sky-50 text-sky-700 inline-flex items-center gap-2 text-sm"
            >
              <Filter className="w-4 h-4" /> Filters
            </button>
          </div>
        </div>

        {/* Filters panel */}
        <div id="filters-panel" className="mb-4">
          <div className="bg-white border rounded p-3 grid grid-cols-1 md:grid-cols-6 gap-3">
            <input
              value={originFilter}
              onChange={(e) => {
                setOriginFilter(e.target.value);
                setClientPage(1);
              }}
              placeholder="Origin"
              className="col-span-1 md:col-span-1 py-2 px-3 border rounded"
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setClientPage(1);
              }}
              className="col-span-1 md:col-span-1 py-2 px-3 border rounded"
            >
              <option value="">All status</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setClientPage(1);
              }}
              className="py-2 px-3 border rounded"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setClientPage(1);
              }}
              className="py-2 px-3 border rounded"
            />
            <input
              value={minCtnFilter}
              onChange={(e) => {
                setMinCtnFilter(e.target.value);
                setClientPage(1);
              }}
              placeholder="Min CTN"
              className="py-2 px-3 border rounded"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={clearFilters}
                className="px-3 py-2 rounded bg-slate-100 text-sm"
              >
                Reset
              </button>
              <div className="text-sm text-slate-500">
                Clients:{" "}
                <strong className="text-slate-800">
                  {groupedClients.length}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* totals + actions */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded bg-sky-50 text-sky-700 text-sm">
              Visible CTN {visibleTotals.tctn}
            </div>
            <div className="px-3 py-1 rounded bg-sky-100 text-sky-800 text-sm">
              Visible PCS {visibleTotals.tpcs}
            </div>
            <div className="px-3 py-1 rounded bg-slate-50 text-slate-800 text-sm">
              CBM {Number(visibleTotals.tcbm).toFixed(3)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                localStorage.setItem("igpl_loading", JSON.stringify(DEMO_SEED));
                setRawSheets(DEMO_SEED);
                toast.success("Seeded demo");
              }}
              className="px-3 py-1 rounded bg-slate-100 text-sm"
            >
              Reset Demo
            </button>
            <div className="text-sm text-slate-500">
              Page {clientPage}/{clientPageCount}
            </div>
          </div>
        </div>

        {/* Client cards (paginated) */}
        <div className="space-y-4">
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-6 bg-slate-200 rounded w-48" />
              <div className="h-40 bg-slate-100 rounded" />
            </div>
          ) : paginatedClients.length === 0 ? (
            <div className="p-6 bg-white border rounded text-slate-500">
              No clients match your filters.
            </div>
          ) : (
            paginatedClients.map((client) => (
              <div
                key={client.clientName}
                className="bg-white border rounded-lg shadow-sm overflow-hidden"
              >
                <div className="p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-semibold text-slate-900 truncate">
                        {client.clientName}
                      </div>
                      <div className="text-xs px-2 py-0.5 rounded bg-slate-50 text-slate-700">
                        {client.sheets.length} sheet(s)
                      </div>
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      Last loading: {client.lastLoadingDate || "—"} • CTN:{" "}
                      <strong className="text-slate-800">
                        {client.totals?.tctn || 0}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        // open a client-level printable combined preview (first sheet + summary)
                        // For demonstration open printable of the first sheet
                        if (client.sheets[0])
                          openPreviewModal(client.sheets[0]);
                      }}
                      className="px-2 py-1 rounded bg-sky-600 text-white text-sm inline-flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4" /> Preview
                    </button>

                    <button
                      onClick={() => {
                        // open email with summary
                        const subj = encodeURIComponent(
                          `Loading Summary — ${client.clientName} / ${containerCode}`
                        );
                        const body = encodeURIComponent(
                          [
                            `Client: ${client.clientName}`,
                            `Container: ${containerCode}`,
                            `Sheets: ${client.sheets
                              .map((s) => `${s.id} (${s.tctn} CTN)`)
                              .join(", ")}`,
                            `Totals: CTN ${client.totals.tctn} • PCS ${
                              client.totals.tpcs
                            } • CBM ${Number(client.totals.tcbm || 0).toFixed(
                              3
                            )} • WT ${Number(client.totals.twt || 0).toFixed(
                              1
                            )}kg`,
                          ].join("\n")
                        );
                        window.location.href = `mailto:?subject=${subj}&body=${body}`;
                      }}
                      className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-sm inline-flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" /> Send
                    </button>
                  </div>
                </div>

                {/* sheets list inside client card */}
                <div className="border-t bg-slate-50 p-3">
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                      <thead className="text-xs text-slate-600 uppercase">
                        <tr>
                          <th className="px-2 py-2 text-left">Sheet</th>
                          <th className="px-2 py-2 text-left">Loading</th>
                          <th className="px-2 py-2 text-left">Invoice</th>
                          <th className="px-2 py-2 text-right">CTN</th>
                          <th className="px-2 py-2 text-right">PCS</th>
                          <th className="px-2 py-2 text-right">CBM</th>
                          <th className="px-2 py-2 text-right">WT</th>
                          <th className="px-2 py-2 text-right">Status</th>
                          <th className="px-2 py-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {client.sheets.map((s) => (
                          <tr key={s.id} className="border-t">
                            <td className="px-2 py-2 text-sm">{s.id}</td>
                            <td className="px-2 py-2 text-sm">
                              {s.loadingDate || "—"}
                            </td>
                            <td className="px-2 py-2 text-sm">
                              {s.invoiceNo || "—"}
                            </td>
                            <td className="px-2 py-2 text-sm text-right font-semibold">
                              {s.tctn || 0}
                            </td>
                            <td className="px-2 py-2 text-sm text-right">
                              {s.tpcs || 0}
                            </td>
                            <td className="px-2 py-2 text-sm text-right">
                              {Number(s.tcbm || 0).toFixed(3)}
                            </td>
                            <td className="px-2 py-2 text-sm text-right">
                              {Number(s.twt || 0).toFixed(1)}
                            </td>
                            <td className="px-2 py-2 text-sm text-right">
                              <span
                                className={`px-2 py-0.5 rounded text-xs ${
                                  s.status === "draft"
                                    ? "bg-amber-50 text-amber-800"
                                    : "bg-emerald-50 text-emerald-800"
                                }`}
                              >
                                {s.status}
                              </span>
                            </td>
                            <td className="px-2 py-2 text-sm text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/loading/${containerCode}/${s.id}/edit`
                                    )
                                  }
                                  className="px-2 py-1 rounded bg-white border text-slate-700 text-xs inline-flex items-center gap-1"
                                >
                                  <Edit3 className="w-3 h-3" /> Edit
                                </button>
                                <button
                                  onClick={() => setDeleteFor(s.id)}
                                  className="px-2 py-1 rounded bg-rose-50 text-rose-700 text-xs"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                                {s.status === "draft" ? (
                                  <button
                                    onClick={() => setCompleteFor(s.id)}
                                    className="px-2 py-1 rounded bg-sky-600 text-white text-xs inline-flex items-center gap-1"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                ) : (
                                  <div className="text-xs text-slate-400 px-2">
                                    Locked
                                  </div>
                                )}
                                <button
                                  onClick={() => openPreviewModal(s)}
                                  className="px-2 py-1 rounded bg-slate-800 text-white text-xs inline-flex items-center gap-1"
                                >
                                  <Printer className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-100">
                          <td colSpan={3} className="px-2 py-2 font-medium">
                            Client Total
                          </td>
                          <td className="px-2 py-2 text-right font-semibold">
                            {client.totals.tctn}
                          </td>
                          <td className="px-2 py-2" />
                          <td className="px-2 py-2 text-right font-semibold">
                            {Number(client.totals.tcbm || 0).toFixed(3)}
                          </td>
                          <td className="px-2 py-2 text-right font-semibold">
                            {Number(client.totals.twt || 0).toFixed(2)}
                          </td>
                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* pagination controls */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Showing {paginatedClients.length} of {groupedClients.length} clients
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setClientPage((p) => Math.max(1, p - 1))}
              className="px-2 py-1 rounded bg-slate-100"
            >
              Prev
            </button>
            <div className="text-sm">
              {clientPage}/{clientPageCount}
            </div>
            <button
              onClick={() =>
                setClientPage((p) => Math.min(clientPageCount, p + 1))
              }
              className="px-2 py-1 rounded bg-slate-100"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* preview modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-md shadow-xl w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-3 border-b">
              <div className="text-sm font-semibold">
                {previewTitle} — Preview
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={printPreview}
                  className="px-2 py-1 rounded bg-sky-600 text-white text-sm inline-flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button
                  onClick={downloadFromPreview}
                  className="px-2 py-1 rounded bg-slate-800 text-white text-sm inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-sm"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 relative">
              <iframe
                id="igpl-preview-iframe"
                title="IGPL preview"
                srcDoc={previewHtml || "<p>Loading...</p>"}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* delete confirm */}
      {deleteFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-4 shadow-lg w-96">
            <h3 className="text-lg font-semibold">Delete sheet</h3>
            <p className="text-sm text-slate-600 mt-2">
              This will remove the sheet from local storage. Are you sure?
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => setDeleteFor(null)}
                className="px-3 py-1 rounded bg-slate-100 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => doDelete(deleteFor)}
                className="px-3 py-1 rounded bg-rose-600 text-white text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* complete confirm */}
      {completeFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-4 shadow-lg w-96">
            <h3 className="text-lg font-semibold">Mark complete</h3>
            <p className="text-sm text-slate-600 mt-2">
              Mark this sheet as <strong>completed</strong> for the client? This
              change is reversible by editing the sheet.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => setCompleteFor(null)}
                className="px-3 py-1 rounded bg-slate-100 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => doComplete(completeFor)}
                className="px-3 py-1 rounded bg-emerald-600 text-white text-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
