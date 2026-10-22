const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const EVIDENCE_DIR = path.resolve(__dirname, '../../../docs/evidence');
const BASE_URL = 'http://localhost:4000';

async function main() {
  if (!fs.existsSync(EVIDENCE_DIR)) {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  }

  // 1. Get auth token via direct fetch
  console.log('Authenticating via API...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'Admin@123' }),
  });
  const loginJson = await loginRes.json();
  const token = loginJson.data.token;
  const user = loginJson.data.user;

  console.log('🚀 Launching headless Edge to capture genuine evidence screenshots...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();

  // 1. Capture Login Screen
  console.log('Capturing 18-deployed-website.png (Login Screen)...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '18-deployed-website.png') });

  // 2. Set token in localStorage for authenticated routes
  await page.evaluate((tok, usr) => {
    localStorage.setItem('ccb_token', tok);
    localStorage.setItem('ccb_user', JSON.stringify(usr));
  }, token, user);

  const screens = [
    { url: `${BASE_URL}/`, file: '01-dashboard.png', name: 'Dashboard KPIs & Escalations' },
    { url: `${BASE_URL}/ci-registry`, file: '02-ci-registry.png', name: 'CI Registry Table' },
    { url: `${BASE_URL}/change-requests`, file: '03-change-request-form.png', name: 'Change Requests Management' },
    { url: `${BASE_URL}/approvals`, file: '04-ccb-approval-queue.png', name: 'CCB Approval Workspace' },
    { url: `${BASE_URL}/version-history`, file: '05-version-history.png', name: 'Version History Lineage' },
    { url: `${BASE_URL}/status-accounting`, file: '06-status-accounting.png', name: 'Status Accounting Report' },
    { url: `${BASE_URL}/audits`, file: '07-fca-checklist.png', name: 'FCA/PCA Audit Checklists' },
    { url: `${BASE_URL}/baselines`, file: '08-pca-baseline-comparison.png', name: 'Baseline Comparison' },
    { url: `${BASE_URL}/history-log`, file: '09-change-history.png', name: 'Append-Only Change History' },
    { url: `${BASE_URL}/users`, file: '10-role-permissions.png', name: 'Users & RBAC' },
    { url: `${BASE_URL}/scm-center`, file: '14-github-issue-templates.png', name: 'SCM Centre & Matrix' },
    { url: `${BASE_URL}/approvals`, file: '19-live-demo-flow.png', name: 'Live Demo Flow' },
    { url: `${BASE_URL}/status-accounting`, file: '20-audit-report.png', name: 'Final Status Report' },
  ];

  for (const s of screens) {
    console.log(`Capturing ${s.file} (${s.name})...`);
    await page.goto(s.url, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(EVIDENCE_DIR, s.file) });
  }

  await browser.close();
  console.log('✅ All evidence screenshots captured successfully in docs/evidence/!');
}

main().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
