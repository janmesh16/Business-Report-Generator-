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
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

    const targetUrl = `${config.clientUrl}/reports/${reportId}/print`;

    let navigatedSuccessfully = false;
    try {
      await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 10000 });
      // Wait for print-container
      await page.waitForSelector('#print-container', { timeout: 5000 });
      navigatedSuccessfully = true;
    } catch (navErr) {
      console.warn(`[PDF Exporter] Could not reach client print route at ${targetUrl}. Falling back to internal HTML renderer.`);
    }

    if (!navigatedSuccessfully) {
      // Fallback: render self-contained HTML directly
      const report: ReportJson = JSON.parse(reportRecord.report_json);
      const computedStats = JSON.parse(reportRecord.computed_stats_json || '{}');
      const fallbackHtml = generateStandaloneReportHtml(reportRecord, report, computedStats);
      await page.setContent(fallbackHtml, { waitUntil: 'load' });
    }

    // Small delay to ensure any SVG charts or fonts settle
    await new Promise((resolve) => setTimeout(resolve, 800));

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

function generateStandaloneReportHtml(
  record: any,
  report: ReportJson,
  computedStats: any
): string {
  const earthyPalette = {
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
      <div style="background: ${earthyPalette.surface}; border: 1px solid ${earthyPalette.sand}; border-radius: 12px; padding: 14px 18px; flex: 1; min-width: 180px;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: ${earthyPalette.muted};">${k.label}</div>
        <div style="font-size: 24px; font-weight: bold; color: ${earthyPalette.deep}; margin: 4px 0;">${k.value}</div>
        <div style="font-size: 12px; color: ${k.trend === 'up' ? earthyPalette.olive : k.trend === 'down' ? earthyPalette.clay : earthyPalette.muted}; font-weight: 600;">
          ${k.trend === 'up' ? '▲' : k.trend === 'down' ? '▼' : '●'} ${k.change || 'Stable'}
          <span style="font-size: 10px; color: ${earthyPalette.muted}; font-weight: normal; margin-left: 4px;">• ${k.sourceRef}</span>
        </div>
      </div>
    `
    )
    .join('');

  const findingsHtml = report.findings
    .map((f, i) => {
      const chartHtml = f.chart
        ? `
        <div style="margin-top: 14px; padding: 12px; background: #fff; border: 1px solid ${earthyPalette.sand}; border-radius: 8px;">
          <div style="font-size: 12px; font-weight: 600; color: ${earthyPalette.deep}; margin-bottom: 8px;">${f.chart.title} (${f.chart.type.toUpperCase()})</div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: ${earthyPalette.bg}; border-bottom: 1px solid ${earthyPalette.sand};">
                <th style="text-align: left; padding: 4px 8px; color: ${earthyPalette.muted};">Segment / Period</th>
                <th style="text-align: right; padding: 4px 8px; color: ${earthyPalette.muted};">Metric Value</th>
              </tr>
            </thead>
            <tbody>
              ${f.chart.data
                .map(
                  (d) => `
                <tr style="border-bottom: 1px solid #f0e9df;">
                  <td style="padding: 4px 8px; color: ${earthyPalette.deep};">${d.label}</td>
                  <td style="padding: 4px 8px; text-align: right; font-weight: 600; color: ${earthyPalette.primary};">${d.value.toLocaleString()}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `
        : '';

      const evidenceHtml = f.evidence
        .map(
          (e) => `
        <div style="font-size: 11px; background: #EFE6D9; color: ${earthyPalette.deep}; padding: 4px 10px; border-radius: 6px; display: inline-block; margin-right: 6px; margin-top: 6px;">
          📍 <strong>${e.source}</strong> [${e.location}] ${e.quote ? `— "${e.quote}"` : ''}
        </div>
      `
        )
        .join('');

      return `
      <div style="background: ${earthyPalette.surface}; border: 1px solid ${earthyPalette.sand}; border-radius: 12px; padding: 18px; margin-bottom: 16px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; font-size: 16px; color: ${earthyPalette.deep};">${i + 1}. ${f.headline}</h3>
          <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; background: ${f.impact === 'high' ? '#F7D7D0' : '#EFE6D9'}; color: ${f.impact === 'high' ? earthyPalette.clay : earthyPalette.primary};">
            ${f.impact} impact
          </span>
        </div>
        <p style="font-size: 13px; color: ${earthyPalette.text}; line-height: 1.5; margin: 10px 0;">${f.detail}</p>
        ${chartHtml}
        <div style="margin-top: 8px;">${evidenceHtml}</div>
      </div>
    `;
    })
    .join('');

  const recsHtml = report.recommendations
    .map(
      (r, i) => `
      <div style="background: ${earthyPalette.surface}; border-left: 4px solid ${r.priority === 'high' ? earthyPalette.terracotta : earthyPalette.primary}; border-top: 1px solid ${earthyPalette.sand}; border-right: 1px solid ${earthyPalette.sand}; border-bottom: 1px solid ${earthyPalette.sand}; border-radius: 0 10px 10px 0; padding: 14px 18px; margin-bottom: 12px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between;">
          <span style="font-weight: bold; font-size: 14px; color: ${earthyPalette.deep};">${i + 1}. ${r.action}</span>
          <span style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: ${r.priority === 'high' ? earthyPalette.clay : earthyPalette.primary};">${r.priority} Priority</span>
        </div>
        <div style="font-size: 12px; color: ${earthyPalette.text}; margin-top: 6px;"><strong>Rationale:</strong> ${r.rationale}</div>
        <div style="font-size: 12px; color: ${earthyPalette.olive}; font-weight: 600; margin-top: 4px;"><strong>Expected Impact:</strong> ${r.expectedImpact}</div>
        <div style="font-size: 10px; color: ${earthyPalette.muted}; margin-top: 4px;">Linked Findings: ${r.linkedFindingIds.join(', ')}</div>
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
            font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: ${earthyPalette.bg};
            color: ${earthyPalette.text};
            margin: 0;
            padding: 24px;
            -webkit-print-color-adjust: exact;
          }
          h1, h2, h3 { font-family: 'Lora', Georgia, serif; }
        </style>
      </head>
      <body>
        <div id="print-container">
          <div style="border-bottom: 2px solid ${earthyPalette.sand}; padding-bottom: 16px; margin-bottom: 24px;">
            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: ${earthyPalette.terracotta}; font-weight: bold;">Ledgerly Business Intelligence</div>
            <h1 style="font-size: 26px; color: ${earthyPalette.deep}; margin: 6px 0;">${report.title}</h1>
            <div style="font-size: 12px; color: ${earthyPalette.muted};">
              Entity: <strong>${record.business_name || 'Standard Enterprise'}</strong> | Generated: ${new Date(record.created_at).toLocaleDateString()} | Confidence: <strong>${report.dataQuality.confidence.toUpperCase()}</strong>
            </div>
          </div>

          <!-- KPIs -->
          <div style="display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap;">
            ${kpisHtml}
          </div>

          <!-- Executive Summary -->
          <div style="background: ${earthyPalette.surface}; border: 1px solid ${earthyPalette.sand}; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <h2 style="font-size: 18px; color: ${earthyPalette.deep}; margin-top: 0; margin-bottom: 10px;">Executive Summary</h2>
            <p style="font-size: 13.5px; line-height: 1.6; color: ${earthyPalette.text}; margin: 0;">${report.executiveSummary}</p>
          </div>

          <!-- Key Findings -->
          <h2 style="font-size: 19px; color: ${earthyPalette.deep}; margin-bottom: 14px;">Key Findings & Empirical Evidence</h2>
          ${findingsHtml}

          <!-- Recommendations -->
          <h2 style="font-size: 19px; color: ${earthyPalette.deep}; margin-top: 24px; margin-bottom: 14px;">Strategic Recommendations</h2>
          ${recsHtml}

          <!-- Risks & Caveats -->
          <div style="background: #F8EFE9; border: 1px solid #E4C8BE; border-radius: 12px; padding: 16px; margin-top: 24px; page-break-inside: avoid;">
            <h3 style="font-size: 14px; color: ${earthyPalette.clay}; margin-top: 0; margin-bottom: 8px;">Risks, Assumptions & Data Quality Notes</h3>
            <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: ${earthyPalette.deep}; line-height: 1.5;">
              ${report.risksAndCaveats.map((r) => `<li>${r}</li>`).join('')}
              ${report.dataQuality.issues.map((i) => `<li><em>Data Issue:</em> ${i}</li>`).join('')}
            </ul>
          </div>
        </div>
      </body>
    </html>
  `;
}
