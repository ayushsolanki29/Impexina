"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import API from "@/lib/api";
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  Printer,
  Download,
  Save,
  X,
  Eye,
  ArrowLeft,
  Settings,
  Activity,
} from "lucide-react";

export default function CommercialInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const containerCode = params.containerCode;

  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const autosaveTimer = useRef(null);

  // Form states
  const [formData, setFormData] = useState({
    // Header Information
    companyName: "",
    companyAddress: "",
    title: "COMMERCIAL INVOICE",

    // Buyer Information
    buyerName: "",
    buyerAddress: "",
    buyerIEC: "",
    buyerGST: "",
    buyerEmail: "",

    // Invoice Information
    invoiceNo: "",
    date: new Date().toISOString().split("T")[0],
    from: "CHINA",
    to: "",
    cifText: "",

    // Bank Details
    bankDetail: "",

    // Stamp Settings
    stampImage: null,
    stampPosition: "BOTTOM_RIGHT",
    stampText: "",

    // Status
    status: "DRAFT",
  });

  // Load invoice data
  useEffect(() => {
    if (containerCode) {
      loadInvoice();
      loadActivities();
    }
  }, [containerCode]);

  // Load activities
  async function loadActivities() {
    try {
      const response = await API.get(
        `/commercial-invoice/${containerCode}/activities`
      );
      if (response.data.success) {
        setActivities(response.data.data);
      }
    } catch (error) {
      console.error("Error loading activities:", error);
    }
  }

  async function loadInvoice() {
    try {
      setIsLoading(true);
      const response = await API.get(`/commercial-invoice/${containerCode}`);

      if (response.data.success && response.data.data) {
        const invoiceData = response.data.data;
        setInvoice(invoiceData);
        setItems(invoiceData.items || []);

        // Set form data
        setFormData({
          companyName: invoiceData.companyName || "",
          companyAddress: invoiceData.companyAddress || "",
          title: invoiceData.title || "COMMERCIAL INVOICE",
          buyerName: invoiceData.buyerName || "",
          buyerAddress: invoiceData.buyerAddress || "",
          buyerIEC: invoiceData.buyerIEC || "",
          buyerGST: invoiceData.buyerGST || "",
          buyerEmail: invoiceData.buyerEmail || "",
          invoiceNo: invoiceData.invoiceNo || "",
          date: invoiceData.invoiceDate
            ? new Date(invoiceData.invoiceDate).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          from: invoiceData.from || "CHINA",
          to: invoiceData.to || "",
          cifText: invoiceData.cifText || "",
          bankDetail: invoiceData.bankDetail || "",
          stampImage: invoiceData.stampImage || null,
          stampPosition: invoiceData.stampPosition || "BOTTOM_RIGHT",
          stampText: invoiceData.stampText || "",
          status: invoiceData.status || "DRAFT",
        });
      } else {
        toast.info(
          "Commercial invoice not found. You can initialize one from bifurcation data."
        );
      }
    } catch (error) {
      console.error("Error loading commercial invoice:", error);
      if (error.response?.status === 404) {
        toast.info(
          "No commercial invoice found. Click 'Initialize' to create one."
        );
      } else {
        toast.error(error.message || "Failed to load commercial invoice");
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Save commercial invoice
  async function saveInvoice(isAutoSave = false) {
    try {
      // Validation for manual save
      if (!isAutoSave) {
        if (!formData.companyName.trim()) {
          toast.error("Company Name is required");
          return;
        }
        if (!formData.buyerName.trim()) {
          toast.error("Buyer Name is required");
          return;
        }
        if (!formData.invoiceNo.trim()) {
          toast.error("Invoice Number is required");
          return;
        }
      }

      setIsSaving(true);

      // Prepare save data
      const saveData = {
        companyName: formData.companyName,
        companyAddress: formData.companyAddress,
        title: formData.title,
        buyerName: formData.buyerName,
        buyerAddress: formData.buyerAddress,
        buyerIEC: formData.buyerIEC,
        buyerGST: formData.buyerGST,
        buyerEmail: formData.buyerEmail,
        invoiceNo: formData.invoiceNo,
        invoiceDate: formData.date,
        from: formData.from,
        to: formData.to,
        cifText: formData.cifText,
        bankDetail: formData.bankDetail,
        stampImage: formData.stampImage,
        stampPosition: formData.stampPosition,
        stampText: formData.stampText,
        status: formData.status,
      };

      // Update invoice details
      const updateResponse = await API.patch(
        `/commercial-invoice/${containerCode}`,
        saveData
      );

      if (!updateResponse.data.success) {
        throw new Error(
          updateResponse.data.message || "Failed to update commercial invoice"
        );
      }

      // Prepare items for saving
      const itemsToSave = items.map(({ id, ...rest }) => {
        const finalId = id && id.startsWith("item_") ? undefined : id;
        return {
          ...rest,
          id: finalId,
          ctn: Number(rest.ctn) || 0,
          qtyPerCtn: Number(rest.qtyPerCtn) || 0,
          tQty: Number(rest.tQty) || 0,
          unitPrice: Number(rest.unitPrice) || 0,
          amountUsd: Number(rest.amountUsd) || 0,
          from: rest.from || "",
          to: rest.to || "",
        };
      });

      // Update items
      const itemsResponse = await API.patch(
        `/commercial-invoice/${containerCode}/items`,
        {
          items: itemsToSave,
        }
      );

      if (!itemsResponse.data.success) {
        throw new Error(itemsResponse.data.message || "Failed to update items");
      }

      // Log activity only for manual saves
      if (!isAutoSave) {
        await API.post(`/commercial-invoice/${containerCode}/activity`, {
          type: "FIELDS_UPDATED",
          note: "Updated commercial invoice fields and items",
        });
      }

      if (!isAutoSave) {
        toast.success("Commercial invoice saved successfully!");
      }
      loadInvoice();
      loadActivities();
    } catch (error) {
      console.error("Save error:", error);
      if (!isAutoSave) {
        toast.error(error.message || "Failed to save commercial invoice");
      }
    } finally {
      setIsSaving(false);
    }
  }

  // Item management functions
  function baseEmptyRow() {
    return {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      itemNumber: "",
      description: "",
      ctn: 0,
      qtyPerCtn: 0,
      unit: "PCS",
      tQty: 0,
      unitPrice: 0,
      amountUsd: 0,
      photo: null,
      from: "",
      to: "",
    };
  }

  function addRow() {
    setItems([...items, baseEmptyRow()]);
  }

  function addMultipleRows(count) {
    setItems([
      ...items,
      ...Array.from({ length: count }, () => baseEmptyRow()),
    ]);
  }

  function duplicateRow(id) {
    const rowToDuplicate = items.find((item) => item.id === id);
    if (rowToDuplicate) {
      const duplicatedRow = {
        ...rowToDuplicate,
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      setItems([...items, duplicatedRow]);
    }
  }

  function insertRowAfter(id) {
    const index = items.findIndex((item) => item.id === id);
    if (index !== -1) {
      const newItems = [...items];
      newItems.splice(index + 1, 0, baseEmptyRow());
      setItems(newItems);
    }
  }

  function updateRow(id, field, value) {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };

          // Auto-calculate totals
          if (
            field === "ctn" ||
            field === "qtyPerCtn" ||
            field === "unitPrice"
          ) {
            const ctn = Number(updated.ctn) || 0;
            const qtyPerCtn = Number(updated.qtyPerCtn) || 0;
            const unitPrice = Number(updated.unitPrice) || 0;
            updated.tQty = ctn * qtyPerCtn;
            updated.amountUsd = updated.tQty * unitPrice;
          }

          return updated;
        }
        return item;
      })
    );
  }

  // Numeric field handler
  function handleNumberChange(id, field, raw) {
    const value = raw === "" ? "" : Number(raw);
    setItems(
      items.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        const ctn = Number(updated.ctn || 0);
        const qtyPerCtn = Number(updated.qtyPerCtn || 0);
        const unitPrice = Number(updated.unitPrice || 0);
        updated.tQty = ctn * qtyPerCtn;
        updated.amountUsd = updated.tQty * unitPrice;
        return updated;
      })
    );
  }

  function removeRow(id) {
    setItems(items.filter((item) => item.id !== id));
  }

  // Handle photo upload
  function handlePhotoUpload(e, itemId) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      updateRow(itemId, "photo", event.target.result);
    };
    reader.readAsDataURL(file);
  }

  // Handle stamp upload
  function handleStampUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({ ...prev, stampImage: event.target.result }));
    };
    reader.readAsDataURL(file);
  }

  // Calculate totals
  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.ctn += Number(item.ctn) || 0;
        acc.tQty += Number(item.tQty) || 0;
        acc.amount += Number(item.amountUsd) || 0;
        return acc;
      },
      { ctn: 0, tQty: 0, amount: 0 }
    );
  }, [items]);

  // Build printable HTML
  function buildPrintableHTML() {
    const stampPositionStyle =
      {
        BOTTOM_LEFT: "text-align: left;",
        BOTTOM_CENTER: "text-align: center;",
        BOTTOM_RIGHT: "text-align: right;",
      }[formData.stampPosition] || "text-align: right;";

    function escapeHtml(s) {
      if (s === null || s === undefined) return "";
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    const rowsHtml = items
      .map((it, i) => {
        const photo = it.photo
          ? `<img src="${it.photo}" style="max-width:45px;max-height:35px;" />`
          : "";
        return `
  <tr>
    <td class="c">${i + 1}</td>
    <td class="c">${escapeHtml(it.itemNumber)}</td>
    <td class="c">${photo}</td>
    <td>${escapeHtml(it.description)}</td>
    <td class="r">${it.ctn}</td>
    <td class="r">${it.qtyPerCtn}</td>
    <td class="c">${escapeHtml(it.unit)}</td>
    <td class="r">${it.tQty}</td>
    <td class="r">${Number(it.unitPrice).toFixed(2)}</td>

    <td class="r">${Number(it.amountUsd).toFixed(2)}</td>
  </tr>`;
      })
      .join("");

    return `<!DOCTYPE html>
  <html>
  <head>
  <meta charset="utf-8"/>
  <title>Commercial Invoice - ${escapeHtml(formData.invoiceNo)}</title>
  
  <style>
  @page { size:A4; margin:10mm; }
  
  body {
    font-family: Cambria, "Cambria Math", "Times New Roman", serif;
    font-size: 10.5px;
    color:#000;
    margin:0;
  }
  
  table {
    width:100%;
    border-collapse:collapse;
  }
  
  td, th {
    border:1px solid #888;
    padding:3px 4px;
    vertical-align:top;
  }
  
  .c { text-align:center; }
  .r { text-align:right; }
  .b { font-weight:bold; }
  </style>
  </head>
  
  <body>
  
  <table>
  <tr>
    <td class="c b" style="font-size:16px;">
      ${escapeHtml(formData.companyName)}
    </td>
  </tr>
  <tr>
    <td class="c">
      ${escapeHtml(formData.companyAddress)}
    </td>
  </tr>
  <tr>
    <td class="c b" style="font-size:14px;">
      ${escapeHtml(formData.title)}
    </td>
  </tr>
  </table>
  
  <table>
  <tr>
  <td style="width:65%;">
    <b>${escapeHtml(formData.buyerName)}</b><br/>
    ${escapeHtml(formData.buyerAddress).replace(/\n/g, "<br/>")}<br/>
    ${escapeHtml(formData.buyerIEC)}<br/>
    ${escapeHtml(formData.buyerGST)}<br/>
    ${escapeHtml(formData.buyerEmail)}
  </td>
  <td style="width:35%;">
    <b>INV NO.:</b> ${escapeHtml(formData.invoiceNo)}<br/>
    <b>DATE:</b> ${new Date(formData.date).toLocaleDateString("en-GB")}<br/>
    <b>${escapeHtml(formData.to)}</b><br/>
    <b>FROM:</b> ${escapeHtml(formData.from)}
  </td>
  </tr>
  </table>
  
  <table>
  <thead>
  <tr class="b">
    <th>S.N.</th>
    <th>ITEM NO.</th>
    <th>Photo</th>
    <th>Descriptions</th>
    <th>Ctn.</th>
    <th>Qty./Ctn</th>
    <th>Unit</th>
    <th>T-Qty</th>
    <th>U.price</th>
    <th>Amount/USD</th>
  </tr>
  </thead>
  
  <tbody>
  ${rowsHtml}
  
  <tr class="b">
    <td colspan="6">TOTAL</td>
    <td class="r">${totals.ctn}</td>

    <td class="r">${totals.tQty}</td>
    <td></td>
    <td class="r">${totals.amount.toFixed(2)}</td>
  </tr>
  </tbody>
  </table>
  
  <table>
  <tr>
    <td class="b">
      ${escapeHtml(formData.cifText)}
    </td>
  </tr>
  </table>
  
  <table>
  <tr><td class="b">Bank Detail:</td></tr>
  ${escapeHtml(formData.bankDetail)
    .split("\n")
    .map((l) => `<tr><td>${l}</td></tr>`)
    .join("")}
  </table>
  
  <table>
  <tr>
    <td></td>
    <td class="c" style="${stampPositionStyle}">
      ${
        formData.stampImage
          ? `<img src="${formData.stampImage}" style="max-height:55px"/><br/>`
          : ""
      }
      ${escapeHtml(formData.stampText).replace(/\n/g, "<br/>")}
    </td>
  </tr>
  </table>
  
  </body>
  </html>`;
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
      html + "<script>setTimeout(()=>window.print(),200);</script>"
    );
    w.document.close();
  }

  async function handleInitialize() {
    try {
      const response = await API.post(
        `/commercial-invoice/initialize/${containerCode}`,
        {
          companyName: "YIWU ZHOULAI TRADING CO., LIMITED",
          companyAddress:
            "Add.: Room 801, Unit 3, Building 1, Jiuheyuan, Jiangdong Street, Yiwu City, Jinhua City, Zhejiang Province Tel.:13735751445",
        }
      );
      if (response.data.success) {
        toast.success("Commercial invoice initialized successfully!");
        loadInvoice();
      }
    } catch (error) {
      toast.error(`Failed to initialize: ${error.message}`);
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading commercial invoice...</div>
      </div>
    );
  }

  // If no invoice exists, show initialization screen
  if (!invoice) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-2">
            Initialize Commercial Invoice
          </h2>
          <p className="text-gray-600 mb-6">
            No commercial invoice found for container{" "}
            <strong>{containerCode}</strong>. Initialize from bifurcation data
            to create a new invoice.
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleInitialize}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Initialize Commercial Invoice
            </button>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main commercial invoice editor UI
  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Commercial Invoice - {formData.invoiceNo}
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-gray-600">
                  Container: <strong>{containerCode}</strong>
                </span>
                <span className="text-gray-600">
                  Status:{" "}
                  <span
                    className={`font-semibold ${
                      formData.status === "CONFIRMED"
                        ? "text-green-600"
                        : formData.status === "PRINTED"
                        ? "text-blue-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {formData.status}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="px-3 py-2 border border-gray-300 rounded inline-flex items-center gap-2 hover:bg-gray-50"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <button
              onClick={() => saveInvoice(false)}
              disabled={isSaving}
              className="px-4 py-2 bg-emerald-600 text-white rounded inline-flex items-center gap-2 hover:bg-emerald-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={openPreview}
              className="px-4 py-2 bg-slate-800 text-white rounded inline-flex items-center gap-2 hover:bg-slate-900"
            >
              <Eye className="w-4 h-4" /> Preview
            </button>
            <button
              onClick={printPreview}
              className="px-4 py-2 bg-blue-600 text-white rounded inline-flex items-center gap-2 hover:bg-blue-700"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>
        {/* Advanced Settings */}
        {showAdvancedSettings && (
          <div className="bg-white border rounded p-4 mt-4">
            <h3 className="font-semibold text-sm mb-3">Advanced Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-600">Invoice Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((m) => ({ ...m, status: e.target.value }))
                  }
                  className="w-full border px-3 py-2 rounded mt-1 text-sm"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PRINTED">Printed</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-600">Load Demo Data</label>
                <button
                  onClick={() => {
                    setFormData({
                      ...formData,
                      companyName: "YIWU ZHOULAI TRADING CO., LIMITED",
                      companyAddress:
                        "Add.: Room 801, Unit 3, Building 1, Jiuheyuan, Jiangdong Street, Yiwu City, Jinhua City, Zhejiang Province Tel.:13735751445",
                      title: "COMMERCIAL INVOICE",
                      buyerName: "IMPEXINA GLOBAL PVT LTD",
                      buyerAddress:
                        "Ground Floor, C-5, Gami Industrial Park Pawane\nMIDC Road NAVI MUMBAI, THANE, Maharashtra, 400705",
                      buyerIEC: "IEC NO.: AAHCI1462J",
                      buyerGST: "GST NO.: 27AAHCI1462J1ZG",
                      buyerEmail: "EMAIL: impexina91@gmail.com",
                      cifText:
                        "TOTAL CIF USD 9010 AND 90 WITHIN DAYS AFTER DELIVERY",
                      bankDetail:
                        "BENEFICIARY'S BANK NAME: ZHEJIANG TAILONG COMMERCIAL BANK\nBENEFICIARY NAME: YIWU ZHOULAI TRADING CO.,LIMITED\nSWIFT BIC: ZJTLNBHXKXX\nBENEFICIARY'S BANK ADD: ROOM 801, UNIT 3, BUILDING 1, JIUHEYUAN, JIANGDONG STREET, YIWU CITY, JINHUA CITY, ZHEJIANG PROVINCE\nBENEFICIARY A/C NO.: 330800202001000155179",
                      stampText:
                        "YIWU ZHOULAI TRADING CO., LIMITED\nAUTHORIZED SIGNATORY",
                    });
                    toast.success("Demo data loaded");
                  }}
                  className="w-full px-3 py-2 bg-amber-100 text-amber-900 rounded mt-1 text-sm hover:bg-amber-200"
                >
                  Load Demo Data
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Company header editor */}
        <div className="bg-white border rounded p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-600">Company Name</label>
              <input
                value={formData.companyName}
                onChange={(e) =>
                  setFormData((m) => ({ ...m, companyName: e.target.value }))
                }
                className="w-full border px-3 py-2 rounded mt-1 text-sm"
              />
              <label className="text-xs text-slate-600 mt-2 block">
                Company Address
              </label>
              <textarea
                value={formData.companyAddress}
                onChange={(e) =>
                  setFormData((m) => ({ ...m, companyAddress: e.target.value }))
                }
                className="w-full border px-3 py-2 rounded mt-1 text-sm"
                rows={3}
              />
              <label className="text-xs text-slate-600 mt-2 block">
                Invoice Title
              </label>
              <input
                value={formData.title}
                onChange={(e) =>
                  setFormData((m) => ({ ...m, title: e.target.value }))
                }
                className="w-full border px-3 py-2 rounded mt-1 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600">Invoice No.</label>
              <input
                value={formData.invoiceNo}
                onChange={(e) =>
                  setFormData((m) => ({ ...m, invoiceNo: e.target.value }))
                }
                className="w-full border px-3 py-2 rounded mt-1 text-sm"
              />
              <label className="text-xs text-slate-600 mt-2 block">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData((m) => ({ ...m, date: e.target.value }))
                }
                className="w-full border px-3 py-2 rounded mt-1 text-sm"
              />
              <label className="text-xs text-slate-600 mt-2 block">From</label>
              <input
                value={formData.from}
                onChange={(e) =>
                  setFormData((m) => ({ ...m, from: e.target.value }))
                }
                className="w-full border px-3 py-2 rounded mt-1 text-sm"
              />
              <label className="text-xs text-slate-600 mt-2 block">To</label>
              <input
                value={formData.to}
                onChange={(e) =>
                  setFormData((m) => ({ ...m, to: e.target.value }))
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
              value={formData.buyerName}
              onChange={(e) =>
                setFormData((m) => ({ ...m, buyerName: e.target.value }))
              }
              className="w-full border px-3 py-2 rounded mt-1 text-sm"
            />
            <label className="text-xs text-slate-600 mt-2 block">
              Buyer Address
            </label>
            <textarea
              value={formData.buyerAddress}
              onChange={(e) =>
                setFormData((m) => ({ ...m, buyerAddress: e.target.value }))
              }
              className="w-full border px-3 py-2 rounded mt-1 text-sm"
              rows={3}
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">Buyer IEC</label>
            <input
              value={formData.buyerIEC}
              onChange={(e) =>
                setFormData((m) => ({ ...m, buyerIEC: e.target.value }))
              }
              className="w-full border px-3 py-2 rounded mt-1 text-sm"
            />
            <label className="text-xs text-slate-600 mt-2 block">
              Buyer GST
            </label>
            <input
              value={formData.buyerGST}
              onChange={(e) =>
                setFormData((m) => ({ ...m, buyerGST: e.target.value }))
              }
              className="w-full border px-3 py-2 rounded mt-1 text-sm"
            />
            <label className="text-xs text-slate-600 mt-2 block">
              Buyer Email
            </label>
            <input
              value={formData.buyerEmail}
              onChange={(e) =>
                setFormData((m) => ({ ...m, buyerEmail: e.target.value }))
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
              <span className="font-semibold">{totals.tQty}</span> total
              quantity
            </span>
            <span>
              USD{" "}
              <span className="font-semibold">{totals.amount.toFixed(2)}</span>{" "}
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
                  {/* Item No */}
                  <td className="px-2 py-2">
                    <input
                      value={it.itemNumber}
                      onChange={(e) =>
                        updateRow(it.id, "itemNumber", e.target.value)
                      }
                      className="border px-2 py-1 rounded text-xs w-24"
                    />
                  </td>

                  {/* Photo */}
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
                        onChange={(e) => handlePhotoUpload(e, it.id)}
                        className="text-[10px] w-20"
                      />
                    </div>
                  </td>
                  {/* Description */}
                  <td className="px-2 py-2">
                    <input
                      value={it.description}
                      onChange={(e) =>
                        updateRow(it.id, "description", e.target.value)
                      }
                      className="border px-2 py-1 rounded text-xs w-48"
                    />
                  </td>
                  {/* Ctn */}
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      value={it.ctn}
                      onChange={(e) =>
                        handleNumberChange(it.id, "ctn", e.target.value)
                      }
                      className="border px-2 py-1 rounded text-xs w-14 text-right"
                    />
                  </td>
                  {/* Qty/Ctn */}
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      value={it.qtyPerCtn}
                      onChange={(e) =>
                        handleNumberChange(it.id, "qtyPerCtn", e.target.value)
                      }
                      className="border px-2 py-1 rounded text-xs w-16 text-right"
                    />
                  </td>
                  {/* Unit */}
                  <td className="px-2 py-2">
                    <input
                      value={it.unit}
                      onChange={(e) => updateRow(it.id, "unit", e.target.value)}
                      className="border px-2 py-1 rounded text-xs w-14 text-center"
                    />
                  </td>
                  {/* Total Qty */}
                  <td className="px-2 py-2 text-right text-xs">
                    {Number(it.tQty) || 0}
                  </td>
                  {/* Unit Price */}
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

                  {/* Amount */}
                  <td className="px-2 py-2 text-right text-xs">
                    {Number(it.amountUsd || 0).toFixed(2)}
                  </td>
                  {/* Actions */}
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-1">
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
                <td colSpan={6} className="px-2 py-2 font-semibold">
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
              value={formData.cifText}
              onChange={(e) =>
                setFormData((m) => ({ ...m, cifText: e.target.value }))
              }
              className="w-full border px-3 py-2 rounded mt-1 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">Bank Details</label>
            <textarea
              value={formData.bankDetail || ""}
              onChange={(e) =>
                setFormData((m) => ({ ...m, bankDetail: e.target.value }))
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
                  {formData.stampImage ? (
                    <img
                      src={formData.stampImage}
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
                    onChange={handleStampUpload}
                  />
                  <div className="text-xs text-slate-500 mt-2">
                    Signature label (printed under stamp)
                  </div>
                  <textarea
                    value={formData.stampText || ""}
                    onChange={(e) =>
                      setFormData((m) => ({
                        ...m,
                        stampText: e.target.value,
                      }))
                    }
                    className="border px-2 py-1 rounded text-xs w-60 mt-1"
                    rows={2}
                  />
                  <div className="mt-2">
                    <label className="text-xs text-slate-600">
                      Stamp Position
                    </label>
                    <select
                      value={formData.stampPosition}
                      onChange={(e) =>
                        setFormData((m) => ({
                          ...m,
                          stampPosition: e.target.value,
                        }))
                      }
                      className="border px-2 py-1 rounded text-xs w-full mt-1"
                    >
                      <option value="BOTTOM_LEFT">Bottom Left</option>
                      <option value="BOTTOM_CENTER">Bottom Center</option>
                      <option value="BOTTOM_RIGHT">Bottom Right</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activities Section */}
        {activities.length > 0 && (
          <div className="bg-white border rounded p-4 mt-4">
            <h3 className="font-semibold text-sm mb-3">Recent Activities</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {activities.map((activity, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 text-xs border-b pb-2"
                >
                  <Activity className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">{activity.type}</div>
                    <div className="text-gray-600">{activity.note}</div>
                    <div className="text-gray-500 text-[10px]">
                      {new Date(activity.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
