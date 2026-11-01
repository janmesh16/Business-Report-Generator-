import pdfParse from 'pdf-parse';
import { ParsedSource } from './types.js';

export async function parsePdf(
  buffer: Buffer,
  fileName: string,
  sizeBytes: number
): Promise<ParsedSource> {
  try {
    const data = await pdfParse(buffer);
    const text = data.text ? data.text.trim() : '';
    const numPages = data.numpages || 1;

    // Check for scanned / image-only PDF
    const isScannedOrEmpty = text.length < 50;

    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

    return {
      id: `src_pdf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: fileName,
      type: 'pdf',
      sizeBytes,
      lineCount: lines.length,
      extractedText: text,
      isScannedOrEmpty,
      notes: isScannedOrEmpty
        ? 'Warning: Scanned or image-only PDF detected. No extractable text was found in this document.'
        : `Extracted ${lines.length} lines across ${numPages} page(s).`,
    };
  } catch (err: any) {
    return {
      id: `src_pdf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: fileName,
      type: 'pdf',
      sizeBytes,
      lineCount: 0,
      extractedText: '',
      isScannedOrEmpty: true,
      notes: `Failed to extract text from PDF: ${err.message}`,
    };
  }
}

