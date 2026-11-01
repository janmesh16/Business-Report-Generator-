import { z } from 'zod';

export const KpiSchema = z.object({
  label: z.string(),
  value: z.string(),
  change: z.string().nullable().optional(),
  trend: z.enum(['up', 'down', 'flat']),
  sourceRef: z.string(),
});

export const ChartDataPointSchema = z.object({
  label: z.string(),
  value: z.number(),
});

export const ChartSchema = z.object({
  type: z.enum(['bar', 'line', 'pie', 'area']),
  title: z.string(),
  data: z.array(ChartDataPointSchema),
});

export const EvidenceSchema = z.object({
  source: z.string(),
  location: z.string(),
  quote: z.string().nullable().optional(),
});

export const FindingSchema = z.object({
  id: z.string(),
  headline: z.string(),
  detail: z.string(),
  impact: z.enum(['high', 'medium', 'low']),
  chart: ChartSchema.nullable().optional(),
  evidence: z.array(EvidenceSchema).min(1, 'At least one evidence item is required per finding'),
});

export const RecommendationSchema = z.object({
  priority: z.enum(['high', 'medium', 'low']),
  action: z.string(),
  rationale: z.string(),
  expectedImpact: z.string(),
  linkedFindingIds: z.array(z.string()),
});

export const DataQualitySchema = z.object({
  issues: z.array(z.string()),
  confidence: z.enum(['high', 'medium', 'low']),
});

export const ReportJsonSchema = z.object({
  title: z.string(),
  executiveSummary: z.string(),
  kpis: z.array(KpiSchema).min(1),
  findings: z.array(FindingSchema).min(1),
  recommendations: z.array(RecommendationSchema).min(1),
  risksAndCaveats: z.array(z.string()),
  dataQuality: DataQualitySchema,
});

export type Kpi = z.infer<typeof KpiSchema>;
export type ChartData = z.infer<typeof ChartSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type Finding = z.infer<typeof FindingSchema>;
export type Recommendation = z.infer<typeof RecommendationSchema>;
export type DataQuality = z.infer<typeof DataQualitySchema>;
export type ReportJson = z.infer<typeof ReportJsonSchema>;

export interface LLMProvider {
  name: string;
  generateReport(prompt: string, systemInstruction: string): Promise<ReportJson>;
}

