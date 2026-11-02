import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { ReportRecord } from '../types';
import { ReportHeader } from '../components/report/ReportHeader';
import { KpiGrid } from '../components/report/KpiGrid';
import { ExecutiveSummary } from '../components/report/ExecutiveSummary';
import { FindingCard } from '../components/report/FindingCard';
import { RecommendationList } from '../components/report/RecommendationList';
import { RisksAndQuality } from '../components/report/RisksAndQuality';
import { StatsAppendix } from '../components/report/StatsAppendix';
import { AboutDataPanel } from '../components/report/AboutDataPanel';
import { VisualAnalysisSection } from '../components/report/VisualAnalysisSection';

export const PrintReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ReportRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .getReport(id)
      .then((data) => {
        setReport(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load report for printing:', err);
        setLoading(false);
      });
  }, [id]);

  if (loading || !report || !report.reportJson) {
    return (
      <div id="print-container" className="p-8 text-center text-earth-muted">
        Loading printable report document...
      </div>
    );
  }

  const reportJson = report.reportJson;
  const candidateCharts = report.computedStats?.candidateCharts || [];
  const linkedChartIds = (reportJson.findings || []).flatMap((f) => f.chartIds || []);

  return (
    <div
      id="print-container"
      className="max-w-4xl mx-auto p-6 sm:p-10 bg-earth-bg text-earth-deep print:p-0"
    >
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

      {reportJson.aboutData && (
        <AboutDataPanel aboutData={reportJson.aboutData} />
      )}

      <div className="mb-6">
        <h2 className="font-serif text-xl font-bold text-earth-deep mb-3">
          Key Findings & Empirical Evidence
        </h2>
        {reportJson.findings.map((finding, idx) => (
          <FindingCard
            key={finding.id || idx}
            finding={finding}
            index={idx}
            candidateCharts={candidateCharts}
            onOpenEvidence={() => {}}
            isPrintMode={true}
          />
        ))}
      </div>

      <VisualAnalysisSection
        candidateCharts={candidateCharts}
        linkedChartIds={linkedChartIds}
        isPrintMode={true}
      />

      <RecommendationList recommendations={reportJson.recommendations} />

      <RisksAndQuality
        risksAndCaveats={reportJson.risksAndCaveats}
        dataQuality={reportJson.dataQuality}
      />

      <StatsAppendix computedStats={report.computedStats} />
    </div>
  );
};

