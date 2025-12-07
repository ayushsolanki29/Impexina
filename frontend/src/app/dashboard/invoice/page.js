"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";
import { Search as SearchIcon, Download, Filter } from "lucide-react";

/**
 * InvoicesPage
 * - reads `igpl_invoices_v1` from localStorage (falls back to demo / legacy)
 * - flat list of invoices
 * - click invoice -> router.push to invoice detail page
 */

const INVOICE_KEY = "igpl_invoices_v1";
const OLD_INVOICE_KEY = "igpl_commercial_invoice_v1"; // if you stored a single invoice before

// Demo invoices so UI isn't empty for new users
const DEMO_INVOICES = [
  {
    id: "inv-1",
    meta: {
      companyName: "YIWU ZHOULAI TRADING CO., LIMITED",
      buyerName: "IMPEXINA GLOBAL PVT LTD",
      invNo: "ICPLEY86",
      date: "2025-10-09",
      from: "CHINA",
      to: "NHAVA SHEVA INDIA",
    },
    origin: "YIWU",
    status: "completed",
    tctn: 649,
    tQty: 56343.8, // treat as total quantity – adjust as per your schema
    tAmount: 9010,
    items: [],
  },
  {
    id: "inv-2",
    meta: {
      companyName: "YIWU ZHOULAI TRADING CO., LIMITED",
      buyerName: "SOME OTHER BUYER",
      invNo: "ICPLX22",
      date: "2025-09-20",
      from: "CHINA",
      to: "MUNDRA INDIA",
    },
    origin: "YIWU",
    status: "draft",
    tctn: 120,
    tQty: 3500,
    tAmount: 4200,
    items: [],
  },
];

function readLocal(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") || null;
  } catch {
    return null;
  }
}

function writeLocal(key, v) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    // ignore
  }
}

// try to derive totals from items if not present
function normalizeInvoice(inv) {
  const items = Array.isArray(inv.items) ? inv.items : [];
  let tctn = Number(inv.tctn || 0);
  let tQty = Number(inv.tQty || 0);
  let tAmount = Number(inv.tAmount || 0);

  if ((!tctn || !tQty || !tAmount) && items.length) {
    for (const it of items) {
      tctn += Number(it.ctn || 0);
      tQty += Number(it.tQty || 0);
      tAmount += Number(it.amountUsd || 0);
    }
  }

  return {
    ...inv,
    id: inv.id || `inv-${Math.random().toString(36).slice(2, 8)}`,
    meta: inv.meta || {},
    origin: inv.origin || inv.meta?.from || "",
    status: inv.status || "draft",
    tctn,
    tQty,
    tAmount,
    items,
  };
}

