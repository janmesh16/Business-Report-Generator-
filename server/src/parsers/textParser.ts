import { ParsedSource } from './types.js';

export function parseText(
  text: string,
  sourceLabel: string = 'Pasted Business Notes'
): ParsedSource {
  // Basic sanitization: strip non-printable control characters (except newlines and tabs)
  const sanitized = text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();

  const lines = sanitized.split('\n').map((l) => l.trim()).filter(Boolean);
  const sizeBytes = Buffer.byteLength(sanitized, 'utf8');

  return {
    id: `src_text_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: sourceLabel,
    type: 'text',
    sizeBytes,
    lineCount: lines.length,
    extractedText: sanitized,
    notes: `Sanitized text source containing ${lines.length} lines (~${sanitized.split(/\s+/).length} words).`,
  };
}

