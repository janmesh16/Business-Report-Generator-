import React from 'react';
import { X, Table, FileText, CheckCircle2, AlertCircle, Eye } from 'lucide-react';

interface DataPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previews: any[];
}

export const DataPreviewModal: React.FC<DataPreviewModalProps> = ({
  isOpen,
  onClose,
  previews,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-earth-deep/60 backdrop-blur-xs">
      <div className="bg-earth-surface border border-earth-sand rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-warm-lg max-h-[85vh] flex flex-col justify-between animate-in fade-in zoom-in-95">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-earth-sand">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-earth-primary" />
              <div>
                <h3 className="font-serif text-lg font-bold text-earth-deep">
                  Ingestion Data Preview & Column Profiling
                </h3>
                <p className="text-xs text-earth-muted">
                  Inspect parsed tables, detected datatypes, and sample rows before running full analysis
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-earth-muted hover:text-earth-deep hover:bg-earth-sand/40"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="mt-4 space-y-6 overflow-y-auto max-h-[60vh] pr-1">
            {previews.length === 0 ? (
              <div className="py-8 text-center text-sm text-earth-muted">
                No files or data provided yet to preview.
              </div>
            ) : (
              previews.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-earth-bg border border-earth-sand space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.type === 'csv' || item.type === 'excel' ? (
                        <Table className="w-4 h-4 text-earth-olive" />
                      ) : (
                        <FileText className="w-4 h-4 text-earth-terracotta" />
                      )}
                      <span className="font-bold text-sm text-earth-deep">{item.name}</span>
                    </div>
                    {item.qualityScore !== undefined && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-earth-sand text-earth-deep">
                        Quality Score: {item.qualityScore}/100
                      </span>
                    )}
                  </div>

                  {/* Tabular Preview */}
                  {item.previewRows && item.previewRows.length > 0 ? (
                    <div>
                      {/* Column Types Tag Strip */}
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {item.headers?.map((h: string) => (
                          <span
                            key={h}
                            className="text-[10px] px-2 py-0.5 rounded bg-earth-surface border border-earth-sand text-earth-deep"
                          >
                            <strong>{h}</strong>: {item.columnTypes?.[h] || 'unknown'}
                          </span>
                        ))}
                      </div>

                      <div className="overflow-x-auto border border-earth-sand rounded-xl bg-earth-surface">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-earth-sand/40 border-b border-earth-sand text-earth-deep font-semibold">
                            <tr>
                              {item.headers?.map((h: string) => (
                                <th key={h} className="p-2 truncate">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-earth-sand/60">
                            {item.previewRows.map((r: any, rIdx: number) => (
                              <tr key={rIdx} className="hover:bg-earth-sand/20">
                                {item.headers?.map((h: string) => (
                                  <td key={h} className="p-2 text-earth-deep truncate max-w-[120px]">
                                    {String(r[h] ?? '')}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    // Text Snippet Preview
                    <div className="p-3 bg-earth-surface rounded-xl border border-earth-sand text-xs font-mono text-earth-deep whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {item.textSnippet || 'No previewable text.'}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-earth-sand flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-earth-primary text-white text-xs font-semibold hover:bg-earth-deep transition-colors"
          >
            Done Previewing
          </button>
        </div>
      </div>
    </div>
  );
};
