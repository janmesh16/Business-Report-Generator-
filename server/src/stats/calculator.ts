import { ParsedTable } from '../parsers/types.js';
import { profileTable, TableProfile } from './profiler.js';

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
  sparkline: number[];
}

export interface CategoryBreakdownItem {
  category: string;
  metric: string;
  value: number;
  shareOfTotalPercent: number;
  cumulativeSharePercent: number;
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
  highestPoint: { period: string; value: number };
  lowestPoint: { period: string; value: number };
  periods: { period: string; value: number }[];
}

export interface CorrelationPair {
  colA: string;
  colB: string;
  r: number; // Pearson correlation coefficient (-1 to 1)
  description: string;
  points: { x: number; y: number; label?: string }[];
}

export interface HistogramBucket {
  range: string;
  min: number;
  max: number;
  count: number;
  isOutlierBucket: boolean;
}

export interface VarianceStep {
  period: string;
  startValue: number;
  change: number;
  endValue: number;
  direction: 'increase' | 'decrease' | 'neutral';
}

export interface ComputedTableStats {
  sourceName: string;
  sheetName?: string;
  totalRows: number;
  profile: TableProfile;
  numericSummaries: Record<string, NumericSummary>;
  categoryBreakdowns: Record<string, CategoryBreakdownItem[]>;
  twoCategoryBreakdowns: {
    catA: string;
    catB: string;
    metric: string;
    data: Record<string, any>[];
  }[];
  timeSeriesTrends: TimeSeriesTrend[];
  correlations: CorrelationPair[];
  histograms: Record<string, HistogramBucket[]>;
  periodVariances: Record<string, VarianceStep[]>;
  topRankings: Record<string, { label: string; value: number; formatted: string }[]>;
  bottomRankings: Record<string, { label: string; value: number; formatted: string }[]>;
}

export interface GlobalComputedStats {
  tables: ComputedTableStats[];
  textSourcesCount: number;
  totalRecordsAnalyzed: number;
  overallDateRange: string | null;
  overallQualityScore: number;
  candidateCharts: any[];
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

export function calculatePearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  return denX > 0 && denY > 0 ? num / Math.sqrt(denX * denY) : 0;
}

