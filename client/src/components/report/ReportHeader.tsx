import React from 'react';
import { Building2, Calendar, FileSpreadsheet, FileText, HelpCircle, ShieldCheck } from 'lucide-react';
import { ParsedSourceMetadata, DataQuality } from '../../types';

interface ReportHeaderProps {
  title: string;
  businessName?: string | null;
  decisionContext?: string | null;
  createdAt: string;
  sources: ParsedSourceMetadata[];
  dataQuality?: DataQuality;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  title,
  businessName,
  decisionContext,
  createdAt,
  sources,
  dataQuality,
}) => {
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const confidence = dataQuality?.confidence || 'high';

  return (
    <div className="bg-earth-surface border border-earth-sand rounded-3xl p-6 sm:p-8 shadow-warm mb-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-earth-sand pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs uppercase tracking-widest font-bold text-earth-terracotta">
              Strategic Executive Report
            </span>
            <span className="text-earth-sand">•</span>
            <div className="flex items-center gap-1 text-xs text-earth-muted">
              <Calendar className="w-3.5 h-3.5 text-earth-primary" />
              <span>{formattedDate}</span>
            </div>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-earth-deep tracking-tight">
            {title}
          </h1>

          {businessName && (
            <div className="flex items-center gap-2 mt-2 text-earth-muted text-sm font-medium">
              <Building2 className="w-4 h-4 text-earth-primary" />
              <span>Entity: <strong className="text-earth-deep">{businessName}</strong></span>
            </div>
          )}
        </div>

        {/* Confidence Badge */}
        <div className="shrink-0 flex md:flex-col items-center md:items-end justify-between gap-2">
          <div
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
              confidence === 'high'
                ? 'bg-earth-olive/15 text-earth-olive border border-earth-olive/30'
                : confidence === 'medium'
                ? 'bg-earth-terracotta/15 text-earth-terracotta border border-earth-terracotta/30'
                : 'bg-earth-clay/15 text-earth-clay border border-earth-clay/30'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{confidence} Confidence</span>
          </div>
          <span className="text-[11px] text-earth-muted">
            Grounding Verified
          </span>
        </div>
      </div>

      {/* Decision Context */}
      {decisionContext && (
        <div className="mt-4 p-3.5 rounded-2xl bg-earth-bg/70 border border-earth-sand/80 flex items-start gap-3">
          <HelpCircle className="w-4 h-4 text-earth-terracotta shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <span className="font-semibold text-earth-deep">Core Decision Objective: </span>
            <span className="text-earth-muted">{decisionContext}</span>
          </div>
        </div>
      )}

      {/* Source Data Sources Pills */}
      <div className="mt-5 pt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-earth-muted uppercase tracking-wider mr-1">
          Source Ingests:
        </span>
        {sources.length > 0 ? (
          sources.map((s, idx) => (
            <span
              key={`${s.name}-${idx}`}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs bg-earth-bg border border-earth-sand text-earth-deep"
            >
              {s.type === 'csv' || s.type === 'excel' ? (
                <FileSpreadsheet className="w-3.5 h-3.5 text-earth-olive" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-earth-terracotta" />
              )}
              <span className="font-medium truncate max-w-[180px]">{s.name}</span>
              {s.rowCount ? (
                <span className="text-[10px] text-earth-muted">({s.rowCount} rows)</span>
              ) : s.lineCount ? (
                <span className="text-[10px] text-earth-muted">({s.lineCount} lines)</span>
              ) : null}
            </span>
          ))
        ) : (
          <span className="text-xs text-earth-muted">Aggregated business inputs</span>
        )}
      </div>
    </div>
  );
};

