/**
 * Export Service — converts report data to CSV, Excel (.xlsx), and PDF.
 *
 * Each exporter receives `{ title, data }` where `data` is the report's
 * `.data` object. The service auto-detects structure and serialises
 * arrays of objects as tables and nested objects as key-value rows.
 */

const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// ═══════════════════════════════════════════════════════════════════
//  Helpers
// ═══════════════════════════════════════════════════════════════════

/**
 * Deep-flatten an object: { a: { b: 1 } } → { "a.b": 1 }
 */
const isSerialisableObject = (val) =>
    val !== null &&
    typeof val === 'object' &&
    !Array.isArray(val) &&
    !(val instanceof Date) &&
    !(val instanceof Buffer) &&
    !(val.constructor?.name === 'ObjectId') &&
    !(val._bsontype); // MongoDB Binary / ObjectId / etc.

const toString = (val) => {
    if (val === null || val === undefined) return '';
    if (val instanceof Date) return val.toISOString();
    if (val instanceof Buffer) return val.toString('hex');
    if (val._bsontype === 'ObjectId' || val.constructor?.name === 'ObjectId') return val.toString();
    if (typeof val === 'object') return JSON.stringify(val);
    return val;
};

const flatten = (obj, prefix = '') => {
    const result = {};
    for (const [key, val] of Object.entries(obj)) {
        const k = prefix ? `${prefix}.${key}` : key;
        if (isSerialisableObject(val)) {
            Object.assign(result, flatten(val, k));
        } else if (Array.isArray(val)) {
            result[k] = JSON.stringify(val);
        } else {
            result[k] = toString(val);
        }
    }
    return result;
};

/**
 * Normalise report data into an array of flat row objects.
 * Handles nested objects, arrays-of-objects at any key, and
 * plain key-value shapes.
 */
/**
 * Preferred table keys (in order) to extract from summary objects.
 * When a report returns { total, byStatus, byVehicle, ... }, we want to
 * find the main table array and export that rather than flattening
 * the entire summary into one row.
 */
const TABLE_KEYS = ['byVehicle', 'vehicles', 'byType', 'drivers', 'jobs', 'logs', 'fuelLogs', 'maintenanceLogs'];

const normaliseRows = (data) => {
    // Already an array of homogenous objects — best case
    if (Array.isArray(data)) return data.map(v => flatten(v));

    if (data && typeof data === 'object') {
        // 1) Prefer named table keys (e.g. byVehicle, byType)
        for (const key of TABLE_KEYS) {
            const val = data[key];
            if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
                return val.map(v => flatten(v));
            }
        }

        // 2) Any other array of objects
        for (const val of Object.values(data)) {
            if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
                return val.map(v => flatten(v));
            }
        }
    }

    // Fallback — flatten top-level summary into a 2-column Key | Value table
    if (data && typeof data === 'object' && !Array.isArray(data)) {
        const flat = flatten(data);
        return Object.entries(flat).map(([key, value]) => ({ Key: key, Value: value }));
    }

    return [{ Value: JSON.stringify(data) }];
};

/**
 * Build columns from all keys present across rows, sorted alphabetically
 * but with common identifier columns first.
 */
const buildColumns = (rows) => {
    const keySet = new Set();
    for (const row of rows) {
        Object.keys(row).forEach(k => keySet.add(k));
    }
    // Push name/label/id columns first, then alphabetical
    const priority = ['name', 'registrationNumber', 'vehicleName', 'type', 'status', '_id', 'vehicleId'];
    const ordered = priority.filter(k => keySet.has(k));
    const rest = [...keySet].filter(k => !priority.includes(k)).sort();
    return [...ordered, ...rest];
};

// ═══════════════════════════════════════════════════════════════════
//  CSV Exporter
// ═══════════════════════════════════════════════════════════════════

const toCSV = (title, data) => {
    const rows = normaliseRows(data);
    const cols = buildColumns(rows);

    // Header
    const lines = [cols.join(',')];

    // Data rows — escape commas and quotes
    for (const row of rows) {
        const vals = cols.map(c => {
            const v = row[c];
            if (v === undefined || v === null) return '';
            const s = String(v);
            return s.includes(',') || s.includes('"') || s.includes('\n')
                ? `"${s.replace(/"/g, '""')}"`
                : s;
        });
        lines.push(vals.join(','));
    }

    return {
        buffer: Buffer.from('﻿' + lines.join('\n'), 'utf-8'), // BOM for Excel UTF-8 compat
        contentType: 'text/csv; charset=utf-8',
        extension: 'csv'
    };
};

