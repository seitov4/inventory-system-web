/**
 * Report Generator Utilities
 * 
 * This module provides functions for generating sales reports in various formats.
 * Supports TXT (human-readable) and XLSX (Excel) formats.
 * 
 * IMPORTANT: This module works ONLY with real data from the backend API.
 * No mock/demo data is generated.
 */

import * as XLSX from 'xlsx';

/**
 * Aggregate sales data by product for a given date range
 * 
 * @param {Array} salesData - Raw sales data from API
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @returns {Object} Aggregated report data
 */
export function aggregateSalesData(salesData, startDate, endDate) {
    // If no data, return empty report
    if (!Array.isArray(salesData) || salesData.length === 0) {
        return {
            lines: [],
            totals: { totalQuantity: 0, totalRevenue: 0 },
            period: { start: startDate, end: endDate },
            generatedAt: new Date(),
            isEmpty: true
        };
    }

    // Filter sales within date range
    const filteredSales = salesData.filter(sale => {
        const saleDate = new Date(sale.date || sale.created_at);
        return saleDate >= startDate && saleDate <= endDate;
    });

    // Group by product and aggregate quantities/totals
    const productMap = new Map();
    
    filteredSales.forEach(sale => {
        const key = sale.product_id || sale.id;
        const existing = productMap.get(key);
        
        const quantity = Math.abs(sale.quantity || sale.qty || 1);
        const price = sale.sale_price || sale.price || 0;
        const lineTotal = sale.total || (quantity * price);
        
        if (existing) {
            // Accumulate quantities and totals for same product
            existing.quantity += quantity;
            existing.total += lineTotal;
        } else {
            // Create new product entry
            productMap.set(key, {
                date: sale.date || sale.created_at,
                product_name: sale.product_name || sale.name,
                sku: sale.sku || '',
                quantity: quantity,
                sale_price: price,
                total: lineTotal
            });
        }
    });

    // Convert map to array and sort by date
    const reportLines = Array.from(productMap.values()).sort((a, b) => 
        new Date(a.date) - new Date(b.date)
    );

    // Calculate grand totals
    const grandTotals = reportLines.reduce((acc, line) => ({
        totalQuantity: acc.totalQuantity + line.quantity,
        totalRevenue: acc.totalRevenue + line.total
    }), { totalQuantity: 0, totalRevenue: 0 });

    return {
        lines: reportLines,
        totals: grandTotals,
        period: {
            start: startDate,
            end: endDate
        },
        generatedAt: new Date(),
        isEmpty: reportLines.length === 0
    };
}

/**
 * Format currency value
 * @param {number} value - Numeric value
 * @returns {string} Formatted currency string
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value || 0);
}

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

/**
 * Generate TXT report content
 * Human-readable text format
 * 
 * @param {Object} reportData - Aggregated report data from aggregateSalesData()
 * @returns {string} TXT file content
 */
export function generateTXTReport(reportData) {
    const { lines, totals, period, generatedAt, isEmpty } = reportData;
    
    const separator = '='.repeat(80);
    const thinSeparator = '-'.repeat(80);
    
    let content = '';
    
    // Header
    content += separator + '\n';
    content += '                         SALES REPORT\n';
    content += separator + '\n\n';
    
    // Report metadata
    content += `Period: ${formatDate(period.start)} - ${formatDate(period.end)}\n`;
    content += `Generated: ${formatDate(generatedAt)} at ${generatedAt.toLocaleTimeString()}\n`;
    content += '\n' + thinSeparator + '\n\n';
    
    // Handle empty report
    if (isEmpty || lines.length === 0) {
        content += 'No sales data found for the selected period.\n';
        content += '\n' + separator + '\n';
        return content;
    }
    
    // Column headers
    content += 'Date        | Product Name                    | SKU          | Qty  | Price    | Total\n';
    content += thinSeparator + '\n';
    
    // Report lines
    lines.forEach(line => {
        const date = formatDate(line.date).padEnd(11);
        const name = (line.product_name || '').substring(0, 31).padEnd(31);
        const sku = (line.sku || '-').substring(0, 12).padEnd(12);
        const qty = String(line.quantity).padStart(4);
        const price = formatCurrency(line.sale_price).padStart(8);
        const total = formatCurrency(line.total).padStart(10);
        
        content += `${date} | ${name} | ${sku} | ${qty} | ${price} | ${total}\n`;
    });
    
    // Totals section
    content += '\n' + thinSeparator + '\n';
    content += `GRAND TOTALS:\n`;
    content += `  Total Items Sold: ${totals.totalQuantity}\n`;
    content += `  Total Revenue:    ${formatCurrency(totals.totalRevenue)}\n`;
    content += separator + '\n';
    
    return content;
}

