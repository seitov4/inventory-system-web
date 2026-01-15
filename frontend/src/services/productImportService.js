/**
 * Product Import Service
 * 
 * This service handles parsing and validation of product data from CSV and XLSX files.
 * It provides a unified interface for importing products regardless of file format.
 * 
 * Supported formats:
 * - CSV (using PapaParse)
 * - XLSX/XLS (using SheetJS)
 * 
 * Required columns: name
 * Optional columns: sku, barcode, purchase_price, sale_price, min_stock
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// Column name mappings (case-insensitive)
// Maps various possible column names to our standard field names
const COLUMN_MAPPINGS = {
    // Name field (required)
    'name': 'name',
    'product_name': 'name',
    'productname': 'name',
    'product': 'name',
    'название': 'name',
    'наименование': 'name',
    'товар': 'name',
    
    // SKU field
    'sku': 'sku',
    'артикул': 'sku',
    'код': 'sku',
    'code': 'sku',
    'product_code': 'sku',
    
    // Barcode field
    'barcode': 'barcode',
    'bar_code': 'barcode',
    'штрихкод': 'barcode',
    'штрих_код': 'barcode',
    'ean': 'barcode',
    
    // Purchase price field
    'purchase_price': 'purchase_price',
    'purchaseprice': 'purchase_price',
    'cost': 'purchase_price',
    'cost_price': 'purchase_price',
    'закупочная_цена': 'purchase_price',
    'себестоимость': 'purchase_price',
    'цена_закупки': 'purchase_price',
    
    // Sale price field
    'sale_price': 'sale_price',
    'saleprice': 'sale_price',
    'price': 'sale_price',
    'retail_price': 'sale_price',
    'цена': 'sale_price',
    'цена_продажи': 'sale_price',
    'розничная_цена': 'sale_price',
    
    // Min stock field
    'min_stock': 'min_stock',
    'minstock': 'min_stock',
    'minimum_stock': 'min_stock',
    'min_quantity': 'min_stock',
    'мин_остаток': 'min_stock',
    'минимальный_остаток': 'min_stock',
};

/**
 * Normalize column name to standard field name
 * @param {string} columnName - Original column name from file
 * @returns {string|null} Normalized field name or null if not recognized
 */
function normalizeColumnName(columnName) {
    if (!columnName) return null;
    
    const normalized = columnName
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_а-яё]/gi, '');
    
    return COLUMN_MAPPINGS[normalized] || null;
}

/**
 * Parse numeric value from string
 * @param {any} value - Value to parse
 * @returns {number|null} Parsed number or null
 */
function parseNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    
    // Handle string numbers with comma as decimal separator
    const strValue = String(value).replace(',', '.').trim();
    const num = parseFloat(strValue);
    
    return isNaN(num) ? null : num;
}

/**
 * Validate and transform a single product row
 * Required fields: name, sku, sale_price
 * 
 * @param {Object} row - Raw row data with normalized keys
 * @param {number} rowIndex - Row index for error reporting
 * @returns {Object} { product: Object|null, error: string|null }
 */
function validateProductRow(row, rowIndex) {
    const errors = [];
    
    // Check required field: name
    if (!row.name || String(row.name).trim() === '') {
        errors.push('missing required field "name"');
    }
    
    // Check required field: sku
    if (!row.sku || String(row.sku).trim() === '') {
        errors.push('missing required field "sku"');
    }
    
    // Check required field: sale_price
    const salePrice = parseNumber(row.sale_price);
    if (salePrice === null) {
        errors.push('missing required field "sale_price"');
    }
    
    // Return early if required fields are missing
    if (errors.length > 0) {
        return {
            product: null,
            error: `Row ${rowIndex + 1}: ${errors.join(', ')}`
        };
    }
    
    // Build product object with validated data
    const product = {
        name: String(row.name).trim(),
        sku: String(row.sku).trim(),
        barcode: row.barcode ? String(row.barcode).trim() : null,
        purchase_price: parseNumber(row.purchase_price),
        sale_price: salePrice,
        min_stock: parseNumber(row.min_stock) ?? 0,
    };
    
    // Validate numeric fields are non-negative
    if (product.purchase_price !== null && product.purchase_price < 0) {
        errors.push('purchase_price must be non-negative');
    }
    if (product.sale_price < 0) {
        errors.push('sale_price must be non-negative');
    }
    if (product.min_stock < 0) {
        errors.push('min_stock must be non-negative');
    }
    
    if (errors.length > 0) {
        return {
            product: null,
            error: `Row ${rowIndex + 1}: ${errors.join(', ')}`
        };
    }
    
    return { product, error: null };
}

