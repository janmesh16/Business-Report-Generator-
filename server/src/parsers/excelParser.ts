import XLSX from 'xlsx';
import { ParsedSource, ParsedTable } from './types.js';

export function parseExcel(
  buffer: Buffer,
  fileName: string,
  sizeBytes: number,
  selectedSheet?: string
): ParsedSource {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheetNames = workbook.SheetNames;
  
  if (sheetNames.length === 0) {
    throw new Error(`Excel file ${fileName} contains no sheets.`);
  }

  const tables: Record<string, ParsedTable> = {};

  for (const sheetName of sheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    // Convert to JSON with headers
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
      defval: null,
      raw: false,
    });

    if (rawRows.length > 0) {
      const headers = Object.keys(rawRows[0] || {});
      // Clean numeric fields
      const rows = rawRows.map((row) => {
        const cleaned: Record<string, any> = {};
        for (const [k, v] of Object.entries(row)) {
          const trimmedKey = k.trim();
          if (typeof v === 'string') {
            const num = Number(v.replace(/[$,]/g, ''));
            if (!isNaN(num) && v.trim() !== '') {
              cleaned[trimmedKey] = num;
            } else {
              cleaned[trimmedKey] = v;
            }
          } else {
            cleaned[trimmedKey] = v;
          }
        }
        return cleaned;
      });

      tables[sheetName] = {
        headers,
        rows,
        totalRows: rows.length,
      };
    } else {
      tables[sheetName] = {
        headers: [],
        rows: [],
        totalRows: 0,
      };
    }
  }

  const activeSheetName = selectedSheet && tables[selectedSheet] ? selectedSheet : sheetNames[0];
  const activeTable = tables[activeSheetName];

  return {
    id: `src_excel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: fileName,
    type: 'excel',
    sizeBytes,
    rowCount: activeTable?.totalRows || 0,
    columns: activeTable?.headers || [],
    tables,
    activeTable,
    notes: `Sheets found: ${sheetNames.join(', ')}. Active sheet: ${activeSheetName}.`,
  };
}