export function calculateHistogram(
  vals: number[],
  bucketCount = 5
): { bins: { range: string; min: number; max: number; count: number }[]; outliers: number[] } {
  const clean = vals.filter((v) => !isNaN(v)).sort((a, b) => a - b);
  if (clean.length === 0) return { bins: [], outliers: [] };
  const min = clean[0];
  const max = clean[clean.length - 1];
  const step = bucketCount > 0 ? (max - min) / bucketCount : 1;

  // Detect IQR outliers
  const q1 = clean[Math.floor(clean.length * 0.25)];
  const q3 = clean[Math.floor(clean.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  const outliers = clean.filter((v) => v < lowerBound || v > upperBound);

  const bins: { range: string; min: number; max: number; count: number }[] = [];
  for (let b = 0; b < bucketCount; b++) {
    const bMin = min + b * step;
    const bMax = min + (b + 1) * step;
    const count = clean.filter((v) => (b === bucketCount - 1 ? v >= bMin && v <= bMax : v >= bMin && v < bMax)).length;
    bins.push({
      range: `${bMin.toFixed(1)} - ${bMax.toFixed(1)}`,
      min: bMin,
      max: bMax,
      count,
    });
  }
  return { bins, outliers };
}

export function calculateParetoDistribution(
  items: { name: string; value: number }[]
): { name: string; value: number; cumulativeShare: number }[] {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return sorted.map((s) => ({ ...s, cumulativeShare: 0 }));

  let cumSum = 0;
  return sorted.map((item) => {
    cumSum += item.value;
    return {
      name: item.name,
      value: item.value,
      cumulativeShare: Math.round((cumSum / total) * 100),
    };
  });
}

export function computeStatsForTable(
  table: ParsedTable,
  sourceName: string,
  sheetName?: string
): ComputedTableStats {
  const profile = profileTable(table, sourceName, sheetName);
  const { headers, rows, totalRows } = table;

  if (!rows || rows.length === 0) {
    return {
      sourceName,
      sheetName,
      totalRows: 0,
      profile,
      numericSummaries: {},
      categoryBreakdowns: {},
      twoCategoryBreakdowns: [],
      timeSeriesTrends: [],
      correlations: [],
      histograms: {},
      periodVariances: {},
      topRankings: {},
      bottomRankings: {},
    };
  }

  const numericCols = Object.keys(profile.columns).filter((c) => profile.columns[c].type === 'numeric');
  const categoricalCols = Object.keys(profile.columns).filter((c) => profile.columns[c].type === 'category');
  const dateCols = Object.keys(profile.columns).filter((c) => profile.columns[c].type === 'date');
  const dateCol = dateCols[0] || null;

  // 1. Compute Numeric Summaries + Sparklines
  const numericSummaries: Record<string, NumericSummary> = {};
  for (const col of numericCols) {
    const values = rows
      .map((r) => (typeof r[col] === 'number' ? r[col] : Number(String(r[col]).replace(/[$,%]/g, ''))))
      .filter((v) => !isNaN(v));

    if (values.length === 0) continue;

    const count = values.length;
    const sum = values.reduce((acc, v) => acc + v, 0);
    const mean = sum / count;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(count / 2)];

    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (count > 1 ? count - 1 : 1);
    const stdDev = Math.sqrt(variance);

    // Build 6-8 sample points for sparkline
    const sparklineSize = Math.min(8, values.length);
    const step = Math.max(1, Math.floor(values.length / sparklineSize));
    const sparkline: number[] = [];
    for (let i = 0; i < values.length; i += step) {
      sparkline.push(Math.round(values[i] * 100) / 100);
      if (sparkline.length >= sparklineSize) break;
    }

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
      sparkline,
    };
  }

  // 2. Primary Metric
  const primaryMetric = numericCols.find((c) => /revenue|profit|sales|amount|total|spend/i.test(c)) || numericCols[0];

  // 3. Category Breakdowns & Pareto Cumulative Shares
  const categoryBreakdowns: Record<string, CategoryBreakdownItem[]> = {};
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
        const sortedItems = Object.entries(groups)
          .map(([cat, data]) => ({
            category: cat,
            metric: primaryMetric,
            value: Math.round(data.sum * 100) / 100,
            shareOfTotalPercent: Math.round((data.sum / totalMetricSum) * 1000) / 10,
            cumulativeSharePercent: 0,
            count: data.count,
            formattedValue: formatNumber(data.sum),
          }))
          .sort((a, b) => b.value - a.value);

        let runningSum = 0;
        for (const item of sortedItems) {
          runningSum += item.value;
          item.cumulativeSharePercent = Math.min(100, Math.round((runningSum / totalMetricSum) * 1000) / 10);
        }

        categoryBreakdowns[`${catCol}_by_${primaryMetric}`] = sortedItems;
      }
    }
  }

  // 4. Two Categories + Numeric (Stacked / Grouped Bar)
  const twoCategoryBreakdowns: any[] = [];
  if (categoricalCols.length >= 2 && primaryMetric) {
    const catA = categoricalCols[0];
    const catB = categoricalCols[1];
    const topA = (categoryBreakdowns[`${catA}_by_${primaryMetric}`] || []).slice(0, 5).map((x) => x.category);
    const topB = (categoryBreakdowns[`${catB}_by_${primaryMetric}`] || []).slice(0, 4).map((x) => x.category);

    if (topA.length >= 2 && topB.length >= 2) {
      const matrix: Record<string, Record<string, number>> = {};
      for (const a of topA) {
        matrix[a] = {};
        for (const b of topB) matrix[a][b] = 0;
      }

      for (const row of rows) {
        const aVal = String(row[catA] || '').trim();
        const bVal = String(row[catB] || '').trim();
        const num = typeof row[primaryMetric] === 'number' ? row[primaryMetric] : Number(row[primaryMetric]);
        if (matrix[aVal] && matrix[aVal][bVal] !== undefined && !isNaN(num)) {
          matrix[aVal][bVal] += num;
        }
      }

      const groupedData = Object.entries(matrix).map(([aName, subObj]) => ({
        label: aName,
        ...subObj,
      }));

      twoCategoryBreakdowns.push({
        catA,
        catB,
        metric: primaryMetric,
        data: groupedData,
      });
    }
  }

  // 5. Time Series Trends with marked Highest & Lowest points
  const timeSeriesTrends: TimeSeriesTrend[] = [];
  if (dateCol && primaryMetric) {
    const timeGroups: Record<string, number> = {};
    for (const row of rows) {
      const dVal = String(row[dateCol] || '').trim();
      const num = typeof row[primaryMetric] === 'number' ? row[primaryMetric] : Number(row[primaryMetric]);
      if (!isNaN(num)) {
        // Group by month if dates are YYYY-MM-DD
        const key = dVal.length >= 7 ? dVal.slice(0, 7) : dVal;
        timeGroups[key] = (timeGroups[key] || 0) + num;
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

      let highest = periods[0];
      let lowest = periods[0];
      for (const p of periods) {
        if (p.value > highest.value) highest = p;
        if (p.value < lowest.value) lowest = p;
      }

      timeSeriesTrends.push({
        dateColumn: dateCol,
        metricColumn: primaryMetric,
        startPeriod: periods[0].period,
        endPeriod: periods[periods.length - 1].period,
        startValue,
        endValue,
        growthRatePercent: Math.round(growthRate * 10) / 10,
        trend,
        highestPoint: highest,
        lowestPoint: lowest,
        periods,
      });
    }
  }

  // 6. Period-over-period Variance (Waterfall)
  const periodVariances: Record<string, VarianceStep[]> = {};
  if (timeSeriesTrends.length > 0) {
    const primaryTrend = timeSeriesTrends[0];
    const steps: VarianceStep[] = [];
    for (let i = 1; i < primaryTrend.periods.length; i++) {
      const prev = primaryTrend.periods[i - 1].value;
      const curr = primaryTrend.periods[i].value;
      const diff = Math.round((curr - prev) * 100) / 100;
      steps.push({
        period: primaryTrend.periods[i].period,
        startValue: prev,
        change: diff,
        endValue: curr,
        direction: diff > 0 ? 'increase' : diff < 0 ? 'decrease' : 'neutral',
      });
    }
    if (steps.length > 0) {
      periodVariances[primaryTrend.metricColumn] = steps;
    }
  }

  // 7. Correlations (Two Numeric Columns)
  const correlations: CorrelationPair[] = [];
  if (numericCols.length >= 2) {
    for (let i = 0; i < numericCols.length; i++) {
      for (let j = i + 1; j < numericCols.length; j++) {
        const colA = numericCols[i];
        const colB = numericCols[j];
        const pairs: { x: number; y: number }[] = [];

        for (const row of rows) {
          const x = typeof row[colA] === 'number' ? row[colA] : Number(row[colA]);
          const y = typeof row[colB] === 'number' ? row[colB] : Number(row[colB]);
          if (!isNaN(x) && !isNaN(y)) {
            pairs.push({ x, y });
          }
        }

        if (pairs.length >= 10) {
          const n = pairs.length;
          const meanX = pairs.reduce((acc, p) => acc + p.x, 0) / n;
          const meanY = pairs.reduce((acc, p) => acc + p.y, 0) / n;

          let numerator = 0;
          let denomX = 0;
          let denomY = 0;

          for (const p of pairs) {
            const dx = p.x - meanX;
            const dy = p.y - meanY;
            numerator += dx * dy;
            denomX += dx * dx;
            denomY += dy * dy;
          }

          const r = denomX > 0 && denomY > 0 ? numerator / Math.sqrt(denomX * denomY) : 0;
          const roundedR = Math.round(r * 100) / 100;

          let desc = 'No significant correlation';
          if (roundedR > 0.7) desc = 'Strong positive correlation';
          else if (roundedR > 0.3) desc = 'Moderate positive correlation';
          else if (roundedR < -0.7) desc = 'Strong negative correlation';
          else if (roundedR < -0.3) desc = 'Moderate negative correlation';

          // Sample 30 points for scatter chart
          const sampleStep = Math.max(1, Math.floor(pairs.length / 30));
          const sampledPoints = pairs.filter((_, idx) => idx % sampleStep === 0).slice(0, 30);

          correlations.push({
            colA,
            colB,
            r: roundedR,
            description: desc,
            points: sampledPoints,
          });
        }
      }
    }
  }

  // 8. Histogram Distribution for Numeric Columns
  const histograms: Record<string, HistogramBucket[]> = {};
  for (const col of numericCols.slice(0, 2)) {
    const vals = rows
      .map((r) => (typeof r[col] === 'number' ? r[col] : Number(r[col])))
      .filter((v) => !isNaN(v));

    if (vals.length >= 15) {
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const bucketCount = 6;
      const step = (max - min) / bucketCount;

      if (step > 0) {
        const buckets: HistogramBucket[] = [];
        for (let b = 0; b < bucketCount; b++) {
          const bMin = Math.round((min + b * step) * 10) / 10;
          const bMax = Math.round((min + (b + 1) * step) * 10) / 10;
          const count = vals.filter((v) => (b === bucketCount - 1 ? v >= bMin && v <= bMax : v >= bMin && v < bMax)).length;
          const isOutlierBucket = b === 0 || b === bucketCount - 1;

          buckets.push({
            range: `${formatNumber(bMin)} - ${formatNumber(bMax)}`,
            min: bMin,
            max: bMax,
            count,
            isOutlierBucket: count > 0 && isOutlierBucket && count < vals.length * 0.05,
          });
        }
        histograms[col] = buckets;
      }
    }
  }

  // 9. Top & Bottom Rankings
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
    profile,
    numericSummaries,
    categoryBreakdowns,
    twoCategoryBreakdowns,
    timeSeriesTrends,
    correlations,
    histograms,
    periodVariances,
    topRankings,
    bottomRankings,
  };
}
