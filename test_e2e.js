import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const puppeteer = require('./server/node_modules/puppeteer');

const SERVER_URL = 'http://localhost:3001';
const CLIENT_URL = 'http://localhost:5173';
const ARTIFACT_DIR = '/Users/janmeshravindrarohida/.gemini/antigravity/brain/405f4c79-848e-43f6-9a92-0d735e83a85b';

async function runEndToEndTest() {
  console.log('=== [E2E TEST] Starting Ledgerly End-to-End Verification ===\n');

  // Step 1: Health check
  console.log('1. Checking backend health...');
  const healthRes = await fetch(`${SERVER_URL}/api/health`);
  const healthJson = await healthRes.json();
  console.log('   Health response:', healthJson);
  if (healthJson.status !== 'ok') throw new Error('Health check failed');

  // Step 2: Test Preview API
  console.log('\n2. Testing Pre-flight Telemetry Preview API (/api/reports/preview)...');
  const salesCsv = fs.readFileSync('samples/sales.csv');
  const financeXlsx = fs.readFileSync('samples/finance.xlsx');
  const reportPdf = fs.readFileSync('samples/report.pdf');

  const previewForm = new FormData();
  previewForm.append('files', new Blob([salesCsv]), 'sales.csv');
  previewForm.append('files', new Blob([financeXlsx]), 'finance.xlsx');
  previewForm.append('pastedText', 'Product,TargetRevenue,ActualRevenue\nEnterprise,500000,560000\nMidMarket,300000,290000\nSMB,150000,180000');

  const previewRes = await fetch(`${SERVER_URL}/api/reports/preview`, {
    method: 'POST',
    body: previewForm,
  });
  if (!previewRes.ok) throw new Error(`Preview failed with HTTP ${previewRes.status}`);
  const previewJson = await previewRes.json();
  console.log(`   Preview returned ${previewJson.previews.length} source telemetry previews:`);
  previewJson.previews.forEach((p) => {
    console.log(`     - [${p.type}] ${p.name}: ${p.totalRows} rows, ${p.columns?.length || 0} cols, quality: ${p.qualityScore}/100`);
  });

  // Step 3: Test Prompt Compare API
  console.log('\n3. Testing 3-Way Prompt Architecture Comparison (/api/reports/compare)...');
  const compareForm = new FormData();
  compareForm.append('pastedText', 'Date,Team,ARR,Headcount\n2025-01,Sales,120000,12\n2025-02,Sales,145000,14\n2025-03,Sales,180000,16\n2025-01,Support,40000,8\n2025-02,Support,42000,8\n2025-03,Support,48000,9');
  compareForm.append('title', 'Team Capacity & ARR Run-Rate');
  const compareRes = await fetch(`${SERVER_URL}/api/reports/compare`, {
    method: 'POST',
    body: compareForm,
  });
  if (!compareRes.ok) throw new Error(`Prompt compare failed with HTTP ${compareRes.status}`);
  const compareJson = await compareRes.json();
  console.log('   Prompt comparison successful:');
  console.log(`     - v1 Findings count: ${compareJson.v1.findings?.length || 0}`);
  console.log(`     - v2 KPIs count: ${compareJson.v2.kpis?.length || 0}`);
  console.log(`     - v3 Quality Score: ${compareJson.v3.aboutData?.qualityScore}/100, Findings: ${compareJson.v3.findings?.length}`);
  console.log(`     - Candidate Charts Built: ${compareJson.charts?.length || 0}`);

  // Step 4: Upload Multi-Source Data for Full Report Generation
  console.log('\n4. Generating Full Production Report with Prompt v3...');
  const formData = new FormData();
  formData.append('files', new Blob([salesCsv]), 'sales.csv');
  formData.append('files', new Blob([financeXlsx]), 'finance.xlsx');
  formData.append('files', new Blob([reportPdf]), 'report.pdf');
  formData.append('title', 'Q1-Q3 2025 Comprehensive Business & Financial Telemetry');
  formData.append('businessName', 'Apex Enterprise Technologies');
  formData.append('decisionContext', 'Resource allocation and operational expansion for upcoming fiscal year');
  formData.append('promptVersion', 'v3');
  formData.append('sheetSelections', JSON.stringify({ 'finance.xlsx': 'Income_Statement' }));

  const createRes = await fetch(`${SERVER_URL}/api/reports`, {
    method: 'POST',
    body: formData,
  });
  if (!createRes.ok) {
    const text = await createRes.text();
    throw new Error(`Failed to create report: HTTP ${createRes.status}: ${text}`);
  }
  const { reportId } = await createRes.json();
  console.log(`   Report successfully queued with ID: ${reportId}`);

  // Step 5: Poll progress through 4 distinct stages
  console.log('\n5. Polling 4-Stage Pipeline Progress...');
  let status = 'parsing';
  let reportData = null;
  for (let i = 0; i < 35; i++) {
    await new Promise((r) => setTimeout(r, 800));
    const statusRes = await fetch(`${SERVER_URL}/api/reports/${reportId}/status`);
    const statusJson = await statusRes.json();
    console.log(`   [Poll ${i + 1}] Status: ${statusJson.status} — "${statusJson.progressStep}"`);

    if (statusJson.status === 'completed') {
      status = 'completed';
      break;
    }
    if (statusJson.status === 'failed') {
      throw new Error(`Pipeline failed: ${statusJson.errorMessage}`);
    }
  }

  if (status !== 'completed') {
    throw new Error('Report generation timed out.');
  }

  // Step 6: Fetch and inspect completed report
  console.log('\n6. Fetching and validating complete report structure...');
  const reportRes = await fetch(`${SERVER_URL}/api/reports/${reportId}`);
  reportData = await reportRes.json();
  const reportJson = reportData.reportJson;

  console.log(`   Report Title: ${reportJson.title}`);
  console.log(`   Prompt Engine: ${reportData.promptVersion}`);
  console.log(`   Data Quality Score: ${reportJson.aboutData?.qualityScore}/100 (${reportJson.aboutData?.rows} rows, ${reportJson.aboutData?.columns} cols)`);
  console.log(`   Candidate Charts Generated: ${reportData.computedStats?.candidateCharts?.length || 0}`);
  if ((reportData.computedStats?.candidateCharts?.length || 0) < 6) {
    console.warn('   ⚠️ Warning: Fewer than 6 candidate charts generated.');
  } else {
    console.log(`   ✅ 6-10 Rich Charts Requirement Satisfied (${reportData.computedStats.candidateCharts.length} charts)`);
  }

  console.log(`   Headline KPIs (${reportJson.kpis.length}):`);
  reportJson.kpis.forEach((k) => console.log(`     • ${k.label}: ${k.value} (${k.change || 'flat'}, ${k.trend}) [${k.sourceRef}]`));

  console.log(`   Key Findings with Citations (${reportJson.findings.length}):`);
  reportJson.findings.forEach((f) => {
    console.log(`     • [${f.impact.toUpperCase()}] ${f.headline}`);
    f.evidence?.forEach((ev) => console.log(`         Citation: ${ev.source} (${ev.location}) "${ev.quote || ''}"`));
  });

  // Step 7: Test PDF Export
  console.log('\n7. Testing PDF Export via Puppeteer...');
  const pdfRes = await fetch(`${SERVER_URL}/api/reports/${reportId}/export/pdf`);
  if (!pdfRes.ok) throw new Error(`PDF export failed with HTTP ${pdfRes.status}`);
  const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
  console.log(`   PDF downloaded successfully! Size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
  const isPdfValid = pdfBuffer.slice(0, 5).toString('ascii') === '%PDF-';
  console.log(`   PDF magic bytes valid (%PDF-): ${isPdfValid}`);
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'sample_report.pdf'), pdfBuffer);

  // Step 8: Test Word (.docx) Export
  console.log('\n8. Testing Word (.docx) Export with embedded charts...');
  const docxRes = await fetch(`${SERVER_URL}/api/reports/${reportId}/export/docx`);
  if (!docxRes.ok) throw new Error(`DOCX export failed with HTTP ${docxRes.status}`);
  const docxBuffer = Buffer.from(await docxRes.arrayBuffer());
  console.log(`   DOCX downloaded successfully! Size: ${(docxBuffer.length / 1024).toFixed(1)} KB`);
  const isDocxValid = docxBuffer.slice(0, 2).toString('ascii') === 'PK';
  console.log(`   DOCX magic bytes valid (PK zip): ${isDocxValid}`);
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'sample_report.docx'), docxBuffer);

  // Step 9: Test Share Link Lifecycle
  console.log('\n9. Testing Share Link Lifecycle...');
  const shareRes = await fetch(`${SERVER_URL}/api/reports/${reportId}/share`, { method: 'POST' });
  const shareJson = await shareRes.json();
  console.log(`   Share URL: ${shareJson.shareUrl}`);

  const publicRes = await fetch(`${SERVER_URL}/api/shared/${shareJson.token}`);
  if (!publicRes.ok) throw new Error(`Public shared retrieval failed: HTTP ${publicRes.status}`);
  const publicData = await publicRes.json();
  console.log(`   Public view loaded successfully! Title: ${publicData.title}`);

  // Revoke share token
  console.log('   Testing token revocation...');
  await fetch(`${SERVER_URL}/api/reports/${reportId}/share`, { method: 'DELETE' });
  const revokedAccessRes = await fetch(`${SERVER_URL}/api/shared/${shareJson.token}`);
  console.log(`   Revoked token HTTP status: ${revokedAccessRes.status} (Expected: 404)`);
  if (revokedAccessRes.status !== 404) throw new Error('Revoked token was still accessible!');

  // Re-enable share token for user inspection
  await fetch(`${SERVER_URL}/api/reports/${reportId}/share`, { method: 'POST' });

  // Step 10: Puppeteer UI Testing & Screenshots
  console.log('\n10. Puppeteer Browser Testing & Screenshot Captures...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // 10a: Desktop Dashboard screenshot
    await page.setViewport({ width: 1440, height: 2200, deviceScaleFactor: 2 });
    await page.goto(`${CLIENT_URL}/reports/${reportId}`, { waitUntil: 'networkidle0', timeout: 20000 });
    await new Promise((r) => setTimeout(r, 2000)); // allow Recharts animations to complete

    // Click an evidence chip to open the Evidence Drawer
    try {
      const chipSelector = 'button[type="button"]';
      const buttons = await page.$$(chipSelector);
      for (const btn of buttons) {
        const text = await page.evaluate((el) => el.innerText, btn);
        if (text && (text.includes('sales.csv') || text.includes('finance.xlsx') || text.includes('report.pdf'))) {
          await btn.click();
          console.log('   Clicked Evidence Chip to test Evidence Drawer opening!');
          await new Promise((r) => setTimeout(r, 600));
          break;
        }
      }
    } catch (e) {
      console.warn('   Could not click evidence chip in test:', e.message);
    }

    const desktopScreenshotPath = path.join(ARTIFACT_DIR, 'dashboard_desktop.png');
    await page.screenshot({ path: desktopScreenshotPath, fullPage: true });
    console.log(`   Desktop screenshot saved to: ${desktopScreenshotPath}`);

    // 10b: Mobile screenshot
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1500));
    const mobileScreenshotPath = path.join(ARTIFACT_DIR, 'dashboard_mobile.png');
    await page.screenshot({ path: mobileScreenshotPath, fullPage: true });
    console.log(`   Mobile screenshot saved to: ${mobileScreenshotPath}`);

    // 10c: Home page screenshot
    await page.setViewport({ width: 1440, height: 1200, deviceScaleFactor: 2 });
    await page.goto(`${CLIENT_URL}/`, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1000));
    const homeScreenshotPath = path.join(ARTIFACT_DIR, 'landing_home.png');
    await page.screenshot({ path: homeScreenshotPath, fullPage: true });
    console.log(`   Home page screenshot saved to: ${homeScreenshotPath}`);
  } finally {
    await browser.close();
  }

  console.log('\n=== [ALL E2E TESTS PASSED SUCCESSFULLY] ===\n');
}

runEndToEndTest().catch((err) => {
  console.error('\n❌ E2E TEST FAILED:', err);
  process.exit(1);
});
