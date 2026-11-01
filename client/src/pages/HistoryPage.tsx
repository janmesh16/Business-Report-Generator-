import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Trash2,
  Share2,
  ExternalLink,
  ShieldOff,
  Calendar,
  Building2,
  PlusCircle,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { api } from '../api/client';
import { PastReportSummary } from '../types';

export const HistoryPage: React.FC = () => {
  const [reports, setReports] = useState<PastReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await api.getAllReports();
      setReports(data);
    } catch (err) {
      console.error('Failed to load past reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      await api.deleteReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleToggleShare = async (report: PastReportSummary, e: React.MouseEvent) => {
    e.preventDefault();
    if (report.share_token) {
      // Revoke
      await api.revokeShare(report.id);
    } else {
      // Create
      await api.shareReport(report.id);
    }
    fetchReports();
  };

  const handleCopyLink = (token: string, e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.origin}/r/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(token);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-earth-deep tracking-tight">
            Generated Reports History
          </h1>
          <p className="text-sm text-earth-muted mt-1">
            Access past reports, download exports, or manage public share links.
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-earth-terracotta hover:bg-earth-deep text-white text-sm font-semibold transition-colors shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Report</span>
        </Link>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 text-earth-terracotta animate-spin mx-auto mb-3" />
          <p className="text-sm text-earth-muted">Loading report history...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-earth-surface border border-earth-sand rounded-3xl p-12 text-center shadow-warm">
          <div className="w-14 h-14 rounded-2xl bg-earth-sand/60 text-earth-primary flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="font-serif text-xl font-bold text-earth-deep mb-2">No Reports Generated Yet</h3>
          <p className="text-sm text-earth-muted max-w-md mx-auto mb-6">
            Upload your first spreadsheet or paste meeting notes to generate a structured executive report.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-earth-primary text-white text-sm font-semibold hover:bg-earth-deep transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Generate First Report</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3.5">
          {reports.map((report) => {
            const hasShare = Boolean(report.share_token);

            return (
              <div
                key={report.id}
                className="bg-earth-surface border border-earth-sand rounded-2xl p-5 shadow-warm hover:border-earth-primary/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        report.status === 'completed'
                          ? 'bg-earth-olive/15 text-earth-olive'
                          : report.status === 'failed'
                          ? 'bg-earth-clay/15 text-earth-clay'
                          : 'bg-earth-sand text-earth-deep'
                      }`}
                    >
                      {report.status}
                    </span>

                    {hasShare && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-earth-terracotta/15 text-earth-terracotta">
                        <Share2 className="w-3 h-3" /> Shared
                      </span>
                    )}

                    <div className="flex items-center gap-1 text-xs text-earth-muted ml-2">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(report.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Link
                    to={`/reports/${report.id}`}
                    className="font-serif text-lg font-bold text-earth-deep hover:text-earth-terracotta transition-colors line-clamp-1"
                  >
                    {report.title}
                  </Link>

                  {report.business_name && (
                    <div className="flex items-center gap-1.5 text-xs text-earth-muted mt-1">
                      <Building2 className="w-3.5 h-3.5 text-earth-primary" />
                      <span>{report.business_name}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/reports/${report.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-earth-sand text-earth-deep text-xs font-semibold hover:bg-earth-sand/80 transition-colors"
                  >
                    <span>Open Dashboard</span>
                    <ExternalLink className="w-3.5 h-3.5 text-earth-primary" />
                  </Link>

                  {hasShare ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleCopyLink(report.share_token!, e)}
                        className="p-2 rounded-xl text-earth-muted hover:text-earth-deep hover:bg-earth-sand/40 transition-colors"
                        title="Copy share link"
                      >
                        {copiedId === report.share_token ? (
                          <Check className="w-4 h-4 text-earth-olive" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleToggleShare(report, e)}
                        className="p-2 rounded-xl text-earth-clay hover:bg-earth-clay/10 transition-colors"
                        title="Revoke public share link"
                      >
                        <ShieldOff className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleToggleShare(report, e)}
                      className="p-2 rounded-xl text-earth-muted hover:text-earth-terracotta hover:bg-earth-sand/40 transition-colors"
                      title="Generate public share link"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleDelete(report.id, e)}
                    className="p-2 rounded-xl text-earth-muted hover:text-earth-clay hover:bg-earth-clay/10 transition-colors"
                    title="Delete report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

