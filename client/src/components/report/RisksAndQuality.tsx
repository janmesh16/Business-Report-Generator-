import React from 'react';
import { AlertTriangle, CheckSquare, ShieldAlert } from 'lucide-react';
import { DataQuality } from '../../types';

interface RisksAndQualityProps {
  risksAndCaveats: string[];
  dataQuality: DataQuality;
}

export const RisksAndQuality: React.FC<RisksAndQualityProps> = ({
  risksAndCaveats,
  dataQuality,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 print-avoid-break">
      {/* Risks & Caveats */}
      <div className="bg-earth-surface border border-earth-sand rounded-3xl p-6 shadow-warm">
        <div className="flex items-center gap-2 mb-3.5">
          <AlertTriangle className="w-5 h-5 text-earth-clay" />
          <h3 className="font-serif text-lg font-bold text-earth-deep">
            Risks, Caveats & Limitations
          </h3>
        </div>

        <ul className="space-y-2.5 text-sm text-earth-deep">
          {risksAndCaveats.map((risk, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-earth-clay mt-2 shrink-0" />
              <span className="leading-relaxed">{risk}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Data Quality & Integrity */}
      <div className="bg-earth-surface border border-earth-sand rounded-3xl p-6 shadow-warm">
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-earth-terracotta" />
            <h3 className="font-serif text-lg font-bold text-earth-deep">
              Data Integrity Assessment
            </h3>
          </div>
          <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-earth-sand text-earth-deep">
            {dataQuality.confidence} Quality
          </span>
        </div>

        <ul className="space-y-2.5 text-sm text-earth-deep">
          {dataQuality.issues.map((issue, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <CheckSquare className="w-4 h-4 text-earth-olive mt-0.5 shrink-0" />
              <span className="leading-relaxed">{issue}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

