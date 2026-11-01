import { ParsedSource, ParsedTable } from '../parsers/types.js';

export interface NumericSummary {
  column: string;
  count: number;
  sum: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  formattedSum: string;
  formattedMean: string;
}

export interface CategoryBreakdownItem {
  category: string;
  metric: string;
  value: number;
  shareOfTotalPercent: number;
  count: number;
  formattedValue: string;
}

export interface TimeSeriesTrend {
  dateColumn: string;
  metricColumn: string;
  startPeriod: string;
  endPeriod: string;
  startValue: number;
  endValue: number;
  growthRatePercent: number;
  trend: 'up' | 'down' | 'flat';
  periods: { period: string; value: number }[];
}

export interface ComputedTableStats {
  sourceName: string;
  sheetName?: string;
  totalRows: number;
  numericSummaries: Record<string, NumericSummary>;
  categoryBreakdowns: Record<string, CategoryBreakdownItem[]>;
  timeSeriesTrends: TimeSeriesTrend[];
  topRankings: Record<string, { label: string; value: number; formatted: string }[]>;
  bottomRankings: Record<string, { label: string; value: number; formatted: string }[]>;
}

export interface GlobalComputedStats {
  tables: ComputedTableStats[];
  textSourcesCount: number;
  totalRecordsAnalyzed: number;
  candidateCharts: {
    id: string;
    type: 'bar' | 'line' | 'pie' | 'area';
    title: string;
    source: string;
    data: { label: string; value: number }[];
  }[];
}

function formatNumber(num: number): string {
  if (Math.abs(num) >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(num) >= 1_000) {
    return `$${(num / 1_000).toFixed(1)}k`;
  }
  return Number.isInteger(num) ? num.toLocaleString() : num.toFixed(2);
}

