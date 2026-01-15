"use client";

import React, { useState, useRef } from "react";
import { 
  X, Download, FileSpreadsheet, FileText, Image as ImageIcon, 
  Copy, Share2, Eye, EyeOff, Loader2, 
  Package
} from "lucide-react";
import { toast } from "sonner";
import API from "@/lib/api";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function PreviewModal({ sheet, container, onClose, onUpdate }) {
  const [showImages, setShowImages] = useState(true);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const previewRef = useRef(null);

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
    iframe.style.width = '1200px'; 
    iframe.style.height = '2000px'; // Initial height, will resize to content
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

      // 4. Capture - Target the content specifically to avoid whitespace
      const canvas = await html2canvas(mountPoint.firstElementChild, {
        scale: 2, 
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      // 5. Save
      if (format === 'pdf') {
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "px",
          format: "a4"
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`loading-sheet-${sheet.shippingMark}.pdf`);
        toast.success("PDF generated successfully");
      } else {
        const link = document.createElement("a");
        link.download = `preview-${sheet.shippingMark}.png`;
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
      const response = await API.get(`/loading-sheets/${sheet.id}/export/excel`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `loading-sheet-${sheet.shippingMark}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Excel downloaded");
    } catch (error) {
      toast.error("Failed to download Excel");
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppCopy = async () => {
    try {
      const response = await API.get(`/loading-sheets/${sheet.id}/whatsapp`);
      if (response.data.success) {
        let text = response.data.data;
        text = text.replace(/Status: .*/i, '').trim();
        await navigator.clipboard.writeText(text);
        toast.success("Summary copied");
      }
    } catch (error) {
      toast.error("Failed to copy summary");
    }
  };

  const handleStatusChange = async (newStatus) => {
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

  const totals = sheet.items.reduce(
    (acc, item) => {
      acc.ctn += item.ctn;
      acc.tPcs += item.tPcs;
      acc.tCbm += item.tCbm;
      acc.tWt += item.tWt;
      return acc;
    },
    { ctn: 0, tPcs: 0, tCbm: 0, tWt: 0 }
  );

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
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-lg shadow-xl flex flex-col h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0 bg-slate-50 rounded-t-lg">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800">Preview: {sheet.shippingMark}</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImages(!showImages)}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              {showImages ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {showImages ? "Images On" : "Images Off"}
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
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
            <div 
            ref={previewRef} 
            className="mx-auto relative shadow-sm origin-top"
            style={{ 
              backgroundColor: colors.white, 
              color: colors.slate900, 
              padding: '24px', // Reduced padding
              width: '800px',  // Fixed optimized width
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
                  {sheet.shippingMark}
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

            {/* Professionally Styled Table */}
{/* Professionally Styled Table - Optimized Style */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', fontSize: '11px', color: colors.slate700 }}>
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
                </tr>
              </thead>
              <tbody>
                {sheet.items.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${colors.slate200}` }}>
                    <td style={{ borderRight: `1px solid ${colors.slate200}`, padding: '8px', textAlign: 'center', fontWeight: '500' }}>{idx + 1}</td>
                    {showImages && (
                      <td style={{ borderRight: `1px solid ${colors.slate200}`, padding: '4px', textAlign: 'center' }}>
                         {item.photo ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_API_URL}${item.photo}`}
                            alt=""
                            style={{ width: '40px', height: '40px', objectFit: 'contain', display: 'block', margin: '0 auto', border: `1px solid ${colors.slate200}`, borderRadius: '4px' }}
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <div style={{ width: '40px', height: '40px', background: colors.slate50, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', border: `1px dashed ${colors.slate300}`, borderRadius: '4px' }}>-</div>
                        )}
                      </td>
                    )}
                    <td style={{ borderRight: `1px solid ${colors.slate200}`, padding: '8px', fontWeight: '500', color: colors.slate900 }}>{item.particular}</td>
                    <td style={{ borderRight: `1px solid ${colors.slate200}`, padding: '8px', textAlign: 'center', fontSize: '10px', color: colors.slate500, fontWeight: 'bold' }}>{item.mark || sheet.shippingMark}</td>
                    <td style={{ borderRight: `1px solid ${colors.slate200}`, padding: '8px', textAlign: 'center', fontFamily: 'monospace' }}>{item.itemNo || '-'}</td>
                    <td style={{ borderRight: `1px solid ${colors.slate200}`, padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{item.ctn}</td>
                    <td style={{ borderRight: `1px solid ${colors.slate200}`, padding: '8px', textAlign: 'center' }}>{item.pcs}</td>
                    <td style={{ borderRight: `1px solid ${colors.slate200}`, padding: '8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: colors.slate50 }}>{item.ctn * item.pcs}</td>
                    <td style={{ borderRight: `1px solid ${colors.slate200}`, padding: '8px', textAlign: 'center', textTransform: 'uppercase', fontSize: '10px' }}>{item.unit || 'PCS'}</td>
                    <td style={{ borderRight: `1px solid ${colors.slate200}`, padding: '8px', textAlign: 'center' }}>{item.cbm}</td>
                    <td style={{ borderRight: `1px solid ${colors.slate200}`, padding: '8px', textAlign: 'center', fontWeight: 'bold', color: colors.blueText }}>{(item.ctn * item.cbm).toFixed(3)}</td>
                    <td style={{ borderRight: `1px solid ${colors.slate200}`, padding: '8px', textAlign: 'center' }}>{item.wt}</td>
                    <td style={{ borderRight: `1px solid ${colors.slate200}`, padding: '8px', textAlign: 'center', fontWeight: 'bold', color: colors.orangeText }}>{(item.ctn * item.wt).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: `2px solid ${colors.slate300}`, backgroundColor: colors.slate50 }}>
                  <td colSpan={showImages ? 5 : 4} style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px', color: colors.slate500 }}>Total</td>
                  <td style={{ borderLeft: `1px solid ${colors.slate200}`, padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '13px', color: colors.slate900 }}>{totals.ctn}</td>
                  <td style={{ borderLeft: `1px solid ${colors.slate200}`, padding: '10px', backgroundColor: colors.slate100 }}></td>
                  <td style={{ borderLeft: `1px solid ${colors.slate200}`, padding: '10px', textAlign: 'center', fontWeight: 'bold', color: colors.blueText, fontSize: '13px', backgroundColor: colors.white }}>{totals.tPcs}</td>
                  <td style={{ borderLeft: `1px solid ${colors.slate200}`, padding: '10px', backgroundColor: colors.slate100 }}></td>
                  <td style={{ borderLeft: `1px solid ${colors.slate200}`, padding: '10px', backgroundColor: colors.slate100 }}></td>
                  <td style={{ borderLeft: `1px solid ${colors.slate200}`, padding: '10px', textAlign: 'center', fontWeight: 'bold', color: colors.blueText, fontSize: '13px', backgroundColor: colors.white }}>{totals.tCbm.toFixed(3)}</td>
                  <td style={{ borderLeft: `1px solid ${colors.slate200}`, padding: '10px', backgroundColor: colors.slate100 }}></td>
                  <td style={{ borderLeft: `1px solid ${colors.slate200}`, padding: '10px', textAlign: 'center', fontWeight: 'bold', color: colors.orangeText, fontSize: '13px', backgroundColor: colors.white }}>{totals.tWt.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>

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
                *{sheet.shippingMark}* CONFIRMATION<br/>
                CTN: {totals.ctn} | PCS: {totals.tPcs}<br/>
                CBM: {totals.tCbm.toFixed(3)} | WT: {totals.tWt.toFixed(2)} KG<br/>
                CONTAINER: {container.containerCode}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer (Internal) */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-between items-center rounded-b-lg shrink-0">
          <div className="flex items-center gap-4">
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
