const { prisma } = require('../../database/prisma');
const ExcelExporter = require('../../utils/excel-exporter');

const packingListExportService = {
    // Generate Excel for a single packing list
    generateExcel: async (packingListId) => {
        const packingList = await prisma.packingList.findUnique({
            where: { id: packingListId },
            include: {
                items: { orderBy: { createdAt: 'asc' } },
            },
        });

        if (!packingList) {
            throw new Error('Packing list not found');
        }

        const columns = [
            { header: 'Item No/Mark', key: 'itemNumber', width: 20 },
            { header: 'Particular', key: 'particular', width: 35 },
            { header: 'CTN', key: 'ctn', width: 10 },
            { header: 'Qty/CTN', key: 'qtyPerCtn', width: 10 },
            { header: 'Total Qty', key: 'tQty', width: 12 },
            { header: 'Unit', key: 'unit', width: 10 },
            { header: 'Unit KG', key: 'kg', width: 12 },
            { header: 'Total KG', key: 'tKg', width: 12 },
            { header: 'MIX', key: 'mix', width: 15 },
            { header: 'HSN', key: 'hsn', width: 12 },
        ];

        const data = packingList.items.map(item => ({
            ...item,
            kg: parseFloat(item.kg).toFixed(2),
            tKg: parseFloat(item.tKg).toFixed(2)
        }));

        return await ExcelExporter.generateBuffer({
            sheetName: (packingList.invNo || 'Packing List').substring(0, 31).replace(/[\[\]\?\*\/\\:]/g, ''),
            title: `Packing List: ${packingList.invNo} | Date: ${packingList.invoiceDate ? new Date(packingList.invoiceDate).toLocaleDateString() : 'N/A'} | Container: ${packingList.containerCode}`,
            columns,
            data
        });
    },

    // Generate Global Excel for all packing lists
    generateAllContainersExcel: async () => {
        const containers = await prisma.container.findMany({
            include: {
                packingList: {
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
            { header: 'Particular', key: 'particular', width: 35 },
            { header: 'CTN', key: 'ctn', width: 10 },
            { header: 'Total Qty', key: 'tQty', width: 12 },
            { header: 'Unit', key: 'unit', width: 10 },
            { header: 'Total KG', key: 'tKg', width: 12 },
            { header: 'HSN', key: 'hsn', width: 12 },
            { header: 'Status', key: 'status', width: 12 },
        ];

        const workbookSheets = [];

        for (const container of containers) {
            let data = [];
            let subtitle = '';

            if (container.packingList && container.packingList.items.length > 0) {
                data = container.packingList.items.map(item => ({
                    itemNumber: item.itemNumber || '',
                    particular: item.particular,
                    ctn: item.ctn,
                    tQty: item.tQty,
                    unit: item.unit,
                    tKg: parseFloat(item.tKg).toFixed(2),
                    hsn: item.hsn || '',
                    status: 'SAVED'
                }));
                subtitle = `Packing List: ${container.packingList.invNo} | Status: SAVED`;
            } else if (container.loadingSheets && container.loadingSheets.length > 0) {
                // Fallback to loading sheets data (PENDING status)
                container.loadingSheets.forEach(sheet => {
                    sheet.items.forEach(item => {
                        data.push({
                            itemNumber: item.mark || '',
                            particular: item.particular,
                            ctn: item.ctn,
                            tQty: item.tPcs,
                            unit: item.unit,
                            tKg: parseFloat(item.tWt || 0).toFixed(2),
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

module.exports = packingListExportService;
