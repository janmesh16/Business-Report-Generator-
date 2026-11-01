import React from 'react';
import { Compass } from 'lucide-react';

interface ExecutiveSummaryProps {
  summary: string;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ summary }) => {
  return (
    <div className="bg-earth-surface border border-earth-sand rounded-3xl p-6 sm:p-8 shadow-warm mb-8">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-xl bg-earth-terracotta/15 flex items-center justify-center text-earth-terracotta">
          <Compass className="w-4 h-4" />
        </div>
        <h2 className="font-serif text-xl font-bold text-earth-deep tracking-tight">
          Executive Summary
        </h2>
      </div>

      <p className="text-earth-deep text-sm sm:text-base leading-relaxed whitespace-pre-line font-sans">
        {summary}
      </p>
    </div>
  );
};

