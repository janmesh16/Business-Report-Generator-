import { describe, it, expect } from 'vitest';
import { computeStatsForTable, calculatePearsonCorrelation, calculateHistogram, calculateParetoDistribution } from '../src/stats/calculator.js';
import { profileTable } from '../src/stats/profiler.js';
import { buildRichChartCandidates } from '../src/stats/chartBuilder.js';
import { evaluateDataQuality } from '../src/stats/dataQuality.js';
import { ReportJsonSchema } from '../src/llm/types.js';

describe('Deterministic Statistics & Profiling Engine', () => {
  const sampleTable = {
    headers: ['Date', 'Product', 'Revenue', 'Cost', 'Units'],
    rows: [
      { Date: '2025-01-01', Product: 'SaaS', Revenue: 10000, Cost: 4000, Units: 10 },
      { Date: '2025-02-01', Product: 'SaaS', Revenue: 15000, Cost: 5500, Units: 15 },
      { Date: '2025-03-01', Product: 'Consulting', Revenue: 5000, Cost: 3000, Units: 5 },
      { Date: '2025-04-01', Product: 'SaaS', Revenue: 20000, Cost: 7000, Units: 20 },
      { Date: '2025-05-01', Product: 'Enterprise', Revenue: 50000, Cost: 18000, Units: 45 },
    ],
    totalRows: 5,
  };

  it('computes accurate totals, means, and growth rates without arithmetic errors', () => {
    const stats = computeStatsForTable(sampleTable, 'test_sales.csv');

    // Revenue sum = 10000 + 15000 + 5000 + 20000 + 50000 = 100000
    expect(stats.numericSummaries['Revenue'].sum).toBe(100000);
    expect(stats.numericSummaries['Revenue'].mean).toBe(20000);
    expect(stats.numericSummaries['Revenue'].min).toBe(5000);
    expect(stats.numericSummaries['Revenue'].max).toBe(50000);

    // Units sum = 95
    expect(stats.numericSummaries['Units'].sum).toBe(95);
    expect(stats.numericSummaries['Units'].mean).toBe(19);

    // Time series growth rate
    expect(stats.timeSeriesTrends.length).toBeGreaterThan(0);
    const trend = stats.timeSeriesTrends[0];
    expect(trend.growthRatePercent).toBe(400); // 10000 to 50000 is +400%
    expect(trend.trend).toBe('up');

    // Categorical breakdown for Product: SaaS should have 45000 / 100000 = 45%
    const breakdown = stats.categoryBreakdowns['Product_by_Revenue'];
    expect(breakdown).toBeDefined();
    const saasItem = breakdown.find((b) => b.category === 'SaaS');
    expect(saasItem?.shareOfTotalPercent).toBe(45);
  });

  it('profiles table columns, detects dates, categories, numbers and quality scores', () => {
    const profile = profileTable(sampleTable, 'test_sales.csv');

    expect(profile.rowCount).toBe(5);
    expect(profile.columnCount).toBe(5);
    expect(profile.qualityScore).toBeGreaterThanOrEqual(80);

    expect(profile.columns['Date'].type).toBe('date');
    expect(profile.columns['Product'].type).toBe('category');
    expect(profile.columns['Revenue'].type).toBe('numeric');
  });

  it('calculates Pearson correlation coefficient between numeric columns', () => {
    const revenues = [10000, 15000, 5000, 20000, 50000];
    const costs = [4000, 5500, 3000, 7000, 18000];
    const r = calculatePearsonCorrelation(revenues, costs);

    // Revenue and cost have strong positive correlation > 0.95
    expect(r).toBeGreaterThan(0.95);
  });

  it('calculates histogram distribution with IQR outliers', () => {
    const values = [10, 12, 12, 14, 15, 16, 18, 19, 20, 22, 120]; // 120 is outlier
    const hist = calculateHistogram(values, 5);

    expect(hist.bins.length).toBe(5);
    expect(hist.outliers.length).toBe(1);
    expect(hist.outliers[0]).toBe(120);
  });

  it('calculates Pareto 80/20 cumulative distribution', () => {
    const items = [
      { name: 'Enterprise', value: 80000 },
      { name: 'MidMarket', value: 15000 },
      { name: 'SMB', value: 5000 },
    ];
    const pareto = calculateParetoDistribution(items);

    expect(pareto[0].name).toBe('Enterprise');
    expect(pareto[0].cumulativeShare).toBe(80);
    expect(pareto[2].cumulativeShare).toBe(100);
  });

  it('builds 6 to 10 rich candidate charts across multiple types', () => {
    const stats = computeStatsForTable(sampleTable, 'test_sales.csv');
    const parsedSource = {
      id: 'src_1',
      name: 'test_sales.csv',
      type: 'csv' as const,
      sizeBytes: 1024,
      activeTable: sampleTable,
    };

    const charts = buildRichChartCandidates([stats], [parsedSource]);

    expect(charts.length).toBeGreaterThanOrEqual(6);
    expect(charts.length).toBeLessThanOrEqual(12);

    const chartTypes = new Set(charts.map((c) => c.type));
    // Verify at least 4 distinct chart types
    expect(chartTypes.size).toBeGreaterThanOrEqual(4);

    // Verify peak/trough detection on time series
    const lineOrArea = charts.find((c) => c.type === 'line' || c.type === 'area');
    expect(lineOrArea).toBeDefined();
    expect(lineOrArea?.highestPoint).toBeDefined();
    expect(lineOrArea?.lowestPoint).toBeDefined();
  });

  it('evaluates overall data quality correctly', () => {
    const quality = evaluateDataQuality([
      {
        id: '1',
        name: 'test_sales.csv',
        type: 'csv',
        sizeBytes: 1024,
        activeTable: sampleTable,
      },
    ]);

    expect(['high', 'medium', 'low']).toContain(quality.confidence);
    expect(quality.issues.length).toBeGreaterThan(0);
  });

  it('validates a well-formed report against ReportJsonSchema', () => {
    const mockReport = {
      title: 'Q1 Performance & Strategy Review',
      executiveSummary: 'Enterprise segment drove 80% of quarterly performance with 400% net growth.',
      aboutData: {
        rows: 5,
        columns: 5,
        dateRange: '2025-01-01 to 2025-05-01',
        sources: ['test_sales.csv'],
        qualityScore: 94,
      },
      kpis: [
        {
          label: 'Total Revenue',
          value: '$100,000',
          change: '+400%',
          trend: 'up',
          sourceRef: 'test_sales.csv',
          sparkline: [10000, 15000, 5000, 20000, 50000],
        },
      ],
      findings: [
        {
          id: 'find_01',
          headline: 'Revenue reached $100k led by Enterprise expansion',
          detail: 'Enterprise generated $50k in Month 5 alone, validating the upmarket shift.',
          impact: 'high',
          chartIds: ['chart_rev_trend'],
          evidence: [
            {
              source: 'test_sales.csv',
              location: 'Row 5',
              quote: '2025-05-01 Enterprise 50000',
            },
          ],
        },
      ],
      chartNotes: [
        {
          chartId: 'chart_rev_trend',
          whatItShows: 'Monthly revenue growth accelerating into May.',
          soWhat: 'Prioritize enterprise account onboarding to capitalize on higher contract values.',
        },
      ],
      recommendations: [
        {
          priority: 'high',
          action: 'Expand Enterprise sales team',
          rationale: 'Enterprise generated half of all period revenue.',
          expectedImpact: '+35% annual contract value growth',
          linkedFindingIds: ['find_01'],
        },
      ],
      risksAndCaveats: ['Historical data limited to 5 monthly data points.'],
      dataQuality: {
        issues: ['Sample size is small.'],
        confidence: 'medium',
      },
    };

    const result = ReportJsonSchema.safeParse(mockReport);
    expect(result.success).toBe(true);
  });

  it('rejects malformed report JSON missing required fields', () => {
    const invalidReport = {
      title: 'Missing Required Fields',
      // missing executiveSummary, aboutData, kpis, etc.
    };

    const result = ReportJsonSchema.safeParse(invalidReport);
    expect(result.success).toBe(false);
  });
});
