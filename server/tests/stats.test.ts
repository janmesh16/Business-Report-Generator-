import { describe, it, expect } from 'vitest';
import { computeStatsForTable } from '../src/stats/calculator.js';
import { buildCandidateCharts } from '../src/stats/chartBuilder.js';
import { evaluateDataQuality } from '../src/stats/dataQuality.js';
import { ReportJsonSchema } from '../src/llm/types.js';

describe('Deterministic Statistics Engine', () => {
  const sampleTable = {
    headers: ['Date', 'Product', 'Revenue', 'Units'],
    rows: [
      { Date: '2025-01', Product: 'SaaS', Revenue: 10000, Units: 10 },
      { Date: '2025-02', Product: 'SaaS', Revenue: 15000, Units: 15 },
      { Date: '2025-03', Product: 'Consulting', Revenue: 5000, Units: 5 },
      { Date: '2025-04', Product: 'SaaS', Revenue: 20000, Units: 20 },
    ],
    totalRows: 4,
  };

  it('computes accurate totals, means, and growth rates without arithmetic errors', () => {
    const stats = computeStatsForTable(sampleTable, 'test_sales.csv');

    // Revenue sum = 10000 + 15000 + 5000 + 20000 = 50000
    expect(stats.numericSummaries['Revenue'].sum).toBe(50000);
    expect(stats.numericSummaries['Revenue'].mean).toBe(12500);
    expect(stats.numericSummaries['Revenue'].min).toBe(5000);
    expect(stats.numericSummaries['Revenue'].max).toBe(20000);

    // Units sum = 50
    expect(stats.numericSummaries['Units'].sum).toBe(50);
    expect(stats.numericSummaries['Units'].mean).toBe(12.5);

    // Time series growth rate: 2025-01 (10000) to 2025-04 (20000) = +100%
    expect(stats.timeSeriesTrends.length).toBeGreaterThan(0);
    const trend = stats.timeSeriesTrends[0];
    expect(trend.growthRatePercent).toBe(100);
    expect(trend.trend).toBe('up');

    // Categorical breakdown for Product: SaaS should have 45000 / 50000 = 90%
    const breakdown = stats.categoryBreakdowns['Product_by_Revenue'];
    expect(breakdown).toBeDefined();
    const saasItem = breakdown.find((b) => b.category === 'SaaS');
    expect(saasItem?.shareOfTotalPercent).toBe(90);
  });

  it('builds candidate chart datasets matching exact table data', () => {
    const stats = computeStatsForTable(sampleTable, 'test_sales.csv');
    const charts = buildCandidateCharts([stats]);

    expect(charts.length).toBeGreaterThan(0);
    const lineChart = charts.find((c) => c.type === 'line');
    expect(lineChart).toBeDefined();
    expect(lineChart?.data.length).toBe(4);
    expect(lineChart?.data[0].value).toBe(10000);
    expect(lineChart?.data[3].value).toBe(20000);
  });

  it('evaluates data quality correctly', () => {
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
      title: 'Q1 Review',
      executiveSummary: 'Company grew 100% in Q1.',
      kpis: [
        {
          label: 'Total Revenue',
          value: '$50k',
          change: '+100%',
          trend: 'up',
          sourceRef: 'test_sales.csv',
        },
      ],
      findings: [
        {
          id: 'find_01',
          headline: 'Revenue doubled over period',
          detail: 'Detailed evidence confirms growth from 10k to 20k.',
          impact: 'high',
          chart: null,
          evidence: [
            {
              source: 'test_sales.csv',
              location: 'Row 1 to 4',
              quote: '10k -> 20k',
            },
          ],
        },
      ],
      recommendations: [
        {
          priority: 'high',
          action: 'Expand SaaS product line',
          rationale: '90% of revenue came from SaaS.',
          expectedImpact: '+20% revenue growth',
          linkedFindingIds: ['find_01'],
        },
      ],
      risksAndCaveats: ['Sample size is small.'],
      dataQuality: {
        issues: ['Only 4 records provided.'],
        confidence: 'medium',
      },
    };

    const result = ReportJsonSchema.safeParse(mockReport);
    expect(result.success).toBe(true);
  });
});

