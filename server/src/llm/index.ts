import { config } from '../config.js';
import { LLMProvider, ReportJson, ReportJsonSchema } from './types.js';
import { GeminiAdapter } from './geminiAdapter.js';
import { MockAdapter } from './mockAdapter.js';
import { ParsedSource } from '../parsers/types.js';
import { GlobalComputedStats } from '../stats/calculator.js';

export * from './types.js';

export function getLLMProvider(
  sources: ParsedSource[],
  stats: GlobalComputedStats,
  metadata?: { title?: string; businessName?: string; decisionContext?: string }
): LLMProvider {
  if (config.llmProvider === 'gemini') {
    if (config.geminiApiKey) {
      return new GeminiAdapter(config.geminiApiKey, config.geminiModel);
    }
    console.warn('[LLM] GEMINI_API_KEY is not set. Falling back to deterministic MockAdapter.');
  }
  return new MockAdapter(sources, stats, metadata);
}

export function buildAnalysisPrompt(
  sources: ParsedSource[],
  stats: GlobalComputedStats,
  metadata: { title?: string; businessName?: string; decisionContext?: string }
): { prompt: string; systemInstruction: string } {
  const systemInstruction = `You are Ledgerly, an expert AI business analyst for non-technical managers and small business owners.
Your role is to produce a structured, decision-ready business report that is strictly grounded in the provided data.

CRITICAL GROUNDING RULES:
1. Every number in the report MUST come directly from the pre-computed statistics or extracted text quotes provided below. Never invent, estimate, extrapolate, or calculate new numbers.
2. Every finding must include at least one concrete Evidence reference (source file name, row/table/line location, and exact quote).
3. Any charts in findings MUST use one of the pre-computed candidate charts provided in the input, preserving its exact title, type, and data points.
4. Recommendations must be linked to the findings that justify them using linkedFindingIds.
5. If the data is insufficient to answer an aspect of the decision context, explicitly state the limitation in "risksAndCaveats".
6. Return ONLY valid JSON adhering strictly to the required schema.`;

  // Format precomputed stats for prompt
  const statsOverview = stats.tables.map((t) => ({
    source: t.sourceName,
    sheet: t.sheetName || 'Default',
    totalRows: t.totalRows,
    numericTotals: Object.fromEntries(
      Object.entries(t.numericSummaries).map(([col, s]) => [
        col,
        { sum: s.sum, mean: s.mean, median: s.median, min: s.min, max: s.max, stdDev: s.stdDev },
      ])
    ),
    trends: t.timeSeriesTrends.map((tr) => ({
      metric: tr.metricColumn,
      start: `${tr.startPeriod} (${tr.startValue})`,
      end: `${tr.endPeriod} (${tr.endValue})`,
      growthRatePercent: `${tr.growthRatePercent}%`,
      trend: tr.trend,
    })),
    topSegments: Object.fromEntries(
      Object.entries(t.categoryBreakdowns).map(([k, v]) => [
        k,
        v.slice(0, 5).map((item) => `${item.category}: ${item.value} (${item.shareOfTotalPercent}%)`),
      ])
    ),
  }));

  // Format candidate charts
  const candidateChartsFormatted = stats.candidateCharts.map((c) => ({
    id: c.id,
    type: c.type,
    title: c.title,
    source: c.source,
    data: c.data,
  }));

  // Format text sources
  const textSnippets = sources
    .filter((s) => s.type === 'text' || (s.type === 'pdf' && !s.isScannedOrEmpty))
    .map((s) => ({
      source: s.name,
      sampleLines: (s.extractedText || '').split('\n').slice(0, 40).join('\n'),
    }));

  const prompt = JSON.stringify(
    {
      businessName: metadata.businessName || 'Business Organization',
      reportTitle: metadata.title || 'Executive Business Performance Analysis',
      decisionContext: metadata.decisionContext || 'Strategic resource allocation and growth review',
      precomputedTableStatistics: statsOverview,
      availableCandidateCharts: candidateChartsFormatted,
      qualitativeSources: textSnippets,
      expectedJsonSchema: {
        title: 'string',
        executiveSummary: 'string',
        kpis: [{ label: 'string', value: 'string', change: 'string | null', trend: 'up | down | flat', sourceRef: 'string' }],
        findings: [
          {
            id: 'string',
            headline: 'string',
            detail: 'string',
            impact: 'high | medium | low',
            chart: 'Chart object matching availableCandidateCharts or null',
            evidence: [{ source: 'string', location: 'string', quote: 'string | null' }],
          },
        ],
        recommendations: [
          {
            priority: 'high | medium | low',
            action: 'string',
            rationale: 'string',
            expectedImpact: 'string',
            linkedFindingIds: ['string'],
          },
        ],
        risksAndCaveats: ['string'],
        dataQuality: {
          issues: ['string'],
          confidence: 'high | medium | low',
        },
      },
    },
    null,
    2
  );

  return { prompt, systemInstruction };
}

export async function runAnalysisPipeline(
  sources: ParsedSource[],
  stats: GlobalComputedStats,
  metadata: { title?: string; businessName?: string; decisionContext?: string }
): Promise<ReportJson> {
  const provider = getLLMProvider(sources, stats, metadata);
  const { prompt, systemInstruction } = buildAnalysisPrompt(sources, stats, metadata);

  try {
    const report = await provider.generateReport(prompt, systemInstruction);
    return report;
  } catch (initialErr: any) {
    console.warn(`[LLM Pipeline] Initial generation failed: ${initialErr.message}. Attempting repair prompt...`);

    // Retry once with repair prompt if using live provider
    if (provider instanceof GeminiAdapter) {
      try {
        const repairInstruction = `${systemInstruction}\nYour previous response failed validation: ${initialErr.message}. Return ONLY corrected JSON that strictly satisfies the schema.`;
        const repaired = await provider.generateReport(prompt, repairInstruction);
        return repaired;
      } catch (retryErr: any) {
        console.error(`[LLM Pipeline] Repair attempt failed: ${retryErr.message}. Falling back to deterministic MockAdapter.`);
      }
    }

    // Gracefully fall back to local deterministic MockAdapter if live LLM fails
    const fallbackAdapter = new MockAdapter(sources, stats, metadata);
    return await fallbackAdapter.generateReport(prompt, systemInstruction);
  }
}

