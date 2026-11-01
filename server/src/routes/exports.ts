import express, { Request, Response } from 'express';
import { exportReportToPdf } from '../exporters/pdfExporter.js';
import { exportReportToDocx } from '../exporters/docxExporter.js';
import { dbService } from '../db/index.js';

const router = express.Router();

// GET /api/reports/:id/export/pdf
router.get('/:id/export/pdf', async (req: Request, res: Response): Promise<any> => {
  try {
    const reportId = String(req.params.id);
    const reportRecord = dbService.getReport(reportId);
    if (!reportRecord) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const pdfBuffer = await exportReportToPdf(reportId);
    const sanitizedTitle = (reportRecord.title || 'report').replace(/[^a-zA-Z0-9_-]/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}.pdf"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    console.error('PDF export error:', err);
    res.status(500).json({ error: `Failed to generate PDF: ${err.message}` });
  }
});

// GET /api/reports/:id/export/docx
router.get('/:id/export/docx', async (req: Request, res: Response): Promise<any> => {
  try {
    const reportId = String(req.params.id);
    const reportRecord = dbService.getReport(reportId);
    if (!reportRecord) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const docxBuffer = await exportReportToDocx(reportId);
    const sanitizedTitle = (reportRecord.title || 'report').replace(/[^a-zA-Z0-9_-]/g, '_');

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}.docx"`);
    res.send(docxBuffer);
  } catch (err: any) {
    console.error('DOCX export error:', err);
    res.status(500).json({ error: `Failed to generate Word document: ${err.message}` });
  }
});

export default router;
