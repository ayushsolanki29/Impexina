const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { prisma } = require('../../database/prisma');
const fs = require('fs');
const path = require('path');

const exportService = {
  // Generate Excel for a loading sheet
  generateExcel: async (loadingSheetId) => {
    const sheet = await prisma.loadingSheet.findUnique({
      where: { id: loadingSheetId },
      include: {
        container: true,
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!sheet) {
      throw new Error('Loading sheet not found');
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheet.shippingMark || 'Loading Sheet');

    // Header styling
    const headerStyle = {
      font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      },
    };

    // Title
    worksheet.mergeCells('A1:K1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = sheet.shippingMark || 'Loading Sheet';
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 30;

    // Info row
    worksheet.mergeCells('A2:K2');
    const infoCell = worksheet.getCell('A2');
    infoCell.value = `${sheet.container.containerCode} | Loading Date: ${new Date(sheet.container.loadingDate).toLocaleDateString()}`;
    infoCell.alignment = { horizontal: 'center' };
    worksheet.getRow(2).height = 20;

    // Column headers
    const headers = ['Photo', 'Particular', 'Mark', 'Item No.', 'CTN', 'PCS', 'T.PCS', 'Unit', 'CBM', 'T.CBM', 'WT', 'T.WT'];
    const headerRow = worksheet.getRow(4);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.style = headerStyle;
    });
    headerRow.height = 25;

    // Column widths
    worksheet.columns = [
      { width: 12 }, // Photo
      { width: 30 }, // Particular
      { width: 15 }, // Mark
      { width: 20 }, // Item No
      { width: 10 }, // CTN
      { width: 10 }, // PCS
      { width: 12 }, // T.PCS
      { width: 10 }, // Unit
      { width: 12 }, // CBM
      { width: 12 }, // T.CBM
      { width: 12 }, // WT
      { width: 12 }, // T.WT
    ];

    // Data rows
    let rowIndex = 5;
    let totalCTN = 0;
    let totalTPCS = 0;
    let totalTCBM = 0;
    let totalTWT = 0;

    sheet.items.forEach((item) => {
      const row = worksheet.getRow(rowIndex);
      
      row.getCell(1).value = item.photo ? 'Image' : '';
      row.getCell(2).value = item.particular;
      row.getCell(3).value = sheet.shippingMark || '';
      row.getCell(4).value = item.itemNo;
      row.getCell(5).value = item.ctn;
      row.getCell(6).value = item.pcs;
      row.getCell(7).value = item.tPcs;
      row.getCell(8).value = item.unit;
      row.getCell(9).value = item.cbm;
      row.getCell(10).value = item.tCbm;
      row.getCell(11).value = item.wt;
      row.getCell(12).value = item.tWt;

      // Styling
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.alignment = { vertical: 'middle' };
      });

      // Center align numbers
      [5, 6, 7, 8, 9, 10, 11, 12].forEach(col => {
        row.getCell(col).alignment = { horizontal: 'center', vertical: 'middle' };
      });

      totalCTN += item.ctn;
      totalTPCS += item.tPcs;
      totalTCBM += item.tCbm;
      totalTWT += item.tWt;

      rowIndex++;
    });

    // Total row
    const totalRow = worksheet.getRow(rowIndex);
    totalRow.getCell(1).value = 'TOTAL';
    totalRow.getCell(5).value = totalCTN;
    totalRow.getCell(7).value = totalTPCS;
    totalRow.getCell(10).value = parseFloat(totalTCBM.toFixed(3));
    totalRow.getCell(12).value = parseFloat(totalTWT.toFixed(2));

    totalRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  },

  // Generate PDF for a loading sheet
  generatePDF: async (loadingSheetId) => {
    const sheet = await prisma.loadingSheet.findUnique({
      where: { id: loadingSheetId },
      include: {
        container: true,
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!sheet) {
      throw new Error('Loading sheet not found');
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ 
        margin: 40, 
        size: 'A4', 
        layout: 'landscape' 
      });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // --- BRANDING / HEADER ---
      doc.fillColor('#1e293b').fontSize(24).font('Helvetica-Bold').text(sheet.shippingMark || 'LOADING SHEET', { tracking: 1 });
      doc.fontSize(10).font('Helvetica').fillColor('#64748b').text('DIGITAL LOADING CONFIRMATION / PACKING LIST', { characterSpacing: 1 });
      
      doc.moveDown(1);
      
      // Horizontal Line
      doc.moveTo(40, doc.y).lineTo(750, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke();
      doc.moveDown(1);

      // --- INFO SECTION ---
      const infoY = doc.y;
      doc.fillColor('#475569').font('Helvetica-Bold').fontSize(9).text('CONTAINER DETAILS', 40, infoY);
      doc.fillColor('#1e293b').fontSize(11).text(sheet.container.containerCode, 40, infoY + 15);
      doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(`${sheet.container.origin || ''}`, 40, infoY + 30);

      doc.fillColor('#475569').font('Helvetica-Bold').fontSize(9).text('LOADING DATE', 250, infoY);
      doc.fillColor('#1e293b').fontSize(11).text(new Date(sheet.container.loadingDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }), 250, infoY + 15);

      doc.moveDown(4);

      // --- TABLE ---
      const tableTop = doc.y;
      const colWidths = [180, 100, 60, 60, 70, 60, 60, 60, 60];
      const headers = ['DESCRIPTION / PARTICULAR', 'ITEM NO.', 'CTN', 'PCS', 'T.PCS', 'UNIT', 'CBM', 'T.CBM', 'T.WT'];
      const startX = 40;

      // Header Background
      doc.rect(startX, tableTop, 710, 25).fill('#0f172a');
      
      let x = startX;
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff');
      headers.forEach((header, i) => {
        doc.text(header, x + 5, tableTop + 8, { width: colWidths[i] - 10, align: i > 1 ? 'center' : 'left' });
        x += colWidths[i];
      });

      // Rows
      let y = tableTop + 25;
      let totalCTN = 0;
      let totalTPCS = 0;
      let totalTCBM = 0;
      let totalTWT = 0;

      doc.font('Helvetica').fontSize(9);
      sheet.items.forEach((item, index) => {
        // Page break check
        if (y > 480) {
          doc.addPage({ margin: 40, layout: 'landscape' });
          y = 40;
          // Redraw header on new page
          doc.rect(startX, y, 710, 25).fill('#0f172a');
          let pageX = startX;
          doc.fillColor('#ffffff').font('Helvetica-Bold');
          headers.forEach((header, i) => {
            doc.text(header, pageX + 5, y + 8, { width: colWidths[i] - 10, align: i > 1 ? 'center' : 'left' });
            pageX += colWidths[i];
          });
          y += 25;
          doc.font('Helvetica').fontSize(9);
        }

        const bgColor = index % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(startX, y, 710, 25).fill(bgColor);
        
        let rowX = startX;
        doc.fillColor('#1e293b');
        
        const rowData = [
          item.particular,
          item.itemNo || '-',
          item.ctn.toString(),
          item.pcs.toString(),
          item.tPcs.toString(),
          item.unit,
          item.cbm.toFixed(3),
          item.tCbm.toFixed(3),
          item.tWt.toFixed(2),
        ];

        rowData.forEach((data, i) => {
          doc.text(data, rowX + 5, y + 8, { width: colWidths[i] - 10, align: i > 1 ? 'center' : 'left' });
          rowX += colWidths[i];
        });

        // Cell borders (light)
        doc.rect(startX, y, 710, 25).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

        totalCTN += item.ctn;
        totalTPCS += item.tPcs;
        totalTCBM += item.tCbm;
        totalTWT += item.tWt;

        y += 25;
      });

      // --- TOTALS ROW ---
      doc.rect(startX, y, 710, 30).fill('#1e293b');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10);
      
      let footX = startX;
      doc.text('GRAND TOTAL', footX + 5, y + 10, { width: colWidths[0] + colWidths[1] - 10, align: 'right' });
      footX += colWidths[0] + colWidths[1];
      
      doc.text(totalCTN.toString(), footX + 5, y + 10, { width: colWidths[2] - 10, align: 'center' });
      footX += colWidths[2] + colWidths[3]; // skip pcs
      
      doc.text(totalTPCS.toLocaleString(), footX + 5, y + 10, { width: colWidths[4] - 10, align: 'center' });
      footX += colWidths[4] + colWidths[5]; // skip unit
      
      doc.text(totalTCBM.toFixed(3), footX + 5, y + 10, { width: colWidths[6] + colWidths[7] - 10, align: 'center' });
      footX += colWidths[6] + colWidths[7];
      
      doc.text(totalTWT.toFixed(2), footX + 5, y + 10, { width: colWidths[8] - 10, align: 'center' });

      // Footer
      doc.fontSize(8).font('Helvetica-Oblique').fillColor('#94a3b8').text(
        `Generated by Impexina Cloud on ${new Date().toLocaleString()} | Page 1 of 1`,
        40, 540, { align: 'center' }
      );

      doc.end();
    });
  },

  // Generate WhatsApp summary
  generateWhatsAppSummary: async (loadingSheetId) => {
    const sheet = await prisma.loadingSheet.findUnique({
      where: { id: loadingSheetId },
      include: {
        container: true,
        items: true,
      },
    });

    if (!sheet) {
      throw new Error('Loading sheet not found');
    }

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

    const summary = `
*${sheet.shippingMark || 'Loading Sheet'}*
📦 Container: ${sheet.container.containerCode}
📅 Loading Date: ${new Date(sheet.container.loadingDate).toLocaleDateString()}

📊 *Summary:*
• CTN: ${totals.ctn}
• PCS: ${totals.tPcs.toLocaleString()}
• Weight: ${totals.tWt.toFixed(2)} kg
• CBM: ${totals.tCbm.toFixed(3)}
• Items: ${sheet.items.length}
    `.trim();

    return summary;
  },
};

module.exports = exportService;
