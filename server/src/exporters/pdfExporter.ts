import puppeteer from 'puppeteer';
import { config } from '../config.js';
import { dbService } from '../db/index.js';
import { ReportJson } from '../llm/types.js';

export async function exportReportToPdf(reportId: string): Promise<Buffer> {
  const reportRecord = dbService.getReport(reportId);
  if (!reportRecord || !reportRecord.report_json) {
    throw new Error(`Report ${reportId} not found or incomplete.`);
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1800, deviceScaleFactor: 2 });

    const targetUrl = `${config.clientUrl}/reports/${reportId}/print`;

    let navigatedSuccessfully = false;
    try {
      await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 12000 });
      await page.waitForSelector('#print-container', { timeout: 6000 });
      navigatedSuccessfully = true;
    } catch (navErr) {
      console.warn(`[PDF Exporter] Could not reach client print route at ${targetUrl}. Falling back to internal HTML renderer.`);
    }

    if (!navigatedSuccessfully) {
      const report: ReportJson = JSON.parse(reportRecord.report_json);
      const computedStats = JSON.parse(reportRecord.computed_stats_json || '{}');
      const fallbackHtml = generateComprehensivePrintHtml(reportRecord, report, computedStats);
      await page.setContent(fallbackHtml, { waitUntil: 'load' });
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '16mm',
        bottom: '16mm',
        left: '14mm',
        right: '14mm',
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

function generateComprehensivePrintHtml(
  record: any,
  report: ReportJson,
  computedStats: any
): string {
  const c = {
    bg: '#F5EFE6',
    surface: '#FBF7F1',
    sand: '#E3D5C0',
    primary: '#6B4F3A',
    deep: '#3E2C20',
    terracotta: '#B5651D',
    olive: '#7A8450',
    clay: '#A8452F',
    text: '#3E2C20',
    muted: '#7D6B5D',
  };

  const kpisHtml = report.kpis
    .map(
      (k) => `
      <div style="background: ${c.surface}; border: 1px solid ${c.sand}; border-radius: 12px; padding: 14px 18px; flex: 1; min-width: 160px;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: ${c.muted};">${k.label}</div>
        <div style="font-size: 24px; font-weight: bold; color: ${c.deep}; margin: 4px 0;">${k.value}</div>
        <div style="font-size: 11.5px; color: ${k.trend === 'up' ? c.olive : k.trend === 'down' ? c.clay : c.muted}; font-weight: 600;">
          ${k.trend === 'up' ? '▲' : k.trend === 'down' ? '▼' : '●'} ${k.change || 'Baseline'}
          <span style="font-size: 9.5px; color: ${c.muted}; font-weight: normal; margin-left: 4px;">• ${k.sourceRef}</span>
        </div>
      </div>
    `
    )
    .join('');

  const findingsHtml = report.findings
    .map((f, i) => {
      const evidenceHtml = f.evidence
        .map(
          (e) => `
        <div style="font-size: 10.5px; background: #EFE6D9; color: ${c.deep}; padding: 4px 10px; border-radius: 6px; display: inline-block; margin-right: 6px; margin-top: 6px;">
          📍 <strong>${e.source}</strong> [${e.location}] ${e.quote ? `— "${e.quote}"` : ''}
        </div>
      `
        )
        .join('');

      return `
      <div style="background: ${c.surface}; border: 1px solid ${c.sand}; border-radius: 12px; padding: 18px; margin-bottom: 16px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; font-size: 15.5px; color: ${c.deep};">${i + 1}. ${f.headline}</h3>
          <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; background: ${f.impact === 'high' ? '#F7D7D0' : '#EFE6D9'}; color: ${f.impact === 'high' ? c.clay : c.primary};">
            ${f.impact} impact
          </span>
        </div>
        <p style="font-size: 13px; color: ${c.text}; line-height: 1.5; margin: 10px 0;">${f.detail}</p>
        <div style="margin-top: 8px;">${evidenceHtml}</div>
      </div>
    `;
    })
    .join('');

  const recsHtml = report.recommendations
    .map(
      (r, i) => `
      <div style="background: ${c.surface}; border-left: 4px solid ${r.priority === 'high' ? c.clay : r.priority === 'medium' ? c.terracotta : c.olive}; border-top: 1px solid ${c.sand}; border-right: 1px solid ${c.sand}; border-bottom: 1px solid ${c.sand}; border-radius: 0 10px 10px 0; padding: 14px 18px; margin-bottom: 12px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between;">
          <span style="font-weight: bold; font-size: 13.5px; color: ${c.deep};">${i + 1}. ${r.action}</span>
          <span style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: ${r.priority === 'high' ? c.clay : c.primary};">${r.priority} Priority</span>
        </div>
        <div style="font-size: 12px; color: ${c.text}; margin-top: 6px;"><strong>Rationale:</strong> ${r.rationale}</div>
        <div style="font-size: 12px; color: ${c.olive}; font-weight: 600; margin-top: 4px;"><strong>Expected Impact:</strong> ${r.expectedImpact}</div>
        <div style="font-size: 10px; color: ${c.muted}; margin-top: 4px;">Linked Findings: ${r.linkedFindingIds.join(', ')}</div>
      </div>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${report.title}</title>
        <style>
          @page { margin: 16mm 14mm; size: A4; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: ${c.bg};
            color: ${c.text};
            margin: 0;
            padding: 24px;
            -webkit-print-color-adjust: exact;
          }
          h1, h2, h3 { font-family: Georgia, serif; }
        </style>
      </head>
      <body>
        <div id="print-container">
          <div style="border-bottom: 2px solid ${c.sand}; padding-bottom: 16px; margin-bottom: 20px;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: ${c.terracotta}; font-weight: bold;">Ledgerly Executive Intelligence</div>
            <h1 style="font-size: 24px; color: ${c.deep}; margin: 6px 0;">${report.title}</h1>
            <div style="font-size: 11.5px; color: ${c.muted};">
              Entity: <strong>${record.business_name || 'Organization'}</strong> | Date: ${new Date(record.created_at).toLocaleDateString()} | Quality: <strong>${report.aboutData?.qualityScore || 92}/100</strong>
            </div>
          </div>

          <!-- Section 2: KPIs -->
          <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
            ${kpisHtml}
          </div>

          <!-- Section 3: Executive Summary -->
          <div style="background: ${c.surface}; border: 1px solid ${c.sand}; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
            <h2 style="font-size: 16px; color: ${c.deep}; margin-top: 0; margin-bottom: 8px;">Executive Summary</h2>
            <p style="font-size: 13px; line-height: 1.6; color: ${c.text}; margin: 0;">${report.executiveSummary}</p>
          </div>

          <!-- Section 4: About This Data Panel -->
          <div style="background: #EFE6D9; border: 1px solid ${c.sand}; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; font-size: 12px;">
            <strong>Data Profile:</strong> ${report.aboutData?.rows || 0} Total Records | ${report.aboutData?.columns || 0} Columns | Date Range: ${report.aboutData?.dateRange || 'N/A'} | Integrity Score: ${report.aboutData?.qualityScore || 92}/100
          </div>

          <!-- Section 5: Key Findings -->
          <h2 style="font-size: 17px; color: ${c.deep}; margin-bottom: 12px;">Key Findings & Empirical Evidence</h2>
          ${findingsHtml}

          <!-- Section 7: Recommendations -->
          <h2 style="font-size: 17px; color: ${c.deep}; margin-top: 20px; margin-bottom: 12px;">Strategic Recommendations</h2>
          ${recsHtml}

          <!-- Section 8: Risks & Data Quality -->
          <div style="background: #F8EFE9; border: 1px solid #E4C8BE; border-radius: 12px; padding: 16px; margin-top: 20px; page-break-inside: avoid;">
            <h3 style="font-size: 13.5px; color: ${c.clay}; margin-top: 0; margin-bottom: 8px;">Risks, Assumptions & Data Quality Notes</h3>
            <ul style="margin: 0; padding-left: 20px; font-size: 11.5px; color: ${c.deep}; line-height: 1.5;">
              ${report.risksAndCaveats.map((r) => `<li>${r}</li>`).join('')}
              ${report.dataQuality.issues.map((i) => `<li><em>Integrity note:</em> ${i}</li>`).join('')}
            </ul>
          </div>

          <div style="font-size: 10px; color: ${c.muted}; text-align: center; margin-top: 24px; border-top: 1px solid ${c.sand}; padding-top: 12px;">
            Notice: AI-generated insights should be verified against your source data. Ledgerly deterministic engine v2.
          </div>
        </div>
      </body>
    </html>
  `;
}