// ═══════════════════════════════════════════════════════════════════
//  Excel (.xlsx) Exporter
// ═══════════════════════════════════════════════════════════════════

const toExcel = async (title, data) => {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'TransitOps';
    wb.created = new Date();

    const rows = normaliseRows(data);
    const cols = buildColumns(rows);

    const ws = wb.addWorksheet(title.slice(0, 31)); // Excel sheet name limit

    // Header row
    const headerRow = ws.addRow(cols);
    headerRow.font = { bold: true, size: 11 };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' }  // blue
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };

    // Data rows
    for (const row of rows) {
        const vals = cols.map(c => {
            const v = row[c];
            if (v instanceof Date) return v;
            if (typeof v === 'number') return v;
            return v ?? '';
        });
        ws.addRow(vals);
    }

    // Auto-width
    ws.columns.forEach((col, i) => {
        let max = cols[i].length + 2;
        ws.getColumn(i + 1).eachCell({ includeEmpty: false }, (cell) => {
            const len = String(cell.value || '').length;
            if (len > max) max = len;
        });
        col.width = Math.min(max + 4, 50);
    });

    const buffer = await wb.xlsx.writeBuffer();

    return {
        buffer: Buffer.from(buffer),
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extension: 'xlsx'
    };
};

// ═══════════════════════════════════════════════════════════════════
//  PDF Exporter
// ═══════════════════════════════════════════════════════════════════

const toPDF = async (title, data) => {
    const rows = normaliseRows(data);
    const cols = buildColumns(rows);

    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));

    // Title
    doc.fontSize(14).font('Helvetica-Bold').text(title, { align: 'center' });
    doc.moveDown(0.4);
    doc.fontSize(9).font('Helvetica').text(`Generated: ${new Date().toISOString().slice(0, 10)}`, { align: 'center', color: '#666' });
    doc.moveDown(0.8);

    // Calculate column widths
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidth = Math.max(60, Math.floor(pageWidth / cols.length));

    // Table header
    const startX = doc.page.margins.left;
    let y = doc.y;
    doc.fontSize(8).font('Helvetica-Bold');
    doc.rect(startX, y, pageWidth, 18).fill('#2563EB');
    doc.fillColor('#FFFFFF');
    cols.forEach((col, i) => {
        doc.text(col, startX + i * colWidth + 2, y + 4, { width: colWidth - 4, align: 'left' });
    });
    doc.fillColor('#000000');
    y += 18;

    // Table rows
    doc.font('Helvetica');
    for (let ri = 0; ri < rows.length; ri++) {
        // Check page break
        if (y > doc.page.height - 80) {
            doc.addPage();
            y = doc.page.margins.top;
        }

        // Alternating row fill
        if (ri % 2 === 0) {
            doc.rect(startX, y, pageWidth, 16).fill('#F3F4F6');
            doc.fillColor('#000000');
        }

        cols.forEach((col, i) => {
            const v = rows[ri][col];
            const text = v === null || v === undefined ? '' : String(v);
            doc.fontSize(7).text(text, startX + i * colWidth + 2, y + 3, { width: colWidth - 4, align: 'left' });
        });
        y += 16;
    }

    // Footer
    doc.fontSize(7).fillColor('#999');
    doc.text(`TransitOps — ${title}`, startX, doc.page.height - 30, { align: 'center' });

    doc.end();

    // Wait for PDF to finish writing
    const buffer = await new Promise((resolve) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    return {
        buffer,
        contentType: 'application/pdf',
        extension: 'pdf'
    };
};

// ═══════════════════════════════════════════════════════════════════
//  Public API
// ═══════════════════════════════════════════════════════════════════

/**
 * Export report data to the requested format.
 *
 * @param {'csv'|'excel'|'pdf'} format  — desired output format
 * @param {string} title                — report title (used as filename + heading)
 * @param {object} data                 — the report's `.data` payload
 * @returns {Promise<{ buffer: Buffer, contentType: string, extension: string }>}
 */
const exportReport = async (format, title, data) => {
    switch (format) {
        case 'csv':
            return toCSV(title, data);
        case 'excel':
            return toExcel(title, data);
        case 'pdf':
            return toPDF(title, data);
        default:
            throw new Error(`Unsupported export format: ${format}`);
    }
};

module.exports = { exportReport };
