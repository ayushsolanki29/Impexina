const PDFDocument = require('pdfkit');
const { prisma } = require('../../database/prisma');
const ExcelExporter = require('../../utils/excel-exporter');

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

    const columns = [
      { header: 'Particular', key: 'particular', width: 30 },
      { header: 'Item No.', key: 'itemNo', width: 20 },
      { header: 'CTN', key: 'ctn', width: 10 },
      { header: 'PCS', key: 'pcs', width: 10 },
      { header: 'T.PCS', key: 'tPcs', width: 12 },
      { header: 'Unit', key: 'unit', width: 10 },
      { header: 'CBM', key: 'cbm', width: 12 },
      { header: 'T.CBM', key: 'tCbm', width: 12 },
      { header: 'WT', key: 'wt', width: 12 },
      { header: 'T.WT', key: 'tWt', width: 12 },
    ];

    const data = sheet.items.map(item => ({
      ...item,
      particular: item.particular,
      itemNo: item.itemNo,
      ctn: item.ctn,
      pcs: item.pcs,
      tPcs: item.tPcs,
      unit: item.unit,
      cbm: item.cbm,
      tCbm: item.tCbm,
      wt: item.wt,
      tWt: item.tWt
    }));

    return await ExcelExporter.generateBuffer({
      sheetName: (sheet.shippingMark || 'Loading Sheet').substring(0, 31).replace(/[\[\]\?\*\/\\:]/g, ''),
      title: `${sheet.shippingMark || 'Loading Sheet'} | Container: ${sheet.container.containerCode}`,
      columns,
      data
    });
  },

  // Generate Global Excel for all containers
  generateAllContainersExcel: async () => {
    const containers = await prisma.container.findMany({
      include: {
        loadingSheets: {
          include: {
            items: { orderBy: { createdAt: 'asc' } }
          }
        }
      },
      orderBy: { loadingDate: 'desc' }
    });

    const columns = [
      { header: 'Mark', key: 'mark', width: 15 },
      { header: 'Particular', key: 'particular', width: 30 },
      { header: 'Item No.', key: 'itemNo', width: 15 },
      { header: 'CTN', key: 'ctn', width: 10 },
      { header: 'T.PCS', key: 'tPcs', width: 10 },
      { header: 'Unit', key: 'unit', width: 10 },
      { header: 'T.CBM', key: 'tCbm', width: 12 },
      { header: 'T.WT', key: 'tWt', width: 12 },
    ];

    const workbookSheets = [];

    for (const container of containers) {
      const allItems = [];
      container.loadingSheets.forEach(ls => {
        ls.items.forEach(item => {
          allItems.push({
            mark: ls.shippingMark || 'N/A',
            particular: item.particular,
            itemNo: item.itemNo,
            ctn: item.ctn,
            tPcs: item.tPcs,
            unit: item.unit,
            tCbm: item.tCbm,
            tWt: item.tWt
          });
        });
      });

      if (allItems.length > 0) {
        workbookSheets.push({
          name: container.containerCode.substring(0, 31).replace(/[\[\]\?\*\/\\:]/g, ''),
          title: `Container: ${container.containerCode} | Date: ${new Date(container.loadingDate).toLocaleDateString()} | Origin: ${container.origin || 'N/A'}`,
          columns,
          data: allItems
        });
      }
    }

    if (workbookSheets.length === 0) {
      // Add a placeholder sheet if no data
      workbookSheets.push({
        name: 'No Data',
        columns: [{ header: 'Message', key: 'msg', width: 30 }],
        data: [{ msg: 'No loading sheets found' }]
      });
    }

    return await ExcelExporter.generateMultiSheetBuffer(workbookSheets);
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
