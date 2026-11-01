import React from 'react';
import { MapPin, Quote, TrendingUp } from 'lucide-react';
import { Finding } from '../../types';
import { ChartRenderer } from './ChartRenderer';

interface FindingCardProps {
  finding: Finding;
  index: number;
  isPrintMode?: boolean;
}

export const FindingCard: React.FC<FindingCardProps> = ({
  finding,
  index,
  isPrintMode = false,
}) => {
  const impactStyles = {
    high: 'bg-earth-clay/15 text-earth-clay border-earth-clay/30',
    medium: 'bg-earth-terracotta/15 text-earth-terracotta border-earth-terracotta/30',
    low: 'bg-earth-olive/15 text-earth-olive border-earth-olive/30',
  };

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

      {/* Supporting Chart (if present) */}
      {finding.chart && finding.chart.data && finding.chart.data.length > 0 && (
        <ChartRenderer chart={finding.chart} isPrintMode={isPrintMode} />
      )}

      {/* Evidence Chips */}
      <div className="mt-4 pt-4 border-t border-earth-sand/70">
        <div className="text-xs font-semibold uppercase tracking-wider text-earth-muted mb-2 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-earth-primary" />
          <span>Empirical Evidence References</span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {finding.evidence.map((ev, i) => (
            <div
              key={i}
              className="inline-flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 px-3 py-1.5 rounded-xl bg-earth-bg border border-earth-sand text-xs text-earth-deep"
            >
              <div className="flex items-center gap-1.5 font-semibold text-earth-primary">
                <span>{ev.source}</span>
                <span className="text-earth-sand">|</span>
                <span className="font-mono text-[11px] text-earth-muted">{ev.location}</span>
              </div>
              {ev.quote && (
                <div className="flex items-center gap-1 text-earth-deep/80 italic font-serif">
                  <Quote className="w-3 h-3 text-earth-terracotta shrink-0" />
                  <span className="truncate max-w-xs md:max-w-md">"{ev.quote}"</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