/**
 * Generate XLSX (Excel) report
 * Professional spreadsheet with styling
 * 
 * @param {Object} reportData - Aggregated report data from aggregateSalesData()
 * @returns {Blob} Excel file as Blob
 */
export function generateXLSXReport(reportData) {
    const { lines, totals, period, generatedAt, isEmpty } = reportData;
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Prepare data rows
    let wsData;
    
    if (isEmpty || lines.length === 0) {
        wsData = [
            ['SALES REPORT'],
            [],
            ['Period:', `${formatDate(period.start)} - ${formatDate(period.end)}`],
            ['Generated:', `${formatDate(generatedAt)} ${generatedAt.toLocaleTimeString()}`],
            [],
            ['No sales data found for the selected period.']
        ];
    } else {
        wsData = [
            // Title row
            ['SALES REPORT'],
            [],
            // Metadata
            ['Period:', `${formatDate(period.start)} - ${formatDate(period.end)}`],
            ['Generated:', `${formatDate(generatedAt)} ${generatedAt.toLocaleTimeString()}`],
            [],
            // Headers
            ['Date', 'Product Name', 'SKU', 'Quantity', 'Sale Price', 'Total'],
            // Data rows
            ...lines.map(line => [
                formatDate(line.date),
                line.product_name,
                line.sku || '-',
                line.quantity,
                line.sale_price,
                line.total
            ]),
            // Empty row before totals
            [],
            // Totals
            ['', '', '', 'TOTALS:', totals.totalQuantity, totals.totalRevenue]
        ];
    }
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths for better readability
    ws['!cols'] = [
        { wch: 12 },  // Date
        { wch: 35 },  // Product Name
        { wch: 15 },  // SKU
        { wch: 10 },  // Quantity
        { wch: 12 },  // Sale Price
        { wch: 14 }   // Total
    ];
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Report');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
}

/**
 * Download file helper
 * Creates a download link and triggers download
 * 
 * @param {Blob|string} content - File content
 * @param {string} filename - Name for downloaded file
 * @param {string} mimeType - MIME type of the file
 */
export function downloadFile(content, filename, mimeType) {
    let blob;
    
    if (content instanceof Blob) {
        blob = content;
    } else {
        blob = new Blob([content], { type: mimeType });
    }
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Generate and download sales report
 * Main entry point for report generation
 * 
 * @param {Array} salesData - Raw sales data from API (real data only, no mocks)
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @param {string} format - 'txt' or 'xlsx'
 * @returns {Object} Report data with isEmpty flag
 */
export function exportSalesReport(salesData, startDate, endDate, format = 'txt') {
    // Aggregate the data
    const reportData = aggregateSalesData(salesData, startDate, endDate);
    
    // Generate filename with date range
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    const baseFilename = `sales-report_${startStr}_${endStr}`;
    
    if (format === 'xlsx') {
        // Generate and download Excel file
        const excelBlob = generateXLSXReport(reportData);
        downloadFile(excelBlob, `${baseFilename}.xlsx`);
    } else {
        // Generate and download TXT file
        const txtContent = generateTXTReport(reportData);
        downloadFile(txtContent, `${baseFilename}.txt`, 'text/plain');
    }
    
    return reportData;
}