export function computeStatsForTable(
  table: ParsedTable,
  sourceName: string,
  sheetName?: string
): ComputedTableStats {
  const { headers, rows, totalRows } = table;
  if (!rows || rows.length === 0) {
    return {
      sourceName,
      sheetName,
      totalRows: 0,
      numericSummaries: {},
      categoryBreakdowns: {},
      timeSeriesTrends: [],
      topRankings: {},
      bottomRankings: {},
    };
  }

  // Detect column types
  const numericCols: string[] = [];
  const categoricalCols: string[] = [];
  let dateCol: string | null = null;

  for (const header of headers) {
    const sampleVals = rows.map((r) => r[header]).filter((v) => v !== null && v !== undefined && v !== '');
    const numCount = sampleVals.filter((v) => typeof v === 'number' || (!isNaN(Number(v)) && typeof v !== 'boolean')).length;
    
    // Check if column name or values look like a date
    const isDateName = /date|quarter|period|month|year|q[1-4]|time/i.test(header);
    if (isDateName && !dateCol) {
      dateCol = header;
    }

    if (numCount / sampleVals.length > 0.7 && !isDateName) {
      numericCols.push(header);
    } else {
      categoricalCols.push(header);
    }
  }

  // 1. Compute Numeric Summaries
  const numericSummaries: Record<string, NumericSummary> = {};
  for (const col of numericCols) {
    const values = rows
      .map((r) => (typeof r[col] === 'number' ? r[col] : Number(r[col])))
      .filter((v) => !isNaN(v));

    if (values.length === 0) continue;

    values.sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((acc, v) => acc + v, 0);
    const mean = sum / count;
    const min = values[0];
    const max = values[count - 1];
    const median = count % 2 === 0 ? (values[count / 2 - 1] + values[count / 2]) / 2 : values[Math.floor(count / 2)];
    
    // Sample standard deviation
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (count > 1 ? count - 1 : 1);
    const stdDev = Math.sqrt(variance);

    numericSummaries[col] = {
      column: col,
      count,
      sum: Math.round(sum * 100) / 100,
      mean: Math.round(mean * 100) / 100,
      median: Math.round(median * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      stdDev: Math.round(stdDev * 100) / 100,
      formattedSum: formatNumber(sum),
      formattedMean: formatNumber(mean),
    };
  }

  // 2. Compute Categorical Breakdowns & Shares
  const categoryBreakdowns: Record<string, CategoryBreakdownItem[]> = {};
  const primaryMetric = numericCols.find((c) => /revenue|profit|sales|amount|total|spend/i.test(c)) || numericCols[0];

  if (primaryMetric && categoricalCols.length > 0) {
    for (const catCol of categoricalCols) {
      const groups: Record<string, { sum: number; count: number }> = {};
      let totalMetricSum = 0;

      for (const row of rows) {
        const catKey = String(row[catCol] || 'Unspecified').trim();
        const val = typeof row[primaryMetric] === 'number' ? row[primaryMetric] : Number(row[primaryMetric]);
        if (!isNaN(val)) {
          if (!groups[catKey]) groups[catKey] = { sum: 0, count: 0 };
          groups[catKey].sum += val;
          groups[catKey].count += 1;
          totalMetricSum += val;
        }
      }

      if (totalMetricSum > 0) {
        const breakdown = Object.entries(groups).map(([cat, data]) => ({
          category: cat,
          metric: primaryMetric,
          value: Math.round(data.sum * 100) / 100,
          shareOfTotalPercent: Math.round((data.sum / totalMetricSum) * 1000) / 10,
          count: data.count,
          formattedValue: formatNumber(data.sum),
        }));

        breakdown.sort((a, b) => b.value - a.value);
        categoryBreakdowns[`${catCol}_by_${primaryMetric}`] = breakdown;
      }
    }
  }

  // 3. Compute Time Series Trends
  const timeSeriesTrends: TimeSeriesTrend[] = [];
  if (dateCol && primaryMetric) {
    const timeGroups: Record<string, number> = {};
    for (const row of rows) {
      const periodKey = String(row[dateCol]).trim();
      const val = typeof row[primaryMetric] === 'number' ? row[primaryMetric] : Number(row[primaryMetric]);
      if (!isNaN(val)) {
        timeGroups[periodKey] = (timeGroups[periodKey] || 0) + val;
      }
    }

    const periods = Object.entries(timeGroups)
      .map(([period, value]) => ({ period, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => a.period.localeCompare(b.period));

    if (periods.length >= 2) {
      const startValue = periods[0].value;
      const endValue = periods[periods.length - 1].value;
      const growthRate = startValue !== 0 ? ((endValue - startValue) / Math.abs(startValue)) * 100 : 0;
      const trend: 'up' | 'down' | 'flat' = growthRate > 2 ? 'up' : growthRate < -2 ? 'down' : 'flat';

      timeSeriesTrends.push({
        dateColumn: dateCol,
        metricColumn: primaryMetric,
        startPeriod: periods[0].period,
        endPeriod: periods[periods.length - 1].period,
        startValue,
        endValue,
        growthRatePercent: Math.round(growthRate * 10) / 10,
        trend,
        periods,
      });
    }
  }

  // 4. Compute Top & Bottom Rankings
  const topRankings: Record<string, { label: string; value: number; formatted: string }[]> = {};
  const bottomRankings: Record<string, { label: string; value: number; formatted: string }[]> = {};

  if (primaryMetric) {
    const labelCol = categoricalCols[0] || headers[0];
    const sorted = [...rows]
      .map((r) => ({
        label: String(r[labelCol] || 'Row'),
        value: typeof r[primaryMetric] === 'number' ? r[primaryMetric] : Number(r[primaryMetric]),
      }))
      .filter((item) => !isNaN(item.value))
      .sort((a, b) => b.value - a.value);

    topRankings[primaryMetric] = sorted.slice(0, 5).map((item) => ({
      ...item,
      formatted: formatNumber(item.value),
    }));

    bottomRankings[primaryMetric] = sorted.slice(-5).reverse().map((item) => ({
      ...item,
      formatted: formatNumber(item.value),
    }));
  }

  return {
    sourceName,
    sheetName,
    totalRows,
    numericSummaries,
    categoryBreakdowns,
    timeSeriesTrends,
    topRankings,
    bottomRankings,
  };
}

