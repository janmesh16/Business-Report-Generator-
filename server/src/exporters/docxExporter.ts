import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  HeadingLevel,
  AlignmentType,
  ImageRun,
} from 'docx';
import puppeteer, { Browser } from 'puppeteer';
import { dbService } from '../db/index.js';
import { ReportJson, ChartData } from '../llm/types.js';

// Earthy color constants for Word document (HEX without #)
const COLOR_BG_BEIGE = 'F5EFE6';
const COLOR_SURFACE = 'FBF7F1';
const COLOR_SAND = 'E3D5C0';
const COLOR_PRIMARY = '6B4F3A';
const COLOR_DEEP_BROWN = '3E2C20';
const COLOR_TERRACOTTA = 'B5651D';
const COLOR_OLIVE = '7A8450';
const COLOR_CLAY = 'A8452F';
const COLOR_MUTED = '7D6B5D';

async function renderChartPng(browser: Browser, chart: ChartData): Promise<Buffer | null> {
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 420, deviceScaleFactor: 2 });

    const labels = chart.data.map((d) => d.label);
    const values = chart.data.map((d) => d.value);
    const maxValue = Math.max(...values, 1);

    // Render an SVG bar / line / area / pie chart
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 24px 32px;
              background: #FBF7F1;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #3E2C20;
            }
            .title {
              font-size: 18px;
              font-weight: bold;
              color: #3E2C20;
              margin-bottom: 20px;
            }
            .chart-wrapper {
              display: flex;
              align-items: flex-end;
              gap: 16px;
              height: 260px;
              border-bottom: 2px solid #E3D5C0;
              padding-bottom: 12px;
            }
            .bar-col {
              flex: 1;
              display: flex;
              flex-direction: column;
              align-items: center;
              height: 100%;
              justify-content: flex-end;
            }
            .bar {
              width: 80%;
              background: linear-gradient(180deg, #B5651D 0%, #6B4F3A 100%);
              border-radius: 6px 6px 0 0;
              min-height: 4px;
            }
            .val-label {
              font-size: 13px;
              font-weight: bold;
              color: #3E2C20;
              margin-bottom: 6px;
            }
            .axis-label {
              font-size: 12px;
              color: #7D6B5D;
              margin-top: 8px;
              text-align: center;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 90px;
            }
          </style>
        </head>
        <body>
          <div class="title">${chart.title}</div>
          <div class="chart-wrapper">
            ${chart.data
              .map((d) => {
                const heightPercent = Math.max(4, Math.round((d.value / maxValue) * 90));
                return `
                <div class="bar-col">
                  <div class="val-label">${d.value.toLocaleString()}</div>
                  <div class="bar" style="height: ${heightPercent}%;"></div>
                  <div class="axis-label">${d.label}</div>
                </div>
              `;
              })
              .join('')}
          </div>
        </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: 'load' });
    const screenshot = await page.screenshot({ type: 'png' });
    await page.close();
    return Buffer.from(screenshot);
  } catch (err: any) {
    console.warn(`[DOCX Exporter] Failed to render chart PNG: ${err.message}`);
    return null;
  }
}