/**
 * Transform raw data rows to products
 * @param {Array} rows - Array of raw row objects
 * @param {Object} columnMap - Mapping of original column names to standard names
 * @returns {Object} { products: Array, skipped: Array, errors: Array }
 */
function transformRows(rows, columnMap) {
    const products = [];
    const skipped = [];
    const errors = [];
    
    rows.forEach((row, index) => {
        // Skip completely empty rows
        const hasData = Object.values(row).some(v => v !== null && v !== undefined && v !== '');
        if (!hasData) return;
        
        // Map columns to standard names
        const normalizedRow = {};
        Object.entries(row).forEach(([key, value]) => {
            const normalizedKey = columnMap[key];
            if (normalizedKey) {
                normalizedRow[normalizedKey] = value;
            }
        });
        
        // Validate and transform
        const { product, error } = validateProductRow(normalizedRow, index);
        
        if (product) {
            products.push(product);
        } else {
            skipped.push({ row: index + 1, reason: error });
            errors.push(error);
        }
    });
    
    return { products, skipped, errors };
}

/**
 * Parse CSV file content
 * @param {File} file - CSV file to parse
 * @returns {Promise<Object>} Parsed result with products and metadata
 */
export async function parseCSV(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    const { data, meta } = results;
                    
                    // Build column mapping
                    const columnMap = {};
                    meta.fields.forEach(field => {
                        const normalized = normalizeColumnName(field);
                        if (normalized) {
                            columnMap[field] = normalized;
                        }
                    });
                    
                    // Check if we have at least the name column
                    const hasNameColumn = Object.values(columnMap).includes('name');
                    if (!hasNameColumn) {
                        reject(new Error('CSV file must contain a "name" column'));
                        return;
                    }
                    
                    // Transform rows
                    const result = transformRows(data, columnMap);
                    
                    resolve({
                        totalRows: data.length,
                        ...result,
                        columns: meta.fields,
                        mappedColumns: columnMap
                    });
                } catch (err) {
                    reject(err);
                }
            },
            error: (error) => {
                reject(new Error(`CSV parsing error: ${error.message}`));
            }
        });
    });
}

/**
 * Parse XLSX/XLS file content
 * Validates structure and maps columns by header name
 * 
 * @param {File} file - Excel file to parse
 * @returns {Promise<Object>} Parsed result with products and metadata
 */
export async function parseXLSX(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Look for "Products" sheet first, then fall back to first sheet
                let sheetName = workbook.SheetNames.find(
                    name => name.toLowerCase() === 'products'
                );
                if (!sheetName) {
                    sheetName = workbook.SheetNames[0];
                }
                
                if (!sheetName) {
                    reject(new Error('Excel file contains no sheets'));
                    return;
                }
                
                const worksheet = workbook.Sheets[sheetName];
                
                // Convert to JSON with headers
                const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
                
                if (rows.length === 0) {
                    reject(new Error('Excel sheet is empty. Please add product data starting from row 2.'));
                    return;
                }
                
                // Get column names from first row keys
                const columns = Object.keys(rows[0]);
                
                // Check if all data appears in one column (common CSV-in-XLSX error)
                if (columns.length === 1) {
                    const singleCol = columns[0];
                    // Check if the single column contains comma-separated values
                    if (singleCol.includes(',') || (rows[0][singleCol] && String(rows[0][singleCol]).includes(','))) {
                        reject(new Error(
                            'Invalid file structure: All data appears in a single column. ' +
                            'Please ensure each field is in a separate column. ' +
                            'Download the template for the correct format.'
                        ));
                        return;
                    }
                }
                
                // Build column mapping (case-insensitive)
                const columnMap = {};
                columns.forEach(col => {
                    const normalized = normalizeColumnName(col);
                    if (normalized) {
                        columnMap[col] = normalized;
                    }
                });
                
                // Check for required columns
                const mappedFields = Object.values(columnMap);
                const hasNameColumn = mappedFields.includes('name');
                const hasSkuColumn = mappedFields.includes('sku');
                const hasSalePriceColumn = mappedFields.includes('sale_price');
                
                const missingRequired = [];
                if (!hasNameColumn) missingRequired.push('name');
                if (!hasSkuColumn) missingRequired.push('sku');
                if (!hasSalePriceColumn) missingRequired.push('sale_price');
                
                if (missingRequired.length > 0) {
                    reject(new Error(
                        `Missing required columns: ${missingRequired.join(', ')}. ` +
                        'Please use the template with correct column headers.'
                    ));
                    return;
                }
                
                // Transform rows
                const result = transformRows(rows, columnMap);
                
                resolve({
                    totalRows: rows.length,
                    ...result,
                    columns,
                    mappedColumns: columnMap,
                    sheetName
                });
            } catch (err) {
                reject(new Error(`Excel parsing error: ${err.message}`));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Parse file based on its extension
 * @param {File} file - File to parse (CSV or XLSX)
 * @returns {Promise<Object>} Parsed result
 */
export async function parseProductFile(file) {
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.csv')) {
        return parseCSV(file);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        return parseXLSX(file);
    } else {
        throw new Error('Unsupported file format. Please use CSV or XLSX files.');
    }
}

