"use client";

import React, { useState, useRef } from "react";
import { 
  X, FileSpreadsheet, FileText, Image as ImageIcon, 
  Copy, Eye, EyeOff, 
  Package
} from "lucide-react";
import API from "@/lib/api";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from "xlsx-js-style";

// Helper function to get image URL
const getImageUrl = (photoPath) => {
  if (!photoPath) return null;
  
  // If already a full URL, return as is
  if (photoPath.startsWith("http://") || photoPath.startsWith("https://")) {
    return photoPath;
  }
  
  // Ensure photoPath starts with /
  const normalizedPath = photoPath.startsWith("/") ? photoPath : `/${photoPath}`;
  
  // Get base URL and remove trailing slash if present
  const baseUrl = (process.env.NEXT_PUBLIC_SERVER_URL || "").replace(/\/$/, "");
  
  return `${baseUrl}${normalizedPath}`;
};

const toSafeFileBase = (value, fallback = "loading-sheet") => {
  const raw = String(value || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[\\/:*?"<>|]+/g, "-");

  return raw || fallback;
};

export default function PreviewModal({
  sheet,
  sheets,
  container,
  sheetSort = "oldest",
  sortOptions = [],
  onSheetSortChange,
  onClose,
  onUpdate,
}) {
  const sheetsList = sheets || (sheet ? [sheet] : []);
  const isCombined = sheetsList.length > 1;
  const mainTitle = isCombined ? "Full Container Preview" : `Preview: ${sheet?.shippingMark}`;
  const firstSheet = sheetsList[0] || {};
  const loadingDate = container?.loadingDate
    ? new Date(container.loadingDate).toLocaleDateString("en-GB")
    : "-";
  const [showImages, setShowImages] = useState(true);
  const [showRate, setShowRate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const previewRef = useRef(null);
  const previewWidth = showImages
    ? (showRate ? 1210 : 1130)
    : (showRate ? 1130 : 1050);
  const filename = isCombined ? `full-container-${container.containerCode}` : `loading-sheet-${sheet?.shippingMark || "export"}`;
  const safeFilename = toSafeFileBase(filename);

  /* 
   * Robust Export Strategy:
   * 1. Create an isolated iframe (no Tailwind stylesheets).
   * 2. Clone the content with inline HEX styles.
   * 3. Run html2canvas inside the clean iframe.
   * This guarantees no 'lab'/'oklch' colors from Tailwind 4 preflight.
   */
  const performExport = async (format) => {
    if (!previewRef.current) return;

    // 1. Create hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = `${previewWidth + 64}px`;
    iframe.style.height = '2000px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    try {
      setLoading(true);

      // 2. Prepare content
      const doc = iframe.contentWindow.document;
      doc.open();
      // Write basic structure with NO external styles, only basic reset
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { margin: 0; padding: 0; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; -webkit-print-color-adjust: exact; }
              * { box-sizing: border-box; }
            </style>
          </head>
          <body>
            <div id="capture-mount" style="display: inline-block; width: 100%;"></div>
          </body>
        </html>
      `);
      doc.close();

      // 3. Clone and Clean Content
      const content = previewRef.current.cloneNode(true);
      
      // Strip all class names to ensure NO external CSS matches
      const stripClasses = (node) => {
        if (node.nodeType === 1) {
          node.removeAttribute('class');
          node.removeAttribute('className');
          if (!node.style.borderColor) node.style.borderColor = '#e2e8f0'; // Default border color
          
          // Handle ignore attribute manually if needed, but html2canvas handles data-html2canvas-ignore
          
          Array.from(node.children).forEach(stripClasses);
        }
      };
      stripClasses(content);
      
      const mountPoint = doc.getElementById('capture-mount');
      mountPoint.appendChild(content);

      // Wait for images to load inside iframe
      const images = Array.from(doc.images);
      await Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve; 
        });
      }));

      const exportNode = mountPoint.firstElementChild;
      const exportWidth = Math.ceil(exportNode.scrollWidth);
      const exportHeight = Math.ceil(exportNode.scrollHeight);

      iframe.style.width = `${exportWidth}px`;
      iframe.style.height = `${exportHeight}px`;

      // 4. Capture - Target the content specifically to avoid whitespace
      const canvas = await html2canvas(exportNode, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: exportWidth,
        height: exportHeight,
        windowWidth: exportWidth,
        windowHeight: exportHeight,
      });

      // 5. Save
      if (format === 'pdf') {
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "px",
          format: "a4"
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfPageHeight = pdf.internal.pageSize.getHeight();
        const scaledImageHeight = (canvas.height * pdfWidth) / canvas.width;

        let heightLeft = scaledImageHeight;
        let position = 0;

        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, scaledImageHeight);
        heightLeft -= pdfPageHeight;

        while (heightLeft > 0) {
          position -= pdfPageHeight;
          pdf.addPage();
          pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, scaledImageHeight);
          heightLeft -= pdfPageHeight;
        }

        pdf.save(`${safeFilename}.pdf`);
        toast.success("PDF generated successfully");
      } else {
        const link = document.createElement("a");
        link.download = `${safeFilename}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        toast.success("Image downloaded");
      }

    } catch (error) {
      console.error("Export Error:", error);
      toast.error(`Failed to export ${format.toUpperCase()}`);
    } finally {
      document.body.removeChild(iframe);
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => performExport('pdf');
  const handleDownloadImage = () => performExport('image');

  const handleDownloadExcel = async () => {
    try {
      setLoading(true);

      const columns = isCombined
        ? [
            { key: "sheetMark", label: "SHEET MARK", type: "text" },
            { key: "no", label: "NO.", type: "int" },
            { key: "particular", label: "PARTICULAR", type: "textWrap" },
            { key: "mark", label: "MARK", type: "text" },
            { key: "itemNo", label: "ITEM NO.", type: "text" },
            { key: "ctn", label: "CTN", type: "int" },
            { key: "pcs", label: "PCS", type: "int" },
            { key: "tPcs", label: "TOTAL PCS", type: "int" },
            { key: "unit", label: "UNIT", type: "text" },
            { key: "cbm", label: "CBM", type: "dec3" },
            { key: "tCbm", label: "TOTAL CBM", type: "dec3" },
            { key: "wt", label: "WT", type: "dec2" },
            { key: "tWt", label: "TOTAL WT", type: "dec2" },
            ...(showRate ? [{ key: "rate", label: "RATE", type: "dec2" }] : []),
          ]
        : [
            { key: "no", label: "NO.", type: "int" },
            { key: "particular", label: "PARTICULAR", type: "textWrap" },
            { key: "mark", label: "MARK", type: "text" },
            { key: "itemNo", label: "ITEM NO.", type: "text" },
            { key: "ctn", label: "CTN", type: "int" },
            { key: "pcs", label: "PCS", type: "int" },
            { key: "tPcs", label: "TOTAL PCS", type: "int" },
            { key: "unit", label: "UNIT", type: "text" },
            { key: "cbm", label: "CBM", type: "dec3" },
            { key: "tCbm", label: "TOTAL CBM", type: "dec3" },
            { key: "wt", label: "WT", type: "dec2" },
            { key: "tWt", label: "TOTAL WT", type: "dec2" },
            ...(showRate ? [{ key: "rate", label: "RATE", type: "dec2" }] : []),
          ];

      const headerRow = columns.map((c) => c.label);

      const rows = [];
      sheetsList.forEach((s) => {
        (s.items || []).forEach((item) => {
          if (!item?.particular?.trim()) return;
          const ctn = parseInt(item.ctn) || 0;
          const pcs = parseInt(item.pcs) || 0;
          const cbm = parseFloat(item.cbm) || 0;
          const wt = parseFloat(item.wt) || 0;
          const rate = parseFloat(item.rate) || 0;

          const rowObj = {
            sheetMark: s.shippingMark || "",
            no: rows.length + 1,
            particular: item.particular || "",
            mark: item.mark || s.shippingMark || "",
            itemNo: item.itemNo || "",
            ctn,
            pcs,
            tPcs: ctn * pcs,
            unit: item.unit || "PCS",
            cbm,
            tCbm: ctn * cbm,
            wt,
            tWt: ctn * wt,
            rate,
          };

          rows.push(columns.map((c) => rowObj[c.key]));
        });
      });

      if (rows.length === 0) {
        toast.error("No items to export");
        return;
      }

      const now = new Date();
      const titleText = isCombined
        ? `FULL CONTAINER - ${container?.containerCode || ""}`.trim()
        : `LOADING SHEET - ${sheet?.shippingMark || ""}`.trim();

      const metaLeft = isCombined
        ? `Container: ${container?.containerCode || "-"}   ·   Sheets: ${sheetsList.length}`
        : `Container: ${container?.containerCode || "-"}   ·   Client: ${sheet?.clientName || "-"}`;

      const metaRight = `Date: ${now.toLocaleDateString("en-GB")}`;

      const metaRow = new Array(columns.length).fill("");
      metaRow[0] = metaLeft;
      metaRow[Math.max(columns.length - 2, 0)] = metaRight;

      const wsData = [[titleText], metaRow, [], headerRow, ...rows];

      // Totals row (same math as UI)
      const totalsRow = new Array(columns.length).fill("");
      const labelCol = isCombined ? 2 : 1;
      totalsRow[labelCol] = "TOTAL";
      // CTN / Total PCS / Total CBM / Total WT
      const totals = sheetsList.reduce(
        (acc, s) => {
          (s.items || []).forEach((item) => {
            if (!item?.particular?.trim()) return;
            const ctn = parseInt(item.ctn) || 0;
            const pcs = parseInt(item.pcs) || 0;
            const cbm = parseFloat(item.cbm) || 0;
            const wt = parseFloat(item.wt) || 0;
            acc.ctn += ctn;
            acc.tPcs += ctn * pcs;
            acc.tCbm += ctn * cbm;
            acc.tWt += ctn * wt;
          });
          return acc;
        },
        { ctn: 0, tPcs: 0, tCbm: 0, tWt: 0 }
      );

      const colIndexByKey = Object.fromEntries(columns.map((c, idx) => [c.key, idx]));
      totalsRow[colIndexByKey.ctn] = totals.ctn;
      totalsRow[colIndexByKey.tPcs] = totals.tPcs;
      totalsRow[colIndexByKey.tCbm] = Number(totals.tCbm.toFixed(3));
      totalsRow[colIndexByKey.tWt] = Number(totals.tWt.toFixed(2));

      wsData.push([]);
      wsData.push(totalsRow);

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      ws["!cols"] = isCombined
        ? [
            { wch: 18 }, // sheet mark
            { wch: 6 },
            { wch: 44 },
            { wch: 16 },
            { wch: 14 },
            { wch: 8 },
            { wch: 8 },
            { wch: 10 },
            { wch: 8 },
            { wch: 10 },
            { wch: 12 },
            { wch: 10 },
            { wch: 12 },
            { wch: 12 },
          ]
        : [
            { wch: 6 },
            { wch: 44 },
            { wch: 16 },
            { wch: 14 },
            { wch: 8 },
            { wch: 8 },
            { wch: 10 },
            { wch: 8 },
            { wch: 10 },
            { wch: 12 },
            { wch: 10 },
            { wch: 12 },
            { wch: 12 },
          ];

      // Merges for title + meta row
      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: columns.length - 3 } },
        { s: { r: 1, c: columns.length - 2 }, e: { r: 1, c: columns.length - 1 } },
      ];

      const border = {
        top: { style: "thin", color: { rgb: "CBD5E1" } },
        bottom: { style: "thin", color: { rgb: "CBD5E1" } },
        left: { style: "thin", color: { rgb: "CBD5E1" } },
        right: { style: "thin", color: { rgb: "CBD5E1" } },
      };

      const styleForType = (type) => {
        if (type === "int") return { numFmt: "#,##0" };
        if (type === "dec3") return { numFmt: "#,##0.000" };
        if (type === "dec2") return { numFmt: "#,##0.00" };
        return {};
      };

      const setStyle = (addr, style) => {
        if (!ws[addr]) return;
        ws[addr].s = style;
      };

      // Title row style
      for (let c = 0; c < columns.length; c += 1) {
        setStyle(XLSX.utils.encode_cell({ r: 0, c }), {
          font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
          fill: { patternType: "solid", fgColor: { rgb: "059669" } },
          alignment: { horizontal: "center", vertical: "center" },
        });
      }
      ws["!rows"] = [{ hpt: 26 }];

      // Header row style (r=3)
      const excelHeaderRow = 3;
      for (let c = 0; c < columns.length; c += 1) {
        const col = columns[c];
        const isNumber = ["int", "dec3", "dec2"].includes(col.type);
        setStyle(XLSX.utils.encode_cell({ r: excelHeaderRow, c }), {
          font: { bold: true, color: { rgb: "0F172A" } },
          fill: { patternType: "solid", fgColor: { rgb: "FDE68A" } },
          border,
          alignment: {
            horizontal: isNumber ? "right" : "left",
            vertical: "center",
            wrapText: true,
          },
        });
      }

      // Data rows start at r=4
      const firstDataRow = 4;
      const lastDataRow = firstDataRow + rows.length - 1;
      for (let r = firstDataRow; r <= lastDataRow; r += 1) {
        for (let c = 0; c < columns.length; c += 1) {
          const col = columns[c];
          const isNumber = ["int", "dec3", "dec2"].includes(col.type);
          setStyle(XLSX.utils.encode_cell({ r, c }), {
            border,
            alignment: {
              horizontal: isNumber ? "right" : "left",
              vertical: "top",
              wrapText: col.type === "textWrap",
            },
            ...(isNumber ? styleForType(col.type) : {}),
          });
        }
      }

      // Totals row style
      const totalsExcelRow = lastDataRow + 2;
      for (let c = 0; c < columns.length; c += 1) {
        const col = columns[c];
        const isNumber = ["int", "dec3", "dec2"].includes(col.type);
        setStyle(XLSX.utils.encode_cell({ r: totalsExcelRow, c }), {
          font: { bold: true },
          fill: { patternType: "solid", fgColor: { rgb: "F1F5F9" } },
          border,
          alignment: { horizontal: isNumber ? "right" : "left", vertical: "center" },
          ...(isNumber ? styleForType(col.type) : {}),
        });
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Preview");
      XLSX.writeFile(wb, `${safeFilename}.xlsx`);

      toast.success("Excel downloaded");
    } catch (error) {
      toast.error("Failed to download Excel");
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppCopy = async () => {
    try {
      const summaryText = `*${isCombined ? "GLOBAL SUMMARY" : firstSheet.shippingMark}* CONFIRMATION
LOADING DATE: ${loadingDate}
CTN: ${globalTotals.ctn} | PCS: ${globalTotals.tPcs}
CBM: ${globalTotals.tCbm.toFixed(3)} | WT: ${globalTotals.tWt.toFixed(2)} KG
CONTAINER: ${container.containerCode}`;
      
      await navigator.clipboard.writeText(summaryText);
      toast.success("Summary copied");
    } catch (error) {
      toast.error("Failed to copy summary");
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (isCombined || !sheet) return;
    try {
      setStatusLoading(true);
      const response = await API.patch(`/loading-sheets/${sheet.id}/status`, {
        status: newStatus,
      });
      if (response.data.success) {
        toast.success(`Status updated to ${newStatus}`);
        onUpdate(newStatus);
      }
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  // Helper to calculate totals for a sheet
  const calculateSheetTotals = (s) => (s.items || []).reduce(
    (acc, item) => {
      acc.ctn += (item.ctn || 0);
      acc.tPcs += ((item.ctn || 0) * (item.pcs || 0));
      acc.tCbm += ((item.ctn || 0) * (item.cbm || 0));
      acc.tWt += ((item.ctn || 0) * (item.wt || 0));
      return acc;
    },
    { ctn: 0, tPcs: 0, tCbm: 0, tWt: 0 }
  );

  const globalTotals = sheetsList.reduce((acc, s) => {
    const t = calculateSheetTotals(s);
    acc.ctn += t.ctn;
    acc.tPcs += t.tPcs;
    acc.tCbm += t.tCbm;
    acc.tWt += t.tWt;
    return acc;
  }, { ctn: 0, tPcs: 0, tCbm: 0, tWt: 0 });

  // Professional HEX Colors (Safe for Export)
  const colors = {
    slate900: '#0f172a',
    slate700: '#334155',
    slate600: '#475569',
    slate500: '#64748b',
    slate200: '#e2e8f0',
    slate100: '#f1f5f9',
    slate50:  '#f8fafc',
    white:    '#ffffff',
    blueBg:   '#eff6ff',
    blueText: '#2563eb',
    orangeBg: '#fff7ed',
    orangeText:'#ea580c',
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-2 md:p-4">
      <div className="bg-white w-full max-w-[98vw] xl:max-w-[96vw] rounded-lg shadow-xl flex flex-col h-[95vh]">
        {/* Modal Header */}
        <div className="flex flex-col gap-3 px-4 py-4 border-b border-slate-200 shrink-0 bg-slate-50 rounded-t-lg lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800">{mainTitle}</h2>
              <div className="text-[11px] text-slate-500 font-medium">
                Loading Date: {loadingDate}
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-end gap-2">
            {isCombined && sortOptions.length > 0 && typeof onSheetSortChange === "function" && (
              <div className="flex items-center gap-2 rounded border border-slate-300 bg-white px-2 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Order
                </span>
                <select
                  value={sheetSort}
                  onChange={(e) => onSheetSortChange(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 outline-none"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              onClick={() => setShowImages(!showImages)}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              {showImages ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {showImages ? "Images On" : "Images Off"}
            </button>
            <button
              onClick={() => setShowRate(!showRate)}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              {showRate ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {showRate ? "Rate On" : "Rate Off"}
            </button>
            <div className="w-px h-6 bg-slate-200 mx-2" />
            <button
              onClick={handleDownloadExcel}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-bold bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
            <button
              onClick={handleDownloadImage}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <ImageIcon className="w-3.5 h-3.5" /> Image
            </button>
            <button
              onClick={onClose}
              className="ml-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Container - Gray background for preview, but internal content is white */}
        <div className="flex-1 overflow-auto bg-slate-50 p-3 md:p-6">
          <div className="mx-auto w-fit min-w-full">
            <div
              ref={previewRef}
              className="relative mx-auto shadow-sm origin-top"
              style={{
                backgroundColor: colors.white,
                color: colors.slate900,
                padding: '24px',
                width: `${previewWidth}px`,
                maxWidth: 'none',
                margin: '0 auto',
                fontFamily: 'Arial, sans-serif'
              }}
            >
            {/* Professional Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `2px solid ${colors.slate900}`, paddingBottom: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                 {/* Branding / Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package style={{ color: colors.slate900, width: '28px', height: '28px' }} />
                  <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: colors.slate900, letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: '1' }}>
                    Loading Sheet
                  </h1>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: colors.slate700, paddingLeft: '36px' }}>
                  {isCombined ? "COMBINED SHIPPING MARKS" : firstSheet.shippingMark}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: colors.slate900 }}>{container.containerCode}</div>
                <div style={{ fontSize: '12px', color: colors.slate500, marginTop: '4px' }}>
                  {new Date(container.loadingDate).toLocaleDateString()}
                </div>
                <div style={{ fontSize: '12px', color: colors.slate500, textTransform: 'uppercase' }}>
                  {container.origin}
                </div>
              </div>
            </div>

            {/* Combined/Single Content Rendering */}
            {sheetsList.map((s, sIdx) => {
              const sheetTotals = calculateSheetTotals(s);
              return (
                <div key={s.id || sIdx} style={{ marginBottom: isCombined ? '40px' : '0' }}>
                  {isCombined && (
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '900', 
                      backgroundColor: colors.slate900, 
                      color: colors.white, 
                      padding: '8px 12px', 
                      marginBottom: '10px',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      MARK: {s.shippingMark}
                    </div>
                  )}
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '11px', color: colors.slate700 }}>
                    <thead>
                      <tr style={{ backgroundColor: colors.slate50, borderBottom: `2px solid ${colors.slate300}` }}>
                        <th style={{ borderRight: `1px solid ${colors.slate300}`, padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>No.</th>
                        {showImages && <th style={{ borderRight: `1px solid ${colors.slate300}`, padding: '10px', textAlign: 'center', fontWeight: 'bold', width: '50px' }}>PHOTO</th>}
                        <th style={{ borderRight: `1px solid ${colors.slate300}`, padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>PARTICULAR</th>
                        <th style={{ borderRight: `1px solid ${colors.slate300}`, padding: '10px', textAlign: 'center', fontWeight: 'bold', width: '80px' }}>MARK</th>
                        <th style={{ borderRight: `1px solid ${colors.slate300}`, padding: '10px', textAlign: 'center', fontWeight: 'bold', width: '60px' }}>ITEM NO.</th>
                        <th style={{ borderRight: `1px solid ${colors.slate300}`, padding: '10px', textAlign: 'center', fontWeight: 'bold', width: '40px' }}>CTN</th>
                        <th style={{ borderRight: `1px solid ${colors.slate300}`, padding: '10px', textAlign: 'center', fontWeight: 'bold', width: '40px' }}>PCS</th>
                        <th style={{ borderRight: `1px solid ${colors.slate300}`, padding: '10px', textAlign: 'center', fontWeight: 'bold', width: '50px' }}>T.PCS</th>
                        <th style={{ borderRight: `1px solid ${colors.slate300}`, padding: '10px', textAlign: 'center', fontWeight: 'bold', width: '40px' }}>UNIT</th>
                        <th style={{ borderRight: `1px solid ${colors.slate300}`, padding: '10px', textAlign: 'center', fontWeight: 'bold', width: '50px' }}>CBM</th>
                        <th style={{ borderRight: `1px solid ${colors.slate300}`, padding: '10px', textAlign: 'center', fontWeight: 'bold', width: '60px' }}>T.CBM</th>
                        <th style={{ borderRight: `1px solid ${colors.slate300}`, padding: '10px', textAlign: 'center', fontWeight: 'bold', width: '50px' }}>WT</th>
                        <th style={{ borderRight: `1px solid ${colors.slate300}`, padding: '10px', textAlign: 'center', fontWeight: 'bold', width: '60px' }}>T.WT</th>
                        {showRate && <th style={{ borderRight: `1px solid ${colors.slate300}`, padding: '10px', textAlign: 'center', fontWeight: 'bold', width: '70px' }}>RATE</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {(s.items || []).map((item, idx) => (
                        <tr key={item.id} style={{ borderBottom: `1px solid ${colors.slate200}` }}>
                          <td style={{ borderRight: `1px solid ${colors.slate200}`, padding: '8px', textAlign: 'center', fontWeight: '500' }}>{idx + 1}</td>
                          {showImages && (
                            <td style={{ borderRight: `1px solid ${colors.slate200}`, padding: '4px', textAlign: 'center' }}>
                               {item.photo ? (
                                <img
                                  src={getImageUrl(item.photo)}
                                  alt=""
                                  style={{ width: '40px', height: '40px', objectFit: 'contain', display: 'block', margin: '0 auto', border: `1px solid ${colors.slate200}`, borderRadius: '4px' }}
                                  crossOrigin="anonymous"
                                  onError={(e) => {
                                    console.error("Preview image load error:", getImageUrl(item.photo), item.photo);
                                    e.target.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div style={{ width: '40px', height: '40px', background: colors.slate50, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', border: `1px dashed ${colors.slate300}`, borderRadius: '4px' }}>-</div>
                              )}
                            </td>
                          )}
                          <td style={{ borderRight: `1px solid ${colors.slate200}`, padding: '8px', fontWeight: '500', color: colors.slate900 }}>{item.particular}</td>
                          <td style={{ borderRight: `1px solid ${colors.slate200}`, padding: '8px', textAlign: 'center', fontSize: '10px', color: colors.slate500, fontWeight: 'bold' }}>{item.mark || s.shippingMark}</td>
                          <td style={{ borderRight: `1px solid ${colors.slate200}`, padding: '8px', textAlign: 'center', fontFamily: 'monospace' }}>{item.itemNo || '-'}</td>
                          <td style={{ borderRight: `1px solid ${colors.slate200}`, padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{item.ctn}</td>
                          <td style={{ borderRight: `1px solid ${colors.slate200}`, padding: '8px', textAlign: 'center' }}>{item.pcs}</td>
                          <td style={{ borderRight: `1px solid ${colors.slate200}`, padding: '8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: colors.slate50 }}>{(item.ctn || 0) * (item.pcs || 0)}</td>
                          <td style={{ borderRight: `1px solid ${colors.slate200}`, padding: '8px', textAlign: 'center', textTransform: 'uppercase', fontSize: '10px' }}>{item.unit || 'PCS'}</td>
                          <td style={{ borderRight: `1px solid ${colors.slate200}`, padding: '8px', textAlign: 'center' }}>{item.cbm}</td>
                          <td style={{ borderRight: `1px solid ${colors.slate200}`, padding: '8px', textAlign: 'center', fontWeight: 'bold', color: colors.blueText }}>{((item.ctn || 0) * (item.cbm || 0)).toFixed(3)}</td>
                          <td style={{ borderRight: `1px solid ${colors.slate200}`, padding: '8px', textAlign: 'center' }}>{item.wt}</td>
                          <td style={{ borderRight: `1px solid ${colors.slate200}`, padding: '8px', textAlign: 'center', fontWeight: 'bold', color: colors.orangeText }}>{((item.ctn || 0) * (item.wt || 0)).toFixed(2)}</td>
                          {showRate && <td style={{ borderRight: `1px solid ${colors.slate200}`, padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{(parseFloat(item.rate) || 0).toFixed(2)}</td>}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: `2px solid ${colors.slate300}`, backgroundColor: colors.slate50 }}>
                        <td colSpan={showImages ? 5 : 4} style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px', color: colors.slate500 }}>{isCombined ? `Subtotal (${s.shippingMark})` : "Total"}</td>
                        <td style={{ borderLeft: `1px solid ${colors.slate200}`, padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '13px', color: colors.slate900 }}>{sheetTotals.ctn}</td>
                        <td style={{ borderLeft: `1px solid ${colors.slate200}`, padding: '10px', backgroundColor: colors.slate100 }}></td>
                        <td style={{ borderLeft: `1px solid ${colors.slate200}`, padding: '10px', textAlign: 'center', fontWeight: 'bold', color: colors.blueText, fontSize: '13px', backgroundColor: colors.white }}>{sheetTotals.tPcs}</td>
                        <td style={{ borderLeft: `1px solid ${colors.slate200}`, padding: '10px', backgroundColor: colors.slate100 }}></td>
                        <td style={{ borderLeft: `1px solid ${colors.slate200}`, padding: '10px', backgroundColor: colors.slate100 }}></td>
                        <td style={{ borderLeft: `1px solid ${colors.slate200}`, padding: '10px', textAlign: 'center', fontWeight: 'bold', color: colors.blueText, fontSize: '13px', backgroundColor: colors.white }}>{sheetTotals.tCbm.toFixed(3)}</td>
                        <td style={{ borderLeft: `1px solid ${colors.slate200}`, padding: '10px', backgroundColor: colors.slate100 }}></td>
                        <td style={{ borderLeft: `1px solid ${colors.slate200}`, padding: '10px', textAlign: 'center', fontWeight: 'bold', color: colors.orangeText, fontSize: '13px', backgroundColor: colors.white }}>{sheetTotals.tWt.toFixed(2)}</td>
                        {showRate && <td style={{ borderLeft: `1px solid ${colors.slate200}`, padding: '10px', backgroundColor: colors.slate100 }}></td>}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              );
            })}

            {/* Global Container Totals (Only in combined mode) */}
            {isCombined && (
              <div style={{ marginTop: '40px', borderTop: `4px double ${colors.slate900}`, paddingTop: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: '900', color: colors.slate900, marginBottom: '15px' }}>CONTAINER GLOBAL TOTALS</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: colors.slate900, color: colors.white }}>
                      <th style={{ padding: '12px', textAlign: 'center' }}>TOTAL CTN</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>TOTAL PCS</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>TOTAL CBM</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>TOTAL WT</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', border: `1px solid ${colors.slate200}` }}>{globalTotals.ctn}</td>
                      <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', border: `1px solid ${colors.slate200}` }}>{globalTotals.tPcs}</td>
                      <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', border: `1px solid ${colors.slate200}`, color: colors.blueText }}>{globalTotals.tCbm.toFixed(3)}</td>
                      <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', border: `1px solid ${colors.slate200}`, color: colors.orangeText }}>{globalTotals.tWt.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Verification / Copy Section - VISIBLE IN PREVIEW, HIDDEN IN EXPORT */}
            <div 
              data-html2canvas-ignore="true"
              style={{ padding: '20px', backgroundColor: colors.slate50, borderRadius: '8px', border: `1px dashed ${colors.slate200}` }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: colors.slate500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>WhatsApp Summary</span>
                <button
                  onClick={handleWhatsAppCopy}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-xs font-semibold rounded hover:bg-slate-50 transition-colors flex items-center gap-2 text-slate-700"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Text
                </button>
              </div>
              <div 
                style={{ 
                  fontSize: '12px', 
                  fontFamily: 'monospace', 
                  color: colors.slate600, 
                  lineHeight: '1.6',
                  backgroundColor: colors.white,
                  padding: '12px',
                  borderRadius: '4px',
                  border: `1px solid ${colors.slate200}`
                }}
              >
                *{isCombined ? "GLOBAL SUMMARY" : firstSheet.shippingMark}* CONFIRMATION<br/>
                LOADING DATE: {loadingDate}<br/>
                CTN: {globalTotals.ctn} | PCS: {globalTotals.tPcs}<br/>
                CBM: {globalTotals.tCbm.toFixed(3)} | WT: {globalTotals.tWt.toFixed(2)} KG<br/>
                CONTAINER: {container.containerCode}
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Modal Footer (Internal) */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-between items-center rounded-b-lg shrink-0">
          <div className="flex items-center gap-4">
            {!isCombined && (
              <>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Internal Status:</span>
                <div className="flex gap-2 bg-slate-100 p-1 rounded">
                  {["DRAFT", "CONFIRMED", "SENT"].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      disabled={statusLoading}
                      className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${
                        sheet.status === s ? "bg-slate-800 text-white shadow" : "text-slate-500 hover:bg-white"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}
            {isCombined && (
              <span className="text-xs font-bold text-slate-400 italic">Combined mode: Status updates disabled</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded hover:bg-slate-800 transition-all"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
