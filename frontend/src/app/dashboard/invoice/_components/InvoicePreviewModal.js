"use client";

import React, { useState, useRef } from 'react';
import { X, Printer, FileText, Download, Table } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx-js-style';
import { getImageUrl } from '@/lib/image-utils';

export default function InvoicePreviewModal({ isOpen, onClose, data, items, container }) {
  const [exporting, setExporting] = useState(false);
  const previewRef = useRef(null);

  if (!isOpen) return null;

  const exporterName = data.headerCompanyName || data.exporterCompanyName;
  const exporterAddress = data.headerCompanyAddress || data.exporterAddress;
  const exporterPhone = data.headerPhone;

  const totalCtn = items.reduce((s, i) => s + (parseInt(i.ctn) || 0), 0);
  const totalQty = items.reduce((s, i) => s + (parseInt(i.tQty) || 0), 0);
  const totalAmount = Math.round(items.reduce((s, i) => s + (parseFloat(i.amountUsd) || 0), 0));

  const performExport = async () => {
    if (!previewRef.current) return;

    // 1. Create hidden iframe to isolate from Tailwind 4 CSS variables (lab/oklch)
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '800px';
    iframe.style.height = '2000px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    try {
      setExporting(true);

      // 2. Prepare iframe document structure
      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { margin: 0; padding: 0; font-family: "Cambria", serif; -webkit-print-color-adjust: exact; background: #ffffff; }
              * { box-sizing: border-box; }
              .p-1 { padding: 4px; } .p-3 { padding: 12px; } .p-4 { padding: 16px; }
              .px-4 { padding-left: 16px; padding-right: 16px; } .py-5 { padding-top: 20px; padding-bottom: 20px; }
              .text-center { text-align: center; } .text-left { text-align: left; } .text-right { text-align: right; }
              .font-bold { font-weight: bold; } .font-black { font-weight: 900; }
              .uppercase { text-transform: uppercase; } .italic { font-style: italic; }
              .w-full { width: 100%; } .flex { display: flex; } .gap-2 { gap: 8px; }
              table { border-collapse: collapse; width: 100%; }
              img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>
            <div id="capture-mount" style="display: inline-block; width: 100%;"></div>
          </body>
        </html>
      `);
      doc.close();

      // 3. Clone content and STRIP classes (keeps inline styles from Previews)
      const content = previewRef.current.cloneNode(true);
      const stripClasses = (node) => {
        if (node.nodeType === 1) {
          node.removeAttribute('class');
          node.removeAttribute('className');
          Array.from(node.children).forEach(stripClasses);
        }
      };
      stripClasses(content);

      const mountPoint = doc.getElementById('capture-mount');
      mountPoint.appendChild(content);

      // 4. Wait for images to load in iframe
      const imagesList = Array.from(doc.images);
      await Promise.all(imagesList.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      // 5. Capture with html2canvas inside the clean environment
      const canvas = await html2canvas(mountPoint.firstElementChild, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      // 6. Generate multi-page PDF
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Invoice_${data.invNo || 'Draft'}.pdf`);
    } catch (error) {
      console.error("PDF Export failed:", error);
    } finally {
      document.body.removeChild(iframe);
      setExporting(false);
    }
  };

  const handleDownloadPDF = () => performExport();

  const handleDownloadExcel = () => {
    const wb = XLSX.utils.book_new();

    const wsData = [
      [exporterName?.toUpperCase()],
      [`Add.: ${exporterAddress || ''} ${exporterPhone ? 'Tel.:' + exporterPhone : ''}`],
      [],
      ['COMMERCIAL INVOICE'],
      [],
      ['CONSIGNEE:', '', '', 'INVOICE DETAILS'],
      [data.consigneeName || '', '', '', `INV NO.: ${data.invNo || ''}`],
      [data.consigneeAddress || '', '', '', `DATE: ${data.invoiceDate ? new Date(data.invoiceDate).toLocaleDateString('en-GB') : ''}`],
      [`IEC NO.: ${data.consigneeIecNo || ''}`, '', '', `TO: ${data.to || container?.destination || ''}`],
      [`GST NO.: ${data.consigneeGst || ''}`, '', '', `FROM: ${data.from || container?.origin || ''}`],
      [`EMAIL: ${data.consigneeEmail || ''}`],
      [],
      ['S.N.', 'MARK', 'DESCRIPTIONS', 'CTN.', 'QTY/CTN', 'UNIT', 'T-QTY', 'U.PRICE', 'AMOUNT/USD']
    ];

    items.forEach((item, idx) => {
      wsData.push([
        idx + 1,
        item.itemNumber || '',
        item.description || '',
        parseInt(item.ctn) || 0,
        parseInt(item.qtyPerCtn) || 0,
        item.unit || 'PCS',
        parseInt(item.tQty) || 0,
        parseFloat(item.unitPrice) || 0,
        Math.round(parseFloat(item.amountUsd) || 0)
      ]);
    });

    wsData.push([]);
    wsData.push(['TOTAL', '', '', totalCtn, '', '', totalQty, '', totalAmount]);

    if (data.paymentTerms) {
      wsData.push([]);
      wsData.push([`PAYMENT TERMS: ${data.paymentTerms}`]);
    }

    wsData.push([]);
    wsData.push(['BANK DETAILS:']);
    wsData.push([`BANK NAME: ${data.bankName || ''}`]);
    wsData.push([`BENEFICIARY: ${data.beneficiaryName || ''}`]);
    wsData.push([`SWIFT BIC: ${data.swiftBic || ''}`]);
    wsData.push([`BANK ADDRESS: ${data.bankAddress || ''}`]);
    wsData.push([`ACCOUNT NO: ${data.accountNumber || ''}`]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Apply Styles (Borders and Alignment)
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = { c: C, r: R };
        const cell_ref = XLSX.utils.encode_cell(cell_address);
        if (!ws[cell_ref]) ws[cell_ref] = { t: 's', v: '' };

        // Default style for all cells
        ws[cell_ref].s = {
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          },
          alignment: {
            vertical: "center",
            horizontal: "center",
            wrapText: true
          },
          font: {
            name: "Arial",
            sz: 10
          }
        };

        // Header styles (specific rows)
        if (R === 0) { // Main Exporter Title
          ws[cell_ref].s.font = { name: "Arial", sz: 16, bold: true };
          ws[cell_ref].s.alignment.horizontal = "center";
        }
        if (R === 3) { // COMMERCIAL INVOICE Title
          ws[cell_ref].s.font = { name: "Arial", sz: 14, bold: true };
          ws[cell_ref].s.fill = { fgColor: { rgb: "EEEEEE" } };
        }
        if (R === 12) { // Table Column Headers
          ws[cell_ref].s.font = { name: "Arial", sz: 10, bold: true };
          ws[cell_ref].s.fill = { fgColor: { rgb: "E2E8F0" } };
        }

        // Particulars alignment (Column 3)
        if (R > 12 && R <= 12 + items.length && C === 2) {
          ws[cell_ref].s.alignment.horizontal = "left";
        }
      }
    }

    // Dynamic column widths
    const maxWidths = wsData.reduce((acc, row) => {
      row.forEach((cell, i) => {
        const cellValue = cell?.toString() || "";
        acc[i] = Math.max(acc[i] || 0, cellValue.length);
      });
      return acc;
    }, []);
    ws['!cols'] = maxWidths.map(w => ({ wch: Math.min(Math.max(w + 2, 8), 50) }));

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // Exporter Name
      { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }, // Exporter Address
      { s: { r: 3, c: 0 }, e: { r: 3, c: 8 } }, // Title
      { s: { r: 5, c: 0 }, e: { r: 5, c: 2 } }, // Consignee label
      { s: { r: 5, c: 3 }, e: { r: 5, c: 8 } }, // Invoice Details label
      { s: { r: 6, c: 0 }, e: { r: 6, c: 2 } }, { s: { r: 6, c: 3 }, e: { r: 6, c: 8 } },
      { s: { r: 7, c: 0 }, e: { r: 7, c: 2 } }, { s: { r: 7, c: 3 }, e: { r: 7, c: 8 } },
      { s: { r: 8, c: 0 }, e: { r: 8, c: 2 } }, { s: { r: 8, c: 3 }, e: { r: 8, c: 8 } },
      { s: { r: 9, c: 0 }, e: { r: 9, c: 2 } }, { s: { r: 9, c: 3 }, e: { r: 9, c: 8 } },
      { s: { r: 10, c: 0 }, e: { r: 10, c: 2 } },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Invoice");
    XLSX.writeFile(wb, `Invoice_${data.invNo || 'Draft'}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 md:p-8">
      <div className="bg-white w-full max-w-6xl h-full max-h-[98vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-8 py-3 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none">Invoice Preview</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{data.invNo} • {container?.containerCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold text-sm shadow-md disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Generating...' : 'PDF'}
            </button>
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-bold text-sm shadow-md"
            >
              <Table className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-600 rounded-xl transition-all font-bold text-sm"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div id="print-area" className="flex-1 min-h-0 overflow-auto bg-slate-100/50 p-4 md:p-10 print:overflow-visible print:p-0 print:bg-white flex justify-center items-start">
          <div
            id="print-area-content"
            ref={previewRef}
            style={{
              backgroundColor: '#ffffff',
              color: '#000000',
              border: '1px solid #000000'
            }}
            className="mx-auto w-full max-w-[210mm] min-h-[297mm] print:max-w-none p-0 font-cambria leading-[1.2] shrink-0"
          >

            {/* Topmost Header (Exporter) */}
            <div style={{ borderBottom: '1px solid #000000' }} className="py-5">
              <div className="text-center font-bold text-[32px] leading-none mb-1 uppercase tracking-tight">
                {exporterName}
              </div>
              <div className="text-center font-bold text-[12.5px] px-12 leading-tight">
                Add.: {exporterAddress} {exporterPhone && `Tel.:${exporterPhone}`}
              </div>
              <div className="text-center font-bold text-[42px] mt-4 tracking-[0.1em] pt-1" style={{ borderTop: '1px solid #000000' }}>
                COMMERCIAL INVOICE
              </div>
            </div>

            {/* Consignee and Invoice Info Table */}
            <table className="w-full border-collapse" style={{ borderBottom: '1px solid #000000' }}>
              <tbody>
                <tr>
                  <td className="w-[60%] p-4 align-top text-[13px] leading-[1.4]" style={{ borderRight: '1px solid #000000' }}>
                    <div className="font-bold text-[14px] mb-1 uppercase">{data.consigneeName}</div>
                    <div className="font-bold whitespace-pre-wrap">{data.consigneeAddress}</div>
                    <div className="font-bold mt-2">IEC NO.: {data.consigneeIecNo}</div>
                    <div className="font-bold">GST NO.: {data.consigneeGst}</div>
                    <div className="font-bold">EMAIL: {data.consigneeEmail?.toLowerCase()}</div>
                  </td>
                  <td className="w-[40%] p-4 align-top text-[15px] leading-[1.8]">
                    <div className="p-1 px-4 mb-4" style={{ border: '1px solid #000000' }}>
                      <div className="font-bold">INV NO.: {data.invNo}</div>
                      <div className="font-bold">DATE : {data.invoiceDate ? new Date(data.invoiceDate).toLocaleDateString('en-GB') : ''}</div>
                    </div>
                    <div className="font-bold uppercase tracking-wide">TO: {data.to || container?.destination || 'NHAVA SHEVA'}</div>
                    <div className="font-bold uppercase tracking-wide">FROM: {data.from || container?.origin || 'CHINA'}</div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Items Table */}
            <div className="flex-1">
              <table className="w-full border-collapse text-[10px]">
                <thead>
                  <tr className="font-bold" style={{ borderBottom: '1px solid #000000', backgroundColor: '#f8fafc' }}>
                    <th className="p-1 text-center w-8" style={{ borderRight: '1px solid #000000' }}>S.N.</th>
                    <th className="p-1 text-center w-24" style={{ borderRight: '1px solid #000000' }}>MARK</th>
                    <th className="p-1 text-center w-12" style={{ borderRight: '1px solid #000000' }}>Photo</th>
                    <th className="p-1 text-left" style={{ borderRight: '1px solid #000000' }}>Descriptions</th>
                    <th className="p-1 text-center w-12" style={{ borderRight: '1px solid #000000' }}>Ctn.</th>
                    <th className="p-1 text-center w-16" style={{ borderRight: '1px solid #000000' }}>Qty./ Ctn</th>
                    <th className="p-1 text-center w-12" style={{ borderRight: '1px solid #000000' }}>Unit</th>
                    <th className="p-1 text-center w-16 font-bold" style={{ borderRight: '1px solid #000000' }}>T-QTY</th>
                    <th className="p-1 text-center w-14" style={{ borderRight: '1px solid #000000' }}>U.price</th>
                    <th className="p-1 text-center w-16 font-bold">Amount/USD</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid #000000' }}>
                      <td className="p-1 text-center align-top" style={{ borderRight: '1px solid #000000' }}>{idx + 1}</td>
                      <td className="p-1 text-center font-bold align-top uppercase" style={{ borderRight: '1px solid #000000' }}>{item.itemNumber}</td>
                      <td className="p-1 text-center align-top" style={{ borderRight: '1px solid #000000' }}>
                        {item.photo && getImageUrl(item.photo) && (
                          <img
                            src={getImageUrl(item.photo)}
                            alt="item"
                            crossOrigin="anonymous"
                            className="w-10 h-10 object-contain mx-auto"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}
                      </td>
                      <td className="p-1 align-top leading-tight uppercase min-h-[40px]" style={{ borderRight: '1px solid #000000' }}>
                        {item.description}
                      </td>
                      <td className="p-1 text-center align-top font-bold" style={{ borderRight: '1px solid #000000' }}>{item.ctn}</td>
                      <td className="p-1 text-center align-top" style={{ borderRight: '1px solid #000000' }}>{item.qtyPerCtn}</td>
                      <td className="p-1 text-center align-top uppercase" style={{ borderRight: '1px solid #000000' }}>{item.unit || 'PCS'}</td>
                      <td className="p-1 text-center font-bold align-top" style={{ borderRight: '1px solid #000000' }}>{item.tQty}</td>
                      <td className="p-1 text-center align-top" style={{ borderRight: '1px solid #000000' }}>{parseFloat(item.unitPrice || 0).toFixed(2)}</td>
                      <td className="p-1 text-center font-black align-top underline underline-offset-2">{Math.round(parseFloat(item.amountUsd || 0)).toLocaleString()}</td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="font-bold" style={{ borderTop: '2px solid #000000', backgroundColor: '#f8fafc' }}>
                    <td colSpan="4" className="p-1 text-center tracking-[0.8em] uppercase text-[11px]" style={{ borderRight: '1px solid #000000' }}>T O T A L</td>
                    <td className="p-1 text-center" style={{ borderRight: '1px solid #000000' }}>{totalCtn}</td>
                    <td className="p-1" style={{ borderRight: '1px solid #000000' }}></td>
                    <td className="p-1" style={{ borderRight: '1px solid #000000' }}></td>
                    <td className="p-1 text-center" style={{ borderRight: '1px solid #000000' }}>{totalQty}</td>
                    <td className="p-1" style={{ borderRight: '1px solid #000000' }}></td>
                    <td className="p-1 text-center underline decoration-double">{totalAmount.toLocaleString()}</td>
                  </tr>
                  {/* Payment Terms Row */}
                  {data.paymentTerms && (
                    <tr style={{ borderBottom: '1px solid #000000' }}>
                      <td colSpan="10" className="p-1 px-2 font-bold text-left uppercase text-[9px] italic">
                        {data.paymentTerms}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bank and Stamp Side-by-Side Table */}
            <table className="w-full border-collapse mt-1" style={{ borderTop: '1px solid #000000' }}>
              <tbody>
                <tr>
                  <td className="w-[65%] p-3 align-top" style={{ borderRight: '1px solid #000000' }}>
                    <div className="font-bold underline text-[10px] mb-2 uppercase tracking-wide italic">Bank Detail:</div>
                    <div className="text-[10px] font-medium leading-[1.3] uppercase" style={{ color: '#0f172a' }}>
                      <div className="flex gap-2"><b>BENEFICIARY&apos;S BANK NAME:</b> <span>{data.bankName}</span></div>
                      <div className="flex gap-2"><b>BENEFICIARY NAME :</b> <span>{data.beneficiaryName}</span></div>
                      <div className="flex gap-2"><b>SWIFT BIC:</b> <span>{data.swiftBic}</span></div>
                      <div className="flex gap-2"><b>BENEFICIARY&apos;S BANK ADD:</b> <span>{data.bankAddress}</span></div>
                      <div className="flex gap-2"><b>BENEFICIARY A/C NO.:</b> <span>{data.accountNumber}</span></div>
                    </div>
                  </td>
                  <td className="w-[35%] p-3 align-bottom text-center">
                    {data.stampImage && (
                      <div className="relative inline-block mb-1">
                        <img
                          src={getImageUrl(data.stampImage)}
                          alt="Stamp"
                          crossOrigin="anonymous"
                          style={{
                            width: data.stampSize === 'SM' ? '80px' : data.stampSize === 'LG' ? '180px' : '130px',
                            opacity: 0.9
                          }}
                        />
                      </div>
                    )}
                    <div className="font-bold text-[10px] uppercase mt-2">
                      {exporterName}
                    </div>
                    <div className="font-bold text-[10px] uppercase mt-1">
                      {data.stampText || "Authorized Signatory"}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

          </div>
        </div>
      </div>

      <style jsx global>{`
        #print-area * {
            font-family: "Cambria", "Times New Roman", serif !important;
        }
        @media print {
          body * { visibility: hidden; pointer-events: none; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { 
            position: fixed; 
            left: 0; 
            top: 0; 
            width: 100%; 
            height: 100%;
            margin: 0;
            padding: 0;
            background: white !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div >
  );
}
