import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/notifications — current user's notifications
router.get('/', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const { unread_only } = req.query;

  let sql = 'SELECT * FROM notifications WHERE user_id = ?';
  const params: unknown[] = [req.user!.userId];
  if (unread_only === 'true') { sql += ' AND is_read = 0'; }
  sql += ' ORDER BY created_at DESC LIMIT 100';

  const notifications = db.prepare(sql).all(...params);
  const unreadCount = (db.prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user!.userId) as { c: number }).c;

  res.json({ success: true, data: { notifications, unread_count: unreadCount } });
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user!.userId);
  if (result.changes === 0) { res.status(404).json({ success: false, error: 'Notification not found' }); return; }
  res.json({ success: true, message: 'Marked as read' });
});

// PATCH /api/notifications/read-all
router.patch('/read-all/mark', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user!.userId);
  res.json({ success: true, message: 'All notifications marked as read' });
});

export default router;