/**
 * Generate XLSX template workbook
 * Creates a professional Excel template with:
 * - Products sheet with headers and example data
 * - README sheet with instructions
 * 
 * @returns {Object} XLSX workbook object
 */
export function generateXLSXTemplate() {
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // ===== PRODUCTS SHEET =====
    const headers = ['name', 'sku', 'barcode', 'purchase_price', 'sale_price', 'min_stock'];
    
    // Example products with realistic data
    const exampleProducts = [
        ['Milk 2.5%', 'MLK-001', '4607025391234', 180, 250, 20],
        ['White Bread', 'BRD-001', '4607025391235', 45, 65, 15],
        ['Sugar 1kg', 'SGR-001', '4607025391236', 120, 180, 30],
        ['Rice Premium 1kg', 'RCE-001', '4607025391237', 280, 420, 25],
        ['Pasta Spaghetti 500g', 'PST-001', '4607025391238', 140, 210, 35],
        ['Coffee Arabica 250g', 'COF-001', '4607025391239', 450, 680, 15],
        ['Black Tea 100g', 'TEA-001', '4607025391240', 180, 270, 25],
        ['Butter 200g', 'BTR-001', '4607025391241', 320, 480, 20],
        ['Chicken Eggs 10pcs', 'EGG-001', '4607025391242', 150, 220, 30],
        ['Mineral Water 1.5L', 'WTR-001', '4607025391243', 60, 90, 100],
    ];
    
    // Create Products sheet data
    const productsData = [
        headers,
        ...exampleProducts
    ];
    
    const wsProducts = XLSX.utils.aoa_to_sheet(productsData);
    
    // Set column widths for better readability
    wsProducts['!cols'] = [
        { wch: 25 },  // name
        { wch: 12 },  // sku
        { wch: 16 },  // barcode
        { wch: 14 },  // purchase_price
        { wch: 12 },  // sale_price
        { wch: 10 },  // min_stock
    ];
    
    // Add Products sheet to workbook
    XLSX.utils.book_append_sheet(wb, wsProducts, 'Products');
    
    // ===== README SHEET =====
    const readmeData = [
        ['PRODUCT IMPORT TEMPLATE - INSTRUCTIONS'],
        [''],
        ['How to use this template:'],
        [''],
        ['1. Fill in your product data starting from row 2 of the "Products" sheet'],
        ['2. Do NOT change the column names in row 1'],
        ['3. Do NOT merge any cells'],
        ['4. Do NOT add extra columns or sheets'],
        [''],
        ['Column descriptions:'],
        [''],
        ['  name          - Product name (REQUIRED)'],
        ['  sku           - Stock Keeping Unit / Article number (REQUIRED)'],
        ['  barcode       - Product barcode (EAN/UPC) - optional'],
        ['  purchase_price - Purchase/cost price (number) - optional'],
        ['  sale_price    - Retail/sale price (number) (REQUIRED)'],
        ['  min_stock     - Minimum stock level for alerts (number) - optional, default: 0'],
        [''],
        ['Important notes:'],
        [''],
        ['• All prices must be numbers (no currency symbols)'],
        ['• Barcode should be numeric only'],
        ['• You can delete the example rows and add your own data'],
        ['• Maximum 1000 products per import'],
        ['• Duplicate SKU or barcode will be skipped'],
        [''],
        ['Required fields: name, sku, sale_price'],
        [''],
        ['If you have questions, contact your system administrator.'],
    ];
    
    const wsReadme = XLSX.utils.aoa_to_sheet(readmeData);
    
    // Set column width for README
    wsReadme['!cols'] = [{ wch: 70 }];
    
    // Add README sheet to workbook
    XLSX.utils.book_append_sheet(wb, wsReadme, 'README');
    
    return wb;
}

/**
 * Download XLSX template file
 * Generates and downloads the product import template
 */
export function downloadXLSXTemplate() {
    const wb = generateXLSXTemplate();
    
    // Generate Excel file buffer
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    
    // Create blob and download
    const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'products_import_template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Legacy alias for backward compatibility
export const downloadCSVTemplate = downloadXLSXTemplate;

