import path from 'path';
import fs from 'fs';
import { ParsedSource } from './types.js';
import { parseCsv } from './csvParser.js';
import { parseExcel } from './excelParser.js';
import { parsePdf } from './pdfParser.js';
import { parseText } from './textParser.js';

export * from './types.js';
export { parseCsv, parseExcel, parsePdf, parseText };

export async function parseUploadedFile(
  file: Express.Multer.File,
  selectedSheet?: string
): Promise<ParsedSource> {
  const ext = path.extname(file.originalname).toLowerCase();
  const buffer = file.buffer || (file.path ? fs.readFileSync(file.path) : Buffer.from(''));

  if (ext === '.csv') {
    return parseCsv(buffer, file.originalname, file.size);
  } else if (ext === '.xlsx' || ext === '.xls') {
    return parseExcel(buffer, file.originalname, file.size, selectedSheet);
  } else if (ext === '.pdf') {
    return await parsePdf(buffer, file.originalname, file.size);
  } else if (ext === '.txt' || ext === '.md') {
    return parseText(buffer.toString('utf8'), file.originalname);
  } else {
    throw new Error(`Unsupported file type: ${ext}. Please upload CSV, Excel, PDF, or text files.`);
  }
}

