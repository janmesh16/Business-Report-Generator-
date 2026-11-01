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

  // Step 2: Upload samples
  console.log('\n2. Ingesting multi-source sample data (CSV + Excel + Notes)...');
  const csvBuffer = fs.readFileSync('samples/sales_data_q1_q3.csv');
  const xlsxBuffer = fs.readFileSync('samples/quarterly_financials_2025.xlsx');
  const notesText = fs.readFileSync('samples/operations_meeting_notes.txt', 'utf8');

  const formData = new FormData();
  formData.append('files', new Blob([csvBuffer]), 'sales_data_q1_q3.csv');
  formData.append('files', new Blob([xlsxBuffer]), 'quarterly_financials_2025.xlsx');
  formData.append('notes', notesText);
  formData.append('title', 'Q1-Q3 2025 Enterprise Performance & Operational Strategy');
  formData.append('businessName', 'Apex Global Cloud Solutions, Inc.');
  formData.append('decisionContext', 'Evaluate regional resource allocation: Accelerate North American Cloud Security vs. restructure APAC margin pressure.');
  formData.append('sheetSelections', JSON.stringify({ 'quarterly_financials_2025.xlsx': 'Profit_and_Loss' }));

  const createRes = await fetch(`${SERVER_URL}/api/reports`, {
    method: 'POST',
    body: formData,
  });
  if (!createRes.ok) {
    const text = await createRes.text();
    throw new Error(`Failed to create report: HTTP ${createRes.status}: ${text}`);
  }
  const { reportId } = await createRes.json();
  console.log(`   Report successfully created with ID: ${reportId}`);

  // Step 3: Poll until complete
  console.log('\n3. Polling report generation status...');
  let status = 'parsing';
  let reportData = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 800));
    const statusRes = await fetch(`${SERVER_URL}/api/reports/${reportId}/status`);
    const statusJson = await statusRes.json();
    console.log(`   [Poll ${i + 1}] Status: ${statusJson.status} - "${statusJson.progressStep}"`);

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

  // Step 4: Fetch completed report
  console.log('\n4. Fetching verified report details...');
  const reportRes = await fetch(`${SERVER_URL}/api/reports/${reportId}`);
  reportData = await reportRes.json();
  const reportJson = reportData.reportJson;

  console.log(`   Title: ${reportJson.title}`);
  console.log(`   KPI Count: ${reportJson.kpis.length}`);
  reportJson.kpis.forEach((k) => console.log(`     - ${k.label}: ${k.value} (${k.change || 'flat'}, ${k.trend}) [${k.sourceRef}]`));
  console.log(`   Findings Count: ${reportJson.findings.length}`);
  reportJson.findings.forEach((f) => console.log(`     - [${f.impact.toUpperCase()}] ${f.headline} (Chart: ${f.chart?.type || 'none'})`));
  console.log(`   Recommendations Count: ${reportJson.recommendations.length}`);
  reportJson.recommendations.forEach((r) => console.log(`     - [${r.priority.toUpperCase()}] ${r.action}`));

  // Step 5: Test PDF Export
  console.log('\n5. Testing PDF Export...');
  const pdfRes = await fetch(`${SERVER_URL}/api/reports/${reportId}/export/pdf`);
  if (!pdfRes.ok) throw new Error(`PDF export failed with HTTP ${pdfRes.status}`);
  const pdfArrayBuffer = await pdfRes.arrayBuffer();
  const pdfBuffer = Buffer.from(pdfArrayBuffer);
  console.log(`   PDF downloaded successfully! Size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
  const isPdfValid = pdfBuffer.slice(0, 5).toString('ascii') === '%PDF-';
  console.log(`   PDF magic bytes valid (%PDF-): ${isPdfValid}`);
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'sample_report.pdf'), pdfBuffer);

  // Step 6: Test Word (.docx) Export
  console.log('\n6. Testing Word (.docx) Export...');
  const docxRes = await fetch(`${SERVER_URL}/api/reports/${reportId}/export/docx`);
  if (!docxRes.ok) throw new Error(`DOCX export failed with HTTP ${docxRes.status}`);
  const docxArrayBuffer = await docxRes.arrayBuffer();
  const docxBuffer = Buffer.from(docxArrayBuffer);
  console.log(`   DOCX downloaded successfully! Size: ${(docxBuffer.length / 1024).toFixed(1)} KB`);
  const isDocxValid = docxBuffer.slice(0, 2).toString('ascii') === 'PK';
  console.log(`   DOCX magic bytes valid (PK zip): ${isDocxValid}`);
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'sample_report.docx'), docxBuffer);

  // Step 7: Test Share Link Lifecycle
  console.log('\n7. Testing Share Link lifecycle...');
  const shareRes = await fetch(`${SERVER_URL}/api/reports/${reportId}/share`, { method: 'POST' });
  const shareJson = await shareRes.json();
  console.log(`   Generated Share Token: ${shareJson.token}`);
  console.log(`   Public Share URL: ${shareJson.shareUrl}`);

  // Fetch as public read-only user
  const publicRes = await fetch(`${SERVER_URL}/api/shared/${shareJson.token}`);
  if (!publicRes.ok) throw new Error(`Public shared retrieval failed with HTTP ${publicRes.status}`);
  const publicData = await publicRes.json();
  console.log(`   Public view loaded successfully! Title: ${publicData.title}, isSharedView: ${publicData.isSharedView}`);

  // Revoke share token
  console.log('   Revoking share token...');
  const revokeRes = await fetch(`${SERVER_URL}/api/reports/${reportId}/share`, { method: 'DELETE' });
  const revokeJson = await revokeRes.json();
  console.log('   Revoke response:', revokeJson);

  // Test that revoked token now returns 404
  const revokedAccessRes = await fetch(`${SERVER_URL}/api/shared/${shareJson.token}`);
  console.log(`   Accessing revoked link status code: ${revokedAccessRes.status} (Expected: 404)`);
  if (revokedAccessRes.status !== 404) throw new Error('Revoked token was still accessible!');

  // Re-enable share token for user inspection
  await fetch(`${SERVER_URL}/api/reports/${reportId}/share`, { method: 'POST' });

  // Step 8: Puppeteer Browser UI Verification & Screenshots
  console.log('\n8. Launching browser to capture UI screenshots...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Desktop screenshot
    await page.setViewport({ width: 1440, height: 1800, deviceScaleFactor: 2 });
    await page.goto(`${CLIENT_URL}/reports/${reportId}`, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1500)); // wait for charts to settle
    const desktopScreenshotPath = path.join(ARTIFACT_DIR, 'dashboard_desktop.png');
    await page.screenshot({ path: desktopScreenshotPath, fullPage: true });
    console.log(`   Desktop screenshot saved to: ${desktopScreenshotPath}`);

    // Mobile screenshot
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1200));
    const mobileScreenshotPath = path.join(ARTIFACT_DIR, 'dashboard_mobile.png');
    await page.screenshot({ path: mobileScreenshotPath, fullPage: true });
    console.log(`   Mobile screenshot saved to: ${mobileScreenshotPath}`);

    // Home / Landing screenshot
    await page.setViewport({ width: 1440, height: 1200, deviceScaleFactor: 2 });
    await page.goto(`${CLIENT_URL}/`, { waitUntil: 'networkidle0', timeout: 10000 });
    await new Promise((r) => setTimeout(r, 800));
    const homeScreenshotPath = path.join(ARTIFACT_DIR, 'landing_home.png');
    await page.screenshot({ path: homeScreenshotPath, fullPage: true });
    console.log(`   Home / Ingestion screenshot saved to: ${homeScreenshotPath}`);
  } finally {
    await browser.close();
  }

  console.log('\n=== [ALL E2E TESTS PASSED SUCCESSFULLY] ===\n');
}

runEndToEndTest().catch((err) => {
  console.error('\n❌ E2E TEST FAILED:', err);
  process.exit(1);
});
