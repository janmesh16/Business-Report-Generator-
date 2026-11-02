import React from 'react';
import { BarChart3, PieChart as PieIcon, LineChart as LineIcon } from 'lucide-react';
import { ChartCandidate } from '../../types';
import { ChartRenderer } from './ChartRenderer';

interface VisualAnalysisSectionProps {
  candidateCharts: ChartCandidate[];
  linkedChartIds: string[];
  isPrintMode?: boolean;
}

export const VisualAnalysisSection: React.FC<VisualAnalysisSectionProps> = ({
  candidateCharts = [],
  linkedChartIds = [],
  isPrintMode = false,
}) => {
  const linkedSet = new Set(linkedChartIds);
  const remainingCharts = candidateCharts.filter((c) => !linkedSet.has(c.id));

  if (remainingCharts.length === 0) return null;

  // Group remaining charts by theme
  const themes: Record<string, ChartCandidate[]> = {};
  for (const chart of remainingCharts) {
    const t = chart.categoryTheme || 'General Business Analytics';
    if (!themes[t]) themes[t] = [];
    themes[t].push(chart);
  }

  return (
    <div className="mb-8" id="section-visuals">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="w-5 h-5 text-earth-primary" />
        <h2 className="font-serif text-xl font-bold text-earth-deep tracking-tight">
          Visual Analysis & Diagnostic Deep Dives
        </h2>
      </div>
      <p className="text-xs text-earth-muted mb-6">
        Supplementary statistical models, distribution profiles, and operational workflows generated from the raw inputs
      </p>

      <div className="space-y-8">
        {Object.entries(themes).map(([themeName, charts]) => (
          <div key={themeName} className="space-y-4">
            <div className="flex items-center gap-2 border-b border-earth-sand pb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-earth-terracotta" />
              <h3 className="font-serif text-base font-bold text-earth-deep">
                {themeName}
              </h3>
              <span className="text-xs text-earth-muted">
                ({charts.length} Visualisation{charts.length > 1 ? 's' : ''})
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {charts.map((chart) => (
                <ChartRenderer key={chart.id} chart={chart} isPrintMode={isPrintMode} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
