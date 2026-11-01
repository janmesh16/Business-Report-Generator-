import React, { useState } from 'react';
import { X, Layers, Check } from 'lucide-react';

interface SheetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  onSelectSheet: (sheetName: string) => void;
  currentSheet?: string;
}

export const SheetSelectorModal: React.FC<SheetSelectorModalProps> = ({
  isOpen,
  onClose,
  fileName,
  onSelectSheet,
  currentSheet,
}) => {
  const [customSheet, setCustomSheet] = useState(currentSheet || '');

  if (!isOpen) return null;

  // Common sheet names in financial/business Excel workbooks
  const presetSheets = [
    'Profit_and_Loss',
    'Balance_Sheet',
    'Department_Expenses',
    'Summary',
    'Monthly Sales',
    'Revenue',
    'Q1-Q4',
  ];

  const handleApply = (name: string) => {
    onSelectSheet(name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-earth-deep/50 backdrop-blur-xs">
      <div className="bg-earth-surface border border-earth-sand rounded-2xl max-w-md w-full p-6 shadow-warm-lg animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-earth-sand">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-earth-primary" />
            <h3 className="font-serif text-lg font-semibold text-earth-deep">
              Select Worksheet
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-earth-muted hover:text-earth-deep hover:bg-earth-sand/40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4">
          <p className="text-sm text-earth-muted mb-3">
            Choose which worksheet inside <strong className="text-earth-deep">{fileName}</strong> to analyze:
          </p>

          <div className="space-y-1.5 max-h-48 overflow-y-auto mb-4">
            {presetSheets.map((sheet) => (
              <button
                key={sheet}
                type="button"
                onClick={() => handleApply(sheet)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm text-left transition-colors ${
                  customSheet === sheet
                    ? 'bg-earth-sand text-earth-deep font-semibold'
                    : 'hover:bg-earth-bg text-earth-text'
                }`}
              >
                <span>{sheet}</span>
                {customSheet === sheet && <Check className="w-4 h-4 text-earth-primary" />}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-earth-sand">
            <label className="block text-xs font-semibold text-earth-muted uppercase tracking-wider mb-1.5">
              Or type exact sheet name:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Q3_Final_Forecast"
                value={customSheet}
                onChange={(e) => setCustomSheet(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-earth-bg border border-earth-sand text-sm text-earth-deep focus:outline-hidden focus:ring-2 focus:ring-earth-terracotta"
              />
              <button
                type="button"
                onClick={() => handleApply(customSheet || 'Profit_and_Loss')}
                className="px-4 py-2 rounded-xl bg-earth-primary text-earth-surface text-sm font-semibold hover:bg-earth-deep transition-colors"
              >
                Set Sheet
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

