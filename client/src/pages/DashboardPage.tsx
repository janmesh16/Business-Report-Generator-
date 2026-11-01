import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { ReportRecord } from '../types';
import { ReportHeader } from '../components/report/ReportHeader';
import { KpiGrid } from '../components/report/KpiGrid';
import { ExecutiveSummary } from '../components/report/ExecutiveSummary';
import { FindingCard } from '../components/report/FindingCard';
import { RecommendationList } from '../components/report/RecommendationList';
import { RisksAndQuality } from '../components/report/RisksAndQuality';
import { StatsAppendix } from '../components/report/StatsAppendix';
import { ExportBar } from '../components/report/ExportBar';

export const DashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ReportRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      </div>

      <ExportBar
        reportId={report.id}
        initialShareToken={report.shareToken}
        onShareStatusChange={fetchReport}
      />

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
        <KpiGrid kpis={reportJson.kpis} />

        {/* 3. Executive Summary */}
        <ExecutiveSummary summary={reportJson.executiveSummary} />

        {/* 4. Key Findings */}
        <div className="mb-8">
          <h2 className="font-serif text-xl font-bold text-earth-deep mb-4 tracking-tight">
            Key Findings & Empirical Evidence
          </h2>
          {reportJson.findings.map((finding, idx) => (
            <FindingCard key={finding.id || idx} finding={finding} index={idx} />
          ))}
        </div>

        {/* 5. Prioritized Recommendations */}
        <RecommendationList recommendations={reportJson.recommendations} />

        {/* 6. Risks, Caveats & Data Quality */}
        <RisksAndQuality
          risksAndCaveats={reportJson.risksAndCaveats}
          dataQuality={reportJson.dataQuality}
        />

        {/* 7. Appendix with Verified Calculations */}
        <StatsAppendix computedStats={report.computedStats} />
      </div>
    </div>
  );
};

