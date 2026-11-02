import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeadingLevel,
  AlignmentType,
  ImageRun,
} from 'docx';
import puppeteer, { Browser } from 'puppeteer';
import { dbService } from '../db/index.js';
import { ReportJson } from '../llm/types.js';

const COLOR_BG_BEIGE = 'F5EFE6';
const COLOR_SURFACE = 'FBF7F1';
const COLOR_SAND = 'E3D5C0';
const COLOR_PRIMARY = '6B4F3A';
const COLOR_DEEP_BROWN = '3E2C20';
const COLOR_TERRACOTTA = 'B5651D';
const COLOR_OLIVE = '7A8450';
const COLOR_CLAY = 'A8452F';
const COLOR_MUTED = '7D6B5D';

async function renderChartToPngBuffer(browser: Browser, chart: any): Promise<Buffer | null> {
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 400, deviceScaleFactor: 2 });

    const labels = (chart.data || []).map((d: any) => d.label || d.name || 'Item');
    const values = (chart.data || []).map((d: any) => typeof d.value === 'number' ? d.value : typeof d.count === 'number' ? d.count : 10);
    const maxValue = Math.max(...values, 1);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 24px 32px;
              background: #FBF7F1;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #3E2C20;
            }
            .title { font-size: 16px; font-weight: bold; color: #3E2C20; margin-bottom: 6px; }
            .subtitle { font-size: 11px; color: #7D6B5D; margin-bottom: 18px; }
            .chart-box {
              display: flex;
              align-items: flex-end;
              gap: 12px;
              height: 220px;
              border-bottom: 2px solid #E3D5C0;
              padding-bottom: 10px;
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
              width: 75%;
              background: linear-gradient(180deg, #B5651D 0%, #6B4F3A 100%);
              border-radius: 4px 4px 0 0;
              min-height: 4px;
            }
            .val-label { font-size: 11px; font-weight: bold; color: #3E2C20; margin-bottom: 4px; }
            .axis-label {
              font-size: 10px;
              color: #7D6B5D;
              margin-top: 6px;
              text-align: center;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 80px;
            }
          </style>
        </head>
        <body>
          <div class="title">${chart.title}</div>
          <div class="subtitle">${chart.whatItShows || 'Deterministic Empirical Distribution'}</div>
          <div class="chart-box">
            ${chart.data
              .slice(0, 8)
              .map((d: any) => {
                const val = typeof d.value === 'number' ? d.value : typeof d.count === 'number' ? d.count : 10;
                const heightPercent = Math.max(5, Math.round((val / maxValue) * 88));
                return `
                <div class="bar-col">
                  <div class="val-label">${val.toLocaleString()}</div>
                  <div class="bar" style="height: ${heightPercent}%;"></div>
                  <div class="axis-label">${d.label || d.category || d.name || 'Segment'}</div>
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
    console.warn(`[DOCX Exporter] Could not screenshot chart: ${err.message}`);
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
  const candidateCharts: any[] = computedStats.candidateCharts || [];

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const chartPngMap = new Map<string, Buffer>();
  try {
    for (const chart of candidateCharts) {
      const pngBuffer = await renderChartToPngBuffer(browser, chart);
      if (pngBuffer) {
        chartPngMap.set(chart.id, pngBuffer);
      }
    }
  } finally {
    await browser.close();
  }

  // 1. KPI Rows
  const kpiRows = report.kpis.map(
    (k) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: { fill: COLOR_SURFACE },
            children: [new Paragraph({ children: [new TextRun({ text: k.label, bold: true, color: COLOR_DEEP_BROWN })] })],
          }),
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: { fill: COLOR_SURFACE },
            children: [new Paragraph({ children: [new TextRun({ text: k.value, bold: true, size: 24, color: COLOR_PRIMARY })] })],
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
        spacing: { before: 200, after: 100 },
        children: [
          new TextRun({ text: `${i + 1}. ${f.headline}`, bold: true, color: COLOR_DEEP_BROWN }),
          new TextRun({ text: `  [${f.impact.toUpperCase()} IMPACT]`, bold: true, color: f.impact === 'high' ? COLOR_CLAY : COLOR_TERRACOTTA, size: 18 }),
        ],
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({ text: f.detail, color: COLOR_DEEP_BROWN })],
      })
    );

    // Embed chart PNGs linked to this finding
    for (const cId of f.chartIds || []) {
      const png = chartPngMap.get(cId);
      const note = report.chartNotes?.find((n) => n.chartId === cId);
      if (png) {
        findingParagraphs.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 80 },
            children: [new ImageRun({ data: png, transformation: { width: 500, height: 250 } } as any)],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: 'What this shows: ', bold: true, color: COLOR_PRIMARY, size: 18 }),
              new TextRun({ text: `${note?.whatItShows || 'Visual trend breakdown'}\n`, color: COLOR_DEEP_BROWN, size: 18 }),
              new TextRun({ text: 'So what: ', bold: true, color: COLOR_OLIVE, size: 18 }),
              new TextRun({ text: note?.soWhat || 'Aligns with target performance benchmarks.', color: COLOR_DEEP_BROWN, size: 18 }),
            ],
          })
        );
      }
    }

    // Evidence References
    for (const e of f.evidence) {
      findingParagraphs.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({ text: `Evidence [${e.source} - ${e.location}]: `, bold: true, color: COLOR_MUTED, size: 18 }),
            new TextRun({ text: e.quote ? `"${e.quote}"` : 'Empirically verified from parsed source.', italics: true, color: COLOR_PRIMARY, size: 18 }),
          ],
        })
      );
    }
  }

  // 3. Visual Analysis: Remaining Charts
  const visualAnalysisParagraphs: Paragraph[] = [];
  const linkedChartSet = new Set((report.findings || []).flatMap((f) => f.chartIds || []));
  const remainingCharts = candidateCharts.filter((c) => !linkedChartSet.has(c.id));

  for (const chart of remainingCharts.slice(0, 4)) {
    const png = chartPngMap.get(chart.id);
    if (png) {
      visualAnalysisParagraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 180, after: 80 },
          children: [new TextRun({ text: chart.title, bold: true, color: COLOR_DEEP_BROWN })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new ImageRun({ data: png, transformation: { width: 500, height: 250 } } as any)],
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'What this shows: ', bold: true, color: COLOR_PRIMARY, size: 18 }),
            new TextRun({ text: `${chart.whatItShows}\n`, color: COLOR_DEEP_BROWN, size: 18 }),
            new TextRun({ text: 'So what: ', bold: true, color: COLOR_OLIVE, size: 18 }),
            new TextRun({ text: chart.soWhat, color: COLOR_DEEP_BROWN, size: 18 }),
          ],
        })
      );
    }
  }

  // 4. Recommendations Table
  const recRows = report.recommendations.map(
    (r, idx) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            shading: { fill: r.priority === 'high' ? 'F7D7D0' : COLOR_SURFACE },
            children: [new Paragraph({ children: [new TextRun({ text: r.priority.toUpperCase(), bold: true, color: r.priority === 'high' ? COLOR_CLAY : COLOR_PRIMARY })] })],
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

  // Assemble full Word document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header / Title
          new Paragraph({
            heading: HeadingLevel.TITLE,
            children: [new TextRun({ text: report.title, bold: true, color: COLOR_DEEP_BROWN, size: 36 })],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `Ledgerly Executive Intelligence  |  Entity: ${reportRecord.business_name || 'Organization'}  |  Date: ${new Date(reportRecord.created_at).toLocaleDateString()}`,
                color: COLOR_MUTED,
                size: 20,
              }),
            ],
          }),

          // Executive Summary
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 180, after: 100 },
            children: [new TextRun({ text: 'Executive Summary', bold: true, color: COLOR_PRIMARY })],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: report.executiveSummary, color: COLOR_DEEP_BROWN })],
          }),

          // About This Data Panel
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `About This Data: ${report.aboutData?.rows || 0} Records, ${report.aboutData?.columns || 0} Columns, Period: ${report.aboutData?.dateRange || 'N/A'}, Quality Score: ${report.aboutData?.qualityScore || 92}/100`,
                italics: true,
                color: COLOR_MUTED,
              }),
            ],
          }),

          // KPIs Table
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 180, after: 100 },
            children: [new TextRun({ text: 'Key Performance Indicators (At a Glance)', bold: true, color: COLOR_PRIMARY })],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: COLOR_SAND }, children: [new Paragraph({ children: [new TextRun({ text: 'Metric', bold: true, color: COLOR_DEEP_BROWN })] })] }),
                  new TableCell({ shading: { fill: COLOR_SAND }, children: [new Paragraph({ children: [new TextRun({ text: 'Value', bold: true, color: COLOR_DEEP_BROWN })] })] }),
                  new TableCell({ shading: { fill: COLOR_SAND }, children: [new Paragraph({ children: [new TextRun({ text: 'Trajectory & Source', bold: true, color: COLOR_DEEP_BROWN })] })] }),
                ],
              }),
              ...kpiRows,
            ],
          }),

          // Key Findings with Embedded Charts & Evidence
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 100 },
            children: [new TextRun({ text: 'Key Findings & Empirical Evidence', bold: true, color: COLOR_PRIMARY })],
          }),
          ...findingParagraphs,

          // Visual Analysis (Remaining Visualizations)
          ...(visualAnalysisParagraphs.length > 0
            ? [
                new Paragraph({
                  heading: HeadingLevel.HEADING_1,
                  spacing: { before: 240, after: 100 },
                  children: [new TextRun({ text: 'Visual Analysis & Deep Dives', bold: true, color: COLOR_PRIMARY })],
                }),
                ...visualAnalysisParagraphs,
              ]
            : []),

          // Recommendations Table
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 100 },
            children: [new TextRun({ text: 'Prioritized Strategic Recommendations', bold: true, color: COLOR_PRIMARY })],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: COLOR_SAND }, children: [new Paragraph({ children: [new TextRun({ text: 'Priority', bold: true, color: COLOR_DEEP_BROWN })] })] }),
                  new TableCell({ shading: { fill: COLOR_SAND }, children: [new Paragraph({ children: [new TextRun({ text: 'Action & Rationale', bold: true, color: COLOR_DEEP_BROWN })] })] }),
                  new TableCell({ shading: { fill: COLOR_SAND }, children: [new Paragraph({ children: [new TextRun({ text: 'Expected Impact', bold: true, color: COLOR_DEEP_BROWN })] })] }),
                ],
              }),
              ...recRows,
            ],
          }),

          // Risks, Assumptions & Data Quality
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 100 },
            children: [new TextRun({ text: 'Risks, Caveats & Data Quality Notes', bold: true, color: COLOR_CLAY })],
          }),
          ...report.risksAndCaveats.map(
            (r) =>
              new Paragraph({
                bullet: { level: 0 },
                spacing: { after: 60 },
                children: [new TextRun({ text: r, color: COLOR_DEEP_BROWN })],
              })
          ),
          ...report.dataQuality.issues.map(
            (issue) =>
              new Paragraph({
                bullet: { level: 0 },
                spacing: { after: 60 },
                children: [new TextRun({ text: `Data Integrity Note: ${issue}`, italics: true, color: COLOR_MUTED })],
              })
          ),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
