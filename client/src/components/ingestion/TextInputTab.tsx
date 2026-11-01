import React from 'react';
import { AlignLeft, HelpCircle } from 'lucide-react';

interface TextInputTabProps {
  pastedText: string;
  onPastedTextChange: (text: string) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
}

export const TextInputTab: React.FC<TextInputTabProps> = ({
  pastedText,
  onPastedTextChange,
  notes,
  onNotesChange,
}) => {
  return (
    <div className="space-y-6">
      {/* Tabular Data Textarea */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-semibold text-earth-deep">
            <AlignLeft className="w-4 h-4 text-earth-primary" />
            <span>Paste Raw Data / CSV Snippet</span>
          </label>
          <span className="text-xs text-earth-muted">
            Tab-separated or comma-separated rows
          </span>
        </div>
        <textarea
          rows={6}
          value={pastedText}
          onChange={(e) => onPastedTextChange(e.target.value)}
          placeholder={`Date,Category,Region,Revenue,Units\n2025-01-15,Consulting,North America,45000,12\n2025-02-20,SaaS,Europe,85000,40\n2025-03-10,Enterprise,North America,120000,15`}
          className="w-full p-3.5 rounded-2xl bg-earth-surface border border-earth-sand text-earth-deep text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-earth-terracotta transition-shadow placeholder:text-earth-muted/60"
        />
      </div>

      {/* Strategic Notes Textarea */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-semibold text-earth-deep">
            <HelpCircle className="w-4 h-4 text-earth-terracotta" />
            <span>Meeting Notes / Executive Context</span>
          </label>
          <span className="text-xs text-earth-muted">
            Transcripts, team updates, known blockers
          </span>
        </div>
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="e.g. Leadership decided to pause European expansion due to regulatory friction. Need to cut onboarding turnaround by 30% before Q4 renewal contracts."
          className="w-full p-3.5 rounded-2xl bg-earth-surface border border-earth-sand text-earth-deep text-sm focus:outline-hidden focus:ring-2 focus:ring-earth-terracotta transition-shadow placeholder:text-earth-muted/60"
        />
      </div>
    </div>
  );
};

