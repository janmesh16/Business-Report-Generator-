import { LLMProvider, ReportJson, Kpi, Finding, Recommendation, ChartNote } from './types.js';
import { ParsedSource } from '../parsers/types.js';
import { GlobalComputedStats } from '../stats/calculator.js';
import { evaluateDataQuality } from '../stats/dataQuality.js';

export class MockAdapter implements LLMProvider {
  name = 'MockAdapter (Deterministic Local)';

  constructor(
    private sources: ParsedSource[] = [],
    private stats?: GlobalComputedStats,
    private metadata?: { title?: string; businessName?: string; decisionContext?: string }
  ) {}

  async generateReport(_prompt: string, _systemInstruction: string): Promise<ReportJson> {
    const business = this.metadata?.businessName || 'Business Organization';
    const decision = this.metadata?.decisionContext || 'strategic growth and capital allocation';
    const reportTitle = this.metadata?.title || `Executive Performance & Strategic Analysis for ${business}`;

    const kpis: Kpi[] = [];
    const findings: Finding[] = [];
    const recommendations: Recommendation[] = [];
    const chartNotes: ChartNote[] = [];
    const risksAndCaveats: string[] = [];

    const totalRows = this.stats?.totalRecordsAnalyzed || 0;
    const sourceNames = this.sources.map((s) => s.name);
    const dateRange = this.stats?.overallDateRange || (this.stats?.tables[0]?.profile.dateRange) || 'FY2025 YTD';
    const qualityScore = this.stats?.overallQualityScore || (this.stats?.tables[0]?.profile.qualityScore) || 92;

    // 1. Process Tabular Sources & KPIs
    if (this.stats && this.stats.tables.length > 0) {
      const primaryTable = this.stats.tables[0];
      const sourceName = primaryTable.sourceName;
      const numericSummaries = Object.values(primaryTable.numericSummaries);

      // Extract headline metrics for KPIs
      for (const num of numericSummaries.slice(0, 4)) {
        const trendInfo = primaryTable.timeSeriesTrends.find((t) => t.metricColumn === num.column);
        kpis.push({
          label: `Total ${num.column.replace(/_/g, ' ')}`,
          value: num.formattedSum,
          change: trendInfo ? `${trendInfo.growthRatePercent > 0 ? '+' : ''}${trendInfo.growthRatePercent}%` : null,
          trend: trendInfo ? trendInfo.trend : 'flat',
          sourceRef: `${sourceName} (sum of ${num.count} records)`,
          sparkline: num.sparkline,
        });
      }

      // Finding 1: Core Performance & Growth Trajectory
      if (primaryTable.timeSeriesTrends.length > 0) {
        const trend = primaryTable.timeSeriesTrends[0];
        const trendChartId = `chart_trend_${trend.metricColumn}`;
        findings.push({
          id: 'find_01_trajectory',
          headline: `${trend.metricColumn.replace(/_/g, ' ')} displayed a ${trend.growthRatePercent}% trajectory across ${trend.periods.length} reporting intervals`,
          detail: `Analysis across reported intervals demonstrates that ${trend.metricColumn.replace(/_/g, ' ')} shifted from ${trend.periods[0].value.toLocaleString()} in ${trend.startPeriod} to a peak of ${trend.highestPoint.value.toLocaleString()} in ${trend.highestPoint.period}, closing at ${trend.endValue.toLocaleString()} in ${trend.endPeriod}. This represents an annualized trajectory of ${trend.growthRatePercent}%.`,
          impact: trend.trend === 'up' ? 'high' : 'medium',
          chartIds: [trendChartId],
          evidence: [
            {
              source: sourceName,
              location: `${trend.dateColumn} rows 1 to ${trend.periods.length}`,
              quote: `${trend.startPeriod} baseline: ${trend.periods[0].value.toLocaleString()} -> ${trend.highestPoint.period} peak: ${trend.highestPoint.value.toLocaleString()}`,
            },
          ],
        });

        chartNotes.push({
          chartId: trendChartId,
          whatItShows: `Historical time-series showing sequential ${trend.metricColumn.replace(/_/g, ' ')} with marked peak and trough boundaries.`,
          soWhat: `Operational capacity must align with observed peak demand periods to prevent delivery bottlenecks.`,
        });
      }

      // Finding 2: Category Concentration / Distribution
      const categoryEntries = Object.entries(primaryTable.categoryBreakdowns);
      if (categoryEntries.length > 0) {
        const [catKey, breakdown] = categoryEntries[0];
        const topItem = breakdown[0];
        const hbarChartId = `chart_hbar_${catKey}`;
        const donutChartId = `chart_donut_${catKey}`;

        findings.push({
          id: 'find_02_concentration',
          headline: `Top segment "${topItem.category}" delivers ${topItem.shareOfTotalPercent}% of aggregate ${topItem.metric.replace(/_/g, ' ')}`,
          detail: `Categorical segmentation indicates significant concentration: "${topItem.category}" accounted for ${topItem.formattedValue} across ${topItem.count} transactions. The remaining segments represent under ${Math.max(1, 100 - topItem.shareOfTotalPercent).toFixed(1)}% combined volume.`,
          impact: topItem.shareOfTotalPercent > 35 ? 'high' : 'medium',
          chartIds: [hbarChartId, donutChartId],
          evidence: [
            {
              source: sourceName,
              location: `Breakdown for ${catKey.replace(/_/g, ' ')}`,
              quote: `Top category: ${topItem.category} with ${topItem.formattedValue} (${topItem.shareOfTotalPercent}% share of total)`,
            },
          ],
        });

        chartNotes.push(
          {
            chartId: hbarChartId,
            whatItShows: `Ranked contribution of key categories sorted by aggregate volume.`,
            soWhat: `Prioritizing enablement for top-tier segments yields disproportionate revenue gains.`,
          },
          {
            chartId: donutChartId,
            whatItShows: `Proportional market share distribution across active product lines.`,
            soWhat: `Highlights reliance on leading categories and surfaces opportunities to diversify smaller lines.`,
          }
        );
      }

      // Finding 3: Correlations & Outlier Dispersion
      if (primaryTable.correlations.length > 0) {
        const corr = primaryTable.correlations[0];
        const scatterId = `chart_scatter_${corr.colA}_${corr.colB}`;
        findings.push({
          id: 'find_03_correlation',
          headline: `Empirical correlation of r = ${corr.r} observed between ${corr.colA.replace(/_/g, ' ')} and ${corr.colB.replace(/_/g, ' ')}`,
          detail: `Statistical regression confirms a ${corr.description.toLowerCase()} (r = ${corr.r}). Observations demonstrate that transaction volume scaling directly mirrors operational unit economics.`,
          impact: Math.abs(corr.r) > 0.6 ? 'high' : 'medium',
          chartIds: [scatterId],
          evidence: [
            {
              source: sourceName,
              location: `Columns ${corr.colA} vs ${corr.colB}`,
              quote: `Pearson correlation coefficient r = ${corr.r} across sample observations`,
            },
          ],
        });

        chartNotes.push({
          chartId: scatterId,
          whatItShows: `Scatter plot with linear regression trendline testing co-dependence of variables.`,
          soWhat: `Validates that scaling volume positively impacts top-line margins without diminishing returns.`,
        });
      }
    }

    // 2. Process Qualitative Sources (Notes & PDFs)
    const textSources = this.sources.filter((s) => s.type === 'text' || (s.type === 'pdf' && !s.isScannedOrEmpty));
    if (textSources.length > 0) {
      const textSrc = textSources[0];
      const lines = (textSrc.extractedText || '').split('\n').filter((l) => l.trim().length > 10);
      const sampleQuote = lines.find((l) => /priority|decision|challenge|cost|bottleneck|onboarding|capacity/i.test(l)) || lines[0] || 'Leadership review recorded.';

      findings.push({
        id: 'find_04_operations',
        headline: `Operational constraints and customer onboarding lag identified in qualitative records`,
        detail: `Review of executive notes reveals capacity strain and extended turnaround cycles. Cross-functional friction directly impacts customer satisfaction and renewal predictability regarding ${decision}.`,
        impact: 'high',
        chartIds: ['chart_risk_matrix', 'chart_process_workflow'],
        evidence: [
          {
            source: textSrc.name,
            location: `Lines 1-${Math.min(lines.length, 35)}`,
            quote: sampleQuote.slice(0, 160),
          },
        ],
      });

      chartNotes.push(
        {
          chartId: 'chart_risk_matrix',
          whatItShows: 'Risk versus impact classification mapping operational vulnerabilities.',
          soWhat: 'Onboarding lag requires immediate headcount mitigation before customer churn increases.',
        },
        {
          chartId: 'chart_process_workflow',
          whatItShows: 'Five-stage workflow identifying cycle durations and implementation lag.',
          soWhat: 'Compressing the data migration bottleneck from 27 days to under 12 days unlocks rapid time-to-value.',
        }
      );
    }

    // Ensure at least 3 KPIs exist
    if (kpis.length < 3) {
      kpis.push(
        {
          label: 'Total Processed Records',
          value: `${totalRows.toLocaleString()} Rows`,
          change: null,
          trend: 'up',
          sourceRef: 'Data Profiling Engine',
          sparkline: [10, 20, 35, 50, 75, 100],
        },
        {
          label: 'Data Completeness Score',
          value: `${qualityScore} / 100`,
          change: '+4.0%',
          trend: 'up',
          sourceRef: 'Integrity Audit',
          sparkline: [80, 82, 85, 88, 90, qualityScore],
        },
        {
          label: 'Reporting Period',
          value: dateRange,
          change: null,
          trend: 'flat',
          sourceRef: 'Input Timestamp Scan',
          sparkline: null,
        }
      );
    }

    // Strategic Recommendations linked to findings
    recommendations.push(
      {
        priority: 'high',
        action: `Realign operational investment directly toward the leading revenue driver identified in Finding ${findings[0]?.id || 'find_01'}`,
        rationale: 'Concentrating capital and sales enablement on proven high-margin tiers maximizes free cash flow while curbing dilution from lower-margin regions.',
        expectedImpact: 'Estimated 15-20% gain in operating leverage and improved regional margin consistency.',
        linkedFindingIds: [findings[0]?.id || 'find_01_trajectory'],
      },
      {
        priority: 'medium',
        action: 'Standardize customer onboarding workflows to compress implementation turnaround under 25 days',
        rationale: 'Addressing client delivery friction protects customer retention and eliminates tier-1 account dissatisfaction.',
        expectedImpact: 'Reduces onboarding cycle time by ~45% and safeguards recurring contract renewals.',
        linkedFindingIds: findings.length > 1 ? [findings[findings.length - 1].id] : [findings[0].id],
      },
      {
        priority: 'low',
        action: 'Institute automated weekly variance tracking across infrastructure compute and hosting burn',
        rationale: 'Continuous alerting halts unmonitored infrastructure cost creep before quarterly budget limits are breached.',
        expectedImpact: 'Anticipated $15,000 monthly cloud cost optimization and tighter gross margin oversight.',
        linkedFindingIds: [findings[0].id],
      }
    );

    // Risks and Caveats
    risksAndCaveats.push(
      'Figures cited reflect parsed historical inputs and do not account for unrecorded pipeline commitments or external currency fluctuations.',
      'If the data cannot support a conclusion regarding customer churn or Q4 renewals, say so in risksAndCaveats instead of guessing.',
      `Decisions regarding ${decision} should be validated against finalized audited balance sheets and forward cash flow forecasts.`
    );

    // Data Quality
    const dataQuality = evaluateDataQuality(this.sources);

    const executiveSummary = `This executive report evaluates performance metrics and operational records for ${business} to inform decisions regarding ${decision}. Across ${totalRows.toLocaleString()} processed data records and ${this.sources.length} distinct source streams, operations exhibit steady baseline momentum reinforced by key segment concentration. However, cross-functional dependencies and operational onboarding lag require disciplined cost containment and targeted resource allocation going into the next fiscal quarter.`;

    return {
      title: reportTitle,
      executiveSummary,
      aboutData: {
        rows: totalRows,
        columns: this.stats?.tables[0]?.profile.columnCount || 6,
        dateRange,
        sources: sourceNames,
        qualityScore,
      },
      kpis: kpis.slice(0, 6),
      findings,
      chartNotes,
      recommendations,
      risksAndCaveats,
      dataQuality,
    };
  }
}
