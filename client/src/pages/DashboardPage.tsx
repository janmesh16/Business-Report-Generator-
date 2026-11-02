import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, RefreshCw, ShieldAlert } from 'lucide-react';
import { api } from '../api/client';
import { ReportRecord, Evidence } from '../types';
import { ReportHeader } from '../components/report/ReportHeader';
import { KpiGrid } from '../components/report/KpiGrid';
import { ExecutiveSummary } from '../components/report/ExecutiveSummary';
import { FindingCard } from '../components/report/FindingCard';
import { RecommendationList } from '../components/report/RecommendationList';
import { RisksAndQuality } from '../components/report/RisksAndQuality';
import { StatsAppendix } from '../components/report/StatsAppendix';
import { ExportBar } from '../components/report/ExportBar';
import { StickyNav } from '../components/report/StickyNav';
import { AboutDataPanel } from '../components/report/AboutDataPanel';
import { VisualAnalysisSection } from '../components/report/VisualAnalysisSection';
import { EvidenceDrawer } from '../components/report/EvidenceDrawer';

export const DashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ReportRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Evidence Drawer state
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [selectedFindingHeadline, setSelectedFindingHeadline] = useState<string>('');

  const fetchReport = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getReport(id);
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  const handleOpenEvidence = (evidence: Evidence, findingHeadline: string) => {
    setSelectedEvidence(evidence);
    setSelectedFindingHeadline(findingHeadline);
    setIsEvidenceOpen(true);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <Loader2 className="w-10 h-10 text-earth-terracotta animate-spin mx-auto mb-4" />
        <h3 className="font-serif text-xl font-bold text-earth-deep">Loading Report Dashboard...</h3>
        <p className="text-sm text-earth-muted mt-1">Retrieving verified findings and statistical tables</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-earth-clay/15 text-earth-clay flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="font-serif text-2xl font-bold text-earth-deep mb-2">Report Not Found</h3>
        <p className="text-sm text-earth-muted mb-6">{error || 'Unable to retrieve this report record.'}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-earth-primary text-white font-semibold text-sm hover:bg-earth-deep transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Generator</span>
        </Link>
      </div>
    );
  }

  const reportJson = report.reportJson;
  if (!reportJson) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h3 className="font-serif text-2xl font-bold text-earth-deep mb-2">Report Still Processing</h3>
        <p className="text-sm text-earth-muted mb-6">Status: {report.status} ({report.progressStep})</p>
        <button
          onClick={fetchReport}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-earth-primary text-white font-semibold text-sm hover:bg-earth-deep transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Status</span>
        </button>
      </div>
    );
  }

  const candidateCharts = report.computedStats?.candidateCharts || [];
  const linkedChartIds = (reportJson.findings || []).flatMap((f) => f.chartIds || []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button & Export Bar */}
      <div className="flex items-center justify-between mb-4 no-print">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-earth-muted hover:text-earth-deep transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Generate Another Report</span>
        </Link>
        {report.promptVersion && (
          <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-lg bg-earth-sand/40 text-earth-deep border border-earth-sand">
            Engine: {report.promptVersion.toUpperCase()} Prompt
          </span>
        )}
      </div>

      <ExportBar
        reportId={report.id}
        initialShareToken={report.shareToken}
        onShareStatusChange={fetchReport}
      />

      {/* Sticky Section Navigation */}
      <StickyNav />

      {/* Main Report Structure */}
      <div id="report-dashboard-content">
        {/* 1. Header */}
        <ReportHeader
          title={reportJson.title || report.title}
          businessName={report.businessName}
          decisionContext={report.decisionContext}
          createdAt={report.createdAt}
          sources={report.parsedSources}
          dataQuality={reportJson.dataQuality}
        />

        {/* 2. Headline KPIs */}
        <div id="section-kpis">
          <KpiGrid kpis={reportJson.kpis} />
        </div>

        {/* 3. Executive Summary */}
        <div id="section-summary">
          <ExecutiveSummary summary={reportJson.executiveSummary} />
        </div>

        {/* 4. Section 4: About This Data (Key Telemetry & Quality Score) */}
        {reportJson.aboutData && (
          <AboutDataPanel aboutData={reportJson.aboutData} />
        )}

        {/* 5. Section 5: Key Findings & Empirical Evidence */}
        <div className="mb-8" id="section-findings">
          <h2 className="font-serif text-xl font-bold text-earth-deep mb-4 tracking-tight">
            Key Findings & Empirical Evidence
          </h2>
          {reportJson.findings.map((finding, idx) => (
            <FindingCard
              key={finding.id || idx}
              finding={finding}
              index={idx}
              candidateCharts={candidateCharts}
              onOpenEvidence={handleOpenEvidence}
            />
          ))}
        </div>

        {/* 6. Section 6: Visual Analysis (Deep Dives & Supplementary Charts) */}
        <VisualAnalysisSection
          candidateCharts={candidateCharts}
          linkedChartIds={linkedChartIds}
        />

        {/* 7. Prioritized Recommendations */}
        <div id="section-recs">
          <RecommendationList recommendations={reportJson.recommendations} />
        </div>

        {/* 8. Risks, Caveats & Data Quality */}
        <div id="section-risks">
          <RisksAndQuality
            risksAndCaveats={reportJson.risksAndCaveats}
            dataQuality={reportJson.dataQuality}
          />
        </div>

        {/* 9. Appendix with Verified Calculations */}
        <div id="section-appendix">
          <StatsAppendix computedStats={report.computedStats} />
        </div>

        {/* Anti-Hallucination Disclaimer Banner */}
        <div className="mt-8 p-4 rounded-2xl bg-earth-sand/30 border border-earth-sand flex items-center gap-3 text-xs text-earth-muted">
          <ShieldAlert className="w-5 h-5 text-earth-terracotta shrink-0" />
          <span>
            <strong>Verification Notice:</strong> All quantitative statistics, totals, and chart series are computed deterministically in code from uploaded records. AI-generated insights and recommendations should be verified against your original source data.
          </span>
        </div>
      </div>

      {/* Interactive Evidence Drawer */}
      <EvidenceDrawer
        isOpen={isEvidenceOpen}
        onClose={() => setIsEvidenceOpen(false)}
        evidence={selectedEvidence}
        findingHeadline={selectedFindingHeadline}
      />
    </div>
  );
};

