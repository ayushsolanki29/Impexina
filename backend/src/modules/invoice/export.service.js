const { prisma } = require('../../database/prisma');
const ExcelExporter = require('../../utils/excel-exporter');

const invoiceExportService = {
    // Generate Excel for a single invoice
    generateExcel: async (invoiceId) => {
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                items: { orderBy: { createdAt: 'asc' } },
            },
        });

        if (!invoice) {
            throw new Error('Invoice not found');
        }

        const columns = [
            { header: 'Item No/Mark', key: 'itemNumber', width: 20 },
            { header: 'Description', key: 'description', width: 35 },
            { header: 'CTN', key: 'ctn', width: 10 },
            { header: 'Qty/CTN', key: 'qtyPerCtn', width: 10 },
            { header: 'Total Qty', key: 'tQty', width: 12 },
            { header: 'Unit', key: 'unit', width: 10 },
            { header: 'Unit Price (USD)', key: 'unitPrice', width: 15 },
            { header: 'Amount (USD)', key: 'amountUsd', width: 15 },
            { header: 'HSN', key: 'hsn', width: 12 },
        ];

        const data = invoice.items.map(item => ({
            ...item,
            unitPrice: parseFloat(item.unitPrice).toFixed(2),
            amountUsd: parseFloat(item.amountUsd).toFixed(2)
        }));

        return await ExcelExporter.generateBuffer({
            sheetName: (invoice.invNo || 'Invoice').substring(0, 31).replace(/[\[\]\?\*\/\\:]/g, ''),
            title: `Invoice: ${invoice.invNo} | Date: ${invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : 'N/A'} | Container: ${invoice.containerCode}`,
            columns,
            data
        });
    },

    // Generate Global Excel for all invoices
    generateAllContainersExcel: async () => {
        const containers = await prisma.container.findMany({
            include: {
                invoice: {
                    include: {
                        items: { orderBy: { createdAt: 'asc' } }
                    }
                },
                loadingSheets: {
                    include: {
                        items: { orderBy: { createdAt: 'asc' } }
                    }
                }
            },
            orderBy: { loadingDate: 'desc' }
        });

        const columns = [
            { header: 'Item No/Mark', key: 'itemNumber', width: 20 },
            { header: 'Description', key: 'description', width: 35 },
            { header: 'CTN', key: 'ctn', width: 10 },
            { header: 'Total Qty', key: 'tQty', width: 12 },
            { header: 'Unit', key: 'unit', width: 10 },
            { header: 'Unit Price (USD)', key: 'unitPrice', width: 15 },
            { header: 'Amount (USD)', key: 'amountUsd', width: 15 },
            { header: 'HSN', key: 'hsn', width: 12 },
            { header: 'Status', key: 'status', width: 12 },
        ];

        const workbookSheets = [];

        for (const container of containers) {
            let data = [];
            let subtitle = '';

            if (container.invoice && container.invoice.items && container.invoice.items.length > 0) {
                data = container.invoice.items.map(item => ({
                    itemNumber: item.itemNumber || '',
                    description: item.description,
                    ctn: item.ctn,
                    tQty: item.tQty,
                    unit: item.unit,
                    unitPrice: parseFloat(item.unitPrice).toFixed(2),
                    amountUsd: parseFloat(item.amountUsd).toFixed(2),
                    hsn: item.hsn || '',
                    status: 'SAVED'
                }));
                subtitle = `Invoice: ${container.invoice.invNo} | Status: SAVED`;
            } else if (container.loadingSheets && container.loadingSheets.length > 0) {
                // Fallback to loading sheets data (PENDING status)
                container.loadingSheets.forEach(sheet => {
                    sheet.items.forEach(item => {
                        data.push({
                            itemNumber: item.mark || '',
                            description: item.particular,
                            ctn: item.ctn,
                            tQty: item.tPcs,
                            unit: item.unit,
                            unitPrice: '0.00',
                            amountUsd: '0.00',
                            hsn: '',
                            status: 'PENDING'
                        });
                    });
                });
                subtitle = `Status: PENDING (Data from Loading Sheets)`;
            }

            if (data.length > 0) {
                workbookSheets.push({
                    name: container.containerCode.substring(0, 31).replace(/[\[\]\?\*\/\\:]/g, ''),
                    title: `Container: ${container.containerCode} | Date: ${new Date(container.loadingDate).toLocaleDateString()} | ${subtitle}`,
                    columns,
                    data
                });
            }
        }

        if (workbookSheets.length === 0) {
            workbookSheets.push({
                name: 'No Data',
                columns: [{ header: 'Message', key: 'msg', width: 30 }],
                data: [{ msg: 'No containers or loading sheets found' }]
            });
        }

        return await ExcelExporter.generateMultiSheetBuffer(workbookSheets);
    }
};

module.exports = invoiceExportService;
