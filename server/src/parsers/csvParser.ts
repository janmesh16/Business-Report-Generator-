import Papa from 'papaparse';
import { ParsedSource, ParsedTable } from './types.js';

export function parseCsv(
  content: string | Buffer,
  fileName: string,
  sizeBytes: number
): ParsedSource {
  const text = Buffer.isBuffer(content) ? content.toString('utf8') : content;
  
  const parsed = Papa.parse(text, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const headers = parsed.meta.fields || [];
  const rows = (parsed.data as Record<string, any>[]).filter(
    (row) => Object.values(row).some((val) => val !== null && val !== '')
  );

  const table: ParsedTable = {
    headers,
    rows,
    totalRows: rows.length,
  };

  return {
    id: `src_csv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: fileName,
    type: 'csv',
    sizeBytes,
    rowCount: rows.length,
    columns: headers,
    tables: { 'Default': table },
    activeTable: table,
  };
}

