import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { getDb, initDb } from './database';

const SALT_ROUNDS = 12;

// Team member names - configurable
const TEAM = {
  A: 'Harish L',
  B: 'Member B',
  C: 'Member C',
};

export async function seed() {
  initDb();
  const db = getDb();

  const existing = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (existing.count > 0) {
    console.log('⚠️  Database already seeded. Run reset first if you want to re-seed.');
    return;
  }

  console.log('🌱 Seeding database...');

  // ── 1. USERS ────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@123', SALT_ROUNDS);
  const devAHash = await bcrypt.hash('DevA@123', SALT_ROUNDS);
  const devBHash = await bcrypt.hash('DevB@123', SALT_ROUNDS);
  const devCHash = await bcrypt.hash('DevC@123', SALT_ROUNDS);
  const chairHash = await bcrypt.hash('Chair@123', SALT_ROUNDS);
  const ccb1Hash = await bcrypt.hash('CCB1@123', SALT_ROUNDS);
  const ccb2Hash = await bcrypt.hash('CCB2@123', SALT_ROUNDS);
  const viewerHash = await bcrypt.hash('Viewer@123', SALT_ROUNDS);

  const adminId = uuidv4();
  const devAId = uuidv4();
  const devBId = uuidv4();
  const devCId = uuidv4();
  const chairId = uuidv4();
  const ccb1Id = uuidv4();
  const ccb2Id = uuidv4();
  const viewerId = uuidv4();

  const insertUser = db.prepare(`
    INSERT INTO users (id, username, email, password_hash, full_name, role)
    VALUES (@id, @username, @email, @password_hash, @full_name, @role)
  `);

  const seedUsers = db.transaction(() => {
    insertUser.run({ id: adminId, username: 'admin', email: 'admin@ccb.local', password_hash: adminHash, full_name: 'System Admin', role: 'admin' });
    insertUser.run({ id: devAId, username: 'member_a', email: 'member.a@ccb.local', password_hash: devAHash, full_name: TEAM.A, role: 'developer' });
    insertUser.run({ id: devBId, username: 'member_b', email: 'member.b@ccb.local', password_hash: devBHash, full_name: TEAM.B, role: 'developer' });
    insertUser.run({ id: devCId, username: 'member_c', email: 'member.c@ccb.local', password_hash: devCHash, full_name: TEAM.C, role: 'developer' });
    insertUser.run({ id: chairId, username: 'chairperson', email: 'chair@ccb.local', password_hash: chairHash, full_name: 'CCB Chairperson', role: 'chairperson' });
    insertUser.run({ id: ccb1Id, username: 'ccb_tech', email: 'ccb.tech@ccb.local', password_hash: ccb1Hash, full_name: 'CCB Technical Reviewer', role: 'ccb_member' });
    insertUser.run({ id: ccb2Id, username: 'ccb_quality', email: 'ccb.quality@ccb.local', password_hash: ccb2Hash, full_name: 'CCB Quality Reviewer', role: 'ccb_member' });
    insertUser.run({ id: viewerId, username: 'viewer', email: 'viewer@ccb.local', password_hash: viewerHash, full_name: 'Read Only Viewer', role: 'viewer' });
  });
  seedUsers();
  console.log('  ✅ Users seeded (8 users)');

  // ── 2. CONFIGURATION ITEMS (Review 2 exact match) ───────────────────────────
  const insertCI = db.prepare(`
    INSERT INTO configuration_items
      (id, ci_id, name, type, description, owner_id, current_version,
       lifecycle_status, approval_status, baseline_ref, is_seed_data)
    VALUES
      (@id, @ci_id, @name, @type, @description, @owner_id, @current_version,
       @lifecycle_status, @approval_status, @baseline_ref, 1)
  `);

  const insertCIVersion = db.prepare(`
    INSERT INTO ci_version_history
      (id, ci_id, version, changed_by, change_summary, lifecycle_status, approval_status, snapshot_data)
    VALUES
      (@id, @ci_id, @version, @changed_by, @change_summary, @lifecycle_status, @approval_status, @snapshot_data)
  `);

  const ciDefs = [
    { ci_id: 'CI-001', name: 'Requirements Document',              type: 'requirements_document', owner: devAId, ls: 'Complete',     as: 'Approved'     },
    { ci_id: 'CI-002', name: 'Design (ER Diagram / UI Wireframes)', type: 'design_document',       owner: devAId, ls: 'Complete',     as: 'Approved'     },
    { ci_id: 'CI-003', name: 'Source Code — CI Registry Module',    type: 'source_code',           owner: devAId, ls: 'In Progress',  as: 'Not Approved' },
    { ci_id: 'CI-004', name: 'Source Code — Change Request Module', type: 'source_code',           owner: devBId, ls: 'In Progress',  as: 'Not Approved' },
    { ci_id: 'CI-005', name: 'Source Code — CCB Approval Module',   type: 'source_code',           owner: devBId, ls: 'In Progress',  as: 'Not Approved' },
    { ci_id: 'CI-006', name: 'Database (CI / CR Schema)',           type: 'database_schema',       owner: devCId, ls: 'Complete',     as: 'Approved'     },
    { ci_id: 'CI-007', name: 'Test Cases',                          type: 'test_cases',            owner: devCId, ls: 'In Progress',  as: 'Not Approved' },
    { ci_id: 'CI-008', name: 'User Manual',                         type: 'user_manual',           owner: devAId, ls: 'Pending',      as: 'Not Approved' },
    { ci_id: 'CI-009', name: 'Project Report',                      type: 'project_report',        owner: devBId, ls: 'Complete',     as: 'Approved'     },
    { ci_id: 'CI-010', name: 'Version History Log',                 type: 'version_history',       owner: devCId, ls: 'Complete',     as: 'Approved'     },
  ];

  const ciIds: Record<string, string> = {};

  const seedCIs = db.transaction(() => {
    for (const ci of ciDefs) {
      const ciInternalId = uuidv4();
      ciIds[ci.ci_id] = ciInternalId;
      insertCI.run({
        id: ciInternalId, ci_id: ci.ci_id, name: ci.name, type: ci.type,
        description: `[DEMO DATA] ${ci.name} — initial version for CCB Simulator project`,
        owner_id: ci.owner, current_version: 'v1.0',
        lifecycle_status: ci.ls, approval_status: ci.as, baseline_ref: null,
      });
      insertCIVersion.run({
        id: uuidv4(), ci_id: ciInternalId, version: 'v1.0', changed_by: ci.owner,
        change_summary: 'Initial version created (seed data)',
        lifecycle_status: ci.ls, approval_status: ci.as,
        snapshot_data: JSON.stringify({ ci_id: ci.ci_id, name: ci.name, version: 'v1.0' }),
      });
    }
  });
  seedCIs();
  console.log('  ✅ Configuration Items seeded (10 CIs — matches Review 2)');

  // ── 3. BASELINE ─────────────────────────────────────────────────────────────
  const baselineId = uuidv4();
  const insertBaseline = db.prepare(`
    INSERT INTO baselines (id, baseline_id, name, description, created_by, status, is_seed_data)
    VALUES (@id, @baseline_id, @name, @description, @created_by, 'Active', 1)
  `);
  const insertBaselineItem = db.prepare(`
    INSERT INTO baseline_items (id, baseline_id, ci_id, version_at_baseline, approval_status_at_baseline)
    VALUES (@id, @baseline_id, @ci_id, @version, @approval_status)
  `);

  const seedBaseline = db.transaction(() => {
    insertBaseline.run({
      id: baselineId, baseline_id: 'BL-001',
      name: 'Review 2 Baseline',
      description: '[DEMO DATA] Baseline captured at end of Review 2 — 5 approved CIs at v1.0',
      created_by: adminId,
    });
    const approvedCIs = ciDefs.filter(c => c.as === 'Approved');
    for (const ci of approvedCIs) {
      insertBaselineItem.run({
        id: uuidv4(), baseline_id: baselineId,
        ci_id: ciIds[ci.ci_id], version: 'v1.0', approval_status: ci.as,
      });
    }
  });
  seedBaseline();
  console.log('  ✅ Baseline seeded (BL-001 — Review 2 Baseline, 5 approved CIs)');

  // ── 4. SAMPLE CHANGE REQUESTS ───────────────────────────────────────────────
  const cr1Id = uuidv4();
  const cr2Id = uuidv4();

  const insertCR = db.prepare(`
    INSERT INTO change_requests
      (id, cr_id, title, ci_id, description, reason, classification, priority,
       impact_analysis, requester_id, status, review_notes, final_decision_reason,
       decided_at, decided_by, version_before, is_seed_data)
    VALUES
      (@id, @cr_id, @title, @ci_id, @description, @reason, @classification, @priority,
       @impact_analysis, @requester_id, @status, @review_notes, @final_decision_reason,
       @decided_at, @decided_by, @version_before, 1)
  `);

  const seedCRs = db.transaction(() => {
    insertCR.run({
      id: cr1Id, cr_id: 'CR-001',
      title: 'Add pagination to CI Registry table',
      ci_id: ciIds['CI-003'],
      description: 'The CI Registry table currently loads all records at once. Adding server-side pagination will improve performance and UX.',
      reason: 'Performance improvement and better user experience for large CI datasets.',
      classification: 'Minor', priority: 'Medium',
      impact_analysis: 'Low risk. Only affects frontend display logic. No database schema changes required.',
      requester_id: devAId, status: 'Pending',
      review_notes: null, final_decision_reason: null,
      decided_at: null, decided_by: null, version_before: 'v1.0',
    });
    insertCR.run({
      id: cr2Id, cr_id: 'CR-002',
      title: 'Refactor database schema for approval steps',
      ci_id: ciIds['CI-006'],
      description: 'The approval_steps table needs a step_order column and updated foreign key constraints to properly enforce the 3-member CCB process for Major changes.',
      reason: 'Correctness of Major CR approval policy enforcement requires ordered steps.',
      classification: 'Major', priority: 'High',
      impact_analysis: 'Medium risk. Requires schema migration and updates to approval routes. Existing pending approvals may need reprocessing.',
      requester_id: devCId, status: 'Under Review',
      review_notes: 'Technical review noted the migration must be backward-compatible.',
      final_decision_reason: null, decided_at: null, decided_by: null, version_before: 'v1.0',
    });
  });
  seedCRs();
  console.log('  ✅ Sample Change Requests seeded (CR-001 Pending, CR-002 Under Review)');

  // ── 5. EVENT HISTORY ────────────────────────────────────────────────────────
  const insertEvent = db.prepare(`
    INSERT INTO event_history
      (id, event_type, actor_id, actor_name, actor_role, target_type, target_id, target_name, action, reason, before_value, after_value, metadata)
    VALUES
      (@id, @event_type, @actor_id, @actor_name, @actor_role, @target_type, @target_id, @target_name, @action, @reason, @before_value, @after_value, @metadata)
  `);

  const seedEvents = db.transaction(() => {
    insertEvent.run({
      id: uuidv4(), event_type: 'SYSTEM_INIT', actor_id: adminId, actor_name: 'System Admin',
      actor_role: 'admin', target_type: 'System', target_id: null, target_name: 'CCB Control Center',
      action: 'Database initialized and seeded with Review 2 demo data',
      reason: 'Initial system setup', before_value: null, after_value: null,
      metadata: JSON.stringify({ seed_version: '1.0', ci_count: 10, baseline_count: 1 }),
    });
    for (const ci of ciDefs) {
      insertEvent.run({
        id: uuidv4(), event_type: 'CI_CREATED', actor_id: adminId, actor_name: 'System Admin',
        actor_role: 'admin', target_type: 'CI', target_id: ciIds[ci.ci_id], target_name: ci.name,
        action: `Configuration Item registered at v1.0`,
        reason: 'Seed data — Review 2 baseline',
        before_value: null, after_value: JSON.stringify({ version: 'v1.0', lifecycle_status: ci.ls, approval_status: ci.as }),
        metadata: JSON.stringify({ is_seed: true }),
      });
    }
    insertEvent.run({
      id: uuidv4(), event_type: 'BASELINE_CREATED', actor_id: adminId, actor_name: 'System Admin',
      actor_role: 'admin', target_type: 'Baseline', target_id: baselineId, target_name: 'Review 2 Baseline',
      action: 'Baseline BL-001 created with 5 approved CIs',
      reason: 'Review 2 milestone baseline', before_value: null,
      after_value: JSON.stringify({ baseline_id: 'BL-001', ci_count: 5 }), metadata: null,
    });
    insertEvent.run({
      id: uuidv4(), event_type: 'CR_SUBMITTED', actor_id: devAId, actor_name: TEAM.A,
      actor_role: 'developer', target_type: 'CR', target_id: cr1Id, target_name: 'CR-001',
      action: 'Change Request submitted: Add pagination to CI Registry table',
      reason: 'Performance improvement', before_value: null,
      after_value: JSON.stringify({ status: 'Pending', classification: 'Minor' }), metadata: null,
    });
    insertEvent.run({
      id: uuidv4(), event_type: 'CR_SUBMITTED', actor_id: devCId, actor_name: TEAM.C,
      actor_role: 'developer', target_type: 'CR', target_id: cr2Id, target_name: 'CR-002',
      action: 'Change Request submitted: Refactor database schema for approval steps',
      reason: 'Policy correctness', before_value: null,
      after_value: JSON.stringify({ status: 'Pending', classification: 'Major' }), metadata: null,
    });
  });
  seedEvents();
  console.log('  ✅ Event history seeded');

  // ── 6. NOTIFICATIONS ────────────────────────────────────────────────────────
  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, related_cr_id)
    VALUES (@id, @user_id, @title, @message, @type, @related_cr_id)
  `);
  const seedNotifs = db.transaction(() => {
    insertNotif.run({
      id: uuidv4(), user_id: chairId,
      title: 'New Change Request Pending Review',
      message: 'CR-001 "Add pagination to CI Registry table" (Minor) has been submitted and is awaiting CCB review.',
      type: 'system', related_cr_id: cr1Id,
    });
    insertNotif.run({
      id: uuidv4(), user_id: ccb1Id,
      title: 'New Major CR Under Review',
      message: 'CR-002 "Refactor database schema for approval steps" (Major) requires your technical review.',
      type: 'system', related_cr_id: cr2Id,
    });
  });
  seedNotifs();
  console.log('  ✅ Notifications seeded');

  console.log('\n🎉 Seed complete! Initial status accounting:');
  console.log('   Total CIs: 10');
  console.log('   Approved:  5 (CI-001, CI-002, CI-006, CI-009, CI-010)');
  console.log('   In Progress: 4 (CI-003, CI-004, CI-005, CI-007)');
  console.log('   Pending: 1 (CI-008)');
  console.log('\n📋 Demo accounts:');
  console.log('   admin / Admin@123          (Admin)');
  console.log('   chairperson / Chair@123    (CCB Chairperson)');
  console.log('   ccb_tech / CCB1@123        (CCB Technical Reviewer)');
  console.log('   ccb_quality / CCB2@123     (CCB Quality Reviewer)');
  console.log('   member_a / DevA@123        (Developer — ' + TEAM.A + ')');
  console.log('   member_b / DevB@123        (Developer — ' + TEAM.B + ')');
  console.log('   member_c / DevC@123        (Developer — ' + TEAM.C + ')');
  console.log('   viewer / Viewer@123        (Viewer)');
}

seed().catch(console.error);
