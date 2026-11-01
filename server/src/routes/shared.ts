import express, { Request, Response } from 'express';
import { dbService } from '../db/index.js';
import { config } from '../config.js';

const router = express.Router();

// POST /api/reports/:id/share (generate or retrieve active share link)
router.post('/reports/:id/share', (req: Request, res: Response): any => {
  const reportId = String(req.params.id);
  const report = dbService.getReport(reportId);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  const { token, isNew } = dbService.createOrGetShareToken(reportId);
  const shareUrl = `${config.clientUrl}/r/${token}`;

  res.json({
    token,
    shareUrl,
    isNew,
  });
});

// DELETE /api/reports/:id/share (revoke active share link)
router.delete('/reports/:id/share', (req: Request, res: Response): any => {
  const reportId = String(req.params.id);
  const report = dbService.getReport(reportId);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  dbService.revokeShareToken(reportId);
  res.json({ success: true, message: 'Share link revoked successfully.' });
});

// GET /api/shared/:token (public read-only view)
router.get('/shared/:token', (req: Request, res: Response): any => {
  const token = String(req.params.token);
  const report = dbService.getReportByShareToken(token);
  if (!report) {
    return res.status(404).json({
      error: 'This shared report does not exist or its access link has been revoked by the owner.',
    });
  }

  let parsedSources = [];
  let computedStats = {};
  let reportJson = null;

  try {
    parsedSources = JSON.parse(report.parsed_sources_json || '[]').map((s: any) => ({
      name: s.name,
      type: s.type,
      sizeBytes: s.sizeBytes,
      rowCount: s.rowCount,
      lineCount: s.lineCount,
    }));
    computedStats = JSON.parse(report.computed_stats_json || '{}');
    if (report.report_json) {
      reportJson = JSON.parse(report.report_json);
    }
  } catch (e) {
    // ignore
  }

  res.json({
    title: report.title,
    businessName: report.business_name,
    decisionContext: report.decision_context,
    createdAt: report.created_at,
    parsedSources,
    computedStats,
    reportJson,
    isSharedView: true,
  });
});

export default router;
