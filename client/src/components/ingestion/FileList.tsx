import React from 'react';
import { FileSpreadsheet, FileText, Trash2, Layers, CheckCircle2 } from 'lucide-react';

interface FileListProps {
  files: File[];
  onRemoveFile: (index: number) => void;
  sheetSelections: Record<string, string>;
  onOpenSheetSelector?: (fileIndex: number, file: File) => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onRemoveFile,
  sheetSelections,
  onOpenSheetSelector,
}) => {
  if (files.length === 0) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['csv', 'xlsx', 'xls'].includes(ext || '')) {
      return <FileSpreadsheet className="w-5 h-5 text-earth-olive" />;
    }
    return <FileText className="w-5 h-5 text-earth-terracotta" />;
  };

  return (
    <div className="space-y-2 mt-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-earth-muted uppercase tracking-wider">
          Attached Data Files ({files.length})
        </h4>
        <span className="text-xs text-earth-muted">
          Click sheet icon to select specific worksheet
        </span>
      </div>

      <div className="divide-y divide-earth-sand border border-earth-sand rounded-xl bg-earth-surface overflow-hidden">
        {files.map((file, idx) => {
          const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
          const selectedSheet = sheetSelections[file.name] || sheetSelections[String(idx)];

          return (
            <div
              key={`${file.name}-${idx}`}
              className="flex items-center justify-between p-3.5 hover:bg-earth-sand/20 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-earth-bg border border-earth-sand flex items-center justify-center shrink-0">
                  {getFileIcon(file.name)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-earth-deep truncate">
                      {file.name}
                    </p>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-earth-bg text-earth-muted border border-earth-sand/60">
                      {formatFileSize(file.size)}
                    </span>
                  </div>

                  {isExcel && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Layers className="w-3.5 h-3.5 text-earth-primary" />
                      <span className="text-xs text-earth-muted">
                        Active Sheet:{' '}
                        <span className="font-semibold text-earth-deep">
                          {selectedSheet || 'Sheet 1 (Auto-detected)'}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isExcel && onOpenSheetSelector && (
                  <button
                    type="button"
                    onClick={() => onOpenSheetSelector(idx, file)}
                    className="p-1.5 text-earth-muted hover:text-earth-primary hover:bg-earth-sand/40 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
                    title="Choose sheet"
                  >
                    <Layers className="w-4 h-4" />
                    <span className="hidden sm:inline">Select Sheet</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onRemoveFile(idx)}
                  className="p-1.5 text-earth-muted hover:text-earth-clay hover:bg-earth-clay/10 rounded-lg transition-colors"
                  title="Remove file"
                  aria-label={`Remove ${file.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

