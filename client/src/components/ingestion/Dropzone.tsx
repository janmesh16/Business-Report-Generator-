import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, FileText, AlertCircle } from 'lucide-react';

interface DropzoneProps {
  files: File[];
  onFilesAdded: (newFiles: File[]) => void;
  maxFiles?: number;
  maxSizeBytes?: number;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  files,
  onFilesAdded,
  maxFiles = 5,
  maxSizeBytes = 10 * 1024 * 1024, // 10MB
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const processFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    setErrorMessage(null);

    const allowedExtensions = ['.csv', '.xlsx', '.xls', '.pdf', '.txt', '.md'];
    const validFiles: File[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();

      if (!allowedExtensions.includes(ext)) {
        setErrorMessage(`"${file.name}" has an unsupported format. Please upload CSV, Excel, PDF, or text files.`);
        continue;
      }

      if (file.size > maxSizeBytes) {
        setErrorMessage(`"${file.name}" exceeds the 10 MB file size limit.`);
        continue;
      }

      validFiles.push(file);
    }

    if (files.length + validFiles.length > maxFiles) {
      setErrorMessage(`Maximum ${maxFiles} files allowed per report.`);
      return;
    }

    if (validFiles.length > 0) {
      onFilesAdded(validFiles);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    processFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragOver
            ? 'border-earth-terracotta bg-earth-sand/40 scale-[1.01]'
            : 'border-earth-sand hover:border-earth-primary bg-earth-surface hover:bg-earth-surface/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv,.xlsx,.xls,.pdf,.txt,.md"
          className="hidden"
          onChange={handleInputChange}
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-earth-sand/50 flex items-center justify-center text-earth-primary">
            <UploadCloud className="w-7 h-7 text-earth-primary" />
          </div>

          <div>
            <h3 className="font-serif text-lg font-semibold text-earth-deep">
              Drag & drop business data files here
            </h3>
            <p className="text-sm text-earth-muted mt-1">
              or <span className="text-earth-terracotta font-semibold hover:underline">browse files</span> from your computer
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-earth-bg text-earth-deep border border-earth-sand">
              <FileSpreadsheet className="w-3.5 h-3.5 text-earth-olive" /> CSV / Excel (.xlsx, .xls)
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-earth-bg text-earth-deep border border-earth-sand">
              <FileText className="w-3.5 h-3.5 text-earth-terracotta" /> PDF Reports
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-earth-bg text-earth-deep border border-earth-sand">
              <FileText className="w-3.5 h-3.5 text-earth-primary" /> Plain Text (.txt, .md)
            </span>
            <span className="text-xs text-earth-muted">
              • Max 10 MB per file (up to 5 files)
            </span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-earth-clay/10 border border-earth-clay/20 text-earth-clay text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};

