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

export default function InvoicePreviewModal({ isOpen, onClose, data, items, container }) {
  const [exporting, setExporting] = useState(false);
  if (!isOpen) return null;

  const totalCtn = items.reduce((s, i) => s + (parseInt(i.ctn) || 0), 0);
  const totalQty = items.reduce((s, i) => s + (parseInt(i.tQty) || 0), 0);
  const totalAmount = items.reduce((s, i) => s + (parseFloat(i.amountUsd) || 0), 0);

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-print-area');
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
      pdf.save(`Invoice_${data.invNo || 'Draft'}.pdf`);
    } catch (error) {
      console.error('PDF Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadExcel = () => {
    const wsData = [
      [data.exporterCompanyName?.toUpperCase()],
      [`Add.: ${data.exporterAddress} ${data.exporterEmail ? 'Email:' + data.exporterEmail : ''}`],
      ['COMMERCIAL INVOICE'],
      [],
      ['EXPORTER:', '', 'INVOICE DETAILS'],
      [data.exporterCompanyName, '', `INV NO.: ${data.invNo}`],
      [data.exporterAddress, '', `DATE: ${new Date(data.invoiceDate).toLocaleDateString('en-GB')}`],
      [`IEC NO.: ${data.exporterIecNo}`, '', `FROM: ${data.from || container?.origin || ''}`],
      [`GST NO.: ${data.exporterGst}`, ''],
      [`EMAIL: ${data.exporterEmail}`, ''],
      [],
      ['CONSIGNEE:'],
      [data.consigneeName],
      [data.consigneeAddress],
      [data.consigneeCountry],
      [],
      ['S.N.', 'MARK', 'DESCRIPTIONS', 'CTN.', 'QTY/CTN', 'UNIT', 'T-QTY', 'U.PRICE', 'AMOUNT/USD']
    ];

    items.forEach((item, idx) => {
      wsData.push([
        idx + 1,
        item.itemNumber,
        item.description,
        item.ctn,
        item.qtyPerCtn,
        item.unit || 'PCS',
        item.tQty,
        item.unitPrice,
        item.amountUsd
      ]);
    });

    wsData.push([]);
    wsData.push(['TOTAL', '', '', totalCtn, '', '', totalQty, '', totalAmount.toFixed(2)]);
    wsData.push([]);
    wsData.push([data.paymentTerms]);
    wsData.push([]);
    wsData.push(['BANK DETAILS:']);
    wsData.push(['BANK NAME:', data.bankName]);
    wsData.push(['BENEFICIARY:', data.beneficiaryName]);
    wsData.push(['SWIFT BIC:', data.swiftBic]);
    wsData.push(['BANK ADDRESS:', data.bankAddress]);
    wsData.push(['ACCOUNT NO:', data.accountNumber]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoice");

    // Auto-width for columns
    const wscols = [
      { wch: 5 }, { wch: 12 }, { wch: 35 }, { wch: 8 }, { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 12 }
    ];
    ws['!cols'] = wscols;

    XLSX.writeFile(wb, `Invoice_${data.invNo || 'Draft'}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 md:p-8">
      <div className="bg-white w-full max-w-6xl h-full max-h-[98vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-white">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Invoice Preview</h2>
            <p className="text-sm text-slate-600 mt-1">{data.invNo || 'Draft'}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadExcel}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold shadow-lg transition-all active:scale-95"
            >
              <Table className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-lg transition-all active:scale-95"
            >
              {exporting ? <Printer className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-8 bg-slate-50">
          <div id="invoice-print-area" className="bg-white p-8 max-w-[210mm] mx-auto text-black font-sans text-[10px] leading-tight selection:bg-none">

            {/* Header: Company Name & Address */}
            <div className="text-center mb-1">
              <h1 className="text-xl font-bold uppercase tracking-wide">{data.exporterCompanyName || 'YIWU ZHOULAI TRADING CO., LIMITED'}</h1>
              <div className="border-t border-b border-black py-1 mt-1 mb-1">
                <p className="text-[10px] whitespace-pre-wrap px-4">
                  Add.: {data.exporterAddress} {data.exporterEmail ? `Email: ${data.exporterEmail}` : ''} {data.headerPhone ? `Tel:${data.headerPhone}` : 'Tel:13735751445'}
                </p>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-lg font-bold text-center mb-1 uppercase">COMMERCIAL INVOICE</h2>

            {/* Exporter & Invoice Details Grid */}
            <div className="border border-black flex mb-0.5">
              {/* Left: Exporter / Consignee Info (Visual mashup as per image) */}
              <div className="w-3/5 p-1 border-r border-black">
                <div className="mb-0.5">
                  <p className="font-bold">{data.consigneeName}</p>
                  <p>{data.consigneeAddress}</p>
                </div>
                <div className="mt-1">
                  <p>IEC NO.: {data.exporterIecNo}</p>
                  <p>GST NO.: {data.exporterGst}</p>
                  <p>EMAIL: {data.exporterEmail}</p>
                </div>
              </div>

              {/* Right: Invoice Meta */}
              <div className="w-2/5 p-1 flex flex-col justify-start">
                <div className="grid grid-cols-[60px_1fr] gap-x-1">
                  <span className="font-bold">INV NO.:</span>
                  <span className="font-bold">{data.invNo}</span>

                  <span className="font-bold">DATE:</span>
                  <span className="font-bold">{new Date(data.invoiceDate).toLocaleDateString('en-GB')}</span>

                  <span className="font-bold">INDIA</span>
                  <span></span>

                  <span className="font-bold">FROM:</span>
                  <span>{data.from || container?.origin || 'CHINA'}</span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-black border-b-0">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-center font-bold">
                    <th className="border-r border-b border-black w-8 py-1">S.N.</th>
                    <th className="border-r border-b border-black w-20 py-1">MARK</th>
                    <th className="border-r border-b border-black w-12 py-1">Photo</th>
                    <th className="border-r border-b border-black py-1">Descriptions</th>
                    <th className="border-r border-b border-black w-12 py-1">Ctn.</th>
                    <th className="border-r border-b border-black w-16 py-1">Qty./Ctn</th>
                    <th className="border-r border-b border-black w-10 py-1">Unit</th>
                    <th className="border-r border-b border-black w-16 py-1">T-Qty</th>
                    <th className="border-r border-b border-black w-16 py-1">U.price</th>
                    <th className="border-b border-black w-24 py-1">Amount/USD</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="text-center h-8">
                      <td className="border-r border-b border-black py-1">{idx + 1}</td>
                      <td className="border-r border-b border-black py-1">{item.itemNumber}</td>
                      <td className="border-r border-b border-black py-1 p-0.5">
                        {item.photo && (
                          <img src={getImageUrl(item.photo)} alt="" className="h-6 w-auto mx-auto object-contain" />
                        )}
                      </td>
                      <td className="border-r border-b border-black py-1 text-left px-1">{item.description}</td>
                      <td className="border-r border-b border-black py-1">{item.ctn}</td>
                      <td className="border-r border-b border-black py-1">{item.qtyPerCtn}</td>
                      <td className="border-r border-b border-black py-1">{item.unit}</td>
                      <td className="border-r border-b border-black py-1">{item.tQty}</td>
                      <td className="border-r border-b border-black py-1">{parseFloat(item.unitPrice).toFixed(2)}</td>
                      <td className="border-b border-black py-1 font-bold">{parseFloat(item.amountUsd).toFixed(2)}</td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr className="font-bold">
                    <td colSpan="4" className="border-r border-b border-black px-1 text-left">TOTAL</td>
                    <td className="border-r border-b border-black text-center">{totalCtn}</td>
                    <td className="border-r border-b border-black"></td>
                    <td className="border-r border-b border-black text-center">{items.length}</td>
                    <td className="border-r border-b border-black text-center">{totalQty}</td>
                    <td className="border-r border-b border-black"></td>
                    <td className="border-b border-black text-center">{totalAmount.toFixed(2)}</td>
                  </tr>

                  {/* Payment Terms Row */}
                  <tr>
                    <td colSpan="10" className="border-b border-black px-1 py-1 font-bold text-left uppercase">
                      {data.paymentTerms}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bank Details */}
            <div className="border border-black border-t-0 p-1">
              <p className="font-bold underline mb-1">Bank Detail:</p>
              <div className="space-y-0.5">
                <div className="flex">
                  <span className="w-52">BENEFICIARY'S BANK NAME:</span>
                  <span className="font-bold">{data.bankName}</span>
                </div>
                <div className="flex">
                  <span className="w-52">BENEFICIARY NAME:</span>
                  <span className="font-bold">{data.beneficiaryName}</span>
                </div>
                <div className="flex">
                  <span className="w-52">SWIFT BIC:</span>
                  <span className="font-bold">{data.swiftBic}</span>
                </div>
                <div className="flex">
                  <span className="w-52">BENEFICIARY'S BANK ADD:</span>
                  <span className="font-bold">{data.bankAddress}</span>
                </div>
                <div className="flex">
                  <span className="w-52">BENEFICIARY A/C NO.:</span>
                  <span className="font-bold">{data.accountNumber}</span>
                </div>
              </div>
            </div>

            {/* Signature Section */}
            <div className="flex flex-col items-end mt-8 pr-4">
              <div className="text-center">
                <p className="font-bold uppercase mb-8">{data.exporterCompanyName || 'YIWU ZHOULAI TRADING CO., LIMITED'}</p>
                {data.stampImage && (
                  <img
                    src={getImageUrl(data.stampImage)}
                    alt="Stamp"
                    className="mx-auto -my-12 w-24 h-24 object-contain opacity-80"
                  />
                )}
                <p className="font-bold border-t border-black pt-1 px-4 inline-block mt-8">AUTHORIZED SIGNATORY</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
