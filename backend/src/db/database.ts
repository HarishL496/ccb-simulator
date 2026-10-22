import Database from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const DB_PATH = process.env.DB_PATH || './ccb.db';
const dbPath = path.resolve(process.cwd(), DB_PATH);

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDb(): void {
  const database = getDb();

  database.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','developer','ccb_member','chairperson','viewer')),
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Configuration Items table
    CREATE TABLE IF NOT EXISTS configuration_items (
      id TEXT PRIMARY KEY,
      ci_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN (
        'requirements_document','design_document','source_code',
        'database_schema','test_cases','user_manual',
        'project_report','version_history','other'
      )),
      description TEXT,
      owner_id TEXT NOT NULL REFERENCES users(id),
      current_version TEXT NOT NULL DEFAULT 'v1.0',
      lifecycle_status TEXT NOT NULL DEFAULT 'Pending' CHECK(lifecycle_status IN ('Pending','In Progress','Complete','Deprecated')),
      approval_status TEXT NOT NULL DEFAULT 'Not Approved' CHECK(approval_status IN ('Approved','Not Approved','Under Review')),
      baseline_ref TEXT,
      is_seed_data INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- CI Version History table
    CREATE TABLE IF NOT EXISTS ci_version_history (
      id TEXT PRIMARY KEY,
      ci_id TEXT NOT NULL REFERENCES configuration_items(id) ON DELETE CASCADE,
      version TEXT NOT NULL,
      changed_by TEXT NOT NULL REFERENCES users(id),
      cr_id TEXT,
      change_summary TEXT NOT NULL,
      lifecycle_status TEXT NOT NULL,
      approval_status TEXT NOT NULL,
      snapshot_data TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Change Requests table
    CREATE TABLE IF NOT EXISTS change_requests (
      id TEXT PRIMARY KEY,
      cr_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      ci_id TEXT NOT NULL REFERENCES configuration_items(id),
      description TEXT NOT NULL,
      reason TEXT NOT NULL,
      classification TEXT NOT NULL CHECK(classification IN ('Minor','Major','Emergency')),
      priority TEXT NOT NULL CHECK(priority IN ('Low','Medium','High','Critical')),
      impact_analysis TEXT,
      requester_id TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Under Review','Approved','Rejected','Deferred')),
      review_notes TEXT,
      final_decision_reason TEXT,
      decided_at TEXT,
      decided_by TEXT REFERENCES users(id),
      version_before TEXT,
      version_after TEXT,
      overdue_notified INTEGER NOT NULL DEFAULT 0,
      is_seed_data INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- CCB Approval Steps table (tracks each individual approval action)
    CREATE TABLE IF NOT EXISTS approval_steps (
      id TEXT PRIMARY KEY,
      cr_id TEXT NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
      approver_id TEXT NOT NULL REFERENCES users(id),
      step_type TEXT NOT NULL CHECK(step_type IN ('technical_review','quality_review','chair_decision','single_approval','emergency_decision')),
      decision TEXT NOT NULL CHECK(decision IN ('Approved','Rejected','Deferred','Pending')),
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Baselines table
    CREATE TABLE IF NOT EXISTS baselines (
      id TEXT PRIMARY KEY,
      baseline_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_by TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active','Superseded','Archived')),
      is_seed_data INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Baseline CI Items (snapshot of CI versions at baseline time)
    CREATE TABLE IF NOT EXISTS baseline_items (
      id TEXT PRIMARY KEY,
      baseline_id TEXT NOT NULL REFERENCES baselines(id) ON DELETE CASCADE,
      ci_id TEXT NOT NULL REFERENCES configuration_items(id),
      version_at_baseline TEXT NOT NULL,
      approval_status_at_baseline TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Audit Checklists (FCA/PCA)
    CREATE TABLE IF NOT EXISTS audit_checklists (
      id TEXT PRIMARY KEY,
      audit_type TEXT NOT NULL CHECK(audit_type IN ('FCA','PCA')),
      title TEXT NOT NULL,
      description TEXT,
      created_by TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'In Progress' CHECK(status IN ('In Progress','Completed','Archived')),
      overall_result TEXT CHECK(overall_result IN ('PASS','FAIL','NEEDS REVIEW')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    );

    -- Audit Checklist Items
    CREATE TABLE IF NOT EXISTS audit_checklist_items (
      id TEXT PRIMARY KEY,
      checklist_id TEXT NOT NULL REFERENCES audit_checklists(id) ON DELETE CASCADE,
      item_number INTEGER NOT NULL,
      category TEXT NOT NULL,
      check_description TEXT NOT NULL,
      result TEXT NOT NULL DEFAULT 'Pending' CHECK(result IN ('Yes','No','In Progress','Pending')),
      remarks TEXT,
      is_automated INTEGER NOT NULL DEFAULT 0,
      auditor_id TEXT REFERENCES users(id),
      checked_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Event / Change History (append-only log)
    CREATE TABLE IF NOT EXISTS event_history (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      actor_id TEXT REFERENCES users(id),
      actor_name TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      target_type TEXT CHECK(target_type IN ('CI','CR','Baseline','User','Audit','System')),
      target_id TEXT,
      target_name TEXT,
      action TEXT NOT NULL,
      reason TEXT,
      before_value TEXT,
      after_value TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('cr_approved','cr_rejected','cr_deferred','overdue_alert','version_updated','system')),
      related_cr_id TEXT REFERENCES change_requests(id),
      related_ci_id TEXT REFERENCES configuration_items(id),
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Report Generation Log
    CREATE TABLE IF NOT EXISTS report_log (
      id TEXT PRIMARY KEY,
      report_type TEXT NOT NULL,
      generated_by TEXT NOT NULL REFERENCES users(id),
      parameters TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_ci_status ON configuration_items(lifecycle_status, approval_status);
    CREATE INDEX IF NOT EXISTS idx_cr_status ON change_requests(status, classification);
    CREATE INDEX IF NOT EXISTS idx_cr_requester ON change_requests(requester_id);
    CREATE INDEX IF NOT EXISTS idx_cr_ci ON change_requests(ci_id);
    CREATE INDEX IF NOT EXISTS idx_event_actor ON event_history(actor_id);
    CREATE INDEX IF NOT EXISTS idx_event_target ON event_history(target_id);
    CREATE INDEX IF NOT EXISTS idx_event_type ON event_history(event_type);
    CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_version_ci ON ci_version_history(ci_id);
    CREATE INDEX IF NOT EXISTS idx_baseline_items ON baseline_items(baseline_id);
  `);

  console.log('✅ Database initialized successfully');
}

export default getDb;