export async function exportReportToDocx(reportId: string): Promise<Buffer> {
  const reportRecord = dbService.getReport(reportId);
  if (!reportRecord || !reportRecord.report_json) {
    throw new Error(`Report ${reportId} not found or incomplete.`);
  }

  const report: ReportJson = JSON.parse(reportRecord.report_json);
  const computedStats = JSON.parse(reportRecord.computed_stats_json || '{}');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const chartImages: Map<string, Buffer> = new Map();
  try {
    for (const finding of report.findings) {
      if (finding.chart && finding.chart.data?.length > 0) {
        const png = await renderChartPng(browser, finding.chart);
        if (png) {
          chartImages.set(finding.id, png);
        }
      }
    }
  } finally {
    await browser.close();
  }

  // 1. KPI Table Rows
  const kpiRows = report.kpis.map(
    (k) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: { fill: COLOR_SURFACE },
            children: [
              new Paragraph({
                children: [new TextRun({ text: k.label, bold: true, color: COLOR_DEEP_BROWN })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: { fill: COLOR_SURFACE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: k.value,
                    bold: true,
                    size: 26,
                    color: COLOR_PRIMARY,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            shading: { fill: COLOR_SURFACE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${k.trend === 'up' ? '▲ ' : k.trend === 'down' ? '▼ ' : '● '}${k.change || 'Baseline'} (${k.sourceRef})`,
                    color: k.trend === 'up' ? COLOR_OLIVE : k.trend === 'down' ? COLOR_CLAY : COLOR_MUTED,
                    size: 18,
                  }),
                ],
              }),
            ],
          }),
        ],
      })
  );

  // 2. Findings Sections
  const findingParagraphs: Paragraph[] = [];
  for (let i = 0; i < report.findings.length; i++) {
    const f = report.findings[i];
    findingParagraphs.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({
            text: `${i + 1}. ${f.headline}`,
            bold: true,
            color: COLOR_DEEP_BROWN,
          }),
          new TextRun({
            text: `  [${f.impact.toUpperCase()} IMPACT]`,
            bold: true,
            color: f.impact === 'high' ? COLOR_CLAY : COLOR_TERRACOTTA,
            size: 18,
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: f.detail, color: COLOR_DEEP_BROWN })],
      })
    );

    // If finding has chart image, embed it
    const imgBuffer = chartImages.get(f.id);
    if (imgBuffer) {
      findingParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: [
            new ImageRun({
              data: imgBuffer,
              transformation: { width: 520, height: 270 },
            } as any),
          ],
        })
      );
    }

    // Evidence
    for (const e of f.evidence) {
      findingParagraphs.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({ text: `Evidence [${e.source} - ${e.location}]: `, bold: true, color: COLOR_MUTED, size: 18 }),
            new TextRun({ text: e.quote ? `"${e.quote}"` : 'Verified from parsed dataset.', italics: true, color: COLOR_PRIMARY, size: 18 }),
          ],
        })
      );
    }
  }

  // 3. Recommendations Table
  const recRows = report.recommendations.map(
    (r, idx) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            shading: { fill: r.priority === 'high' ? 'F7D7D0' : COLOR_SURFACE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${r.priority.toUpperCase()}`,
                    bold: true,
                    color: r.priority === 'high' ? COLOR_CLAY : COLOR_PRIMARY,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            shading: { fill: COLOR_SURFACE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `${idx + 1}. ${r.action}`, bold: true, color: COLOR_DEEP_BROWN }),
                  new TextRun({ text: `\nRationale: ${r.rationale}`, color: COLOR_MUTED, size: 18 }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            shading: { fill: COLOR_SURFACE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `Impact: ${r.expectedImpact}`, color: COLOR_OLIVE, bold: true, size: 18 }),
                  new TextRun({ text: `\nLinked Findings: ${r.linkedFindingIds.join(', ')}`, color: COLOR_MUTED, size: 16 }),
                ],
              }),
            ],
          }),
        ],
      })
  );

  // 4. Assemble Complete Document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header / Title
          new Paragraph({
            heading: HeadingLevel.TITLE,
            children: [
              new TextRun({
                text: report.title,
                bold: true,
                color: COLOR_DEEP_BROWN,
                size: 36,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: `Ledgerly Executive Report  |  Entity: ${reportRecord.business_name || 'Organization'}  |  Date: ${new Date(reportRecord.created_at).toLocaleDateString()}`,
                color: COLOR_MUTED,
                size: 20,
              }),
            ],
          }),

          // Executive Summary
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 120 },
            children: [new TextRun({ text: 'Executive Summary', bold: true, color: COLOR_PRIMARY })],
          }),
          new Paragraph({
            spacing: { after: 240 },
            children: [new TextRun({ text: report.executiveSummary, color: COLOR_DEEP_BROWN })],
          }),

          // Headline KPIs
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 120 },
            children: [new TextRun({ text: 'Key Performance Indicators', bold: true, color: COLOR_PRIMARY })],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: COLOR_SAND },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Metric', bold: true, color: COLOR_DEEP_BROWN })] })],
                  }),
                  new TableCell({
                    shading: { fill: COLOR_SAND },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Reported Value', bold: true, color: COLOR_DEEP_BROWN })] })],
                  }),
                  new TableCell({
                    shading: { fill: COLOR_SAND },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Trajectory & Source', bold: true, color: COLOR_DEEP_BROWN })] })],
                  }),
                ],
              }),
              ...kpiRows,
            ],
          }),

          // Key Findings with Embedded Charts & Evidence
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 120 },
            children: [new TextRun({ text: 'Key Findings & Empirical Evidence', bold: true, color: COLOR_PRIMARY })],
          }),
          ...findingParagraphs,

          // Strategic Recommendations
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 120 },
            children: [new TextRun({ text: 'Prioritized Strategic Recommendations', bold: true, color: COLOR_PRIMARY })],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: COLOR_SAND },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Priority', bold: true, color: COLOR_DEEP_BROWN })] })],
                  }),
                  new TableCell({
                    shading: { fill: COLOR_SAND },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Action & Rationale', bold: true, color: COLOR_DEEP_BROWN })] })],
                  }),
                  new TableCell({
                    shading: { fill: COLOR_SAND },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Expected Impact', bold: true, color: COLOR_DEEP_BROWN })] })],
                  }),
                ],
              }),
              ...recRows,
            ],
          }),

          // Risks, Assumptions & Data Quality
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 120 },
            children: [new TextRun({ text: 'Risks, Caveats & Data Quality Notes', bold: true, color: COLOR_CLAY })],
          }),
          ...report.risksAndCaveats.map(
            (risk) =>
              new Paragraph({
                bullet: { level: 0 },
                spacing: { after: 60 },
                children: [new TextRun({ text: risk, color: COLOR_DEEP_BROWN })],
              })
          ),
          ...report.dataQuality.issues.map(
            (issue) =>
              new Paragraph({
                bullet: { level: 0 },
                spacing: { after: 60 },
                children: [new TextRun({ text: `Data Quality Note: ${issue}`, italics: true, color: COLOR_MUTED })],
              })
          ),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
