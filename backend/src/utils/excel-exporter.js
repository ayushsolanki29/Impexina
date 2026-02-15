const ExcelJS = require('exceljs');

/**
 * Reusable Excel Exporter Utility
 */
class ExcelExporter {
    /**
     * Generate Excel Buffer
     * @param {Object} options
     * @param {string} options.sheetName - Name of the sheet
     * @param {Array} options.columns - Array of objects { header, key, width }
     * @param {Array} options.data - Array of data objects
     * @param {string} options.title - Optional title row at the top
     * @returns {Promise<Buffer>}
     */
    static async generateBuffer({ sheetName = 'Sheet1', columns, data, title }) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheetName);

        let currentRow = 1;

        // Apply Title if provided
        if (title) {
            worksheet.mergeCells(1, 1, 1, columns.length);
            const titleRow = worksheet.getRow(1);
            titleRow.values = [title];
            titleRow.font = { name: 'Arial Black', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
            titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
            titleRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF1E293B' }, // Slate 800
            };
            titleRow.height = 30;
            currentRow = 2;
        }

        // Set Columns
        worksheet.columns = columns.map(col => ({
            header: col.header,
            key: col.key,
            width: col.width || 15
        }));

        // Style Header Row
        const headerRow = worksheet.getRow(currentRow);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF334155' }, // Slate 700
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
        headerRow.height = 20;

        // Add Data
        worksheet.addRows(data);

        // Style Data Rows
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > currentRow) {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                    cell.alignment = { vertical: 'middle' };
                });

                // Alternate row colors
                if (rowNumber % 2 === 0) {
                    row.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF8FAFC' } // Slate 50
                    };
                }
            }
        });

        return await workbook.xlsx.writeBuffer();
    }

    /**
     * Generate multi-sheet Excel Buffer
     * @param {Array} sheets - Array of { name, columns, data, title }
     * @returns {Promise<Buffer>}
     */
    static async generateMultiSheetBuffer(sheets) {
        const workbook = new ExcelJS.Workbook();

        for (const sheetInfo of sheets) {
            const worksheet = workbook.addWorksheet(sheetInfo.name);
            let currentRow = 1;

            if (sheetInfo.title) {
                worksheet.mergeCells(1, 1, 1, sheetInfo.columns.length);
                const titleRow = worksheet.getRow(1);
                titleRow.values = [sheetInfo.title];
                titleRow.font = { name: 'Arial Black', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
                titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
                titleRow.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF1E293B' },
                };
                titleRow.height = 25;
                currentRow = 2;
            }

            worksheet.columns = sheetInfo.columns.map(col => ({
                header: col.header,
                key: col.key,
                width: col.width || 15
            }));

            const headerRow = worksheet.getRow(currentRow);
            headerRow.eachCell((cell) => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF334155' },
                };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });

            worksheet.addRows(sheetInfo.data);

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > currentRow) {
                    row.eachCell((cell) => {
                        cell.border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        };
                    });
                }
            });
        }

        return await workbook.xlsx.writeBuffer();
    }
}

module.exports = ExcelExporter;
