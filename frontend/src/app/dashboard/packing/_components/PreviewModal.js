"use client";

import React, { useState } from 'react';
import { X, Printer, FileText, Download, Table } from 'lucide-react';
import Image from 'next/image';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

// Helper function to get image URL
const getImageUrl = (photoPath) => {
  if (!photoPath) return null;

  if (photoPath.startsWith("http://") || photoPath.startsWith("https://")) {
    return photoPath;
  }

  const normalizedPath = photoPath.startsWith("/") ? photoPath : `/${photoPath}`;
  const baseUrl = (process.env.NEXT_PUBLIC_SERVER_URL || "").replace(/\/$/, "");

  return `${baseUrl}${normalizedPath}`;
};

export default function PreviewModal({ isOpen, onClose, data, items, container }) {
  const [exporting, setExporting] = useState(false);
  if (!isOpen) return null;

  const totalCtn = items.reduce((s, i) => s + (parseInt(i.ctn) || 0), 0);
  const totalQty = items.reduce((s, i) => s + (parseInt(i.tQty) || 0), 0);
  const totalWeight = items.reduce((s, i) => s + (parseFloat(i.tKg) || 0), 0);

  const handleDownloadPDF = async () => {
    const element = document.getElementById('print-area-content');
    if (!element) return;

    try {
      setExporting(true);
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Packing_List_${data.invNo || 'Draft'}.pdf`);
    } catch (error) {
      console.error('PDF Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadExcel = () => {
    const wsData = [
      [data.headerCompanyName?.toUpperCase()],
      [`Add.: ${data.headerCompanyAddress} ${data.headerPhone ? 'Tel.:' + data.headerPhone : ''}`],
      ['PACKING LIST'],
      [],
      ['CONSIGNEE:', '', 'INVOICE DETAILS'],
      [data.sellerCompanyName, '', `INV NO.: ${data.invNo}`],
      [data.sellerAddress, '', `DATE: ${new Date(data.invoiceDate).toLocaleDateString('en-GB')}`],
      [`IEC NO.: ${data.sellerIecNo}`, '', `TO: ${data.to || container?.destination || ''}`],
      [`GST NO.: ${data.sellerGst}`, '', `FROM: ${data.from || container?.origin || ''}`],
      [`EMAIL: ${data.sellerEmail}`, ''],
      [],
      ['S.N.', 'MARK', 'DESCRIPTIONS', 'CTN.', 'QTY/CTN', 'UNIT', 'T-QTY', 'KG', 'T.KG']
    ];

    items.forEach((item, idx) => {
      wsData.push([
        idx + 1,
        item.itemNumber,
        item.particular,
        item.ctn,
        item.qtyPerCtn,
        item.unit || 'PCS',
        item.tQty,
        item.kg,
        item.tKg
      ]);
    });

    wsData.push([]);
    wsData.push(['TOTAL', '', '', totalCtn, '', '', totalQty, '', totalWeight.toFixed(2)]);
    wsData.push([]);
    wsData.push(['BANK DETAILS:']);
    wsData.push(['BANK NAME:', data.bankName]);
    wsData.push(['BENEFICIARY:', data.beneficiaryName]);
    wsData.push(['SWIFT:', data.swiftBic]);
    wsData.push(['ACCOUNT NO:', data.accountNumber]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Packing List");

    // Auto-width for columns
    const wscols = [
      { wch: 5 }, { wch: 15 }, { wch: 40 }, { wch: 8 }, { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 8 }, { wch: 10 }
    ];
    ws['!cols'] = wscols;

    XLSX.writeFile(wb, `Packing_List_${data.invNo || 'Draft'}.xlsx`);
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
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none">Packing List Preview</h2>
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
              {exporting ? 'Generating PDF...' : 'Download PDF'}
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

        <div id="print-area" className="flex-1 overflow-y-auto bg-slate-100/50 p-4 md:p-10 print:p-0 print:bg-white flex justify-center">
          <div
            id="print-area-content"
            style={{
              backgroundColor: '#ffffff',
              color: '#000000',
              border: '1px solid #000000'
            }}
            className="mx-auto w-full max-w-[210mm] min-h-[297mm] print:max-w-none p-0 overflow-hidden font-cambria leading-[1.2]"
          >

            {/* Topmost Header (Exporter/Agent) */}
            <div style={{ borderBottom: '1px solid #000000' }} className="py-5">
              <div className="text-center font-bold text-[32px] leading-none mb-1 uppercase tracking-tight">
                {data.headerCompanyName}
              </div>
              <div className="text-center font-bold text-[12.5px] px-12 leading-tight">
                Add.: {data.headerCompanyAddress} {data.headerPhone && `Tel.:${data.headerPhone}`}
              </div>
              <div className="text-center font-bold text-[42px] mt-4 tracking-[0.1em] pt-1" style={{ borderTop: '1px solid #000000' }}>
                PACKING LIST
              </div>
            </div>

            {/* Consignee and Invoice Info Table */}
            <table className="w-full border-collapse" style={{ borderBottom: '1px solid #000000' }}>
              <tbody>
                <tr>
                  <td className="w-[60%] p-4 align-top text-[13px] leading-[1.4]" style={{ borderRight: '1px solid #000000' }}>
                    <div className="font-bold text-[14px] mb-1 uppercase">{data.sellerCompanyName}</div>
                    <div className="font-bold whitespace-pre-wrap">{data.sellerAddress}</div>
                    <div className="font-bold mt-2">IEC NO.:{data.sellerIecNo}</div>
                    <div className="font-bold">GST NO.:{data.sellerGst}</div>
                    <div className="font-bold">EMAIL: {data.sellerEmail?.toLowerCase()}</div>
                  </td>
                  <td className="w-[40%] p-4 align-top text-[15px] leading-[1.8]">
                    <div className="p-1 px-4 mb-4" style={{ border: '1px solid #000000' }}>
                      <div className="font-bold">INV NO.: {data.invNo}</div>
                      <div className="font-bold">DATE : {new Date(data.invoiceDate).toLocaleDateString('en-GB')}</div>
                    </div>
                    <div className="font-bold uppercase tracking-wide">TO: {data.to || container?.destination || 'NHAVA SHEVA'}</div>
                    <div className="font-bold uppercase tracking-wide">FROM: {data.from || container?.origin || 'CHINA'}</div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Items Table (12 columns) */}
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
                    <th className="p-1 text-center w-14" style={{ borderRight: '1px solid #000000' }}>KG</th>
                    <th className="p-1 text-center w-16 font-bold">T.KG</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #000000' }}>
                      <td className="p-1 text-center align-top" style={{ borderRight: '1px solid #000000' }}>{idx + 1}</td>
                      <td className="p-1 text-center font-bold align-top uppercase" style={{ borderRight: '1px solid #000000' }}>{item.itemNumber}</td>
                      <td className="p-1 text-center align-top" style={{ borderRight: '1px solid #000000' }}>
                        {item.photo && (
                          <img
                            src={getImageUrl(item.photo)}
                            alt="item"
                            className="w-10 h-10 object-contain mx-auto"
                          />
                        )}
                      </td>
                      <td className="p-1 align-top leading-tight uppercase min-h-[40px]" style={{ borderRight: '1px solid #000000' }}>
                        {item.particular}
                      </td>
                      <td className="p-1 text-center align-top font-bold" style={{ borderRight: '1px solid #000000' }}>{item.ctn}</td>
                      <td className="p-1 text-center align-top" style={{ borderRight: '1px solid #000000' }}>{item.qtyPerCtn}</td>
                      <td className="p-1 text-center align-top uppercase" style={{ borderRight: '1px solid #000000' }}>{item.unit || 'PCS'}</td>
                      <td className="p-1 text-center font-bold align-top" style={{ borderRight: '1px solid #000000' }}>{item.tQty}</td>
                      <td className="p-1 text-center align-top" style={{ borderRight: '1px solid #000000' }}>{parseFloat(item.kg).toFixed(2)}</td>
                      <td className="p-1 text-center font-black align-top underline underline-offset-2">{parseFloat(item.tKg).toFixed(2)}</td>
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
                    <td className="p-1 text-center underline decoration-double">{totalWeight.toFixed(2)}</td>
                  </tr>
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
                      <div className="flex gap-2"><b>BENEFICIARY'S BANK NAME:</b> <span>{data.bankName}</span></div>
                      <div className="flex gap-2"><b>BENEFICIARY NAME :</b> <span>{data.beneficiaryName}</span></div>
                      <div className="flex gap-2"><b>SWIFT BIC:</b> <span>{data.swiftBic}</span></div>
                      <div className="flex gap-2"><b>BENEFICIARY'S BANK ADD:</b> <span>{data.bankAddress}</span></div>
                      <div className="flex gap-2"><b>BENEFICIARY A/C NO.:</b> <span>{data.accountNumber}</span></div>
                    </div>
                  </td>
                  <td className="w-[35%] p-3 align-bottom text-center">
                    {data.stampImage && (
                      <div className="relative inline-block mb-1">
                        <img
                          src={getImageUrl(data.stampImage)}
                          alt="Stamp"
                          style={{
                            width: data.stampSize === 'SM' ? '80px' : data.stampSize === 'LG' ? '180px' : '130px',
                            opacity: 0.9
                          }}
                        />
                      </div>
                    )}
                    <div className="font-bold text-[10px] uppercase mt-2">
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
    </div>
  );
}
