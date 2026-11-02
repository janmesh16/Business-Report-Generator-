export interface AboutData {
  rows: number;
  columns: number;
  dateRange?: string | null;
  sources: string[];
  qualityScore: number;
}

export interface Kpi {
  label: string;
  value: string;
  change?: string | null;
  trend: 'up' | 'down' | 'flat';
  sourceRef: string;
  sparkline?: number[] | null;
}

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

export interface Evidence {
  source: string;
  location: string;
  quote?: string | null;
}

export interface Finding {
  id: string;
  headline: string;
  detail: string;
  impact: 'high' | 'medium' | 'low';
  chartIds: string[];
  evidence: Evidence[];
}

export interface ChartNote {
  chartId: string;
  whatItShows: string;
  soWhat: string;
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  rationale: string;
  expectedImpact: string;
  linkedFindingIds: string[];
}

export interface DataQuality {
  issues: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface ReportJson {
  title: string;
  executiveSummary: string;
  aboutData: AboutData;
  kpis: Kpi[];
  findings: Finding[];
  chartNotes: ChartNote[];
  recommendations: Recommendation[];
  risksAndCaveats: string[];
  dataQuality: DataQuality;
}

export interface ParsedSourceMetadata {
  id: string;
  name: string;
  type: 'csv' | 'excel' | 'pdf' | 'text';
  sizeBytes: number;
  rowCount?: number;
  lineCount?: number;
  columns?: string[];
  notes?: string;
}

export interface ReportRecord {
  id: string;
  title: string;
  businessName: string | null;
  decisionContext: string | null;
  promptVersion?: string;
  status: 'pending' | 'parsing' | 'analysing' | 'writing' | 'completed' | 'failed';
  progressStep: string;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  parsedSources: ParsedSourceMetadata[];
  computedStats: {
    tables?: any[];
    candidateCharts?: ChartCandidate[];
    totalRecordsAnalyzed?: number;
    overallDateRange?: string | null;
    overallQualityScore?: number;
  };
  reportJson: ReportJson | null;
  shareToken?: string;
  isSharedView?: boolean;
}

export interface PastReportSummary {
  id: string;
  title: string;
  business_name: string | null;
  decision_context: string | null;
  prompt_version?: string;
  status: 'pending' | 'parsing' | 'analysing' | 'writing' | 'completed' | 'failed';
  created_at: string;
  share_token: string | null;
  is_revoked: number | null;
}
