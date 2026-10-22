import request from 'supertest';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import app from '../src/index';
import { getDb, initDb } from '../src/db/database';

let adminToken: string;
let devToken: string;
let chairToken: string;
let ccbToken: string;

let devId: string;
let chairId: string;
let ccbId: string;
let ciId: string;
let ciInternalId: string;

beforeAll(async () => {
  initDb();
  const db = getDb();

  // Seed test users
  const adminId = uuidv4();
  devId = uuidv4();
  chairId = uuidv4();
  ccbId = uuidv4();
  const viewerId = uuidv4();

  const insertUser = db.prepare('INSERT INTO users (id, username, email, password_hash, full_name, role) VALUES (?,?,?,?,?,?)');
  insertUser.run(adminId, 'admin', 'admin@test.com', await bcrypt.hash('Admin@123', 10), 'Admin User', 'admin');
  insertUser.run(devId, 'developer', 'dev@test.com', await bcrypt.hash('Dev@123', 10), 'Dev User', 'developer');
  insertUser.run(chairId, 'chairperson', 'chair@test.com', await bcrypt.hash('Chair@123', 10), 'Chair User', 'chairperson');
  insertUser.run(ccbId, 'ccb_member', 'ccb@test.com', await bcrypt.hash('CCB@123', 10), 'CCB Member', 'ccb_member');
  insertUser.run(viewerId, 'viewer', 'viewer@test.com', await bcrypt.hash('View@123', 10), 'Viewer User', 'viewer');

  // Seed a test CI
  ciInternalId = uuidv4();
  ciId = 'CI-T01';
  db.prepare(`INSERT INTO configuration_items (id, ci_id, name, type, owner_id, current_version, lifecycle_status, approval_status)
    VALUES (?, ?, 'Test CI', 'source_code', ?, 'v1.0', 'In Progress', 'Not Approved')`).run(ciInternalId, ciId, devId);
  db.prepare(`INSERT INTO ci_version_history (id, ci_id, version, changed_by, change_summary, lifecycle_status, approval_status)
    VALUES (?, ?, 'v1.0', ?, 'Initial', 'In Progress', 'Not Approved')`).run(uuidv4(), ciInternalId, devId);

  // Get tokens
  const adminLogin = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'Admin@123' });
  adminToken = adminLogin.body.data.token;

  const devLogin = await request(app).post('/api/auth/login').send({ username: 'developer', password: 'Dev@123' });
  devToken = devLogin.body.data.token;

  const chairLogin = await request(app).post('/api/auth/login').send({ username: 'chairperson', password: 'Chair@123' });
  chairToken = chairLogin.body.data.token;

  const ccbLogin = await request(app).post('/api/auth/login').send({ username: 'ccb_member', password: 'CCB@123' });
  ccbToken = ccbLogin.body.data.token;
});

