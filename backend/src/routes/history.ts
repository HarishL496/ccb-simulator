import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/history — append-only event log
router.get('/', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const { event_type, actor_id, target_type, target_id, date_from, date_to, page = '1', limit = '50' } = req.query;

  let sql = `
    SELECT eh.*, u.full_name as actor_display_name
    FROM event_history eh
    LEFT JOIN users u ON eh.actor_id = u.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (event_type) { sql += ' AND eh.event_type = ?'; params.push(event_type); }
  if (actor_id) { sql += ' AND eh.actor_id = ?'; params.push(actor_id); }
  if (target_type) { sql += ' AND eh.target_type = ?'; params.push(target_type); }
  if (target_id) { sql += ' AND eh.target_id = ?'; params.push(target_id); }
  if (date_from) { sql += ' AND eh.created_at >= ?'; params.push(date_from); }
  if (date_to) { sql += ' AND eh.created_at <= ?'; params.push((date_to as string) + 'T23:59:59'); }

  const allRows = db.prepare(sql + ' ORDER BY eh.created_at DESC').all(...params);
  const total = allRows.length;

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10)));
  const items = allRows.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.json({ success: true, data: { items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } });
});

// GET /api/history/event-types — list available event types
router.get('/event-types', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const types = db.prepare('SELECT DISTINCT event_type FROM event_history ORDER BY event_type').all() as { event_type: string }[];
  res.json({ success: true, data: types.map(t => t.event_type) });
});

export default router;
