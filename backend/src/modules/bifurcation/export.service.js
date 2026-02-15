const { prisma } = require('../../database/prisma');
const ExcelExporter = require('../../utils/excel-exporter');

const bifurcationExportService = {
    // Generate Excel for the bifurcation report
    generateExcel: async (filters = {}) => {
        // We want a global export, but we can respect filters if provided
        const containerWhere = {
            status: { not: 'ARCHIVED' }
        };

        if (filters.containerId) {
            containerWhere.id = filters.containerId;
        }

        if (filters.search || filters.dateFrom || filters.dateTo || filters.origin) {
            const subWhere = {};
            if (filters.search) {
                subWhere.OR = [
                    { containerCode: { contains: filters.search, mode: 'insensitive' } },
                    { loadingSheets: { some: { shippingMark: { contains: filters.search, mode: 'insensitive' } } } }
                ];
            }
            if (filters.dateFrom || filters.dateTo) {
                subWhere.loadingDate = {};
                if (filters.dateFrom) subWhere.loadingDate.gte = new Date(filters.dateFrom);
                if (filters.dateTo) subWhere.loadingDate.lte = new Date(filters.dateTo);
            }
            if (filters.origin) {
                subWhere.origin = { contains: filters.origin, mode: 'insensitive' };
            }
            Object.assign(containerWhere, subWhere);
        }

        const containers = await prisma.container.findMany({
            where: containerWhere,
            orderBy: { containerCode: 'asc' },
            include: {
                loadingSheets: {
                    include: {
                        items: true,
                        bifurcation: true
                    },
                    orderBy: { shippingMark: 'asc' }
                }
            }
        });

        const settings = await prisma.systemSetting.findMany({
            where: { key: 'BIFURCATION_ITEM_LIMIT' }
        });
        const mixLimit = settings.length > 0 ? parseInt(settings[0].value) : 5;

        const workbookSheets = [];

        const columns = [
            { header: 'Shipping Mark', key: 'mark', width: 20 },
            { header: 'Client', key: 'client', width: 25 },
            { header: 'Product Detail', key: 'product', width: 35 },
            { header: 'CTN', key: 'ctn', width: 10 },
            { header: 'CBM', key: 'cbm', width: 12 },
            { header: 'WT', key: 'wt', width: 12 },
            { header: 'From', key: 'from', width: 15 },
            { header: 'To', key: 'to', width: 15 },
            { header: 'Delivery Date', key: 'deliveryDate', width: 15 },
            { header: 'Invoice No', key: 'invoiceNo', width: 15 },
            { header: 'GST Amount', key: 'gstAmount', width: 12 },
            { header: 'LR No', key: 'lrNo', width: 10 },
        ];

        for (const container of containers) {
            if (container.loadingSheets.length === 0) continue;

            const data = container.loadingSheets.map(sheet => {
                const distinctParticulars = [...new Set(sheet.items.map(i => i.particular).filter(Boolean))];
                let productDescription = distinctParticulars.join(', ');
                if (distinctParticulars.length > mixLimit) {
                    productDescription = 'MIX ITEM';
                }

                const totalCtn = sheet.items.reduce((sum, item) => sum + (item.ctn || 0), 0);
                const totalCbm = sheet.items.reduce((sum, item) => sum + (item.tCbm || 0), 0);
                const totalWt = sheet.items.reduce((sum, item) => sum + (item.tWt || 0), 0);

                return {
                    mark: sheet.shippingMark || 'N/A',
                    client: sheet.clientName || '',
                    product: productDescription,
                    ctn: totalCtn,
                    cbm: parseFloat(totalCbm.toFixed(3)),
                    wt: parseFloat(totalWt.toFixed(2)),
                    from: sheet.bifurcation?.from || '',
                    to: sheet.bifurcation?.to || '',
                    deliveryDate: sheet.bifurcation?.deliveryDate ? new Date(sheet.bifurcation.deliveryDate).toLocaleDateString() : '',
                    invoiceNo: sheet.bifurcation?.invoiceNo || '',
                    gstAmount: sheet.bifurcation?.gstAmount || 0,
                    lrNo: sheet.bifurcation?.lrNo ? 'YES' : 'NO'
                };
            });

            workbookSheets.push({
                name: container.containerCode.substring(0, 31).replace(/[\[\]\?\*\/\\:]/g, ''),
                title: `Container: ${container.containerCode} | Date: ${new Date(container.loadingDate).toLocaleDateString()} | Origin: ${container.origin || 'N/A'}`,
                columns,
                data
            });
        }

        if (workbookSheets.length === 0) {
            workbookSheets.push({
                name: 'Report',
                columns: [{ header: 'Message', key: 'msg', width: 30 }],
                data: [{ msg: 'No data found' }]
            });
        }

        return await ExcelExporter.generateMultiSheetBuffer(workbookSheets);
    }
};

module.exports = bifurcationExportService;
