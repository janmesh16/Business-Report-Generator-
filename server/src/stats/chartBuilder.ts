import { ComputedTableStats } from './calculator.js';
import { ChartData } from '../llm/types.js';

export interface PrecomputedChart extends ChartData {
  id: string;
  source: string;
}

export function buildCandidateCharts(tableStatsList: ComputedTableStats[]): PrecomputedChart[] {
  const charts: PrecomputedChart[] = [];

  for (const tableStats of tableStatsList) {
    const { sourceName, sheetName, categoryBreakdowns, timeSeriesTrends, numericSummaries } = tableStats;
    const prefix = sheetName ? `${sourceName} [${sheetName}]` : sourceName;

    // 1. Time Series Charts (Line / Area)
    for (const trend of timeSeriesTrends) {
      if (trend.periods.length >= 2) {
        charts.push({
          id: `chart_trend_${trend.metricColumn}_${charts.length + 1}`,
          source: prefix,
          type: 'line',
          title: `${trend.metricColumn.replace(/_/g, ' ')} Trend (${trend.startPeriod} to ${trend.endPeriod})`,
          data: trend.periods.map((p) => ({
            label: p.period,
            value: p.value,
          })),
        });

        // Area chart variant for volume metrics
        if (/revenue|sales|spend|profit|units/i.test(trend.metricColumn)) {
          charts.push({
            id: `chart_area_${trend.metricColumn}_${charts.length + 1}`,
            source: prefix,
            type: 'area',
            title: `Cumulative ${trend.metricColumn.replace(/_/g, ' ')} Volume`,
            data: trend.periods.map((p) => ({
              label: p.period,
              value: p.value,
            })),
          });
        }
      }
    }

    // 2. Category Breakdowns (Bar Charts)
    for (const [key, items] of Object.entries(categoryBreakdowns)) {
      if (items.length > 0) {
        const titleParts = key.split('_by_');
        const catName = titleParts[0].replace(/_/g, ' ');
        const metricName = (titleParts[1] || 'Metric').replace(/_/g, ' ');

        // Top 8 categories for clean bar chart
        const topItems = items.slice(0, 8);
        charts.push({
          id: `chart_bar_${key}_${charts.length + 1}`,
          source: prefix,
          type: 'bar',
          title: `${metricName} by ${catName}`,
          data: topItems.map((item) => ({
            label: item.category,
            value: item.value,
          })),
        });

        // Pie chart for share of total
        if (items.length >= 2 && items.length <= 8) {
          charts.push({
            id: `chart_pie_${key}_${charts.length + 1}`,
            source: prefix,
            type: 'pie',
            title: `${catName} Share of Total (%)`,
            data: topItems.map((item) => ({
              label: item.category,
              value: item.shareOfTotalPercent,
            })),
          });
        }
      }
    }

    // 3. Fallback: If no categorical breakdowns found, generate metric comparison bar
    if (Object.keys(categoryBreakdowns).length === 0 && Object.keys(numericSummaries).length > 1) {
      const metricEntries = Object.values(numericSummaries).slice(0, 6);
      charts.push({
        id: `chart_summary_metrics_${charts.length + 1}`,
        source: prefix,
        type: 'bar',
        title: `Key Totals Overview`,
        data: metricEntries.map((m) => ({
          label: m.column.replace(/_/g, ' '),
          value: m.sum,
        })),
      });
    }
  }

  return charts;
}

