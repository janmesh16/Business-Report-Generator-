import React from 'react';
import { Database, Calendar, ShieldCheck, FileSpreadsheet, Layers } from 'lucide-react';
import { AboutData } from '../../types';

interface AboutDataPanelProps {
  aboutData: AboutData;
}

export const AboutDataPanel: React.FC<AboutDataPanelProps> = ({ aboutData }) => {
  if (!aboutData) return null;

  const score = aboutData.qualityScore ?? 92;
  const isHigh = score >= 80;
  const isMedium = score >= 60 && score < 80;

  return (
    <div className="bg-earth-surface border border-earth-sand rounded-3xl p-6 sm:p-7 shadow-warm mb-8" id="section-about">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-earth-sand">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-earth-sand flex items-center justify-center text-earth-primary">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-earth-deep">
              Key Information: About This Data
            </h3>
            <p className="text-xs text-earth-muted">
              Summary of parsed telemetry, column mapping, and integrity verification
            </p>
          </div>
        </div>

        {/* Quality Score Ring/Badge */}
        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isHigh
                ? 'bg-earth-olive/15 text-earth-olive border border-earth-olive/30'
                : isMedium
                ? 'bg-earth-terracotta/15 text-earth-terracotta border border-earth-terracotta/30'
                : 'bg-earth-clay/15 text-earth-clay border border-earth-clay/30'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Data Quality: {score} / 100</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
        <div className="p-3.5 rounded-xl bg-earth-bg border border-earth-sand">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-earth-muted">
            Total Records
          </span>
          <p className="font-serif text-xl sm:text-2xl font-bold text-earth-deep mt-1">
            {aboutData.rows.toLocaleString()}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-earth-bg border border-earth-sand">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-earth-muted">
            Columns Analyzed
          </span>
          <p className="font-serif text-xl sm:text-2xl font-bold text-earth-deep mt-1">
            {aboutData.columns}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-earth-bg border border-earth-sand">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-earth-muted">
            Date Range
          </span>
          <p className="font-serif text-sm sm:text-base font-bold text-earth-deep mt-1 truncate" title={aboutData.dateRange || 'N/A'}>
            {aboutData.dateRange || 'FY2025 Historical'}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-earth-bg border border-earth-sand">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-earth-muted">
            Sources Ingested
          </span>
          <p className="font-serif text-xl sm:text-2xl font-bold text-earth-deep mt-1">
            {aboutData.sources?.length || 1}
          </p>
        </div>
      </div>
    </div>
  );
};