// ── AUTH TESTS ────────────────────────────────────────────────────────────────
describe('Authentication', () => {
  test('POST /api/auth/login — valid credentials return token', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'developer', password: 'Dev@123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('developer');
  });

  test('POST /api/auth/login — wrong password returns 401', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'developer', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me — returns current user', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${devToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe('developer');
  });

  test('GET /api/auth/me — no token returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

// ── CI REGISTRY TESTS ─────────────────────────────────────────────────────────
describe('CI Registry', () => {
  test('GET /api/ci — returns list', async () => {
    const res = await request(app).get('/api/ci').set('Authorization', `Bearer ${devToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toBeInstanceOf(Array);
  });

  test('POST /api/ci — creates CI with unique ID', async () => {
    const res = await request(app).post('/api/ci').set('Authorization', `Bearer ${devToken}`).send({
      ci_id: 'CI-T99', name: 'New Test CI', type: 'source_code', owner_id: devId,
    });
    expect(res.status).toBe(201);
    expect(res.body.data.ci_id).toBe('CI-T99');
    expect(res.body.data.current_version).toBe('v1.0');
  });

  test('POST /api/ci — duplicate ID returns 409', async () => {
    const res = await request(app).post('/api/ci').set('Authorization', `Bearer ${devToken}`).send({
      ci_id: 'CI-T99', name: 'Duplicate', type: 'source_code', owner_id: devId,
    });
    expect(res.status).toBe(409);
  });

  test('POST /api/ci — viewer cannot create CI', async () => {
    const viewerLogin = await request(app).post('/api/auth/login').send({ username: 'viewer', password: 'View@123' });
    const vt = viewerLogin.body.data.token;
    const res = await request(app).post('/api/ci').set('Authorization', `Bearer ${vt}`).send({
      ci_id: 'CI-T98', name: 'Viewer CI', type: 'source_code', owner_id: devId,
    });
    expect(res.status).toBe(403);
  });
});

// ── CHANGE REQUEST TESTS ──────────────────────────────────────────────────────
describe('Change Requests', () => {
  let crId: string;
  let crInternalId: string;

  test('POST /api/cr — creates Minor CR', async () => {
    const res = await request(app).post('/api/cr').set('Authorization', `Bearer ${devToken}`).send({
      title: 'Test Minor Change', ci_id: ciInternalId, description: 'A test change request description',
      reason: 'Testing purposes', classification: 'Minor', priority: 'Low',
      impact_analysis: 'Minimal impact',
    });
    expect(res.status).toBe(201);
    crId = res.body.data.cr_id;
    crInternalId = res.body.data.id;
    expect(res.body.data.status).toBe('Pending');
  });

  // ── APPROVAL TESTS ────────────────────────────────────────────────────────
  describe('Approval — Self-approval prevention', () => {
    test('Developer cannot approve own CR', async () => {
      const res = await request(app)
        .post(`/api/approvals/${crInternalId}/decide`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({ decision: 'Approved', reason: 'Self approval attempt for testing', step_type: 'single_approval' });
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/cannot approve.*own/i);
    });
  });

  describe('Approval — Minor CR approval', () => {
    test('Chairperson approves Minor CR → CI version increments', async () => {
      const ciRes = await request(app).get(`/api/ci/${ciInternalId}`).set('Authorization', `Bearer ${chairToken}`);
      const vBefore = ciRes.body.data.current_version;

      const res = await request(app)
        .post(`/api/approvals/${crInternalId}/decide`)
        .set('Authorization', `Bearer ${chairToken}`)
        .send({ decision: 'Approved', reason: 'Change is valid and well-tested. Approving.', step_type: 'single_approval' });
      expect(res.status).toBe(200);
      expect(res.body.data.decision).toBe('Approved');
      expect(res.body.data.version_before).toBe(vBefore);
      expect(res.body.data.version_after).toBe('v1.1');
    });

    test('Approved CR does not increment again (idempotency)', async () => {
      const res = await request(app)
        .post(`/api/approvals/${crInternalId}/decide`)
        .set('Authorization', `Bearer ${ccbToken}`)
        .send({ decision: 'Approved', reason: 'Duplicate approval attempt', step_type: 'single_approval' });
      expect(res.status).toBe(400); // CR already Approved
    });
  });

  describe('Approval — Rejection without version increment', () => {
    let rejCrId: string;
    test('Create another CR to reject', async () => {
      const res = await request(app).post('/api/cr').set('Authorization', `Bearer ${devToken}`).send({
        title: 'CR to Reject', ci_id: ciInternalId, description: 'This will be rejected',
        reason: 'Testing rejection flow', classification: 'Minor', priority: 'Low',
      });
      expect(res.status).toBe(201);
      rejCrId = res.body.data.id;
    });

    test('Reject CR → CI version stays at v1.1', async () => {
      const res = await request(app)
        .post(`/api/approvals/${rejCrId}/decide`)
        .set('Authorization', `Bearer ${chairToken}`)
        .send({ decision: 'Rejected', reason: 'Change not justified at this time. Rejecting.', step_type: 'single_approval' });
      expect(res.status).toBe(200);
      expect(res.body.data.decision).toBe('Rejected');

      const ciCheck = await request(app).get(`/api/ci/${ciInternalId}`).set('Authorization', `Bearer ${chairToken}`);
      expect(ciCheck.body.data.current_version).toBe('v1.1'); // Unchanged
    });
  });

  describe('Approval — Major CR 3-step process', () => {
    let majorCrId: string;
    let majorCiId: string;

    test('Setup: create a fresh CI for Major CR test', async () => {
      const res = await request(app).post('/api/ci').set('Authorization', `Bearer ${devToken}`).send({
        ci_id: 'CI-T97', name: 'Major Test CI', type: 'database_schema', owner_id: devId,
      });
      majorCiId = res.body.data.id;
      expect(res.status).toBe(201);
    });

    test('Create Major CR', async () => {
      const res = await request(app).post('/api/cr').set('Authorization', `Bearer ${devToken}`).send({
        title: 'Major Schema Refactor', ci_id: majorCiId,
        description: 'Full refactor of database schema for better normalization',
        reason: 'Performance and maintainability', classification: 'Major', priority: 'High',
      });
      expect(res.status).toBe(201);
      majorCrId = res.body.data.id;
    });

    test('Step 1 — Technical review (not final yet)', async () => {
      const res = await request(app)
        .post(`/api/approvals/${majorCrId}/decide`)
        .set('Authorization', `Bearer ${ccbToken}`)
        .send({ decision: 'Approved', reason: 'Technical analysis complete. Schema changes are sound.', step_type: 'technical_review' });
      expect(res.status).toBe(200);
      expect(res.body.data).not.toHaveProperty('version_after'); // Not final
    });

    test('Step 2 — Quality review (not final yet)', async () => {
      const res = await request(app)
        .post(`/api/approvals/${majorCrId}/decide`)
        .set('Authorization', `Bearer ${chairToken}`) // chair acts as quality here
        .send({ decision: 'Approved', reason: 'Quality checks passed. No regression risks.', step_type: 'quality_review' });
      expect(res.status).toBe(200);
    });

    test('Step 3 — Chair decision → final approval, version = v2.0', async () => {
      // Need a different CCB user for chair step
      const res = await request(app)
        .post(`/api/approvals/${majorCrId}/decide`)
        .set('Authorization', `Bearer ${chairToken}`)
        .send({ decision: 'Approved', reason: 'All reviews complete. Chairperson approves this Major change.', step_type: 'chair_decision' });
      expect(res.status).toBe(200);
      expect(res.body.data.decision).toBe('Approved');
      expect(res.body.data.version_after).toBe('v2.0');
    });
  });
});

// ── VERSION HELPER TESTS ──────────────────────────────────────────────────────
describe('Version computation', () => {
  const { computeNextVersion } = require('../src/utils/helpers');

  test('Minor: v1.0 → v1.1', () => expect(computeNextVersion('v1.0', 'Minor')).toBe('v1.1'));
  test('Minor: v1.9 → v1.10', () => expect(computeNextVersion('v1.9', 'Minor')).toBe('v1.10'));
  test('Major: v1.0 → v2.0', () => expect(computeNextVersion('v1.0', 'Major')).toBe('v2.0'));
  test('Major: v2.5 → v3.0', () => expect(computeNextVersion('v2.5', 'Major')).toBe('v3.0'));
  test('Emergency: v1.0 → v1.1 (treated as Minor)', () => expect(computeNextVersion('v1.0', 'Emergency')).toBe('v1.1'));
});

// ── ROLE ENFORCEMENT TESTS ────────────────────────────────────────────────────
describe('Role enforcement', () => {
  test('Viewer cannot create CR', async () => {
    const viewerLogin = await request(app).post('/api/auth/login').send({ username: 'viewer', password: 'View@123' });
    const vt = viewerLogin.body.data.token;
    const res = await request(app).post('/api/cr').set('Authorization', `Bearer ${vt}`).send({
      title: 'Viewer CR', ci_id: ciInternalId, description: 'x', reason: 'x', classification: 'Minor', priority: 'Low',
    });
    expect(res.status).toBe(403);
  });

  test('Developer cannot access approval queue', async () => {
    const res = await request(app).get('/api/approvals/queue').set('Authorization', `Bearer ${devToken}`);
    expect(res.status).toBe(403);
  });

  test('CCB member can access approval queue', async () => {
    const res = await request(app).get('/api/approvals/queue').set('Authorization', `Bearer ${ccbToken}`);
    expect(res.status).toBe(200);
  });
});

// ── NOTIFICATIONS TESTS ───────────────────────────────────────────────────────
describe('Notifications', () => {
  test('GET /api/notifications — returns user notifications', async () => {
    const res = await request(app).get('/api/notifications').set('Authorization', `Bearer ${devToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('notifications');
    expect(res.body.data).toHaveProperty('unread_count');
  });
});

// ── STATUS ACCOUNTING TESTS ───────────────────────────────────────────────────
describe('Status Accounting', () => {
  test('GET /api/status — returns CI and CR summaries', async () => {
    const res = await request(app).get('/api/status').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('ci_totals');
    expect(res.body.data).toHaveProperty('cr_totals');
    expect(res.body.data.ci_totals).toHaveProperty('total');
  });

  afterAll(() => {
    try { getDb().close(); } catch {}
  });
});
