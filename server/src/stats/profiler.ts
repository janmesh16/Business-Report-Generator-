import { ParsedTable } from '../parsers/types.js';

export type ColumnType = 'numeric' | 'category' | 'date' | 'id' | 'text';

export interface ColumnProfile {
  name: string;
  type: ColumnType;
  nullCount: number;
  nullPercentage: number;
  uniqueCount: number;
  sampleValues: any[];
  min?: number | string;
  max?: number | string;
  mean?: number;
  median?: number;
  outlierCount?: number;
  outliers?: number[];
}

export interface TableProfile {
  sourceName: string;
  sheetName?: string;
  rowCount: number;
  columnCount: number;
  duplicateRows: number;
  dateRange: string | null;
  columns: Record<string, ColumnProfile>;
  qualityScore: number; // 0 to 100
  issues: string[];
}

export function profileTable(
  table: ParsedTable,
  sourceName: string,
  sheetName?: string
): TableProfile {
  const { headers, rows, totalRows } = table;
  const issues: string[] = [];

  if (!rows || rows.length === 0) {
    return {
      sourceName,
      sheetName,
      rowCount: 0,
      columnCount: headers.length,
      duplicateRows: 0,
      dateRange: null,
      columns: {},
      qualityScore: 0,
      issues: ['Dataset contains 0 data rows.'],
    };
  }

  // 1. Check duplicate rows
  const seenRows = new Set<string>();
  let duplicateRows = 0;
  for (const row of rows) {
    const serialized = JSON.stringify(row);
    if (seenRows.has(serialized)) {
      duplicateRows++;
    } else {
      seenRows.add(serialized);
    }
  }
  if (duplicateRows > 0) {
    issues.push(`Detected ${duplicateRows} duplicate row(s) in dataset.`);
  }

  // 2. Profile each column
  const columns: Record<string, ColumnProfile> = {};
  let minDate: string | null = null;
  let maxDate: string | null = null;
  let totalCells = totalRows * headers.length;
  let totalNullCells = 0;

  for (const header of headers) {
    const rawValues = rows.map((r) => r[header]);
    const validValues = rawValues.filter((v) => v !== null && v !== undefined && v !== '');
    const nullCount = totalRows - validValues.length;
    totalNullCells += nullCount;
    const nullPercentage = Math.round((nullCount / totalRows) * 1000) / 10;

    const uniqueSet = new Set(validValues);
    const uniqueCount = uniqueSet.size;

    // Detect Type
    let type: ColumnType = 'text';

    // Date detection
    const isDateHeader = /date|quarter|month|year|period|day|time/i.test(header);
    const sampleDates = validValues.filter((v) => {
      if (typeof v === 'string') {
        const d = Date.parse(v);
        return !isNaN(d) && v.length >= 7 && (v.includes('-') || v.includes('/'));
      }
      return false;
    });

    // Numeric detection
    const sampleNumbers = validValues.filter((v) => {
      if (typeof v === 'number') return !isNaN(v);
      if (typeof v === 'string') {
        const cleaned = v.replace(/[$,%]/g, '').trim();
        return cleaned !== '' && !isNaN(Number(cleaned));
      }
      return false;
    });

    if (sampleDates.length / Math.max(1, validValues.length) > 0.6 || (isDateHeader && sampleDates.length > 0)) {
      type = 'date';
      const sortedDates = validValues
        .map((v) => String(v).trim())
        .sort((a, b) => a.localeCompare(b));
      if (sortedDates.length > 0) {
        if (!minDate || sortedDates[0] < minDate) minDate = sortedDates[0];
        if (!maxDate || sortedDates[sortedDates.length - 1] > maxDate) maxDate = sortedDates[sortedDates.length - 1];
      }
    } else if (sampleNumbers.length / Math.max(1, validValues.length) > 0.7) {
      type = 'numeric';
    } else if (uniqueCount <= Math.max(15, totalRows * 0.2)) {
      type = 'category';
    } else if (/id|uuid|key|code|sku/i.test(header)) {
      type = 'id';
    }

    const profile: ColumnProfile = {
      name: header,
      type,
      nullCount,
      nullPercentage,
      uniqueCount,
      sampleValues: Array.from(uniqueSet).slice(0, 5),
    };

    // Calculate numeric statistics and outliers
    if (type === 'numeric') {
      const nums = validValues
        .map((v) => (typeof v === 'number' ? v : Number(String(v).replace(/[$,%]/g, '').trim())))
        .filter((n) => !isNaN(n))
        .sort((a, b) => a - b);

      if (nums.length > 0) {
        const sum = nums.reduce((a, b) => a + b, 0);
        profile.min = nums[0];
        profile.max = nums[nums.length - 1];
        profile.mean = Math.round((sum / nums.length) * 100) / 100;
        profile.median = nums[Math.floor(nums.length / 2)];

        // Detect Outliers using IQR (Interquartile Range)
        if (nums.length >= 8) {
          const q1 = nums[Math.floor(nums.length * 0.25)];
          const q3 = nums[Math.floor(nums.length * 0.75)];
          const iqr = q3 - q1;
          const lowerBound = q1 - 1.5 * iqr;
          const upperBound = q3 + 1.5 * iqr;
          const outliers = nums.filter((n) => n < lowerBound || n > upperBound);
          profile.outlierCount = outliers.length;
          profile.outliers = outliers.slice(0, 5);
          if (outliers.length > 0) {
            issues.push(`Column "${header}" has ${outliers.length} statistical outlier(s) beyond 1.5x IQR.`);
          }
        }
      }
    }

    if (nullPercentage > 15) {
      issues.push(`Column "${header}" has ${nullPercentage}% missing values.`);
    }

    columns[header] = profile;
  }

  // Calculate Data Quality Score (0 to 100)
  let qualityScore = 100;

  // Penalize for missing cells
  const overallNullRate = totalCells > 0 ? (totalNullCells / totalCells) * 100 : 0;
  qualityScore -= Math.min(30, overallNullRate * 1.5);

  // Penalize for duplicate rows
  const dupRate = (duplicateRows / totalRows) * 100;
  qualityScore -= Math.min(20, dupRate * 2);

  // Penalize for tiny sample size
  if (totalRows < 10) qualityScore -= 20;
  else if (totalRows < 50) qualityScore -= 10;

  qualityScore = Math.max(10, Math.min(100, Math.round(qualityScore)));

  const dateRange = minDate && maxDate ? `${minDate} to ${maxDate}` : null;

  return {
    sourceName,
    sheetName,
    rowCount: totalRows,
    columnCount: headers.length,
    duplicateRows,
    dateRange,
    columns,
    qualityScore,
    issues,
  };
}
