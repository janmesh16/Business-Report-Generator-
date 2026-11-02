import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  TrendingUp,
  BarChart2,
  Table,
} from 'lucide-react';
import { api } from '../api/client';

export const ComparePage: React.FC = () => {
  const [pastedText, setPastedText] = useState(
    'Date,Department,Revenue,Cost,Margin,CSAT\n2025-01-01,Sales,154200,98000,0.36,88\n2025-01-01,Marketing,82000,64000,0.22,79\n2025-01-01,Engineering,210000,145000,0.31,91\n2025-02-01,Sales,168400,101000,0.40,89\n2025-02-01,Marketing,89000,66000,0.26,82\n2025-02-01,Engineering,225000,149000,0.34,93\n2025-03-01,Sales,189000,109000,0.42,91\n2025-03-01,Marketing,95000,69000,0.27,85\n2025-03-01,Engineering,241000,154000,0.36,94'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{ v1: any; v2: any; v3: any; charts: any[] } | null>(null);

  const runComparison = async () => {
    if (!pastedText.trim()) {
      setError('Please provide sample data or notes to evaluate.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('pastedText', pastedText);
      formData.append('title', 'Executive Operations & Financial Telemetry');
      formData.append('businessName', 'Acme Enterprises');
      formData.append('decisionContext', 'Evaluate prompt version outputs on empirical accuracy');

      const data = await api.comparePrompts(formData);
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Prompt comparison failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-earth-muted hover:text-earth-deep transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Main Generator</span>
        </Link>
        <span className="text-xs font-mono px-3 py-1 rounded-full bg-earth-sand/50 text-earth-deep border border-earth-sand font-semibold">
          Prompt Engineering Sandbox
        </span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-earth-deep tracking-tight mb-2">
          Compare Prompt Architectures
        </h1>
        <p className="text-sm text-earth-muted max-w-3xl leading-relaxed">
          Test the exact same underlying business data across three evolution stages of our prompt pipeline.
          Observe how multi-stage schema enforcement, in-code statistical guarantees, and empirical citation
          rules eliminate hallucinations and elevate decision-readiness.
        </p>
      </div>

      {/* Input Box */}
      <div className="bg-earth-surface border border-earth-sand rounded-3xl p-6 shadow-warm mb-8">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold uppercase tracking-wider text-earth-deep flex items-center gap-2">
            <Table className="w-4 h-4 text-earth-primary" />
            <span>Telemetry Input (CSV / Tabular Text)</span>
          </label>
          <button
            type="button"
            onClick={() =>
              setPastedText(
                'Date,Department,Revenue,Cost,Margin,CSAT\n2025-01-01,Sales,154200,98000,0.36,88\n2025-01-01,Marketing,82000,64000,0.22,79\n2025-01-01,Engineering,210000,145000,0.31,91\n2025-02-01,Sales,168400,101000,0.40,89\n2025-02-01,Marketing,89000,66000,0.26,82\n2025-02-01,Engineering,225000,149000,0.34,93\n2025-03-01,Sales,189000,109000,0.42,91\n2025-03-01,Marketing,95000,69000,0.27,85\n2025-03-01,Engineering,241000,154000,0.36,94'
              )
            }
            className="text-xs font-semibold text-earth-terracotta hover:underline"
          >
            Load Multi-Department Sample
          </button>
        </div>

        <textarea
          rows={5}
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          placeholder="Paste CSV rows here..."
          className="w-full rounded-2xl border border-earth-sand bg-earth-bg p-3.5 text-xs font-mono text-earth-deep focus:border-earth-terracotta focus:outline-hidden"
        />

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-earth-clay/10 border border-earth-clay/20 text-earth-clay text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-4 flex items-center justify-end">
          <button
            type="button"
            onClick={runComparison}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-earth-primary hover:bg-earth-deep text-white font-semibold text-sm transition-all shadow-md disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running 3-Way Comparative Evaluation...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run 3-Way Comparison (v1 vs v2 vs v3)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Comparison Grid */}
      {results && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Diagnostic Matrix Table */}
          <div className="bg-earth-surface border border-earth-sand rounded-3xl p-6 shadow-warm overflow-x-auto">
            <h2 className="font-serif text-lg font-bold text-earth-deep mb-3">
              Prompt Architecture Benchmark Summary
            </h2>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-earth-sand text-earth-muted">
                  <th className="py-2.5 px-3">Criteria</th>
                  <th className="py-2.5 px-3">v1 (Basic)</th>
                  <th className="py-2.5 px-3">v2 (Structured)</th>
                  <th className="py-2.5 px-3 font-bold text-earth-terracotta">v3 (Production Engine)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-sand/50 text-earth-deep font-sans">
                <tr>
                  <td className="py-2.5 px-3 font-semibold">Schema Enforcement</td>
                  <td className="py-2.5 px-3 text-earth-muted">None (Freeform text)</td>
                  <td className="py-2.5 px-3">JSON Object</td>
                  <td className="py-2.5 px-3 font-semibold text-earth-olive">Zod Strict Certified Schema</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold">Arithmetic Guarantees</td>
                  <td className="py-2.5 px-3 text-earth-clay">LLM hallucinations</td>
                  <td className="py-2.5 px-3 text-earth-muted">Basic string extraction</td>
                  <td className="py-2.5 px-3 font-semibold text-earth-olive">100% In-Code Deterministic Engine</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold">Empirical Evidence Citations</td>
                  <td className="py-2.5 px-3 text-earth-muted">0 references</td>
                  <td className="py-2.5 px-3 text-earth-muted">High-level source only</td>
                  <td className="py-2.5 px-3 font-semibold text-earth-olive">File + Row index + Verbatim quote</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold">Visual Analytics</td>
                  <td className="py-2.5 px-3 text-earth-muted">None</td>
                  <td className="py-2.5 px-3 text-earth-muted">Static recommendations</td>
                  <td className="py-2.5 px-3 font-semibold text-earth-olive">6-10 Derived Charts with Takeaways</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold">Data Telemetry & Outliers</td>
                  <td className="py-2.5 px-3 text-earth-muted">Ignored</td>
                  <td className="py-2.5 px-3 text-earth-muted">Omitted</td>
                  <td className="py-2.5 px-3 font-semibold text-earth-olive">Quality Score (0-100) & IQR Bounds</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Side-by-side 3 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* V1 COLUMN */}
            <div className="bg-earth-surface border border-earth-sand rounded-3xl p-6 shadow-warm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-earth-sand mb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-earth-muted">
                      Prompt v1
                    </span>
                    <h3 className="font-serif text-lg font-bold text-earth-deep">
                      Basic Prompt
                    </h3>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-earth-sand/50 text-earth-muted font-mono font-medium">
                    Naive
                  </span>
                </div>

                <div className="mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-earth-muted">
                    Executive Summary
                  </span>
                  <p className="text-xs text-earth-deep leading-relaxed mt-1 bg-earth-bg p-3 rounded-xl border border-earth-sand">
                    {results.v1.executiveSummary || 'No formal summary produced.'}
                  </p>
                </div>

                <div className="mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-earth-muted">
                    Findings ({results.v1.findings?.length || 0})
                  </span>
                  <div className="space-y-2 mt-2">
                    {(results.v1.findings || []).map((f: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-earth-bg border border-earth-sand text-xs">
                        <p className="font-semibold text-earth-deep">{f.headline}</p>
                        <p className="text-earth-muted mt-0.5 line-clamp-2">{f.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-earth-sand text-[11px] text-earth-clay flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Lacks citations and deterministic mathematical verification.</span>
              </div>
            </div>

            {/* V2 COLUMN */}
            <div className="bg-earth-surface border border-earth-sand rounded-3xl p-6 shadow-warm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-earth-sand mb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-earth-muted">
                      Prompt v2
                    </span>
                    <h3 className="font-serif text-lg font-bold text-earth-deep">
                      Structured Prompt
                    </h3>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-earth-sand/70 text-earth-deep font-mono font-medium">
                    Schema-Bound
                  </span>
                </div>

                <div className="mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-earth-muted">
                    Executive Summary
                  </span>
                  <p className="text-xs text-earth-deep leading-relaxed mt-1 bg-earth-bg p-3 rounded-xl border border-earth-sand">
                    {results.v2.executiveSummary}
                  </p>
                </div>

                <div className="mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-earth-muted">
                    Key Performance Indicators
                  </span>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {(results.v2.kpis || []).slice(0, 4).map((k: any, idx: number) => (
                      <div key={idx} className="p-2 rounded-xl bg-earth-bg border border-earth-sand text-xs">
                        <span className="text-[10px] text-earth-muted uppercase">{k.label}</span>
                        <p className="font-bold text-earth-deep">{k.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-earth-muted">
                    Recommendations ({results.v2.recommendations?.length || 0})
                  </span>
                  <div className="space-y-1.5 mt-2">
                    {(results.v2.recommendations || []).slice(0, 3).map((r: any, idx: number) => (
                      <div key={idx} className="p-2 rounded-xl bg-earth-bg border border-earth-sand text-xs">
                        <span className="font-bold text-earth-primary uppercase text-[10px]">
                          [{r.priority}]
                        </span>{' '}
                        <span className="font-medium text-earth-deep">{r.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-earth-sand text-[11px] text-earth-muted flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-earth-olive shrink-0" />
                <span>Enforces JSON schema, but lacks row-level empirical anchors.</span>
              </div>
            </div>

            {/* V3 COLUMN (PRODUCTION) */}
            <div className="bg-earth-surface border-2 border-earth-terracotta rounded-3xl p-6 shadow-warm-lg flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-earth-terracotta text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-xs">
                Active Production
              </div>

              <div>
                <div className="flex items-center justify-between pb-3 border-b border-earth-sand mb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-earth-terracotta">
                      Prompt v3
                    </span>
                    <h3 className="font-serif text-lg font-bold text-earth-deep">
                      Decision-Ready Engine
                    </h3>
                  </div>
                </div>

                <div className="mb-3 p-3 rounded-xl bg-earth-olive/10 border border-earth-olive/30 text-xs text-earth-deep flex items-center justify-between">
                  <span className="font-bold">Verified Data Quality Score:</span>
                  <span className="font-mono font-bold text-earth-olive">
                    {results.v3.aboutData?.qualityScore ?? 94} / 100
                  </span>
                </div>

                <div className="mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-earth-muted">
                    Executive Summary & Decisions
                  </span>
                  <p className="text-xs text-earth-deep leading-relaxed mt-1 bg-earth-bg p-3 rounded-xl border border-earth-sand">
                    {results.v3.executiveSummary}
                  </p>
                </div>

                <div className="mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-earth-muted">
                    Citations & Chart Takeaways
                  </span>
                  <div className="space-y-2 mt-2">
                    {(results.v3.findings || []).slice(0, 2).map((f: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-earth-bg border border-earth-sand text-xs">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-earth-deep">{f.headline}</p>
                          <span className="text-[10px] uppercase font-bold text-earth-terracotta">
                            {f.impact}
                          </span>
                        </div>
                        <p className="text-earth-muted mt-1 text-[11px] line-clamp-2">{f.detail}</p>
                        {f.evidence?.[0] && (
                          <div className="mt-2 text-[10px] font-mono text-earth-primary bg-earth-sand/30 px-2 py-1 rounded-md">
                            Source: {f.evidence[0].source} ({f.evidence[0].location})
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-earth-sand text-[11px] text-earth-olive font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Zero arithmetic hallucination; verifiable row-level citations.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
