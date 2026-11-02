import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Database } from 'lucide-react';
import { Kpi } from '../../types';

interface KpiGridProps {
  kpis: Kpi[];
}

export const KpiGrid: React.FC<KpiGridProps> = ({ kpis }) => {
  if (!kpis || kpis.length === 0) return null;

  const renderMiniSparkline = (points?: number[] | null, isUp = true) => {
    if (!points || points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 64;
    const height = 24;

    const coords = points.map((p, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    });

    const strokeColor = isUp ? '#7A8450' : '#A8452F';

    return (
      <svg width={width} height={height} className="shrink-0 overflow-visible">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={coords.join(' ')}
        />
      </svg>
    );
  };

  return (
    <div className="mb-8" id="section-kpis">
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="font-serif text-lg font-bold text-earth-deep tracking-tight">
          At a Glance: Key Performance Indicators
        </h2>
        <span className="text-xs text-earth-muted">
          Computed deterministically in code
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const isUp = kpi.trend === 'up';
          const isDown = kpi.trend === 'down';

          return (
            <div
              key={`${kpi.label}-${idx}`}
              className="bg-earth-surface border border-earth-sand rounded-2xl p-5 shadow-warm hover:border-earth-primary/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-earth-muted truncate">
                    {kpi.label}
                  </span>
                  {kpi.change && (
                    <span
                      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-bold shrink-0 ${
                        isUp
                          ? 'bg-earth-olive/15 text-earth-olive'
                          : isDown
                          ? 'bg-earth-clay/15 text-earth-clay'
                          : 'bg-earth-sand/60 text-earth-deep'
                      }`}
                    >
                      {isUp ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : isDown ? (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      ) : (
                        <Minus className="w-3.5 h-3.5" />
                      )}
                      <span>{kpi.change}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between gap-2 my-2">
                  <div className="font-serif text-2xl sm:text-3xl font-bold text-earth-deep tracking-tight">
                    {kpi.value}
                  </div>
                  {renderMiniSparkline(kpi.sparkline, isUp)}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-earth-sand/60 flex items-center gap-1.5 text-[11px] text-earth-muted truncate">
                <Database className="w-3 h-3 text-earth-primary shrink-0" />
                <span className="truncate" title={kpi.sourceRef}>
                  {kpi.sourceRef}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
