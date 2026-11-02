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
import { buildRichChartCandidates } from '../stats/chartBuilder.js';
import { profileTable } from '../stats/profiler.js';
import { runAnalysisPipeline } from '../llm/index.js';

const router = express.Router();

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
    fileSize: config.maxFileSize,
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

// Rate limiting: max 40 per 15 minutes
const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: { error: 'Too many report requests. Please wait a moment.' },
});

// Helper to parse inputs from request
async function parseInputsFromRequest(
  files: any[],
  pastedText: string,
  notes: string,
  sheetSelections: Record<string, string>
): Promise<ParsedSource[]> {
  const parsedSources: ParsedSource[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const selectedSheet = sheetSelections[file.originalname] || sheetSelections[String(i)];
    try {
      const parsed = await parseUploadedFile(file, selectedSheet);
      parsedSources.push(parsed);
    } catch (fileErr: any) {
      console.error(`Error parsing file ${file.originalname}:`, fileErr);
    } finally {
      try {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (delErr) {
        // ignore
      }
    }
  }

  if (pastedText) {
    parsedSources.push(parseText(pastedText, 'Pasted Data Snippet'));
  }

  if (notes) {
    parsedSources.push(parseText(notes, 'Executive Context Notes'));
  }

  return parsedSources;
}

// POST /api/reports/preview (Data preview before generating)
router.post('/preview', upload.array('files', 5), async (req: Request, res: Response): Promise<any> => {
  try {
    const files = (req.files as any[]) || [];
    const pastedText = (req.body.pastedText || '').trim();
    const notes = (req.body.notes || '').trim();

    let sheetSelections: Record<string, string> = {};
    if (req.body.sheetSelections) {
      try {
        sheetSelections = typeof req.body.sheetSelections === 'string'
          ? JSON.parse(req.body.sheetSelections)
          : req.body.sheetSelections;
      } catch (e) {}
    }

    const parsedSources = await parseInputsFromRequest(files, pastedText, notes, sheetSelections);

    const previews = parsedSources.map((s) => {
      if (s.activeTable) {
        const profile = profileTable(s.activeTable, s.name);
        return {
          id: s.id,
          name: s.name,
          type: s.type,
          rowCount: s.activeTable.totalRows,
          columnCount: s.activeTable.headers.length,
          headers: s.activeTable.headers,
          columnTypes: Object.fromEntries(
            Object.entries(profile.columns).map(([col, p]) => [col, p.type])
          ),
          previewRows: s.activeTable.rows.slice(0, 8),
          qualityScore: profile.qualityScore,
          dateRange: profile.dateRange,
          notes: s.notes,
        };
      }
      return {
        id: s.id,
        name: s.name,
        type: s.type,
        lineCount: s.lineCount || 0,
        textSnippet: (s.extractedText || '').slice(0, 600),
        isScannedOrEmpty: s.isScannedOrEmpty,
        notes: s.notes,
      };
    });

    res.json({ previews });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to preview data.' });
  }
});

// POST /api/reports (Generate report pipeline)
router.post('/', generateLimiter, upload.array('files', 5), async (req: Request, res: Response): Promise<any> => {
  try {
    const files = (req.files as any[]) || [];
    const pastedText = (req.body.pastedText || '').trim();
    const notes = (req.body.notes || '').trim();
    const title = (req.body.title || '').trim() || 'Business Operations & Performance Analysis';
    const businessName = (req.body.businessName || '').trim() || 'Business Organization';
    const decisionContext = (req.body.decisionContext || '').trim() || 'Strategic capital allocation and growth review';
    const promptVersion = (req.body.promptVersion as 'v1' | 'v2' | 'v3') || 'v3';

    let sheetSelections: Record<string, string> = {};
    if (req.body.sheetSelections) {
      try {
        sheetSelections = typeof req.body.sheetSelections === 'string'
          ? JSON.parse(req.body.sheetSelections)
          : req.body.sheetSelections;
      } catch (e) {}
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
      promptVersion,
    });

    res.status(202).json({ reportId, status: 'parsing' });

    // Asynchronous Execution Pipeline
    (async () => {
      try {
        // STAGE 1: PARSING
        dbService.updateStatus(reportId, 'parsing', `Parsing ${files.length + (pastedText ? 1 : 0) + (notes ? 1 : 0)} data sources...`);

        const parsedSources = await parseInputsFromRequest(files, pastedText, notes, sheetSelections);

        // STAGE 2: PROFILING DATA
        dbService.updateStatus(reportId, 'analysing', 'Profiling columns, missing values, distributions, and outliers...');

        const tableStatsList: any[] = [];
        let totalRecordsAnalyzed = 0;
        let overallDateRange: string | null = null;
        let qualityScoreSum = 0;

        for (const src of parsedSources) {
          if (src.activeTable && src.activeTable.rows.length > 0) {
            const stats = computeStatsForTable(src.activeTable, src.name, src.notes);
            tableStatsList.push(stats);
            totalRecordsAnalyzed += src.activeTable.totalRows;
            if (stats.profile.dateRange && !overallDateRange) {
              overallDateRange = stats.profile.dateRange;
            }
            qualityScoreSum += stats.profile.qualityScore;
          }
        }

        const avgQualityScore = tableStatsList.length > 0
          ? Math.round(qualityScoreSum / tableStatsList.length)
          : 90;

        // STAGE 3: BUILDING CHARTS
        dbService.updateStatus(reportId, 'analysing', 'Constructing rich candidate visualisations (trends, distributions, correlations)...');

        const candidateCharts = buildRichChartCandidates(tableStatsList, parsedSources);

        const globalStats: GlobalComputedStats = {
          tables: tableStatsList,
          textSourcesCount: parsedSources.filter((s) => s.type === 'text' || s.type === 'pdf').length,
          totalRecordsAnalyzed,
          overallDateRange,
          overallQualityScore: avgQualityScore,
          candidateCharts,
        };

        // STAGE 4: WRITING REPORT
        dbService.updateStatus(reportId, 'writing', `Drafting executive findings and recommendations with prompt ${promptVersion}...`);

        const reportJson = await runAnalysisPipeline(
          parsedSources,
          globalStats,
          { title, businessName, decisionContext },
          promptVersion
        );

        // COMPLETE
        dbService.completeReport(reportId, parsedSources, globalStats, reportJson);
      } catch (pipelineErr: any) {
        console.error(`[Report Pipeline Error] ${pipelineErr.message}`, pipelineErr);
        dbService.updateStatus(reportId, 'failed', 'Pipeline failed', pipelineErr.message);
      }
    })();
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /api/reports/compare (Run inputs through v1, v2, v3 side-by-side)
router.post('/compare', upload.array('files', 5), async (req: Request, res: Response): Promise<any> => {
  try {
    const files = (req.files as any[]) || [];
    const pastedText = (req.body.pastedText || '').trim();
    const notes = (req.body.notes || '').trim();
    const title = (req.body.title || '').trim() || 'Prompt Engineering Multi-Version Comparison';
    const businessName = (req.body.businessName || '').trim() || 'Enterprise Evaluation';
    const decisionContext = (req.body.decisionContext || '').trim() || 'Comparative prompt engineering assessment';

    const parsedSources = await parseInputsFromRequest(files, pastedText, notes, {});

    const tableStatsList: any[] = [];
    let totalRecordsAnalyzed = 0;
    for (const src of parsedSources) {
      if (src.activeTable && src.activeTable.rows.length > 0) {
        const stats = computeStatsForTable(src.activeTable, src.name, src.notes);
        tableStatsList.push(stats);
        totalRecordsAnalyzed += src.activeTable.totalRows;
      }
    }

    const candidateCharts = buildRichChartCandidates(tableStatsList, parsedSources);
    const globalStats: GlobalComputedStats = {
      tables: tableStatsList,
      textSourcesCount: parsedSources.filter((s) => s.type === 'text' || s.type === 'pdf').length,
      totalRecordsAnalyzed,
      overallDateRange: 'FY2025 YTD',
      overallQualityScore: 92,
      candidateCharts,
    };

    // Run v1, v2, v3
    const [reportV1, reportV2, reportV3] = await Promise.all([
      runAnalysisPipeline(parsedSources, globalStats, { title, businessName, decisionContext }, 'v1'),
      runAnalysisPipeline(parsedSources, globalStats, { title, businessName, decisionContext }, 'v2'),
      runAnalysisPipeline(parsedSources, globalStats, { title, businessName, decisionContext }, 'v3'),
    ]);

    res.json({
      v1: reportV1,
      v2: reportV2,
      v3: reportV3,
      charts: candidateCharts,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed comparison run.' });
  }
});

// GET /api/reports
router.get('/', (_req: Request, res: Response) => {
  const reports = dbService.getAllReports();
  res.json(reports);
});

// GET /api/reports/:id/status
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

// GET /api/reports/:id
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
  } catch (e) {}

  const shareData = dbService.createOrGetShareToken(report.id);

  res.json({
    id: report.id,
    title: report.title,
    businessName: report.business_name,
    decisionContext: report.decision_context,
    promptVersion: report.prompt_version || 'v3',
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
