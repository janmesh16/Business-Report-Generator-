import { z } from 'zod';

export const AboutDataSchema = z.object({
  rows: z.number(),
  columns: z.number(),
  dateRange: z.string().nullable().optional(),
  sources: z.array(z.string()),
  qualityScore: z.number(),
});

export const KpiSchema = z.object({
  label: z.string(),
  value: z.string(),
  change: z.string().nullable().optional(),
  trend: z.enum(['up', 'down', 'flat']),
  sourceRef: z.string(),
  sparkline: z.array(z.number()).optional().nullable(),
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
  chartIds: z.array(z.string()).default([]),
  evidence: z.array(EvidenceSchema).min(1, 'At least one evidence item is required per finding'),
});

export const ChartNoteSchema = z.object({
  chartId: z.string(),
  whatItShows: z.string(),
  soWhat: z.string(),
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
  aboutData: AboutDataSchema,
  kpis: z.array(KpiSchema).min(1),
  findings: z.array(FindingSchema).min(1),
  chartNotes: z.array(ChartNoteSchema).default([]),
  recommendations: z.array(RecommendationSchema).min(1),
  risksAndCaveats: z.array(z.string()),
  dataQuality: DataQualitySchema,
});

export type AboutData = z.infer<typeof AboutDataSchema>;
export type Kpi = z.infer<typeof KpiSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type Finding = z.infer<typeof FindingSchema>;
export type ChartNote = z.infer<typeof ChartNoteSchema>;
export type Recommendation = z.infer<typeof RecommendationSchema>;
export type DataQuality = z.infer<typeof DataQualitySchema>;
export type ReportJson = z.infer<typeof ReportJsonSchema>;

export interface LLMProvider {
  name: string;
  generateReport(prompt: string, systemInstruction: string): Promise<ReportJson>;
}
