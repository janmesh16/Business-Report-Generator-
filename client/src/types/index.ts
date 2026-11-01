export interface Kpi {
  label: string;
  value: string;
  change?: string | null;
  trend: 'up' | 'down' | 'flat';
  sourceRef: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'area';
  title: string;
  data: ChartDataPoint[];
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
  chart?: ChartData | null;
  evidence: Evidence[];
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
  kpis: Kpi[];
  findings: Finding[];
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
  status: 'pending' | 'parsing' | 'analysing' | 'writing' | 'completed' | 'failed';
  progressStep: string;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  parsedSources: ParsedSourceMetadata[];
  computedStats: any;
  reportJson: ReportJson | null;
  shareToken?: string;
  isSharedView?: boolean;
}

export interface PastReportSummary {
  id: string;
  title: string;
  business_name: string | null;
  decision_context: string | null;
  status: 'pending' | 'parsing' | 'analysing' | 'writing' | 'completed' | 'failed';
  created_at: string;
  share_token: string | null;
  is_revoked: number | null;
}

