import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Database } from 'lucide-react';
import { Kpi } from '../../types';

interface KpiGridProps {
  kpis: Kpi[];
}

export const KpiGrid: React.FC<KpiGridProps> = ({ kpis }) => {
  if (!kpis || kpis.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="font-serif text-lg font-bold text-earth-deep mb-3.5 tracking-tight">
        Key Performance Indicators
      </h2>

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
                  <span className="text-xs font-semibold uppercase tracking-wider text-earth-muted">
                    {kpi.label}
                  </span>
                  {kpi.change && (
                    <span
                      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-bold ${
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

                <div className="font-serif text-2xl sm:text-3xl font-bold text-earth-deep tracking-tight my-2">
                  {kpi.value}
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

