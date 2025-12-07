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

const STORAGE_KEY = "igpl_packing_v1";

// demo seed (matches screenshot-ish / sample PDF)
const DEMO = {
  meta: {
    companyName: "YIWU ZHOULAI TRADING CO., LIMITED",
    companyAddress:
      "Add.: Room 801, Unit 3, Building 1, Jiuheyuan, Jiangdong Street, Yiwu City, Jinhua City, Zhejiang Province Tel.:13735751445",
    sellerName: "IMPEXINA GLOBAL PVT LTD",
    sellerAddress:
      "Ground Floor, C-5, Gami Industrial Park Pawane\nMIDC Road NAVI MUMBAI, THANE, Maharashtra, 400705",
    invNo: "IGPLEV86",
    date: "2025-10-09",
    from: "CHINA",
    to: "NHAVA SHEVA INDIA",
    gst: "27AAHCI1462J1ZG",
    bankDetail:
      "BENEFICIARY'S BANK NAME: ZHEJIANG TAILONG COMMERCIAL BANK\nBENEFICIARY NAME: YIWU ZHOULAI TRADING CO.,LIMITED",
    signatureText: "Authorized Signatory",
  },
  items: [
    {
      id: "i1",
      itemNumber: "BB-AMD",
      particular: "FOOTREST",
      mark: "BB-AMD",
      ctn: 5,
      qtyPerCtn: 100,
      unit: "PCS",
      tQty: 500,
      kg: 7,
      tKg: 35.0,
      mix: "",
      hsn: "",
      photo: null,
    },
    {
      id: "i2",
      itemNumber: "SMWGC18",
      particular: "TABLE RUNNER",
      mark: "SMWGC18",
      ctn: 21,
      qtyPerCtn: 96,
      unit: "PCS",
      tQty: 2016,
      kg: 18,
      tKg: 378.0,
      mix: "",
      hsn: "",
      photo: null,
    },
    {
      id: "i3",
      itemNumber: "EXPRESS",
      particular: "WALL HOOK",
      mark: "EXPRESS",
      ctn: 1,
      qtyPerCtn: 100,
      unit: "PCS",
      tQty: 100,
      kg: 1,
      tKg: 1.0,
      mix: "",
      hsn: "",
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

export default function PackingListPage() {
  // IMPORTANT: initial state is ALWAYS DEMO for SSR + first client render
  const [meta, setMeta] = useState(DEMO.meta);
  const [items, setItems] = useState(DEMO.items);
  const [signature, setSignature] = useState(null);
  const [signaturePreviewName, setSignaturePreviewName] = useState("");
  const [previewHtml, setPreviewHtml] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const autosaveTimer = useRef(null);

  // After mount, hydrate from localStorage (client-only – no SSR mismatch)
  useEffect(() => {
    const stored = readStorage();
    if (stored) {
      setMeta(stored.meta || DEMO.meta);
      setItems(stored.items || DEMO.items);
      setSignature(stored.signature || null);
      setSignaturePreviewName(stored.signatureName || "");
    } else {
      // seed demo once if no storage
      writeStorage({
        meta: DEMO.meta,
        items: DEMO.items,
        signature: null,
        signatureName: "",
      });
    }
  }, []);

  // debounced autosave (no toast spam)
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

  // totals (pure calc – safe)
  const totals = useMemo(
    () =>
      items.reduce(
        (acc, it) => {
          acc.ctn += Number(it.ctn || 0);
          acc.tQty += Number(it.tQty || 0);
          acc.tKg += Number(it.tKg || 0);
          return acc;
        },
        { ctn: 0, tQty: 0, tKg: 0 }
      ),
    [items]
  );

  // item helpers
  function baseEmptyRow() {
    return {
      id: uid("item"),
      itemNumber: "",
      particular: "",
      mark: "",
      ctn: 0,
      qtyPerCtn: 0,
      unit: "PCS",
      tQty: 0,
      kg: 0,
      tKg: 0,
      mix: "",
      hsn: "",
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

  function uploadRowPhoto(e, id) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateRow(id, "photo", ev.target && ev.target.result);
    };
    reader.readAsDataURL(f);
  }

  // signature upload
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

  // numeric inputs that recalc tQty / tKg
  function handleChangeNumber(id, field, raw) {
    const v = raw === "" ? "" : Number(raw);
    setItems((s) =>
      s.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: v };
        if (field === "ctn" || field === "qtyPerCtn") {
          updated.tQty =
            Number(updated.ctn || 0) * Number(updated.qtyPerCtn || 0);
        }
        if (field === "ctn" || field === "kg") {
          updated.tKg = Number(updated.ctn || 0) * Number(updated.kg || 0);
        }
        return updated;
      })
    );
  }

  function escapeHtml(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // printable HTML – tuned to look like your PDF
  function buildPrintableHTML() {
    const headerHtml = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
        <div>
          <div style="font-weight:800;font-size:20px;text-transform:uppercase;">
            ${escapeHtml(meta.companyName)}
          </div>
          <div style="margin-top:4px;white-space:pre-wrap;font-size:11px;color:#111;">
            ${escapeHtml(meta.companyAddress)}
          </div>
        </div>
        <div style="text-align:right;font-size:12px;">
          <div style="font-weight:700;font-size:16px;margin-bottom:4px;">PACKING LIST</div>
          <div>INV NO.: <strong>${escapeHtml(meta.invNo || "")}</strong></div>
          <div>DATE: <strong>${escapeHtml(meta.date || "")}</strong></div>
          <div style="margin-top:4px;">FROM: <strong>${escapeHtml(meta.from || "")}</strong></div>
          <div>TO: <strong>${escapeHtml(meta.to || "")}</strong></div>
        </div>
      </div>

      <div style="margin-top:4px;display:flex;gap:12px;font-size:11px;">
        <div style="flex:1;">
          <div style="font-weight:700;margin-bottom:2px;">${escapeHtml(
            meta.sellerName || ""
          )}</div>
          <div style="white-space:pre-wrap;">${escapeHtml(
            meta.sellerAddress || ""
          )}</div>
          <div style="margin-top:6px;white-space:pre-wrap;">${escapeHtml(
            meta.bankDetail || ""
          )}</div>
        </div>
        <div style="width:220px;">
          <div><strong>GST:</strong> ${escapeHtml(meta.gst || "")}</div>
        </div>
      </div>
    `;

    const rowsHtml = items
      .map((it, i) => {
        const photoTd = it.photo
          ? `<td style="border:1px solid #000;padding:4px;text-align:center;">
               <img src="${it.photo}" style="max-width:60px;max-height:40px;object-fit:cover;" />
             </td>`
          : `<td style="border:1px solid #000;padding:4px;text-align:center;">-</td>`;
        return `<tr>
          <td style="border:1px solid #000;padding:4px;text-align:center;font-size:11px;">${
            i + 1
          }</td>
          <td style="border:1px solid #000;padding:4px;text-align:center;font-size:11px;">${escapeHtml(
            it.itemNumber || ""
          )}</td>
          ${photoTd}
          <td style="border:1px solid #000;padding:4px;font-size:11px;">${escapeHtml(
            it.particular || ""
          )}</td>
          <td style="border:1px solid #000;padding:4px;font-size:11px;">${escapeHtml(
            it.mark || ""
          )}</td>
          <td style="border:1px solid #000;padding:4px;text-align:right;font-size:11px;">${escapeHtml(
            it.ctn || 0
          )}</td>
          <td style="border:1px solid #000;padding:4px;text-align:right;font-size:11px;">${escapeHtml(
            it.qtyPerCtn || 0
          )}</td>
          <td style="border:1px solid #000;padding:4px;text-align:center;font-size:11px;">${escapeHtml(
            it.unit || ""
          )}</td>
          <td style="border:1px solid #000;padding:4px;text-align:right;font-size:11px;">${escapeHtml(
            it.tQty || 0
          )}</td>
          <td style="border:1px solid #000;padding:4px;text-align:right;font-size:11px;">${escapeHtml(
            it.kg || 0
          )}</td>
          <td style="border:1px solid #000;padding:4px;text-align:right;font-size:11px;">${escapeHtml(
            it.tKg || 0
          )}</td>
          <td style="border:1px solid #000;padding:4px;text-align:center;font-size:11px;">${escapeHtml(
            it.mix || ""
          )}</td>
          <td style="border:1px solid #000;padding:4px;text-align:center;font-size:11px;">${escapeHtml(
            it.hsn || ""
          )}</td>
        </tr>`;
      })
      .join("");

    const totalRow = `<tr>
      <td colspan="5" style="border:1px solid #000;padding:5px;font-weight:700;text-align:left;font-size:11px;">
        TOTAL
      </td>
      <td style="border:1px solid #000;padding:5px;text-align:right;font-weight:700;font-size:11px;">
        ${totals.ctn}
      </td>
      <td style="border:1px solid #000;padding:5px;"></td>
      <td style="border:1px solid #000;padding:5px;"></td>
      <td style="border:1px solid #000;padding:5px;text-align:right;font-weight:700;font-size:11px;">
        ${totals.tQty}
      </td>
      <td style="border:1px solid #000;padding:5px;"></td>
      <td style="border:1px solid #000;padding:5px;text-align:right;font-weight:700;font-size:11px;">
        ${totals.tKg.toFixed(2)}
      </td>
      <td style="border:1px solid #000;padding:5px;" colspan="2"></td>
    </tr>`;

    const signatureHtml = signature
      ? `<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:18px;">
          <div style="font-size:11px;">${escapeHtml(meta.signatureText || "")}</div>
          <div style="text-align:center;">
            <img src="${signature}" style="max-width:220px;max-height:80px;object-fit:contain;display:block;margin-bottom:4px;" />
            <div style="font-size:11px;">Stamp / Signature</div>
          </div>
        </div>`
      : `<div style="margin-top:18px;font-size:11px;color:#6b6b6b;">
          Signature / Stamp:
          <span style="margin-left:4px;">____________________________</span>
        </div>`;

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Packing List</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #000;
      padding: 18px;
      margin: 0;
      font-size: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    th {
      border: 1px solid #000;
      padding: 5px;
      background: #f3f3f3;
      font-size: 11px;
      text-align: center;
    }
    td {
      border: 1px solid #000;
    }
  </style>
</head>
<body>
  ${headerHtml}
  <table>
    <thead>
      <tr>
        <th style="width:35px;">S.N.</th>
        <th style="width:90px;">Item Number</th>
        <th style="width:80px;">Photo</th>
        <th>Descriptions</th>
        <th style="width:110px;">Mark</th>
        <th style="width:60px;">Ctn.</th>
        <th style="width:80px;">Qty./ Ctn</th>
        <th style="width:55px;">Unit</th>
        <th style="width:80px;">T-QTY</th>
        <th style="width:55px;">KG</th>
        <th style="width:65px;">T.KG</th>
        <th style="width:55px;">MIX</th>
        <th style="width:70px;">HSN</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
      ${totalRow}
    </tbody>
  </table>
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
              Packing List — Editor
            </h2>
            <div className="text-sm text-slate-500">
              Edit all fields, upload item photos & signature, then preview / print.
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

        {/* Header meta editor */}
        <div className="bg-white border rounded p-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="mt-2 text-xs text-slate-500">Seller Name</div>
            <input
              value={meta.sellerName}
              onChange={(e) =>
                setMeta((m) => ({ ...m, sellerName: e.target.value }))
              }
              className="w-full border px-3 py-2 rounded mt-1 text-sm"
            />
            <div className="mt-2 text-xs text-slate-500">
              Seller Address (multi-line)
            </div>
            <textarea
              value={meta.sellerAddress}
              onChange={(e) =>
                setMeta((m) => ({ ...m, sellerAddress: e.target.value }))
              }
              className="w-full border px-3 py-2 rounded mt-1 text-sm"
              rows={2}
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
            <label className="text-xs text-slate-600 mt-2 block">
              To / Destination
            </label>
            <input
              value={meta.to}
              onChange={(e) =>
                setMeta((m) => ({ ...m, to: e.target.value }))
              }
              className="w-full border px-3 py-2 rounded mt-1 text-sm"
            />
            <label className="text-xs text-slate-600 mt-2 block">
              GST / Tax
            </label>
            <input
              value={meta.gst}
              onChange={(e) =>
                setMeta((m) => ({ ...m, gst: e.target.value }))
              }
              className="w-full border px-3 py-2 rounded mt-1 text-sm"
            />
          </div>
        </div>

        {/* Bank / Notes */}
        <div className="bg-white border rounded p-3 mb-4">
          <label className="text-xs text-slate-600">Bank / Misc detail</label>
          <textarea
            value={meta.bankDetail || ""}
            onChange={(e) =>
              setMeta((m) => ({ ...m, bankDetail: e.target.value }))
            }
            className="w-full border px-3 py-2 rounded mt-1 text-sm"
            rows={2}
          />
        </div>

        {/* Quick totals + add controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2 text-sm">
          <div className="flex flex-wrap gap-4 text-slate-700">
            <span>
              <span className="font-semibold">{totals.ctn}</span> cartons
            </span>
            <span>
              <span className="font-semibold">{totals.tQty}</span> total quantity
            </span>
            <span>
              <span className="font-semibold">{totals.tKg.toFixed(2)}</span> total KG
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
                setItems(DEMO.items);
                setMeta(DEMO.meta);
                setSignature(null);
                setSignaturePreviewName("");
                writeStorage({
                  meta: DEMO.meta,
                  items: DEMO.items,
                  signature: null,
                  signatureName: "",
                });
                toast.success("Reset to demo data");
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
                <th className="px-2 py-2">Item Number</th>
                <th className="px-2 py-2">Photo</th>
                <th className="px-2 py-2">Descriptions</th>
                <th className="px-2 py-2">Mark</th>
                <th className="px-2 py-2">Ctn.</th>
                <th className="px-2 py-2">Qty./ Ctn</th>
                <th className="px-2 py-2">Unit</th>
                <th className="px-2 py-2">T-QTY</th>
                <th className="px-2 py-2">KG</th>
                <th className="px-2 py-2">T.KG</th>
                <th className="px-2 py-2">MIX</th>
                <th className="px-2 py-2">HSN</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={it.id} className="border-t">
                  <td className="px-2 py-2 text-sm text-center">{idx + 1}</td>
                  <td className="px-2 py-2">
                    <input
                      value={it.itemNumber}
                      onChange={(e) =>
                        updateRow(it.id, "itemNumber", e.target.value)
                      }
                      className="border px-2 py-1 rounded text-xs w-32"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      {it.photo ? (
                        <img
                          src={it.photo}
                          alt="thumb"
                          className="w-12 h-8 object-cover rounded border"
                        />
                      ) : (
                        <div className="w-12 h-8 border rounded flex items-center justify-center text-slate-400">
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
                      value={it.particular}
                      onChange={(e) =>
                        updateRow(it.id, "particular", e.target.value)
                      }
                      className="border px-2 py-1 rounded text-xs w-60"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={it.mark}
                      onChange={(e) =>
                        updateRow(it.id, "mark", e.target.value)
                      }
                      className="border px-2 py-1 rounded text-xs w-36"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      value={it.ctn}
                      onChange={(e) =>
                        handleChangeNumber(it.id, "ctn", e.target.value)
                      }
                      className="border px-2 py-1 rounded text-xs w-20 text-right"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      value={it.qtyPerCtn}
                      onChange={(e) =>
                        handleChangeNumber(it.id, "qtyPerCtn", e.target.value)
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
                      className="border px-2 py-1 rounded text-xs w-20"
                    />
                  </td>
                  <td className="px-2 py-2 text-right text-xs">
                    {Number(it.tQty) || 0}
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      value={it.kg}
                      onChange={(e) =>
                        handleChangeNumber(it.id, "kg", e.target.value)
                      }
                      className="border px-2 py-1 rounded text-xs w-20 text-right"
                    />
                  </td>
                  <td className="px-2 py-2 text-right text-xs">
                    {Number(it.tKg || 0).toFixed(2)}
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={it.mix}
                      onChange={(e) =>
                        updateRow(it.id, "mix", e.target.value)
                      }
                      className="border px-2 py-1 rounded text-xs w-24"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={it.hsn}
                      onChange={(e) =>
                        updateRow(it.id, "hsn", e.target.value)
                      }
                      className="border px-2 py-1 rounded text-xs w-24"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap items-center gap-1">
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
                <td colSpan={5} className="px-2 py-2 font-semibold">
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
                  {totals.tKg.toFixed(2)}
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Signature */}
        <div className="flex flex-wrap items-start gap-4 mt-4">
          <div className="flex-1">
            <label className="text-xs text-slate-600">Signature / Stamp</label>
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
                <input type="file" accept="image/*" onChange={uploadSignature} />
                <div className="text-xs text-slate-500 mt-2">
                  File: {signaturePreviewName || "none"}
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  Signature label
                </div>
                <input
                  value={meta.signatureText || ""}
                  onChange={(e) =>
                    setMeta((m) => ({
                      ...m,
                      signatureText: e.target.value,
                    }))
                  }
                  className="border px-2 py-1 rounded text-xs w-60 mt-1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* preview modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-md shadow-xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-3 border-b">
              <div className="font-semibold text-sm">Packing List — Preview</div>
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
                title="packing-preview"
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
