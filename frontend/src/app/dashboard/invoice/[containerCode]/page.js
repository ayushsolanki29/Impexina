"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { Toaster, toast } from "sonner";
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  Printer,
  Download,
  Save,
  X,
} from "lucide-react";

const STORAGE_KEY = "igpl_commercial_invoice_v1";

// Demo data closely matching your PDF
const DEMO = {
  meta: {
    companyName: "YIWU ZHOULAI TRADING CO., LIMITED",
    companyAddress:
      "Add.: Room 801,Unit 3, Building 1, Jiuheyuan, Jiangdong Street, Yiwu City, Jinhua City, Zhejiang Province Tel.:13735751445",
    title: "COMMERCIAL INVOICE",

    buyerName: "IMPEXINA GLOBAL PVT LTD",
    buyerAddress:
      "Ground Floor, C-5, Gami Industrial Park Pawane\nMIDC Road NAVI MUMBAI, THANE, Maharashtra, 400705",
    buyerIEC: "IEC NO.: AAHCI1462J",
    buyerGST: "GST NO.: 27AAHCI1462J1ZG",
    buyerEmail: "EMAIL: impexina91@gmail.com",

    invNo: "ICPLEY86",
    date: "2025-10-09",
    from: "CHINA",
    to: "NHAVA SHEVA INDIA",

    cifText: "TOTAL CIF USD 9010 AND 90 WITHIN DAYS AFTER DELIVERY",

    bankDetail:
      "BENEFICIARY'S BANK NAME: ZHEJIANG TAILONG COMMERCIAL BANK\nBENEFICIARY NAME: YIWU ZHOULAI TRADING CO.,LIMITED\nSWIFT BIC: ZJTLNBHXKXX\nBENEFICIARY'S BANK ADD: ROOM 801, UNIT 3, BUILDING 1, JIUHEYUAN, JIANGDONG STREET, YIWU CITY, JINHUA CITY, ZHEJIANG PROVINCE\nBENEFICIARY A/C NO.: 330800202001000155179",

    signatureText: "YIWU ZHOULAI TRADING CO., LIMITED\nAUTHORIZED SIGNATORY",
  },
  items: [
    {
      id: "i1",
      itemNumber: "BB-AMD",
      description: "FOOTREST",
      ctn: 5,
      qtyPerCtn: 100,
      unit: "PCS",
      tQty: 500,
      unitPrice: 0.046,
      amountUsd: 23,
      photo: null,
    },
    {
      id: "i2",
      itemNumber: "SMWGC18",
      description: "TABLE RUNNER",
      ctn: 21,
      qtyPerCtn: 96,
      unit: "PCS",
      tQty: 2016,
      unitPrice: 0.11,
      amountUsd: 221.76,
      photo: null,
    },
  ],
};

function readStorage() {
  if (typeof window === "undefined") return null;
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return raw;
  } catch {
    return null;
  }
}

function writeStorage(data) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function uid(prefix = "id") {
  return (
    prefix +
    "_" +
    Date.now().toString(36) +
    "_" +
    Math.random().toString(36).slice(2, 8)
  );
}

