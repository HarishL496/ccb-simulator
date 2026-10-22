import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { authenticate } from '../middleware/auth';
import { isOverdue } from '../utils/helpers';
import { ChangeRequest } from '../models/types';

const router = Router();

// GET /api/dashboard — aggregated dashboard data
router.get('/', authenticate, (req: Request, res: Response) => {
  const db = getDb();

  const ciStats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN approval_status = 'Approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN approval_status = 'Not Approved' AND lifecycle_status != 'Complete' THEN 1 ELSE 0 END) as not_approved,
      SUM(CASE WHEN lifecycle_status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN lifecycle_status = 'Pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN lifecycle_status = 'Complete' AND approval_status = 'Approved' THEN 1 ELSE 0 END) as baselined
    FROM configuration_items
  `).get();

  const crStats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'Under Review' THEN 1 ELSE 0 END) as under_review,
      SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN status = 'Deferred' THEN 1 ELSE 0 END) as deferred
    FROM change_requests
  `).get();

  // Overdue CRs
  const openCRs = db.prepare(`
    SELECT * FROM change_requests WHERE status IN ('Pending','Under Review')
  `).all() as ChangeRequest[];
  const overdueCRs = openCRs.filter(cr => isOverdue(cr.created_at, cr.classification));

  // Recent activity (last 10)
  const recentActivity = db.prepare(`
    SELECT eh.*, u.full_name as actor_display_name
    FROM event_history eh
    LEFT JOIN users u ON eh.actor_id = u.id
    ORDER BY eh.created_at DESC LIMIT 10
  `).all();

  // Recent approvals
  const recentApprovals = db.prepare(`
    SELECT cr.cr_id, cr.title, cr.status, cr.classification, cr.decided_at, cr.version_before, cr.version_after,
      ci.name as ci_name, u.full_name as decided_by_name
    FROM change_requests cr
    LEFT JOIN configuration_items ci ON cr.ci_id = ci.id
    LEFT JOIN users u ON cr.decided_by = u.id
    WHERE cr.status IN ('Approved','Rejected','Deferred')
    ORDER BY cr.decided_at DESC LIMIT 5
  `).all();

  // Current baselines
  const baselines = db.prepare(`
    SELECT b.baseline_id, b.name, b.status, b.created_at, u.full_name as created_by_name,
      COUNT(bi.id) as item_count
    FROM baselines b
    LEFT JOIN users u ON b.created_by = u.id
    LEFT JOIN baseline_items bi ON b.id = bi.baseline_id
    WHERE b.status = 'Active'
    GROUP BY b.id ORDER BY b.created_at DESC LIMIT 3
  `).all();

  const unreadNotifications = (db.prepare(
    'SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0'
  ).get(req.user!.userId) as { c: number }).c;

  res.json({
    success: true,
    data: {
      ci_stats: ciStats,
      cr_stats: crStats,
      overdue_count: overdueCRs.length,
      overdue_crs: overdueCRs.slice(0, 5),
      recent_activity: recentActivity,
      recent_approvals: recentApprovals,
      active_baselines: baselines,
      unread_notifications: unreadNotifications,
      generated_at: new Date().toISOString(),
    },
  });
});

export default router;
