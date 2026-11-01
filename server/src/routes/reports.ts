import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { config } from '../config.js';
import { dbService } from '../db/index.js';
import { parseUploadedFile, parseText, ParsedSource } from '../parsers/index.js';
import { computeStatsForTable, GlobalComputedStats } from '../stats/calculator.js';
import { buildCandidateCharts } from '../stats/chartBuilder.js';
import { runAnalysisPipeline } from '../llm/index.js';

const router = express.Router();

// Ensure uploads_temp directory exists
if (!fs.existsSync(config.uploadsDir)) {
  fs.mkdirSync(config.uploadsDir, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => cb(null, config.uploadsDir),
  filename: (_req: any, file: any, cb: any) => {
    const ext = path.extname(file.originalname);
    cb(null, `upload_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

// File validation
const upload = multer({
  storage,
  limits: {
    fileSize: config.maxFileSize, // 10MB
    files: 5,
  },
  fileFilter: (_req: any, file: any, cb: any) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.csv', '.xlsx', '.xls', '.pdf', '.txt', '.md'];
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type ${ext}. Allowed: ${allowed.join(', ')}`));
    }
  },
});

// Rate limiting on report generation: max 30 per 15 minutes
const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many report generation requests. Please try again shortly.' },
});

// POST /api/reports (multipart: files + pastedText + notes + metadata)
router.post('/', generateLimiter, upload.array('files', 5), async (req: Request, res: Response): Promise<any> => {
  try {
    const files = (req.files as any[]) || [];
    const pastedText = (req.body.pastedText || '').trim();
    const notes = (req.body.notes || '').trim();
    const title = (req.body.title || '').trim() || 'Business Operations & Performance Analysis';
    const businessName = (req.body.businessName || '').trim() || 'Business Organization';
    const decisionContext = (req.body.decisionContext || '').trim() || 'Strategic planning and capital allocation';
    
    let sheetSelections: Record<string, string> = {};
    if (req.body.sheetSelections) {
      try {
        sheetSelections = typeof req.body.sheetSelections === 'string'
          ? JSON.parse(req.body.sheetSelections)
          : req.body.sheetSelections;
      } catch (e) {
        // ignore parse error
      }
    }

    if (files.length === 0 && !pastedText && !notes) {
      return res.status(400).json({
        error: 'Please provide at least one data input (upload a file, paste tabular text, or add notes).',
      });
    }

    const reportId = `rep_${crypto.randomUUID()}`;
    dbService.createReport({
      id: reportId,
      title,
      businessName,
      decisionContext,
    });

    // Respond immediately with reportId so client can start polling progress
    res.status(202).json({ reportId, status: 'parsing' });

    // Run async background processing pipeline
    (async () => {
      try {
        // STEP 1: PARSING
        dbService.updateStatus(reportId, 'parsing', `Parsing ${files.length + (pastedText ? 1 : 0) + (notes ? 1 : 0)} data sources...`);

        const parsedSources: ParsedSource[] = [];

        // Parse files
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const selectedSheet = sheetSelections[file.originalname] || sheetSelections[String(i)];
          try {
            const parsed = await parseUploadedFile(file, selectedSheet);
            parsedSources.push(parsed);
          } catch (fileErr: any) {
            console.error(`Error parsing file ${file.originalname}:`, fileErr);
          } finally {
            // Privacy rule: delete raw file after parsing
            try {
              if (file.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
              }
            } catch (delErr) {
              // ignore deletion err
            }
          }
        }

        // Parse pasted text if provided
        if (pastedText) {
          parsedSources.push(parseText(pastedText, 'Pasted Data & Notes'));
        }

        // Parse additional notes if provided
        if (notes) {
          parsedSources.push(parseText(notes, 'Executive Context Notes'));
        }

        // STEP 2: STATISTICAL ANALYSIS & CHART BUILDING (IN CODE)
        dbService.updateStatus(reportId, 'analysing', 'Computing deterministic statistics and trend models...');

        const tableStatsList: any[] = [];
        let totalRecordsAnalyzed = 0;

        for (const src of parsedSources) {
          if (src.activeTable && src.activeTable.rows.length > 0) {
            const stats = computeStatsForTable(src.activeTable, src.name, src.notes);
            tableStatsList.push(stats);
            totalRecordsAnalyzed += src.activeTable.totalRows;
          }
        }

        const candidateCharts = buildCandidateCharts(tableStatsList);

        const globalStats: GlobalComputedStats = {
          tables: tableStatsList,
          textSourcesCount: parsedSources.filter((s) => s.type === 'text' || s.type === 'pdf').length,
          totalRecordsAnalyzed,
          candidateCharts,
        };

        // STEP 3: LLM GENERATION & VALIDATION
        dbService.updateStatus(reportId, 'writing', 'Synthesizing evidence-backed findings and recommendations...');

        const reportJson = await runAnalysisPipeline(parsedSources, globalStats, {
          title,
          businessName,
          decisionContext,
        });

        // STEP 4: COMPLETE & PERSIST
        dbService.completeReport(reportId, parsedSources, globalStats, reportJson);
      } catch (pipelineErr: any) {
        console.error(`[Report Pipeline Error] ${pipelineErr.message}`, pipelineErr);
        dbService.updateStatus(reportId, 'failed', 'Pipeline failed', pipelineErr.message);
      }
    })();
  } catch (err: any) {
    console.error('Error in /api/reports handler:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// GET /api/reports (list all past reports)
router.get('/', (_req: Request, res: Response) => {
  const reports = dbService.getAllReports();
  res.json(reports);
});

// GET /api/reports/:id/status (poll generation status)
router.get('/:id/status', (req: Request, res: Response): any => {
  const reportId = String(req.params.id);
  const report = dbService.getReport(reportId);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  res.json({
    id: report.id,
    status: report.status,
    progressStep: report.progress_step,
    errorMessage: report.error_message,
  });
});

// GET /api/reports/:id (get full report)
router.get('/:id', (req: Request, res: Response): any => {
  const reportId = String(req.params.id);
  const report = dbService.getReport(reportId);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  let parsedSources = [];
  let computedStats = {};
  let reportJson = null;

  try {
    parsedSources = JSON.parse(report.parsed_sources_json || '[]');
    computedStats = JSON.parse(report.computed_stats_json || '{}');
    if (report.report_json) {
      reportJson = JSON.parse(report.report_json);
    }
  } catch (e) {
    // ignore json parse
  }

  // Check share link
  const shareData = dbService.createOrGetShareToken(report.id);

  res.json({
    id: report.id,
    title: report.title,
    businessName: report.business_name,
    decisionContext: report.decision_context,
    status: report.status,
    progressStep: report.progress_step,
    errorMessage: report.error_message,
    createdAt: report.created_at,
    updatedAt: report.updated_at,
    parsedSources,
    computedStats,
    reportJson,
    shareToken: shareData.token,
  });
});

// DELETE /api/reports/:id
router.delete('/:id', (req: Request, res: Response): any => {
  const reportId = String(req.params.id);
  const success = dbService.deleteReport(reportId);
  res.json({ success });
});

export default router;
