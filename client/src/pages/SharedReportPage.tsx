import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, AlertCircle, ArrowLeft, Loader2, Lock } from 'lucide-react';
import { api } from '../api/client';
import { ReportRecord } from '../types';
import { ReportHeader } from '../components/report/ReportHeader';
import { KpiGrid } from '../components/report/KpiGrid';
import { ExecutiveSummary } from '../components/report/ExecutiveSummary';
import { FindingCard } from '../components/report/FindingCard';
import { RecommendationList } from '../components/report/RecommendationList';
import { RisksAndQuality } from '../components/report/RisksAndQuality';
import { StatsAppendix } from '../components/report/StatsAppendix';

export const SharedReportPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [report, setReport] = useState<ReportRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .getSharedReport(token)
      .then((data) => {
        setReport(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Report link invalid or revoked.');
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <Loader2 className="w-10 h-10 text-earth-terracotta animate-spin mx-auto mb-4" />
        <h3 className="font-serif text-xl font-bold text-earth-deep">Loading Shared Report...</h3>
        <p className="text-sm text-earth-muted mt-1">Verifying cryptographic share token</p>
      </div>
    );
  }

  if (error || !report || !report.reportJson) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-earth-clay/15 text-earth-clay flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="font-serif text-2xl font-bold text-earth-deep mb-2">Access Link Unavailable</h3>
        <p className="text-sm text-earth-muted mb-6 leading-relaxed">
          {error || 'This shared business report does not exist or the link was revoked by the creator.'}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-earth-primary text-white font-semibold text-sm hover:bg-earth-deep transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Create Your Own Report</span>
        </Link>
      </div>
    );
  }

  const reportJson = report.reportJson;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Read-Only Public Banner */}
      <div className="mb-6 p-3.5 rounded-2xl bg-earth-sand/40 border border-earth-sand flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-earth-deep">
          <ShieldCheck className="w-4 h-4 text-earth-olive" />
          <span className="font-semibold">Public Read-Only View:</span>
          <span className="text-earth-muted">
            Certified by Ledgerly deterministic pipeline. Raw database records and uploads remain private.
          </span>
        </div>
        <Link
          to="/"
          className="shrink-0 font-semibold text-earth-terracotta hover:text-earth-deep transition-colors"
        >
          Create New Report &rarr;
        </Link>
      </div>

      {/* Main Report */}
      <ReportHeader
        title={reportJson.title || report.title}
        businessName={report.businessName}
        decisionContext={report.decisionContext}
        createdAt={report.createdAt}
        sources={report.parsedSources}
        dataQuality={reportJson.dataQuality}
      />

      <KpiGrid kpis={reportJson.kpis} />

      <ExecutiveSummary summary={reportJson.executiveSummary} />

      <div className="mb-8">
        <h2 className="font-serif text-xl font-bold text-earth-deep mb-4 tracking-tight">
          Key Findings & Empirical Evidence
        </h2>
        {reportJson.findings.map((finding, idx) => (
          <FindingCard key={finding.id || idx} finding={finding} index={idx} />
        ))}
      </div>

      <RecommendationList recommendations={reportJson.recommendations} />

      <RisksAndQuality
        risksAndCaveats={reportJson.risksAndCaveats}
        dataQuality={reportJson.dataQuality}
      />

      <StatsAppendix computedStats={report.computedStats} />
    </div>
  );
};

