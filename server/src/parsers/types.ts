export interface ParsedTable {
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
}

export interface ParsedSource {
  id: string;
  name: string;
  type: 'csv' | 'excel' | 'pdf' | 'text';
  sizeBytes: number;
  rowCount?: number;
  lineCount?: number;
  columns?: string[];
  tables?: Record<string, ParsedTable>; // sheet name -> table data
  activeTable?: ParsedTable;
  extractedText?: string;
  isScannedOrEmpty?: boolean;
  notes?: string;
}

export interface IngestionResult {
  sources: ParsedSource[];
  combinedSummary: string;
}

