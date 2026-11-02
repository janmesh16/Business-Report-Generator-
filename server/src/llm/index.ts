import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';
import { LLMProvider, ReportJson, ReportJsonSchema } from './types.js';
import { GeminiAdapter } from './geminiAdapter.js';
import { MockAdapter } from './mockAdapter.js';
import { ParsedSource } from '../parsers/types.js';
import { GlobalComputedStats } from '../stats/calculator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export function loadPromptTemplate(version: 'v1' | 'v2' | 'v3' = 'v3'): string {
  const promptDir = path.resolve(process.cwd(), 'prompts');
  const fileName = version === 'v1' ? 'v1_basic.txt' : version === 'v2' ? 'v2_structured.txt' : 'v3_production.txt';
  const filePath = path.join(promptDir, fileName);

  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf8');
  }

  // Fallback inline template
  return `Write an executive business report for {businessName} based on: {computedStats}`;
}

export function buildAnalysisPrompt(
  sources: ParsedSource[],
  stats: GlobalComputedStats,
  metadata: { title?: string; businessName?: string; decisionContext?: string },
  promptVersion: 'v1' | 'v2' | 'v3' = 'v3'
): { prompt: string; systemInstruction: string } {
  const businessName = metadata.businessName || 'Business Organization';
  const reportTitle = metadata.title || 'Executive Business Performance Analysis';
  const decisionContext = metadata.decisionContext || 'Strategic resource allocation and capital efficiency';

  const systemInstruction = `You are Ledgerly, an expert AI business intelligence analyst.
Ground every number in the computed stats or verbatim source quotes. Never invent numbers. If data is insufficient, state so in risksAndCaveats instead of guessing. Return ONLY valid JSON adhering to the required schema.`;

  // Format stats for template interpolation
  const statsOverview = JSON.stringify(
    stats.tables.map((t) => ({
      source: t.sourceName,
      sheet: t.sheetName || 'Default',
      rowCount: t.totalRows,
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
        growthRate: `${tr.growthRatePercent}%`,
        peak: `${tr.highestPoint.period} (${tr.highestPoint.value})`,
      })),
      correlations: t.correlations.map((c) => ({
        variables: `${c.colA} vs ${c.colB}`,
        r: c.r,
        description: c.description,
      })),
      categoryBreakdowns: Object.fromEntries(
        Object.entries(t.categoryBreakdowns).map(([k, v]) => [
          k,
          v.slice(0, 5).map((item) => `${item.category}: ${item.value} (${item.shareOfTotalPercent}%)`),
        ])
      ),
    })),
    null,
    2
  );

  const candidateChartsFormatted = JSON.stringify(
    stats.candidateCharts.map((c) => ({
      id: c.id,
      type: c.type,
      title: c.title,
      categoryTheme: c.categoryTheme,
      sourceTag: c.sourceTag,
      units: c.units,
      summaryPreview: c.data.slice(0, 4),
    })),
    null,
    2
  );

  const textSnippets = sources
    .filter((s) => s.type === 'text' || (s.type === 'pdf' && !s.isScannedOrEmpty))
    .map((s) => `[Source: ${s.name}]\n${(s.extractedText || '').slice(0, 1500)}`)
    .join('\n\n');

  const aboutDataSummary = `Records: ${stats.totalRecordsAnalyzed}, Date Range: ${stats.overallDateRange || 'N/A'}, Quality Score: ${stats.overallQualityScore}/100`;

  const template = loadPromptTemplate(promptVersion);

  const prompt = template
    .replace('{businessName}', businessName)
    .replace('{reportTitle}', reportTitle)
    .replace('{decisionContext}', decisionContext)
    .replace('{aboutDataSummary}', aboutDataSummary)
    .replace('{computedStats}', statsOverview)
    .replace('{candidateCharts}', candidateChartsFormatted)
    .replace('{extractedText}', textSnippets || 'No additional narrative text provided.')
    .replace('{data}', `${statsOverview}\n\n${textSnippets}`);

  return { prompt, systemInstruction };
}

export async function runAnalysisPipeline(
  sources: ParsedSource[],
  stats: GlobalComputedStats,
  metadata: { title?: string; businessName?: string; decisionContext?: string },
  promptVersion: 'v1' | 'v2' | 'v3' = 'v3'
): Promise<ReportJson> {
  const provider = getLLMProvider(sources, stats, metadata);
  const { prompt, systemInstruction } = buildAnalysisPrompt(sources, stats, metadata, promptVersion);

  try {
    const report = await provider.generateReport(prompt, systemInstruction);
    return report;
  } catch (initialErr: any) {
    console.warn(`[LLM Pipeline] Generation with ${provider.name} failed: ${initialErr.message}. Retrying with repair prompt...`);

    if (provider instanceof GeminiAdapter) {
      try {
        const repairInstruction = `${systemInstruction}\nYour previous output failed validation: ${initialErr.message}. Return ONLY corrected JSON that strictly satisfies the schema.`;
        const repaired = await provider.generateReport(prompt, repairInstruction);
        return repaired;
      } catch (retryErr: any) {
        console.error(`[LLM Pipeline] Repair attempt failed: ${retryErr.message}. Falling back to deterministic MockAdapter.`);
      }
    }

    const fallbackAdapter = new MockAdapter(sources, stats, metadata);
    return await fallbackAdapter.generateReport(prompt, systemInstruction);
  }
}
