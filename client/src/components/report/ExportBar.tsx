import React, { useState } from 'react';
import { Download, FileText, Share2, Check, Copy, AlertCircle, X, ShieldOff } from 'lucide-react';
import { api } from '../../api/client';

interface ExportBarProps {
  reportId: string;
  initialShareToken?: string;
  onShareStatusChange?: () => void;
}

export const ExportBar: React.FC<ExportBarProps> = ({
  reportId,
  initialShareToken,
  onShareStatusChange,
}) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>(
    initialShareToken ? `${window.location.origin}/r/${initialShareToken}` : ''
  );
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);

  const handleDownloadPdf = () => {
    setPdfLoading(true);
    const url = api.getPdfExportUrl(reportId);
    window.location.href = url;
    setTimeout(() => setPdfLoading(false), 3000);
  };

  const handleDownloadDocx = () => {
    setDocxLoading(true);
    const url = api.getDocxExportUrl(reportId);
    window.location.href = url;
    setTimeout(() => setDocxLoading(false), 3000);
  };

  const handleOpenShare = async () => {
    setIsShareModalOpen(true);
    if (!shareUrl) {
      try {
        setIsSharing(true);
        const res = await api.shareReport(reportId);
        setShareUrl(`${window.location.origin}/r/${res.token}`);
        if (onShareStatusChange) onShareStatusChange();
      } catch (err) {
        console.error('Failed to get share link:', err);
      } finally {
        setIsSharing(false);
      }
    }
  };

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevokeShare = async () => {
    try {
      setIsRevoking(true);
      await api.revokeShare(reportId);
      setShareUrl('');
      setIsShareModalOpen(false);
      if (onShareStatusChange) onShareStatusChange();
    } catch (err) {
      console.error('Failed to revoke share link:', err);
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <>
      <div className="bg-earth-surface border border-earth-sand rounded-2xl p-4 shadow-warm flex flex-wrap items-center justify-between gap-3 mb-8 no-print">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-earth-muted">
            Export & Collaboration:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Download PDF */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-earth-sand hover:bg-earth-sand/80 text-earth-deep font-semibold text-sm transition-colors shadow-xs disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-earth-primary" />
            <span>{pdfLoading ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>

          {/* Download Word */}
          <button
            type="button"
            onClick={handleDownloadDocx}
            disabled={docxLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-earth-sand hover:bg-earth-sand/80 text-earth-deep font-semibold text-sm transition-colors shadow-xs disabled:opacity-50"
          >
            <FileText className="w-4 h-4 text-earth-primary" />
            <span>{docxLoading ? 'Generating Word...' : 'Download Word (.docx)'}</span>
          </button>

          {/* Share Link */}
          <button
            type="button"
            onClick={handleOpenShare}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-earth-terracotta hover:bg-earth-deep text-white font-semibold text-sm transition-colors shadow-xs"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Report</span>
          </button>
        </div>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-earth-deep/60 backdrop-blur-xs">
          <div className="bg-earth-surface border border-earth-sand rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-warm-lg animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-earth-sand">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-earth-terracotta" />
                <h3 className="font-serif text-lg font-bold text-earth-deep">
                  Share Public Report Link
                </h3>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 rounded-lg text-earth-muted hover:text-earth-deep hover:bg-earth-sand/40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-sm text-earth-muted">
                Anyone with this cryptographic link can view a read-only copy of this executive report. Your raw uploaded files and operational databases are never exposed.
              </p>

              {shareUrl ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="flex-1 p-2.5 rounded-xl bg-earth-bg border border-earth-sand text-xs font-mono text-earth-deep select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-4 py-2.5 rounded-xl bg-earth-primary hover:bg-earth-deep text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      {copied ? <Check className="w-4 h-4 text-earth-olive" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="pt-3 border-t border-earth-sand/70 flex items-center justify-between">
                    <span className="text-xs text-earth-muted">
                      Need to revoke access?
                    </span>
                    <button
                      type="button"
                      onClick={handleRevokeShare}
                      disabled={isRevoking}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-earth-clay hover:bg-earth-clay/10 transition-colors"
                    >
                      <ShieldOff className="w-3.5 h-3.5" />
                      <span>{isRevoking ? 'Revoking...' : 'Revoke Share Link'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center">
                  <p className="text-sm text-earth-muted">
                    {isSharing ? 'Generating secure share link...' : 'Share link currently inactive.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

