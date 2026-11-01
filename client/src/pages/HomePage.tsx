import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  FileText,
  Sparkles,
  Layers,
  ArrowRight,
  Database,
  Building2,
  HelpCircle,
  FileCode,
} from 'lucide-react';
import { Dropzone } from '../components/ingestion/Dropzone';
import { FileList } from '../components/ingestion/FileList';
import { TextInputTab } from '../components/ingestion/TextInputTab';
import { SheetSelectorModal } from '../components/ingestion/SheetSelectorModal';
import { ProgressModal } from '../components/ingestion/ProgressModal';
import { api } from '../api/client';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Active input tab: 'upload' | 'paste' | 'notes'
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'notes'>('upload');

  // Form State
  const [files, setFiles] = useState<File[]>([]);
  const [pastedText, setPastedText] = useState('');
  const [notes, setNotes] = useState('');
  const [title, setTitle] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [decisionContext, setDecisionContext] = useState('');
  const [sheetSelections, setSheetSelections] = useState<Record<string, string>>({});

  // Sheet selector modal
  const [modalFileIndex, setModalFileIndex] = useState<number | null>(null);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);

  // Progress modal & generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<
    'pending' | 'parsing' | 'analysing' | 'writing' | 'completed' | 'failed'
  >('pending');
  const [progressStep, setProgressStep] = useState('Initializing pipeline...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFilesAdded = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    const file = files[index];
    if (file && sheetSelections[file.name]) {
      const next = { ...sheetSelections };
      delete next[file.name];
      setSheetSelections(next);
    }
  };

  const handleOpenSheetSelector = (fileIndex: number) => {
    setModalFileIndex(fileIndex);
    setIsSheetModalOpen(true);
  };

  const handleSelectSheet = (sheetName: string) => {
    if (modalFileIndex !== null && files[modalFileIndex]) {
      const file = files[modalFileIndex];
      setSheetSelections((prev) => ({
        ...prev,
        [file.name]: sheetName,
      }));
    }
  };

  // Sample Dataset Pre-loader
  const handleLoadSample = () => {
    setTitle('Q1-Q3 2025 Revenue & Cross-Functional Operations Review');
    setBusinessName('Apex Cloud Technologies, Inc.');
    setDecisionContext('Determine resource allocation for Q4: Expand North American sales team vs. subsidize APAC pricing tiers.');
    setPastedText(`Date,Product_Line,Region,Units_Sold,Revenue,Gross_Profit
2025-01-15,Enterprise ERP,North America,12,102000,66300
2025-02-18,Enterprise ERP,Asia-Pacific,8,68000,42840
2025-03-02,Cloud Security Suite,North America,42,134400,96768
2025-04-10,Enterprise ERP,North America,15,127500,84150
2025-05-12,Data Analytics Hub,North America,50,90000,63900
2025-06-14,Cloud Security Suite,North America,55,176000,128480
2025-07-08,Enterprise ERP,North America,18,153000,100980
2025-08-04,Data Analytics Hub,North America,62,111600,79236
2025-09-03,Cloud Security Suite,North America,60,192000,140160`);
    setNotes(`Executive Meeting Notes:
1. North American market continues to drive 65%+ of aggregate gross margins.
2. Asia-Pacific deals suffer from longer closing cycles (165 days vs 92 days in NA) and domestic pricing pressure.
3. Customer Success team requested 2 Solutions Architects to resolve ERP onboarding bottlenecks before November 15.`);
    setActiveTab('paste');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0 && !pastedText.trim() && !notes.trim()) {
      alert('Please upload at least one file or paste data / notes.');
      return;
    }

    setIsGenerating(true);
    setGenerationStatus('parsing');
    setProgressStep('Uploading and parsing source data...');
    setErrorMessage(null);

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (pastedText.trim()) formData.append('pastedText', pastedText.trim());
    if (notes.trim()) formData.append('notes', notes.trim());
    if (title.trim()) formData.append('title', title.trim());
    if (businessName.trim()) formData.append('businessName', businessName.trim());
    if (decisionContext.trim()) formData.append('decisionContext', decisionContext.trim());
    formData.append('sheetSelections', JSON.stringify(sheetSelections));

    try {
      const { reportId } = await api.createReport(formData);

      // Poll status until complete or failed
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await api.getReportStatus(reportId);
          setGenerationStatus(statusRes.status);
          setProgressStep(statusRes.progressStep || 'Processing...');

          if (statusRes.status === 'completed') {
            clearInterval(pollInterval);
            setTimeout(() => {
              navigate(`/reports/${reportId}`);
            }, 600);
          } else if (statusRes.status === 'failed') {
            clearInterval(pollInterval);
            setErrorMessage(statusRes.errorMessage || 'Generation failed.');
          }
        } catch (pollErr) {
          // temporary network hiccup, keep polling
        }
      }, 1000);
    } catch (err: any) {
      setGenerationStatus('failed');
      setErrorMessage(err.message || 'Failed to submit report request.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Hero Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-earth-sand/60 text-earth-deep text-xs font-semibold mb-4 border border-earth-sand">
          <Sparkles className="w-3.5 h-3.5 text-earth-terracotta" />
          <span>Decision-Ready Business Intelligence</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-earth-deep tracking-tight mb-4">
          Transform Raw Business Data Into Strategic Reports
        </h1>
        <p className="text-earth-muted text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Upload spreadsheets, PDFs, or paste raw meeting notes. Ledgerly computes the statistics in code and produces an executive report grounded in verified empirical evidence.
        </p>

        {/* Quick Demo Pre-loader */}
        <div className="mt-5">
          <button
            type="button"
            onClick={handleLoadSample}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-earth-terracotta hover:text-earth-deep underline decoration-earth-sand hover:decoration-earth-deep transition-all"
          >
            <FileCode className="w-4 h-4" />
            <span>Load Sample Dataset (Sales & Executive Notes)</span>
          </button>
        </div>
      </div>

      {/* Main Ingestion Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Input Tabs */}
        <div className="bg-earth-surface border border-earth-sand rounded-3xl p-6 sm:p-8 shadow-warm">
          <div className="flex border-b border-earth-sand mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`pb-3 px-4 text-sm font-semibold transition-all flex items-center gap-2 border-b-2 ${
                activeTab === 'upload'
                  ? 'border-earth-terracotta text-earth-deep font-bold'
                  : 'border-transparent text-earth-muted hover:text-earth-deep'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-earth-olive" />
              <span>Upload Files ({files.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`pb-3 px-4 text-sm font-semibold transition-all flex items-center gap-2 border-b-2 ${
                activeTab === 'paste'
                  ? 'border-earth-terracotta text-earth-deep font-bold'
                  : 'border-transparent text-earth-muted hover:text-earth-deep'
              }`}
            >
              <FileText className="w-4 h-4 text-earth-primary" />
              <span>Paste Data & Notes</span>
            </button>
          </div>

          {activeTab === 'upload' ? (
            <div>
              <Dropzone files={files} onFilesAdded={handleFilesAdded} />
              <FileList
                files={files}
                onRemoveFile={handleRemoveFile}
                sheetSelections={sheetSelections}
                onOpenSheetSelector={handleOpenSheetSelector}
              />
            </div>
          ) : (
            <TextInputTab
              pastedText={pastedText}
              onPastedTextChange={setPastedText}
              notes={notes}
              onNotesChange={setNotes}
            />
          )}
        </div>

        {/* Step 2: Context & Decision Intent */}
        <div className="bg-earth-surface border border-earth-sand rounded-3xl p-6 sm:p-8 shadow-warm space-y-5">
          <h3 className="font-serif text-lg font-bold text-earth-deep tracking-tight">
            Strategic Context (Optional)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-earth-muted uppercase tracking-wider mb-1.5">
                Report Title
              </label>
              <input
                type="text"
                placeholder="e.g. Q3 Executive Performance Review"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-earth-bg border border-earth-sand text-earth-deep text-sm focus:outline-hidden focus:ring-2 focus:ring-earth-terracotta transition-shadow placeholder:text-earth-muted/60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-earth-muted uppercase tracking-wider mb-1.5">
                Business Name
              </label>
              <input
                type="text"
                placeholder="e.g. Acme Corporation"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-earth-bg border border-earth-sand text-earth-deep text-sm focus:outline-hidden focus:ring-2 focus:ring-earth-terracotta transition-shadow placeholder:text-earth-muted/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-earth-muted uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-earth-terracotta" />
              <span>What decision are you trying to make?</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Should we expand the direct sales team in EMEA or focus exclusively on North American enterprise upsells?"
              value={decisionContext}
              onChange={(e) => setDecisionContext(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-earth-bg border border-earth-sand text-earth-deep text-sm focus:outline-hidden focus:ring-2 focus:ring-earth-terracotta transition-shadow placeholder:text-earth-muted/60"
            />
          </div>
        </div>

        {/* Generate CTA Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs text-earth-muted text-center sm:text-left">
            <span className="font-semibold text-earth-deep">Grounding Guarantee: </span>
            All totals and growth rates are computed in code. The LLM never invents numbers.
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-earth-terracotta hover:bg-earth-deep text-white font-serif font-bold text-base tracking-wide flex items-center justify-center gap-3 shadow-warm-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <span>Generate Business Report</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* Sheet Selector Modal for Excel */}
      <SheetSelectorModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        fileName={modalFileIndex !== null ? files[modalFileIndex]?.name : ''}
        currentSheet={modalFileIndex !== null ? sheetSelections[files[modalFileIndex]?.name] : ''}
        onSelectSheet={handleSelectSheet}
      />

      {/* Progress Indicator Modal */}
      <ProgressModal
        isOpen={isGenerating}
        status={generationStatus}
        progressStep={progressStep}
        errorMessage={errorMessage}
        onRetry={() => {
          setIsGenerating(false);
          setErrorMessage(null);
        }}
      />
    </div>
  );
};

