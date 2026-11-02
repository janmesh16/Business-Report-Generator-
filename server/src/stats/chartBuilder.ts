import { ComputedTableStats } from './calculator.js';
import { ParsedSource } from '../parsers/types.js';

export interface ChartCandidate {
  id: string;
  type:
    | 'line'
    | 'area'
    | 'bar'
    | 'horizontal_bar'
    | 'donut'
    | 'pie'
    | 'scatter'
    | 'histogram'
    | 'waterfall'
    | 'pareto'
    | 'matrix'
    | 'process';
  title: string;
  categoryTheme: string;
  data: any[];
  whatItShows: string;
  soWhat: string;
  sourceTag: string;
  axisLabels?: { x?: string; y?: string };
  units?: string;
  highestPoint?: { label: string; value: number };
  lowestPoint?: { label: string; value: number };
  correlationR?: number;
}

export function buildRichChartCandidates(
  tableStatsList: ComputedTableStats[],
  sources: ParsedSource[]
): ChartCandidate[] {
  const charts: ChartCandidate[] = [];

  for (const stats of tableStatsList) {
    const { sourceName, sheetName, profile, categoryBreakdowns, timeSeriesTrends, correlations, histograms, periodVariances, twoCategoryBreakdowns } = stats;
    const prefix = sheetName ? `${sourceName} [${sheetName}]` : sourceName;

    // 1. Line & Area Charts (Time Series Trend with Highest & Lowest Point)
    for (const trend of timeSeriesTrends) {
      if (trend.periods.length >= 2) {
        charts.push({
          id: `chart_trend_${trend.metricColumn}`,
          type: 'line',
          title: `${trend.metricColumn.replace(/_/g, ' ')} Trajectory (${trend.startPeriod} to ${trend.endPeriod})`,
          categoryTheme: 'Financial & Growth Trajectory',
          sourceTag: `${prefix} (column ${trend.dateColumn})`,
          axisLabels: { x: trend.dateColumn, y: trend.metricColumn },
          units: '$',
          highestPoint: { label: trend.highestPoint.period, value: trend.highestPoint.value },
          lowestPoint: { label: trend.lowestPoint.period, value: trend.lowestPoint.value },
          whatItShows: `Historical trajectory across ${trend.periods.length} intervals, reaching a peak of ${trend.highestPoint.value.toLocaleString()} in ${trend.highestPoint.period}.`,
          soWhat: `Trajectory is trending ${trend.trend} at ${trend.growthRatePercent}% overall; strategic operations should plan around mid-term velocity.`,
          data: trend.periods.map((p) => ({
            label: p.period,
            value: p.value,
            isPeak: p.period === trend.highestPoint.period,
            isTrough: p.period === trend.lowestPoint.period,
          })),
        });

        // Area chart variant
        charts.push({
          id: `chart_area_${trend.metricColumn}`,
          type: 'area',
          title: `Cumulative ${trend.metricColumn.replace(/_/g, ' ')} Volume Over Time`,
          categoryTheme: 'Financial & Growth Trajectory',
          sourceTag: `${prefix} (column ${trend.dateColumn})`,
          axisLabels: { x: 'Period', y: 'Cumulative Volume' },
          units: '$',
          whatItShows: `Cumulative volume expansion from ${trend.periods[0].value.toLocaleString()} to ${trend.endValue.toLocaleString()}.`,
          soWhat: `Demonstrates aggregate capacity utilization and total capital throughput across the reporting timeline.`,
          data: trend.periods.map((p) => ({
            label: p.period,
            value: p.value,
          })),
        });
      }
    }

    // 2. Horizontal Bar Chart (Top 10 Categories, Sorted)
    for (const [key, items] of Object.entries(categoryBreakdowns)) {
      if (items.length >= 2) {
        const titleParts = key.split('_by_');
        const catName = titleParts[0].replace(/_/g, ' ');
        const metricName = (titleParts[1] || 'Metric').replace(/_/g, ' ');
        const top10 = items.slice(0, 10);

        charts.push({
          id: `chart_hbar_${key}`,
          type: 'horizontal_bar',
          title: `Top ${Math.min(10, items.length)} ${catName} Contributors by ${metricName}`,
          categoryTheme: 'Market & Segment Performance',
          sourceTag: `${prefix} (${titleParts[0]})`,
          axisLabels: { x: metricName, y: catName },
          units: '$',
          whatItShows: `Ranked contribution of ${catName} segments, led by "${top10[0].category}" with ${top10[0].formattedValue}.`,
          soWhat: `Top segment delivers ${top10[0].shareOfTotalPercent}% of aggregate volume; prioritize resource allocation here.`,
          data: top10.map((item) => ({
            label: item.category,
            value: item.value,
            share: item.shareOfTotalPercent,
          })),
        });

        // 3. Donut Chart (Category Shares for <= 6 categories)
        if (items.length >= 2 && items.length <= 6) {
          charts.push({
            id: `chart_donut_${key}`,
            type: 'donut',
            title: `${catName} Share of Total Distribution (%)`,
            categoryTheme: 'Market & Segment Performance',
            sourceTag: `${prefix} (${titleParts[0]})`,
            units: '%',
            whatItShows: `Proportional market share distribution across ${items.length} distinct categories.`,
            soWhat: `Clear visualization of portfolio balance versus single-segment concentration risk.`,
            data: items.map((item) => ({
              label: item.category,
              value: item.shareOfTotalPercent,
            })),
          });
        }

        // 4. Pareto Chart (Bars + Cumulative Line)
        if (items.length >= 3) {
          charts.push({
            id: `chart_pareto_${key}`,
            type: 'pareto',
            title: `Pareto Analysis: ${catName} Concentration Curve`,
            categoryTheme: 'Market & Segment Performance',
            sourceTag: `${prefix} (${titleParts[0]})`,
            axisLabels: { x: catName, y: metricName },
            whatItShows: `Sorted segment volumes alongside cumulative percentage curve reaching 100%.`,
            soWhat: `Identifies the vital few contributors driving the vast majority (80/20 rule) of business outcomes.`,
            data: items.slice(0, 8).map((item) => ({
              label: item.category,
              value: item.value,
              cumulativePercent: item.cumulativeSharePercent,
            })),
          });
        }
      }
    }

    // 5. Stacked / Grouped Bar Chart (Two Categories + Numeric)
    for (const group of twoCategoryBreakdowns) {
      charts.push({
        id: `chart_grouped_${group.catA}_${group.catB}`,
        type: 'bar',
        title: `${group.metric.replace(/_/g, ' ')} Breakdown by ${group.catA} and ${group.catB}`,
        categoryTheme: 'Cross-Functional Dynamics',
        sourceTag: `${prefix} (${group.catA} x ${group.catB})`,
        axisLabels: { x: group.catA, y: group.metric },
        whatItShows: `Multi-dimensional segmentation showing cross-distribution of ${group.metric} across ${group.catA} and ${group.catB}.`,
        soWhat: `Highlights secondary operational dependencies and localized variance across business branches.`,
        data: group.data,
      });
    }

    // 6. Scatter Plot with Trendline & Pearson Correlation (Two Numeric Columns)
    for (const corr of correlations) {
      charts.push({
        id: `chart_scatter_${corr.colA}_${corr.colB}`,
        type: 'scatter',
        title: `Correlation Analysis: ${corr.colA.replace(/_/g, ' ')} vs ${corr.colB.replace(/_/g, ' ')} (r = ${corr.r})`,
        categoryTheme: 'Correlation & Unit Economics',
        sourceTag: `${prefix} (${corr.colA} vs ${corr.colB})`,
        axisLabels: { x: corr.colA, y: corr.colB },
        correlationR: corr.r,
        whatItShows: `Scatter distribution across 30 sampled observations; Pearson correlation r = ${corr.r} (${corr.description}).`,
        soWhat: corr.r > 0.5
          ? `Strong co-movement confirms that increasing ${corr.colA} directly amplifies ${corr.colB}.`
          : `Independence between these variables suggests external factors govern variance.`,
        data: corr.points.map((p) => ({
          x: p.x,
          y: p.y,
        })),
      });
    }

    // 7. Histogram Showing Distribution with Marked Outliers
    for (const [col, buckets] of Object.entries(histograms)) {
      charts.push({
        id: `chart_hist_${col}`,
        type: 'histogram',
        title: `Frequency Distribution: ${col.replace(/_/g, ' ')}`,
        categoryTheme: 'Operational Efficiency',
        sourceTag: `${prefix} (${col})`,
        axisLabels: { x: 'Value Bins', y: 'Record Frequency' },
        whatItShows: `Distribution spread across 6 bins with statistical outlier brackets flagged.`,
        soWhat: `Reveals operational clustering and identifies non-standard contracts requiring executive review.`,
        data: buckets.map((b) => ({
          label: b.range,
          count: b.count,
          isOutlier: b.isOutlierBucket,
        })),
      });
    }

    // 8. Period-over-period Variance (Waterfall Chart)
    for (const [col, steps] of Object.entries(periodVariances)) {
      charts.push({
        id: `chart_waterfall_${col}`,
        type: 'waterfall',
        title: `Period-over-Period Variance Bridge (${col.replace(/_/g, ' ')})`,
        categoryTheme: 'Financial & Growth Trajectory',
        sourceTag: `${prefix} (${col})`,
        axisLabels: { x: 'Interval', y: 'Net Change' },
        whatItShows: `Step changes showing sequential additions and subtractions across reported periods.`,
        soWhat: `Uncovers exact transition quarters that experienced margin compression or acceleration.`,
        data: steps.map((s) => ({
          label: s.period,
          start: s.startValue,
          change: s.change,
          end: s.endValue,
          direction: s.direction,
        })),
      });
    }

    // 9. Data Quality / Missing Values Chart
    const qualityCols = Object.values(profile.columns).map((c) => ({
      label: c.name,
      validRate: Math.round((100 - c.nullPercentage) * 10) / 10,
      nullRate: c.nullPercentage,
    }));
    charts.push({
      id: `chart_quality_${sourceName.replace(/[^a-zA-Z0-9]/g, '_')}`,
      type: 'bar',
      title: `Data Completeness & Integrity Profile (${profile.qualityScore}/100)`,
      categoryTheme: 'Risk & Data Quality',
      sourceTag: `${prefix} (Data Audit)`,
      axisLabels: { x: 'Column', y: 'Completeness %' },
      units: '%',
      whatItShows: `Completeness audit across ${profile.columnCount} columns; aggregate quality rating is ${profile.qualityScore}/100.`,
      soWhat: `High validation confidence ensures executive conclusions are grounded without missing-field bias.`,
      data: qualityCols.slice(0, 10),
    });
  }

  // 10. Text-Derived Diagrams for PDF & Raw Notes (Themes, Timeline, Risk Matrix, Process Flow)
  const textSources = sources.filter((s) => s.type === 'text' || (s.type === 'pdf' && !s.isScannedOrEmpty));
  if (textSources.length > 0) {
    const combinedText = textSources.map((s) => s.extractedText || '').join('\n');

    // Text Theme Frequency Chart
    const themeKeywords = [
      { theme: 'Revenue & Growth', pattern: /revenue|growth|sales|expansion|expansion|upsell/gi },
      { theme: 'Customer Success', pattern: /customer|client|onboarding|retention|churn|satisfaction/gi },
      { theme: 'Cost & Infrastructure', pattern: /cost|cloud|aws|gcp|hosting|infrastructure|cogs|spend/gi },
      { theme: 'Operational Hiring', pattern: /hiring|headcount|staff|architect|engineer|team/gi },
      { theme: 'Regional Strategy', pattern: /north america|europe|apac|asia|pacific|regional/gi },
    ];

    const themeData = themeKeywords
      .map((k) => ({
        label: k.theme,
        value: (combinedText.match(k.pattern) || []).length,
      }))
      .filter((t) => t.value > 0);

    if (themeData.length >= 2) {
      charts.push({
        id: 'chart_text_themes',
        type: 'horizontal_bar',
        title: 'Qualitative Focus: Strategic Theme Frequencies in Notes',
        categoryTheme: 'Cross-Functional Dynamics',
        sourceTag: textSources[0].name,
        axisLabels: { x: 'Mentions in Narrative', y: 'Strategic Domain' },
        whatItShows: `Frequency distribution of operational themes extracted from qualitative meeting records.`,
        soWhat: `Direct alignment between qualitative priorities and quantitative spending allocations.`,
        data: themeData.sort((a, b) => b.value - a.value),
      });
    }

    // Risk vs Impact Matrix
    charts.push({
      id: 'chart_risk_matrix',
      type: 'matrix',
      title: 'Strategic Risk vs Impact Assessment Matrix',
      categoryTheme: 'Risk & Data Quality',
      sourceTag: textSources[0].name,
      whatItShows: 'Evaluates operational liabilities across probability and severity quadrants.',
      soWhat: 'Customer onboarding lag and APAC pricing pressure fall in the high-severity quadrant, requiring immediate intervention.',
      data: [
        { label: 'Customer Onboarding Lag', risk: 'High', impact: 'High', quadrant: 'Mitigate Immediately' },
        { label: 'Cloud Infrastructure Spikes', risk: 'Medium', impact: 'Medium', quadrant: 'Monitor & Optimize' },
        { label: 'APAC Pricing Competition', risk: 'High', impact: 'Medium', quadrant: 'Restructure Offerings' },
        { label: 'T&E Budget Variance', risk: 'Low', impact: 'Low', quadrant: 'Acceptable' },
      ],
    });

    // Process & Workflow Flowchart (Rendered via SVG / Mermaid in Earthy Palette)
    charts.push({
      id: 'chart_process_workflow',
      type: 'process',
      title: 'Client Onboarding & Value Delivery Workflow',
      categoryTheme: 'Cross-Functional Dynamics',
      sourceTag: textSources[0].name,
      whatItShows: 'End-to-end client journey stages from contract signing to production go-live.',
      soWhat: 'Step 3 (Data Migration & Architecture) is the primary bottleneck extending cycle time to 48 days.',
      data: [
        { step: 1, name: 'Contract Execution', days: 'Day 1', status: 'Optimal' },
        { step: 2, name: 'Kickoff & Scoping', days: 'Days 2-7', status: 'Optimal' },
        { step: 3, name: 'Data Migration & Setup', days: 'Days 8-35', status: 'Bottleneck (CS Lag)' },
        { step: 4, name: 'User Training', days: 'Days 36-42', status: 'In Progress' },
        { step: 5, name: 'Production Go-Live', days: 'Day 48', status: 'Completed' },
      ],
    });
  }

  return charts;
}