export default function InvoicesPage() {
  const router = useRouter();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // load on mount
  useEffect(() => {
    setLoading(true);
    try {
      let stored = readLocal(INVOICE_KEY);

      // if we previously only stored ONE invoice object
      if (stored && !Array.isArray(stored)) {
        stored = [stored];
      }

      if (!stored || !Array.isArray(stored) || stored.length === 0) {
        // try fallback single-invoice key
        const legacy = readLocal(OLD_INVOICE_KEY);
        if (legacy) {
          stored = Array.isArray(legacy) ? legacy : [legacy];
        } else {
          stored = DEMO_INVOICES;
        }
        writeLocal(INVOICE_KEY, stored);
      }

      setInvoices(stored.map(normalizeInvoice));
    } catch (e) {
      setInvoices(DEMO_INVOICES.map(normalizeInvoice));
    } finally {
      setLoading(false);
    }
  }, []);

  // filtered / searched invoices
  const visibleInvoices = useMemo(() => {
    if (loading) return [];
    const ql = q.trim().toLowerCase();
    return invoices
      .filter((inv) => {
        if (statusFilter && inv.status.toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }

        if (!ql) return true;

        const m = inv.meta || {};
        const hay = [
          inv.id,
          inv.origin,
          inv.status,
          m.invNo,
          m.buyerName,
          m.companyName,
          m.from,
          m.to,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (hay.includes(ql)) return true;

        if (Array.isArray(inv.items)) {
          for (const it of inv.items) {
            const itHay = `${it.itemNumber || ""} ${it.description || ""}`.toLowerCase();
            if (itHay.includes(ql)) return true;
          }
        }
        return false;
      })
      .sort((a, b) => {
        const da = a.meta?.date ? new Date(a.meta.date) : null;
        const db = b.meta?.date ? new Date(b.meta.date) : null;
        if (da && db && da.getTime() !== db.getTime()) {
          return db - da; // newest first
        }
        // then by invoice no
        return (b.meta?.invNo || "").localeCompare(a.meta?.invNo || "");
      });
  }, [invoices, q, statusFilter, loading]);

  function openInvoice(inv) {
    // adjust this route as per your invoice editor routing
    router.push(`/dashboard/invoice/${encodeURIComponent(inv.id)}`);
  }

  function exportCsvVisible() {
    const headers = [
      "id",
      "invNo",
      "buyer",
      "from",
      "to",
      "origin",
      "status",
      "date",
      "tctn",
      "tQty",
      "tAmount",
    ];
    const rows = visibleInvoices.map((inv) => [
      inv.id || "",
      inv.meta?.invNo || "",
      inv.meta?.buyerName || "",
      inv.meta?.from || "",
      inv.meta?.to || "",
      inv.origin || "",
      inv.status || "",
      inv.meta?.date || "",
      inv.tctn,
      inv.tQty,
      inv.tAmount,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Invoices CSV exported");
  }

  function exportSingleInvoice(inv) {
    const headers = [
      "itemNumber",
      "description",
      "ctn",
      "qtyPerCtn",
      "unit",
      "tQty",
      "unitPrice",
      "amountUsd",
    ];
    const rows = (inv.items || []).map((it) => [
      it.itemNumber || "",
      it.description || "",
      it.ctn || 0,
      it.qtyPerCtn || 0,
      it.unit || "",
      it.tQty || 0,
      it.unitPrice || 0,
      it.amountUsd || 0,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${inv.meta?.invNo || inv.id}_items.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Invoice CSV exported");
  }

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto">
        {/* header + actions */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Commercial Invoices
            </h2>
            <div className="text-sm text-slate-500">
              Search, filter, and open invoice sheets. Data loaded from browser
              storage.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search invoice no, buyer, item..."
                className="pl-10 pr-3 py-2 border rounded-md w-72 text-sm"
              />
            </div>

            <button
              onClick={() =>
                document.getElementById("invoice-filters")?.classList.toggle("hidden")
              }
              className="px-3 py-2 rounded bg-sky-50 text-sky-700 inline-flex items-center gap-2 text-sm"
            >
              <Filter className="w-4 h-4" /> Filters
            </button>

            <button
              onClick={exportCsvVisible}
              className="px-3 py-2 rounded bg-slate-800 text-white inline-flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        {/* filters */}
        <div id="invoice-filters" className="mb-4">
          <div className="bg-white border rounded p-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 border rounded"
            >
              <option value="">All status</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setStatusFilter("");
                  setQ("");
                }}
                className="px-3 py-2 bg-slate-100 rounded"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* list table */}
        <div className="bg-white border rounded">
          <div className="px-4 py-3 flex items-center gap-3 text-[11px] text-slate-600 uppercase">
            <div className="w-28">Invoice No.</div>
            <div className="w-40">Buyer</div>
            <div className="w-32">Company</div>
            <div className="w-24">From</div>
            <div className="w-24">To</div>
            <div className="w-20 text-right">CTN</div>
            <div className="w-24 text-right">T.QTY</div>
            <div className="w-24 text-right">Amount (USD)</div>
            <div className="w-24">Status</div>
            <div className="w-32">Date</div>
            <div className="w-32 text-right">Action</div>
          </div>

          {loading ? (
            <div className="p-6 text-center text-slate-500 text-sm">
              Loading…
            </div>
          ) : visibleInvoices.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">
              No invoices found
            </div>
          ) : (
            visibleInvoices.map((inv) => (
              <div
                key={inv.id}
                className="px-4 py-3 border-t flex items-center gap-3 hover:bg-slate-50 text-sm"
              >
                <div className="w-28 font-semibold text-sky-700">
                  {inv.meta?.invNo || "-"}
                </div>
                <div className="w-40 text-slate-800 truncate">
                  {inv.meta?.buyerName || "-"}
                </div>
                <div className="w-32 text-slate-600 truncate">
                  {inv.meta?.companyName || "-"}
                </div>
                <div className="w-24 text-slate-600 truncate">
                  {inv.meta?.from || "-"}
                </div>
                <div className="w-24 text-slate-600 truncate">
                  {inv.meta?.to || "-"}
                </div>
                <div className="w-20 text-right font-semibold">
                  {inv.tctn || 0}
                </div>
                <div className="w-24 text-right">{inv.tQty || 0}</div>
                <div className="w-24 text-right">
                  {inv.tAmount ? inv.tAmount.toFixed(2) : "0.00"}
                </div>
                <div className="w-24">
                  <span
                    className={`inline-flex items-center px-2 py-[2px] rounded-full text-[11px] ${
                      inv.status === "completed"
                        ? "bg-emerald-50 text-emerald-700"
                        : inv.status === "draft"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {inv.status || "draft"}
                  </span>
                </div>
                <div className="w-32 text-slate-600 text-xs">
                  {inv.meta?.date || "-"}
                </div>
                <div className="w-32 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openInvoice(inv)}
                    className="px-3 py-1 rounded bg-sky-600 text-white text-xs"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => exportSingleInvoice(inv)}
                    className="px-3 py-1 rounded bg-slate-50 text-slate-700 text-xs"
                  >
                    Export
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
