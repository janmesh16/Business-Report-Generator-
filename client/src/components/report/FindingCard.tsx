import React from 'react';
import { MapPin, Quote, ExternalLink } from 'lucide-react';
import { Finding, ChartCandidate, Evidence } from '../../types';
import { ChartRenderer } from './ChartRenderer';

interface FindingCardProps {
  finding: Finding;
  index: number;
  candidateCharts?: ChartCandidate[];
  onOpenEvidence: (evidence: Evidence, findingHeadline: string) => void;
  isPrintMode?: boolean;
}

export const FindingCard: React.FC<FindingCardProps> = ({
  finding,
  index,
  candidateCharts = [],
  onOpenEvidence,
  isPrintMode = false,
}) => {
  const impactStyles = {
    high: 'bg-earth-clay/15 text-earth-clay border-earth-clay/30',
    medium: 'bg-earth-terracotta/15 text-earth-terracotta border-earth-terracotta/30',
    low: 'bg-earth-olive/15 text-earth-olive border-earth-olive/30',
  };

  // Find linked charts
  const linkedCharts = candidateCharts.filter((c) => (finding.chartIds || []).includes(c.id));

  return (
    <div className="bg-earth-surface border border-earth-sand rounded-3xl p-6 sm:p-7 shadow-warm mb-6 print-avoid-break">
      {/* Finding Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-lg bg-earth-sand flex items-center justify-center text-xs font-bold text-earth-deep font-mono">
            {index + 1}
          </span>
          <h3 className="font-serif text-lg sm:text-xl font-bold text-earth-deep tracking-tight">
            {finding.headline}
          </h3>
        </div>

        <span
          className={`self-start sm:self-auto text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
            impactStyles[finding.impact] || impactStyles.medium
          }`}
        >
          {finding.impact} Impact
        </span>
      </div>

      {/* Finding Detail */}
      <p className="text-earth-deep text-sm sm:text-base leading-relaxed mb-4">
        {finding.detail}
      </p>

      {/* Supporting Visualizations */}
      {linkedCharts.map((chart) => (
        <ChartRenderer key={chart.id} chart={chart} isPrintMode={isPrintMode} />
      ))}

      {/* Evidence Chips with Click-to-Inspect Drawer */}
      <div className="mt-4 pt-4 border-t border-earth-sand/70">
        <div className="text-xs font-semibold uppercase tracking-wider text-earth-muted mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-earth-primary" />
            <span>Empirical Evidence References</span>
          </div>
          {!isPrintMode && (
            <span className="text-[11px] text-earth-terracotta font-medium">
              Click any chip to inspect source rows
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2.5">
          {finding.evidence.map((ev, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onOpenEvidence(ev, finding.headline)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-earth-bg border border-earth-sand text-xs text-earth-deep hover:border-earth-terracotta hover:bg-earth-sand/30 transition-all cursor-pointer group text-left"
            >
              <div className="flex items-center gap-1.5 font-semibold text-earth-primary">
                <span>{ev.source}</span>
                <span className="text-earth-sand">|</span>
                <span className="font-mono text-[11px] text-earth-muted">{ev.location}</span>
              </div>
              {ev.quote && (
                <div className="hidden md:flex items-center gap-1 text-earth-deep/80 italic font-serif">
                  <Quote className="w-3 h-3 text-earth-terracotta shrink-0" />
                  <span className="truncate max-w-[200px]">"{ev.quote}"</span>
                </div>
              )}
              {!isPrintMode && <ExternalLink className="w-3 h-3 text-earth-muted group-hover:text-earth-terracotta transition-colors" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
