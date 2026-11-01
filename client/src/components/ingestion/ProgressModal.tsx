import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, FileSearch, BarChart2, PenTool } from 'lucide-react';

interface ProgressModalProps {
  isOpen: boolean;
  status: 'pending' | 'parsing' | 'analysing' | 'writing' | 'completed' | 'failed';
  progressStep: string;
  errorMessage?: string | null;
  onRetry?: () => void;
}

export const ProgressModal: React.FC<ProgressModalProps> = ({
  isOpen,
  status,
  progressStep,
  errorMessage,
  onRetry,
}) => {
  if (!isOpen) return null;

  const stages = [
    {
      id: 'parsing',
      label: 'Parsing & Normalization',
      desc: 'Extracting tables, sheets, and structured text from inputs',
      icon: FileSearch,
    },
    {
      id: 'analysing',
      label: 'In-Code Statistical Analysis',
      desc: 'Computing totals, growth rates, distributions & charts',
      icon: BarChart2,
    },
    {
      id: 'writing',
      label: 'Evidence Grounding & Synthesis',
      desc: 'Formulating decision-ready findings & recommendations',
      icon: PenTool,
    },
  ];

  const getStageState = (stageId: string) => {
    const order = ['pending', 'parsing', 'analysing', 'writing', 'completed'];
    const currentIndex = order.indexOf(status);
    const stageIndex = order.indexOf(stageId);

    if (status === 'failed') return 'failed';
    if (currentIndex > stageIndex || status === 'completed') return 'completed';
    if (currentIndex === stageIndex) return 'active';
    return 'waiting';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-earth-deep/60 backdrop-blur-xs">
      <div className="bg-earth-surface border border-earth-sand rounded-3xl max-w-lg w-full p-8 shadow-warm-lg animate-in fade-in zoom-in-95">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-earth-sand/60 flex items-center justify-center text-earth-primary mb-3">
            {status === 'failed' ? (
              <AlertCircle className="w-8 h-8 text-earth-clay" />
            ) : status === 'completed' ? (
              <CheckCircle2 className="w-8 h-8 text-earth-olive" />
            ) : (
              <Loader2 className="w-8 h-8 text-earth-terracotta animate-spin" />
            )}
          </div>

          <h3 className="font-serif text-2xl font-bold text-earth-deep">
            {status === 'completed'
              ? 'Report Ready!'
              : status === 'failed'
              ? 'Analysis Encountered an Error'
              : 'Synthesizing Business Report'}
          </h3>
          <p className="text-sm text-earth-muted mt-1">
            {errorMessage || progressStep || 'Please hold while Ledgerly structures your findings...'}
          </p>
        </div>

        {/* Multi-step progress timeline */}
        <div className="space-y-4 my-6">
          {stages.map((stage) => {
            const state = getStageState(stage.id);
            const Icon = stage.icon;

            return (
              <div
                key={stage.id}
                className={`flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all ${
                  state === 'active'
                    ? 'border-earth-terracotta bg-earth-sand/30 shadow-xs'
                    : state === 'completed'
                    ? 'border-earth-olive/30 bg-earth-olive/5'
                    : 'border-earth-sand/60 opacity-60'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    state === 'active'
                      ? 'bg-earth-terracotta text-earth-surface'
                      : state === 'completed'
                      ? 'bg-earth-olive text-earth-surface'
                      : 'bg-earth-sand text-earth-muted'
                  }`}
                >
                  {state === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : state === 'active' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-earth-deep">
                      {stage.label}
                    </h4>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-earth-muted">
                      {state === 'completed'
                        ? 'Done'
                        : state === 'active'
                        ? 'Processing'
                        : 'Queued'}
                    </span>
                  </div>
                  <p className="text-xs text-earth-muted mt-0.5">{stage.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {status === 'failed' && onRetry && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={onRetry}
              className="px-5 py-2.5 rounded-xl bg-earth-terracotta text-white font-semibold text-sm hover:bg-earth-deep transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

