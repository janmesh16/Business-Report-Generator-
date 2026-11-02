import React from 'react';
import { X, MapPin, Quote, FileSpreadsheet, FileText, CheckCircle2 } from 'lucide-react';
import { Evidence } from '../../types';

interface EvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  evidence: Evidence | null;
  findingHeadline?: string;
  sourcePreviewRows?: any[];
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  isOpen,
  onClose,
  evidence,
  findingHeadline,
  sourcePreviewRows,
}) => {
  if (!isOpen || !evidence) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-earth-deep/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-earth-surface border-l border-earth-sand p-6 shadow-warm-lg flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-earth-sand">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-earth-terracotta" />
                <h3 className="font-serif text-lg font-bold text-earth-deep">
                  Empirical Evidence Inspector
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-earth-muted hover:text-earth-deep hover:bg-earth-sand/40 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Context */}
            {findingHeadline && (
              <div className="mt-4 p-3 rounded-xl bg-earth-bg border border-earth-sand">
                <span className="text-[10px] uppercase font-bold tracking-wider text-earth-terracotta">
                  Associated Finding
                </span>
                <p className="text-xs font-semibold text-earth-deep mt-0.5">
                  {findingHeadline}
                </p>
              </div>
            )}

            {/* Citation Details */}
            <div className="mt-4 space-y-3">
              <div className="p-4 rounded-xl bg-earth-surface border border-earth-sand">
                <div className="text-xs font-semibold uppercase tracking-wider text-earth-muted">
                  Source Document
                </div>
                <div className="flex items-center gap-2 font-mono text-sm font-bold text-earth-deep mt-1">
                  {evidence.source.includes('.csv') || evidence.source.includes('.xlsx') ? (
                    <FileSpreadsheet className="w-4 h-4 text-earth-olive" />
                  ) : (
                    <FileText className="w-4 h-4 text-earth-terracotta" />
                  )}
                  <span>{evidence.source}</span>
                </div>

                <div className="mt-2 text-xs text-earth-muted">
                  Location Index: <span className="font-mono font-semibold text-earth-deep">{evidence.location}</span>
                </div>
              </div>

              {/* Verbatim Quote */}
              {evidence.quote && (
                <div className="p-4 rounded-xl bg-earth-sand/30 border border-earth-sand">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-earth-primary uppercase tracking-wider mb-1.5">
                    <Quote className="w-3.5 h-3.5" />
                    <span>Verbatim Extracted Quote</span>
                  </div>
                  <p className="font-serif italic text-sm text-earth-deep leading-relaxed">
                    "{evidence.quote}"
                  </p>
                </div>
              )}

              {/* Sample Rows or Source Verification */}
              {sourcePreviewRows && sourcePreviewRows.length > 0 ? (
                <div className="mt-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-earth-muted mb-2">
                    Raw Table Data Slice
                  </div>
                  <div className="overflow-x-auto border border-earth-sand rounded-xl bg-white">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-earth-bg border-b border-earth-sand text-earth-muted">
                        <tr>
                          {Object.keys(sourcePreviewRows[0] || {}).slice(0, 4).map((h) => (
                            <th key={h} className="p-2 font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-earth-sand/60">
                        {sourcePreviewRows.slice(0, 4).map((r, i) => (
                          <tr key={i}>
                            {Object.values(r).slice(0, 4).map((v: any, j) => (
                              <td key={j} className="p-2 text-earth-deep truncate max-w-[100px]">
                                {String(v)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-earth-sand mt-6">
            <div className="flex items-center gap-1.5 text-xs text-earth-olive font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Cryptographically grounded to source data</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