export default function CommercialInvoicePage() {
  // SSR-safe initial state: always DEMO, then hydrate from localStorage
  const [meta, setMeta] = useState(DEMO.meta);
  const [items, setItems] = useState(DEMO.items);
  const [signature, setSignature] = useState(null);
  const [signaturePreviewName, setSignaturePreviewName] = useState("");
  const [previewHtml, setPreviewHtml] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const autosaveTimer = useRef(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = readStorage();
    if (stored) {
      setMeta(stored.meta || DEMO.meta);
      setItems(stored.items || DEMO.items);
      setSignature(stored.signature || null);
      setSignaturePreviewName(stored.signatureName || "");
    } else {
      writeStorage({
        meta: DEMO.meta,
        items: DEMO.items,
        signature: null,
        signatureName: "",
      });
    }
  }, []);

  // Make sure derived fields are correct once on mount
  useEffect(() => {
    setItems((cur) =>
      cur.map((it) => {
        const ctn = Number(it.ctn || 0);
        const qtyPerCtn = Number(it.qtyPerCtn || 0);
        const unitPrice = Number(it.unitPrice || 0);
        const tQty = ctn * qtyPerCtn;
        const amountUsd = tQty * unitPrice;
        return { ...it, tQty, amountUsd };
      })
    );
  }, []);

  // Debounced autosave
  useEffect(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      writeStorage({ meta, items, signature, signatureName: signaturePreviewName });
      setLastSaved(new Date().toLocaleTimeString());
    }, 700);

    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [meta, items, signature, signaturePreviewName]);

  // Totals: cartons, quantity, amount
  const totals = useMemo(
    () =>
      items.reduce(
        (acc, it) => {
          acc.ctn += Number(it.ctn || 0);
          acc.tQty += Number(it.tQty || 0);
          acc.amount += Number(it.amountUsd || 0);
          return acc;
        },
        { ctn: 0, tQty: 0, amount: 0 }
      ),
    [items]
  );

  // Helpers for items
  function baseEmptyRow() {
    return {
      id: uid("item"),
      itemNumber: "",
      description: "",
      ctn: 0,
      qtyPerCtn: 0,
      unit: "PCS",
      tQty: 0,
      unitPrice: 0,
      amountUsd: 0,
      photo: null,
    };
  }

  function addRow() {
    setItems((s) => [...s, baseEmptyRow()]);
  }

  function addMultipleRows(count) {
    setItems((s) => [...s, ...Array.from({ length: count }, () => baseEmptyRow())]);
  }

  function insertRowAfter(id) {
    setItems((s) => {
      const idx = s.findIndex((r) => r.id === id);
      if (idx === -1) return s;
      const clone = [...s];
      clone.splice(idx + 1, 0, baseEmptyRow());
      return clone;
    });
  }

  function duplicateRow(id) {
    setItems((s) => {
      const idx = s.findIndex((r) => r.id === id);
      if (idx === -1) return s;
      const row = s[idx];
      const dup = { ...row, id: uid("item") };
      const clone = [...s];
      clone.splice(idx + 1, 0, dup);
      return clone;
    });
  }

  function removeRow(id) {
    setItems((s) => s.filter((r) => r.id !== id));
  }

  function updateRow(id, field, value) {
    setItems((s) => s.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  // Numeric fields (ctn, qtyPerCtn, unitPrice)
  function handleNumberChange(id, field, raw) {
    const v = raw === "" ? "" : Number(raw);
    setItems((s) =>
      s.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: v };
        const ctn = Number(updated.ctn || 0);
        const qtyPerCtn = Number(updated.qtyPerCtn || 0);
        const unitPrice = Number(updated.unitPrice || 0);
        updated.tQty = ctn * qtyPerCtn;
        updated.amountUsd = updated.tQty * unitPrice;
        return updated;
      })
    );
  }

  function uploadRowPhoto(e, id) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateRow(id, "photo", ev.target && ev.target.result);
    };
    reader.readAsDataURL(f);
  }

  // Signature upload
  function uploadSignature(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSignature(ev.target && ev.target.result);
      setSignaturePreviewName(f.name);
      toast.success("Signature uploaded");
    };
    reader.readAsDataURL(f);
  }

  function escapeHtml(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // Printable HTML – matching your invoice style
  function buildPrintableHTML() {
    const headerHtml = `
      <div style="border:1px solid #000;padding:4px 8px;">
        <div style="text-align:center;font-size:16px;font-weight:bold;text-transform:uppercase;">
          ${escapeHtml(meta.companyName)}
        </div>
        <div style="text-align:center;font-size:10px;margin-top:2px;">
          ${escapeHtml(meta.companyAddress)}
        </div>
      </div>

      <div style="border-left:1px solid #000;border-right:1px solid #000;border-bottom:1px solid #000;padding:4px 8px;">
        <div style="text-align:center;font-size:13px;font-weight:bold;text-decoration:underline;">
          ${escapeHtml(meta.title || "COMMERCIAL INVOICE")}
        </div>

        <div style="margin-top:4px;display:flex;font-size:11px;gap:12px;">
          <div style="flex:2;">
            <div style="font-weight:bold;margin-bottom:2px;">
              ${escapeHtml(meta.buyerName || "")}
            </div>
            <div style="white-space:pre-wrap;">
              ${escapeHtml(meta.buyerAddress || "")}
            </div>
            <div style="margin-top:4px;">${escapeHtml(meta.buyerIEC || "")}</div>
            <div>${escapeHtml(meta.buyerGST || "")}</div>
            <div>${escapeHtml(meta.buyerEmail || "")}</div>
          </div>
          <div style="flex:1;">
            <div>INV NO.: <strong>${escapeHtml(meta.invNo || "")}</strong></div>
            <div>DATE: <strong>${escapeHtml(meta.date || "")}</strong></div>
            <div>NHAVA SHEVA INDIA</div>
            <div>FROM: ${escapeHtml(meta.from || "")}</div>
            <div>TO: ${escapeHtml(meta.to || "")}</div>
          </div>
        </div>
      </div>
    `;

    const rowsHtml = items
      .map((it, i) => {
        const photoTd = it.photo
          ? `<td style="border:1px solid #000;padding:3px;text-align:center;">
               <img src="${it.photo}" style="max-width:55px;max-height:45px;object-fit:cover;" />
             </td>`
          : `<td style="border:1px solid #000;padding:3px;text-align:center;"></td>`;
        return `<tr>
          <td style="border:1px solid #000;padding:3px;text-align:center;font-size:10px;">${i +
            1}</td>
          <td style="border:1px solid #000;padding:3px;text-align:center;font-size:10px;">${escapeHtml(
            it.itemNumber || ""
          )}</td>
          ${photoTd}
          <td style="border:1px solid #000;padding:3px;font-size:10px;">${escapeHtml(
            it.description || ""
          )}</td>
          <td style="border:1px solid #000;padding:3px;text-align:right;font-size:10px;">${escapeHtml(
            it.ctn || 0
          )}</td>
          <td style="border:1px solid #000;padding:3px;text-align:right;font-size:10px;">${escapeHtml(
            it.qtyPerCtn || 0
          )}</td>
          <td style="border:1px solid #000;padding:3px;text-align:center;font-size:10px;">${escapeHtml(
            it.unit || ""
          )}</td>
          <td style="border:1px solid #000;padding:3px;text-align:right;font-size:10px;">${escapeHtml(
            it.tQty || 0
          )}</td>
          <td style="border:1px solid #000;padding:3px;text-align:right;font-size:10px;">${Number(
            it.unitPrice || 0
          ).toFixed(2)}</td>
          <td style="border:1px solid #000;padding:3px;text-align:right;font-size:10px;">${Number(
            it.amountUsd || 0
          ).toFixed(2)}</td>
        </tr>`;
      })
      .join("");

    const totalRow = `
      <tr>
        <td colspan="4" style="border:1px solid #000;padding:4px;font-weight:bold;font-size:10px;text-align:left;">TOTAL</td>
        <td style="border:1px solid #000;padding:4px;text-align:right;font-weight:bold;font-size:10px;">${
          totals.ctn
        }</td>
        <td style="border:1px solid #000;padding:4px;"></td>
        <td style="border:1px solid #000;padding:4px;"></td>
        <td style="border:1px solid #000;padding:4px;text-align:right;font-weight:bold;font-size:10px;">${
          totals.tQty
        }</td>
        <td style="border:1px solid #000;padding:4px;"></td>
        <td style="border:1px solid #000;padding:4px;text-align:right;font-weight:bold;font-size:10px;">${totals.amount.toFixed(
          2
        )}</td>
      </tr>
    `;

    const cifHtml = `
      <div style="border-left:1px solid #000;border-right:1px solid #000;border-bottom:1px solid #000;padding:4px 8px;font-size:11px;">
        ${escapeHtml(meta.cifText || "")}
      </div>
    `;

    const bankHtml = `
      <div style="border:1px solid #000;border-top:none;padding:4px 8px;font-size:11px;white-space:pre-wrap;">
        <div style="font-weight:bold;margin-bottom:4px;">Bank Details:</div>
        ${escapeHtml(meta.bankDetail || "")}
      </div>
    `;

    const signatureHtml = `
      <div style="margin-top:18px;display:flex;justify-content:flex-end;">
        <div style="text-align:center;font-size:10px;">
          ${
            signature
              ? `<img src="${signature}" style="max-width:220px;max-height:70px;object-fit:contain;display:block;margin-bottom:4px;" />`
              : ""
          }
          <div style="white-space:pre-wrap;">${escapeHtml(
            meta.signatureText || ""
          )}</div>
        </div>
      </div>
    `;

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Commercial Invoice</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      color: #000;
      margin: 0;
      padding: 18px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      border: 1px solid #000;
      padding: 4px;
      font-size: 10px;
      background: #f3f3f3;
      text-align: center;
    }
    td {
      border: 1px solid #000;
    }
  </style>
</head>
<body>
  ${headerHtml}
  <table style="border-left:1px solid #000;border-right:1px solid #000;border-bottom:1px solid #000;margin-top:6px;">
    <thead>
      <tr>
        <th style="width:30px;">S.N.</th>
        <th style="width:80px;">ITEM NO.</th>
        <th style="width:80px;">Photo</th>
        <th>Descriptions</th>
        <th style="width:50px;">Ctn.</th>
        <th style="width:70px;">Qty./ Ctn</th>
        <th style="width:45px;">Unit</th>
        <th style="width:70px;">T-Qty</th>
        <th style="width:65px;">U.price</th>
        <th style="width:80px;">Amount/USD</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
      ${totalRow}
    </tbody>
  </table>
  ${cifHtml}
  ${bankHtml}
  ${signatureHtml}
</body>
</html>`;

    return html;
  }

  function openPreview() {
    const html = buildPrintableHTML();
    setPreviewHtml(html);
    setPreviewOpen(true);
  }

  function printPreview() {
    const html = previewHtml || buildPrintableHTML();
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) return toast.error("Popup blocked");
    w.document.open();
    w.document.write(
      html + '<script>setTimeout(()=>window.print(),200);</script>'
    );
    w.document.close();
  }

  function handleSaveNow() {
    writeStorage({ meta, items, signature, signatureName: signaturePreviewName });
    setLastSaved(new Date().toLocaleTimeString());
    toast.success("Saved to browser storage");
  }

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Commercial Invoice — Editor
            </h2>
            <div className="text-sm text-slate-500">
              Fill invoice details, items, prices, upload photos & signature,
              then preview / print exact invoice PDF layout.
            </div>
            {lastSaved && (
              <div className="mt-1 text-xs text-emerald-600">
                Auto-saved at {lastSaved}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSaveNow}
              className="px-3 py-2 rounded bg-emerald-600 text-white inline-flex items-center gap-2 text-sm"
            >
              <Save className="w-4 h-4" /> Save
            </button>
            <button
              onClick={openPreview}
              className="px-3 py-2 rounded bg-slate-800 text-white inline-flex items-center gap-2 text-sm"
            >
              <Printer className="w-4 h-4" /> Preview
            </button>
            <button
              onClick={printPreview}
              className="px-3 py-2 rounded bg-sky-600 text-white inline-flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" /> Print / Download
            </button>
          </div>
        </div>

        {/* Company header editor */}
        <div className="bg-white border rounded p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-600">Company Name</label>
              <input
                value={meta.companyName}
                onChange={(e) =>
                  setMeta((m) => ({ ...m, companyName: e.target.value }))
                }
                className="w-full border px-3 py-2 rounded mt-1 text-sm"
              />
              <label className="text-xs text-slate-600 mt-2 block">
                Company Address
              </label>
              <textarea
                value={meta.companyAddress}
                onChange={(e) =>
                  setMeta((m) => ({ ...m, companyAddress: e.target.value }))
                }
                className="w-full border px-3 py-2 rounded mt-1 text-sm"
                rows={3}
              />
              <label className="text-xs text-slate-600 mt-2 block">
                Invoice Title
              </label>
              <input
                value={meta.title}
                onChange={(e) =>
                  setMeta((m) => ({ ...m, title: e.target.value }))
                }
                className="w-full border px-3 py-2 rounded mt-1 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600">Invoice No.</label>
              <input
                value={meta.invNo}
                onChange={(e) =>
                  setMeta((m) => ({ ...m, invNo: e.target.value }))
                }
                className="w-full border px-3 py-2 rounded mt-1 text-sm"
              />
              <label className="text-xs text-slate-600 mt-2 block">Date</label>
              <input
                type="date"
                value={meta.date}
                onChange={(e) =>
                  setMeta((m) => ({ ...m, date: e.target.value }))
                }
                className="w-full border px-3 py-2 rounded mt-1 text-sm"
              />
              <label className="text-xs text-slate-600 mt-2 block">From</label>
              <input
                value={meta.from}
                onChange={(e) =>
                  setMeta((m) => ({ ...m, from: e.target.value }))
                }
                className="w-full border px-3 py-2 rounded mt-1 text-sm"
              />
              <label className="text-xs text-slate-600 mt-2 block">To</label>
              <input
                value={meta.to}
                onChange={(e) =>
                  setMeta((m) => ({ ...m, to: e.target.value }))
                }
                className="w-full border px-3 py-2 rounded mt-1 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Buyer & bank top details */}
        <div className="bg-white border rounded p-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-600">Buyer Name</label>
            <input
              value={meta.buyerName}
              onChange={(e) =>
                setMeta((m) => ({ ...m, buyerName: e.target.value }))
              }
              className="w-full border px-3 py-2 rounded mt-1 text-sm"
            />
            <label className="text-xs text-slate-600 mt-2 block">
              Buyer Address
            </label>
            <textarea
              value={meta.buyerAddress}
              onChange={(e) =>
                setMeta((m) => ({ ...m, buyerAddress: e.target.value }))
              }
              className="w-full border px-3 py-2 rounded mt-1 text-sm"
              rows={3}
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">Buyer IEC</label>
            <input
              value={meta.buyerIEC}
              onChange={(e) =>
                setMeta((m) => ({ ...m, buyerIEC: e.target.value }))
              }
              className="w-full border px-3 py-2 rounded mt-1 text-sm"
            />
            <label className="text-xs text-slate-600 mt-2 block">
              Buyer GST
            </label>
            <input
              value={meta.buyerGST}
              onChange={(e) =>
                setMeta((m) => ({ ...m, buyerGST: e.target.value }))
              }
              className="w-full border px-3 py-2 rounded mt-1 text-sm"
            />
            <label className="text-xs text-slate-600 mt-2 block">
              Buyer Email
            </label>
            <input
              value={meta.buyerEmail}
              onChange={(e) =>
                setMeta((m) => ({ ...m, buyerEmail: e.target.value }))
              }
              className="w-full border px-3 py-2 rounded mt-1 text-sm"
            />
          </div>
        </div>

        {/* Quick totals + controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2 text-sm">
          <div className="flex flex-wrap gap-4 text-slate-700">
            <span>
              <span className="font-semibold">{totals.ctn}</span> cartons
            </span>
            <span>
              <span className="font-semibold">{totals.tQty}</span> total quantity
            </span>
            <span>
              USD{" "}
              <span className="font-semibold">
                {totals.amount.toFixed(2)}
              </span>{" "}
              total amount
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={addRow}
              className="px-3 py-1.5 rounded bg-amber-50 text-amber-900 text-xs inline-flex items-center gap-2"
            >
              <Plus className="w-3 h-3" /> Add row
            </button>
            <button
              onClick={() => addMultipleRows(5)}
              className="px-3 py-1.5 rounded bg-slate-100 text-slate-700 text-xs"
            >
              + 5 empty rows
            </button>
            <button
              onClick={() => {
                setMeta(DEMO.meta);
                setItems(DEMO.items);
                setSignature(null);
                setSignaturePreviewName("");
                writeStorage({
                  meta: DEMO.meta,
                  items: DEMO.items,
                  signature: null,
                  signatureName: "",
                });
                toast.success("Reset to demo sample");
              }}
              className="px-3 py-1.5 rounded bg-red-50 text-red-700 text-xs"
            >
              Reset to demo
            </button>
          </div>
        </div>

        {/* Items table editor */}
        <div className="bg-white border rounded overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                <th className="px-2 py-2">S.N.</th>
                <th className="px-2 py-2">ITEM NO.</th>
                <th className="px-2 py-2">Photo</th>
                <th className="px-2 py-2">Descriptions</th>
                <th className="px-2 py-2">Ctn.</th>
                <th className="px-2 py-2">Qty./ Ctn</th>
                <th className="px-2 py-2">Unit</th>
                <th className="px-2 py-2">T-QTY</th>
                <th className="px-2 py-2">U.price</th>
                <th className="px-2 py-2">Amount/USD</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={it.id} className="border-t">
                  <td className="px-2 py-2 text-xs text-center">{idx + 1}</td>
                  <td className="px-2 py-2">
                    <input
                      value={it.itemNumber}
                      onChange={(e) =>
                        updateRow(it.id, "itemNumber", e.target.value)
                      }
                      className="border px-2 py-1 rounded text-xs w-28"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      {it.photo ? (
                        <img
                          src={it.photo}
                          alt="thumb"
                          className="w-12 h-10 object-cover rounded border"
                        />
                      ) : (
                        <div className="w-12 h-10 border rounded flex items-center justify-center text-slate-400">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => uploadRowPhoto(e, it.id)}
                        className="text-[10px]"
                      />
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={it.description}
                      onChange={(e) =>
                        updateRow(it.id, "description", e.target.value)
                      }
                      className="border px-2 py-1 rounded text-xs w-64"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      value={it.ctn}
                      onChange={(e) =>
                        handleNumberChange(it.id, "ctn", e.target.value)
                      }
                      className="border px-2 py-1 rounded text-xs w-16 text-right"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      value={it.qtyPerCtn}
                      onChange={(e) =>
                        handleNumberChange(it.id, "qtyPerCtn", e.target.value)
                      }
                      className="border px-2 py-1 rounded text-xs w-20 text-right"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={it.unit}
                      onChange={(e) =>
                        updateRow(it.id, "unit", e.target.value)
                      }
                      className="border px-2 py-1 rounded text-xs w-16 text-center"
                    />
                  </td>
                  <td className="px-2 py-2 text-right text-xs">
                    {Number(it.tQty) || 0}
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      step="0.01"
                      value={it.unitPrice}
                      onChange={(e) =>
                        handleNumberChange(it.id, "unitPrice", e.target.value)
                      }
                      className="border px-2 py-1 rounded text-xs w-20 text-right"
                    />
                  </td>
                  <td className="px-2 py-2 text-right text-xs">
                    {Number(it.amountUsd || 0).toFixed(2)}
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => duplicateRow(it.id)}
                        className="px-2 py-1 rounded bg-slate-100 text-xs"
                      >
                        Dup
                      </button>
                      <button
                        onClick={() => insertRowAfter(it.id)}
                        className="px-2 py-1 rounded bg-slate-100 text-xs"
                      >
                        +Below
                      </button>
                      <button
                        onClick={() => removeRow(it.id)}
                        className="px-2 py-1 rounded bg-rose-50 text-rose-700 text-xs inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 text-xs">
              <tr>
                <td colSpan={4} className="px-2 py-2 font-semibold">
                  TOTAL
                </td>
                <td className="px-2 py-2 text-right font-semibold">
                  {totals.ctn}
                </td>
                <td className="px-2 py-2" />
                <td className="px-2 py-2" />
                <td className="px-2 py-2 text-right font-semibold">
                  {totals.tQty}
                </td>
                <td className="px-2 py-2" />
                <td className="px-2 py-2 text-right font-semibold">
                  {totals.amount.toFixed(2)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* CIF + Bank + Signature */}
        <div className="bg-white border rounded p-4 mt-4 space-y-4">
          <div>
            <label className="text-xs text-slate-600">
              TOTAL CIF text (bottom line)
            </label>
            <input
              value={meta.cifText}
              onChange={(e) =>
                setMeta((m) => ({ ...m, cifText: e.target.value }))
              }
              className="w-full border px-3 py-2 rounded mt-1 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">Bank Details</label>
            <textarea
              value={meta.bankDetail || ""}
              onChange={(e) =>
                setMeta((m) => ({ ...m, bankDetail: e.target.value }))
              }
              className="w-full border px-3 py-2 rounded mt-1 text-sm"
              rows={4}
            />
          </div>

          <div className="flex flex-wrap items-start gap-4">
            <div className="flex-1">
              <label className="text-xs text-slate-600">
                Stamp / Signature
              </label>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <div className="w-40 h-20 border rounded flex items-center justify-center bg-slate-50">
                  {signature ? (
                    <img
                      src={signature}
                      alt="sig"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-xs text-slate-400">No signature</div>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={uploadSignature}
                  />
                  <div className="text-xs text-slate-500 mt-2">
                    File: {signaturePreviewName || "none"}
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    Signature label (printed under stamp)
                  </div>
                  <textarea
                    value={meta.signatureText || ""}
                    onChange={(e) =>
                      setMeta((m) => ({
                        ...m,
                        signatureText: e.target.value,
                      }))
                    }
                    className="border px-2 py-1 rounded text-xs w-60 mt-1"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-md shadow-xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-3 border-b">
              <div className="font-semibold text-sm">
                Commercial Invoice — Preview
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={printPreview}
                  className="px-3 py-1 rounded bg-sky-600 text-white inline-flex items-center gap-2 text-xs"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button
                  onClick={() => {
                    const html = previewHtml || buildPrintableHTML();
                    const w = window.open("", "_blank", "noopener,noreferrer");
                    if (!w) return toast.error("Popup blocked");
                    w.document.open();
                    w.document.write(html);
                    w.document.close();
                  }}
                  className="px-3 py-1 rounded bg-slate-800 text-white inline-flex items-center gap-2 text-xs"
                >
                  <Download className="w-4 h-4" /> Open
                </button>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="px-3 py-1 rounded bg-slate-100 text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <iframe
                title="invoice-preview"
                srcDoc={previewHtml || buildPrintableHTML()}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
