import React, { useState } from 'react';
import { Table, ChevronDown, ChevronUp } from 'lucide-react';

interface StatsAppendixProps {
  computedStats: any;
}

export const StatsAppendix: React.FC<StatsAppendixProps> = ({ computedStats }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!computedStats || !computedStats.tables || computedStats.tables.length === 0) {
    return null;
  }

  return (
    <div className="bg-earth-surface border border-earth-sand rounded-3xl p-6 sm:p-7 shadow-warm mb-8 print-avoid-break">
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2.5">
          <Table className="w-5 h-5 text-earth-primary" />
          <div>
            <h3 className="font-serif text-lg font-bold text-earth-deep">
              Appendix: Verified Statistical Computations
            </h3>
            <p className="text-xs text-earth-muted">
              Deterministic mathematical aggregations computed in code (Zero LLM extrapolation)
            </p>
          </div>
        </div>

        <button
          type="button"
          className="p-2 rounded-xl hover:bg-earth-sand/40 text-earth-muted hover:text-earth-deep transition-colors"
        >
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-6 pt-6 border-t border-earth-sand space-y-6">
          {computedStats.tables.map((table: any, idx: number) => (
            <div key={idx} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-earth-deep">
                  Dataset: {table.sourceName} {table.sheetName ? `(${table.sheetName})` : ''}
                </h4>
                <span className="text-xs text-earth-muted">
                  {table.totalRows} Total Rows
                </span>
              </div>

              {/* Numeric Column Summaries */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-earth-sand rounded-xl overflow-hidden">
                  <thead className="bg-earth-bg border-b border-earth-sand text-earth-muted uppercase tracking-wider">
                    <tr>
                      <th className="p-2.5 font-semibold">Column</th>
                      <th className="p-2.5 font-semibold text-right">Sum</th>
                      <th className="p-2.5 font-semibold text-right">Mean</th>
                      <th className="p-2.5 font-semibold text-right">Median</th>
                      <th className="p-2.5 font-semibold text-right">Min</th>
                      <th className="p-2.5 font-semibold text-right">Max</th>
                      <th className="p-2.5 font-semibold text-right">StdDev</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-earth-sand/60 bg-earth-surface">
                    {Object.values(table.numericSummaries || {}).map((num: any) => (
                      <tr key={num.column} className="hover:bg-earth-sand/20">
                        <td className="p-2.5 font-semibold text-earth-deep">{num.column}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-earth-primary">
                          {num.sum.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-mono text-earth-deep">
                          {num.mean.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-mono text-earth-deep">
                          {num.median.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-mono text-earth-deep">
                          {num.min.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-mono text-earth-deep">
                          {num.max.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-mono text-earth-muted">
                          {num.stdDev.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

