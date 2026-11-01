import { LLMProvider, ReportJson, Kpi, Finding, Recommendation } from './types.js';
import { ParsedSource } from '../parsers/types.js';
import { GlobalComputedStats, ComputedTableStats } from '../stats/calculator.js';
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
    const decision = this.metadata?.decisionContext || 'strategic growth and resource allocation';
    const reportTitle = this.metadata?.title || `Executive Performance & Strategic Analysis for ${business}`;

    const kpis: Kpi[] = [];
    const findings: Finding[] = [];
    const recommendations: Recommendation[] = [];
    const risksAndCaveats: string[] = [];

    // 1. Process Tabular Sources & Precomputed Stats
    if (this.stats && this.stats.tables.length > 0) {
      const primaryTable = this.stats.tables[0];
      const sourceName = primaryTable.sourceName;
      const numericSummaries = Object.values(primaryTable.numericSummaries);

      // Extract primary financial/operational metrics for KPIs
      for (const num of numericSummaries.slice(0, 4)) {
        const trendInfo = primaryTable.timeSeriesTrends.find((t) => t.metricColumn === num.column);
        kpis.push({
          label: `Total ${num.column.replace(/_/g, ' ')}`,
          value: num.formattedSum,
          change: trendInfo ? `${trendInfo.growthRatePercent > 0 ? '+' : ''}${trendInfo.growthRatePercent}%` : null,
          trend: trendInfo ? trendInfo.trend : 'flat',
          sourceRef: `${sourceName} (sum of ${num.count} records)`,
        });
      }

      // Finding 1: Core Performance & Growth Trend
      if (primaryTable.timeSeriesTrends.length > 0) {
        const trend = primaryTable.timeSeriesTrends[0];
        const matchingChart = this.stats.candidateCharts.find((c) => c.type === 'line' || c.type === 'area');
        findings.push({
          id: 'find_01_trajectory',
          headline: `${trend.metricColumn.replace(/_/g, ' ')} displayed a ${trend.growthRatePercent}% trajectory across ${trend.periods.length} reporting periods`,
          detail: `Analysis across reported intervals demonstrates that ${trend.metricColumn.replace(/_/g, ' ')} shifted from ${trend.periods[0].value.toLocaleString()} in ${trend.startPeriod} to ${trend.endValue.toLocaleString()} in ${trend.endPeriod}. This represents an annualized trajectory of ${trend.growthRatePercent}%.`,
          impact: trend.trend === 'up' ? 'high' : 'medium',
          chart: matchingChart || null,
          evidence: [
            {
              source: sourceName,
              location: `${trend.dateColumn} rows 1 to ${trend.periods.length}`,
              quote: `${trend.startPeriod} baseline: ${trend.periods[0].value.toLocaleString()} -> ${trend.endPeriod}: ${trend.endValue.toLocaleString()}`,
            },
          ],
        });
      }

      // Finding 2: Category Concentration / Distribution
      const categoryEntries = Object.entries(primaryTable.categoryBreakdowns);
      if (categoryEntries.length > 0) {
        const [catKey, breakdown] = categoryEntries[0];
        const topItem = breakdown[0];
        const barChart = this.stats.candidateCharts.find((c) => c.type === 'bar');

        findings.push({
          id: 'find_02_concentration',
          headline: `Top segment "${topItem.category}" accounts for ${topItem.shareOfTotalPercent}% of aggregate ${topItem.metric.replace(/_/g, ' ')}`,
          detail: `Categorical segmentation shows significant concentration: "${topItem.category}" delivered ${topItem.formattedValue} across ${topItem.count} transactions. The bottom segments represent under ${Math.max(1, 100 - topItem.shareOfTotalPercent).toFixed(1)}% combined.`,
          impact: topItem.shareOfTotalPercent > 40 ? 'high' : 'medium',
          chart: barChart || null,
          evidence: [
            {
              source: sourceName,
              location: `Categorical breakdown for ${catKey.replace(/_/g, ' ')}`,
              quote: `Top category: ${topItem.category} with ${topItem.formattedValue} (${topItem.shareOfTotalPercent}% share)`,
            },
          ],
        });
      }

      // Finding 3: Operational Outliers & Spread
      if (numericSummaries.length >= 2) {
        const metric = numericSummaries[1] || numericSummaries[0];
        const pieChart = this.stats.candidateCharts.find((c) => c.type === 'pie');
        findings.push({
          id: 'find_03_dispersion',
          headline: `Dispersion in ${metric.column.replace(/_/g, ' ')} ranges from ${metric.min.toLocaleString()} to ${metric.max.toLocaleString()}`,
          detail: `Statistical distribution indicates a median value of ${metric.median.toLocaleString()} with a standard deviation of ${metric.stdDev.toLocaleString()}, highlighting variability between low and high volume engagements.`,
          impact: 'medium',
          chart: pieChart || null,
          evidence: [
            {
              source: sourceName,
              location: `Metric column ${metric.column}`,
              quote: `Min: ${metric.min.toLocaleString()}, Median: ${metric.median.toLocaleString()}, Max: ${metric.max.toLocaleString()}`,
            },
          ],
        });
      }
    }

    // 2. Process Unstructured / Text Sources (Meeting Notes, PDFs)
    const textSources = this.sources.filter((s) => s.type === 'text' || (s.type === 'pdf' && !s.isScannedOrEmpty));
    for (const textSrc of textSources) {
      const lines = (textSrc.extractedText || '').split('\n').filter((l) => l.trim().length > 10);
      const sampleQuote = lines.find((l) => /priority|decision|challenge|cost|bottleneck|increase|growth/i.test(l)) || lines[0] || 'Operational review completed.';
      
      findings.push({
        id: `find_text_${findings.length + 1}`,
        headline: `Operational findings identified in qualitative source: "${textSrc.name}"`,
        detail: `Qualitative inputs highlight operational dependencies, organizational constraints, and near-term milestones impacting the business decision regarding ${decision}.`,
        impact: 'medium',
        chart: null,
        evidence: [
          {
            source: textSrc.name,
            location: `Lines 1-${Math.min(lines.length, 30)}`,
            quote: sampleQuote.slice(0, 160),
          },
        ],
      });
    }

    // Ensure at least 1 finding exists if dataset was minimal
    if (findings.length === 0) {
      findings.push({
        id: 'find_baseline',
        headline: 'Baseline dataset ingest completed with preliminary metrics',
        detail: 'The provided data files were structured and parsed into unified representations for executive review.',
        impact: 'low',
        chart: null,
        evidence: [
          {
            source: this.sources[0]?.name || 'Pasted Inputs',
            location: 'Records 1-1',
            quote: 'Initial input ingested.',
          },
        ],
      });
    }

    // Ensure at least 3 KPIs exist
    if (kpis.length < 3) {
      kpis.push(
        {
          label: 'Data Sources Ingested',
          value: `${this.sources.length} Source${this.sources.length > 1 ? 's' : ''}`,
          change: null,
          trend: 'flat',
          sourceRef: 'System Ingestion Pipeline',
        },
        {
          label: 'Total Rows Processed',
          value: `${this.stats?.totalRecordsAnalyzed || 0} Rows`,
          change: null,
          trend: 'up',
          sourceRef: 'Unified Parser Output',
        },
        {
          label: 'Reporting Period',
          value: 'FY2025 YTD',
          change: null,
          trend: 'flat',
          sourceRef: 'Input Timestamps',
        }
      );
    }

    // Build Prioritized Recommendations linked to findings
    recommendations.push(
      {
        priority: 'high',
        action: `Align Q4 resource allocation directly toward top-performing segment identified in Finding ${findings[0]?.id || '1'}`,
        rationale: 'Focusing operational investments on demonstrated high-margin drivers maximizes cash generation while mitigating exposure to underperforming categories.',
        expectedImpact: 'Estimated 12-18% efficiency gain and reduced margin variance.',
        linkedFindingIds: [findings[0]?.id || 'find_01_trajectory'],
      },
      {
        priority: 'medium',
        action: 'Standardize operational onboarding workflows to compress client delivery lag',
        rationale: 'Addressing implementation bottlenecks prevents customer friction and protects recurring renewal revenue.',
        expectedImpact: 'Reduced onboarding duration and improved initial customer satisfaction scores.',
        linkedFindingIds: findings.length > 1 ? [findings[1].id] : [findings[0].id],
      },
      {
        priority: 'low',
        action: 'Implement weekly automated variance tracking on compute infrastructure and regional margins',
        rationale: 'Early warning indicators prevent cumulative budget overruns and alert leadership to localized pricing pressure.',
        expectedImpact: 'Early detection of margin erosion and tighter operational expense control.',
        linkedFindingIds: [findings[0].id],
      }
    );

    // Risks and Caveats
    risksAndCaveats.push(
      'Figures cited reflect parsed historical records and do not account for external macroeconomic volatility or unrecorded pipeline commitments.',
      'Regional comparisons assume consistent currency conversion and standard gross margin definitions across business units.',
      `Decisions regarding ${decision} should be validated against ongoing operational cash flow and finalized audited balance sheets.`
    );

    // Evaluate Data Quality
    const dataQuality = evaluateDataQuality(this.sources);

    const executiveSummary = `This executive report evaluates performance metrics and operational records for ${business} to inform decisions regarding ${decision}. Across ${this.stats?.totalRecordsAnalyzed || 0} processed data records and ${this.sources.length} distinct source streams, top-line performance exhibits steady momentum, reinforced by key segment concentration. However, cross-functional dependencies and operational overhead require disciplined cost containment and targeted resource allocation going into the next fiscal quarter.`;

    return {
      title: reportTitle,
      executiveSummary,
      kpis: kpis.slice(0, 6),
      findings,
      recommendations,
      risksAndCaveats,
      dataQuality,
    };
  }
}
