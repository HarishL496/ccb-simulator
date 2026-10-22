import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { authenticate } from '../middleware/auth';
import { logEvent } from '../utils/helpers';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/status — full status accounting report
router.get('/', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const { category, date_from, date_to } = req.query;

  // CI summary by category and lifecycle + approval status
  const ciSummary = db.prepare(`
    SELECT type,
      COUNT(*) as total,
      SUM(CASE WHEN approval_status = 'Approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN lifecycle_status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN lifecycle_status = 'Pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN lifecycle_status = 'Complete' THEN 1 ELSE 0 END) as complete,
      SUM(CASE WHEN approval_status = 'Not Approved' THEN 1 ELSE 0 END) as not_approved,
      SUM(CASE WHEN approval_status = 'Under Review' THEN 1 ELSE 0 END) as under_review
    FROM configuration_items
    ${category ? "WHERE type = ?" : ""}
    GROUP BY type ORDER BY type
  `).all(...(category ? [category] : []));

  const ciTotals = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN approval_status = 'Approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN lifecycle_status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN lifecycle_status = 'Pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN lifecycle_status = 'Complete' THEN 1 ELSE 0 END) as complete,
      SUM(CASE WHEN approval_status = 'Not Approved' THEN 1 ELSE 0 END) as not_approved,
      SUM(CASE WHEN approval_status = 'Under Review' THEN 1 ELSE 0 END) as under_review
    FROM configuration_items
  `).get();

  // CR summary by status and classification
  let crSql = `SELECT status, classification, COUNT(*) as count FROM change_requests WHERE 1=1`;
  const crParams: unknown[] = [];
  if (date_from) { crSql += ' AND created_at >= ?'; crParams.push(date_from); }
  if (date_to) { crSql += ' AND created_at <= ?'; crParams.push(date_to + 'T23:59:59'); }
  crSql += ' GROUP BY status, classification ORDER BY status, classification';
  const crSummary = db.prepare(crSql).all(...crParams);

  const crTotals = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'Under Review' THEN 1 ELSE 0 END) as under_review,
      SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN status = 'Deferred' THEN 1 ELSE 0 END) as deferred
    FROM change_requests
  `).get();

  const baseline = db.prepare("SELECT COUNT(*) as count FROM baselines WHERE status = 'Active'").get() as { count: number };

  // Log report generation
  const reportId = uuidv4();
  db.prepare(`INSERT INTO report_log (id, report_type, generated_by, parameters) VALUES (?, 'STATUS_ACCOUNTING', ?, ?)`)
    .run(reportId, req.user!.userId, JSON.stringify({ category, date_from, date_to }));

  logEvent({
    event_type: 'REPORT_GENERATED', actor_id: req.user!.userId, actor_name: req.user!.username,
    actor_role: req.user!.role, target_type: 'System', action: 'Status Accounting report generated',
    metadata: { report_type: 'STATUS_ACCOUNTING', filters: { category, date_from, date_to } },
  });

  res.json({
    success: true,
    data: {
      generated_at: new Date().toISOString(),
      generated_by: req.user!.username,
      ci_summary: ciSummary,
      ci_totals: ciTotals,
      cr_summary: crSummary,
      cr_totals: crTotals,
      active_baselines: baseline.count,
    },
  });
});

export default router;
