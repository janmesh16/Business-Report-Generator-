import React from 'react';
import { Target, Zap, ArrowRight, Link as LinkIcon } from 'lucide-react';
import { Recommendation } from '../../types';

interface RecommendationListProps {
  recommendations: Recommendation[];
}

export const RecommendationList: React.FC<RecommendationListProps> = ({ recommendations }) => {
  if (!recommendations || recommendations.length === 0) return null;

  const priorityConfig = {
    high: {
      badge: 'bg-earth-clay/15 text-earth-clay border-earth-clay/30',
      border: 'border-l-4 border-l-earth-clay',
      label: 'High Priority',
    },
    medium: {
      badge: 'bg-earth-terracotta/15 text-earth-terracotta border-earth-terracotta/30',
      border: 'border-l-4 border-l-earth-terracotta',
      label: 'Medium Priority',
    },
    low: {
      badge: 'bg-earth-olive/15 text-earth-olive border-earth-olive/30',
      border: 'border-l-4 border-l-earth-olive',
      label: 'Low Priority',
    },
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-earth-primary" />
        <h2 className="font-serif text-xl font-bold text-earth-deep tracking-tight">
          Prioritized Strategic Recommendations
        </h2>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec, idx) => {
          const config = priorityConfig[rec.priority] || priorityConfig.medium;

          return (
            <div
              key={idx}
              className={`bg-earth-surface border border-earth-sand rounded-2xl p-5 sm:p-6 shadow-warm ${config.border} print-avoid-break`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-earth-sand flex items-center justify-center text-xs font-bold text-earth-deep font-mono">
                    {idx + 1}
                  </span>
                  <h4 className="font-serif text-base sm:text-lg font-bold text-earth-deep">
                    {rec.action}
                  </h4>
                </div>

                <span
                  className={`self-start sm:self-auto text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${config.badge}`}
                >
                  {config.label}
                </span>
              </div>

              {/* Rationale */}
              <p className="text-sm text-earth-deep leading-relaxed mb-3">
                <strong className="text-earth-muted">Rationale: </strong>
                {rec.rationale}
              </p>

              {/* Expected Impact & Linked Findings */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-earth-sand/60 text-xs">
                <div className="flex items-center gap-1.5 text-earth-olive font-semibold">
                  <Zap className="w-4 h-4 shrink-0" />
                  <span>Expected Impact: {rec.expectedImpact}</span>
                </div>

                {rec.linkedFindingIds && rec.linkedFindingIds.length > 0 && (
                  <div className="flex items-center gap-1.5 text-earth-muted">
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Justified by: </span>
                    <div className="flex gap-1">
                      {rec.linkedFindingIds.map((id) => (
                        <span
                          key={id}
                          className="px-2 py-0.5 rounded bg-earth-bg border border-earth-sand font-mono text-[11px] text-earth-deep font-semibold"
                        >
                          {id}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

