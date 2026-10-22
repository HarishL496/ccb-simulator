import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { authenticate, authorize } from '../middleware/auth';
import { logEvent, notifyUser } from '../utils/helpers';
import { ChangeRequest } from '../models/types';

const router = Router();

const crQuery = `
  SELECT cr.*,
    ci.name as ci_name, ci.current_version as ci_current_version,
    u1.full_name as requester_name,
    u2.full_name as decided_by_name
  FROM change_requests cr
  LEFT JOIN configuration_items ci ON cr.ci_id = ci.id
  LEFT JOIN users u1 ON cr.requester_id = u1.id
  LEFT JOIN users u2 ON cr.decided_by = u2.id
`;

// GET /api/cr  — list with filters
router.get('/', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const { search, status, classification, priority, page = '1', limit = '20' } = req.query;

  let sql = crQuery + ' WHERE 1=1';
  const params: unknown[] = [];

  // Developers see only their own requests
  if (req.user!.role === 'developer') {
    sql += ' AND cr.requester_id = ?';
    params.push(req.user!.userId);
  }

  if (search) {
    sql += ' AND (cr.title LIKE ? OR cr.cr_id LIKE ? OR cr.description LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (status) { sql += ' AND cr.status = ?'; params.push(status); }
  if (classification) { sql += ' AND cr.classification = ?'; params.push(classification); }
  if (priority) { sql += ' AND cr.priority = ?'; params.push(priority); }

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));

  const allRows = db.prepare(sql + ' ORDER BY cr.created_at DESC').all(...params) as ChangeRequest[];
  const total = allRows.length;
  const items = allRows.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.json({ success: true, data: { items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } });
});

// GET /api/cr/:id
router.get('/:id', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const cr = db.prepare(crQuery + ' WHERE cr.id = ? OR cr.cr_id = ?')
    .get(req.params.id, req.params.id) as ChangeRequest | undefined;

  if (!cr) {
    res.status(404).json({ success: false, error: 'Change request not found' });
    return;
  }

  // Developers can only view their own
  if (req.user!.role === 'developer' && cr.requester_id !== req.user!.userId) {
    res.status(403).json({ success: false, error: 'Access denied' });
    return;
  }

  const steps = db.prepare(`
    SELECT as2.*, u.full_name as approver_name, u.role as approver_role
    FROM approval_steps as2
    LEFT JOIN users u ON as2.approver_id = u.id
    WHERE as2.cr_id = ? ORDER BY as2.created_at ASC
  `).all(cr.id);

  res.json({ success: true, data: { ...(cr as object), approval_steps: steps } });
});

// POST /api/cr — create new CR
router.post('/', authenticate, authorize('developer', 'admin'), [
  body('title').trim().notEmpty().withMessage('Title required').isLength({ max: 200 }),
  body('ci_id').trim().notEmpty().withMessage('Affected CI required'),
  body('description').trim().notEmpty().withMessage('Description required'),
  body('reason').trim().notEmpty().withMessage('Business reason required'),
  body('classification').isIn(['Minor','Major','Emergency']).withMessage('Classification must be Minor, Major, or Emergency'),
  body('priority').isIn(['Low','Medium','High','Critical']).withMessage('Priority must be Low, Medium, High, or Critical'),
  body('impact_analysis').optional().isString(),
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
    return;
  }

  const db = getDb();
  const { title, ci_id, description, reason, classification, priority, impact_analysis } = req.body;

  const ci = db.prepare('SELECT id, name, current_version FROM configuration_items WHERE id = ? OR ci_id = ?')
    .get(ci_id, ci_id) as { id: string; name: string; current_version: string } | undefined;
  if (!ci) {
    res.status(400).json({ success: false, error: 'Referenced CI not found' });
    return;
  }

  // Generate sequential CR ID safely
  const maxRow = db.prepare("SELECT MAX(CAST(SUBSTR(cr_id, 4) AS INTEGER)) as max_num FROM change_requests").get() as { max_num: number | null } | undefined;
  const crNum = (maxRow?.max_num || 0) + 1;
  const cr_id = `CR-${String(crNum).padStart(3, '0')}`;

  const id = uuidv4();
  db.prepare(`
    INSERT INTO change_requests
      (id, cr_id, title, ci_id, description, reason, classification, priority, impact_analysis, requester_id, version_before)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, cr_id, title, ci.id, description, reason, classification, priority, impact_analysis || null, req.user!.userId, ci.current_version);

  // Notify CCB Chairperson and members
  const ccbUsers = db.prepare("SELECT id FROM users WHERE role IN ('ccb_member','chairperson') AND is_active = 1").all() as { id: string }[];
  for (const u of ccbUsers) {
    notifyUser({
      user_id: u.id,
      title: `New ${classification} Change Request`,
      message: `${cr_id}: "${title}" submitted for ${ci.name}`,
      type: 'system', related_cr_id: id,
    });
  }

  logEvent({
    event_type: 'CR_SUBMITTED', actor_id: req.user!.userId, actor_name: req.user!.username,
    actor_role: req.user!.role, target_type: 'CR', target_id: id, target_name: cr_id,
    action: `Change Request submitted: ${title}`,
    reason, after_value: { cr_id, classification, priority, ci_id: ci.id },
  });

  const created = db.prepare(crQuery + ' WHERE cr.id = ?').get(id);
  res.status(201).json({ success: true, data: created });
});

// PATCH /api/cr/:id/review-notes (CCB members only)
router.patch('/:id/review-notes', authenticate, authorize('ccb_member', 'chairperson', 'admin'), [
  body('review_notes').trim().notEmpty().withMessage('Review notes required'),
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
    return;
  }
  const db = getDb();
  const cr = db.prepare('SELECT * FROM change_requests WHERE id = ? OR cr_id = ?')
    .get(req.params.id, req.params.id) as ChangeRequest | undefined;
  if (!cr) { res.status(404).json({ success: false, error: 'CR not found' }); return; }
  if (!['Pending','Under Review'].includes(cr.status)) {
    res.status(400).json({ success: false, error: 'Can only add notes to Pending or Under Review CRs' }); return;
  }

  db.prepare("UPDATE change_requests SET review_notes = ?, status = 'Under Review', updated_at = ? WHERE id = ?")
    .run(req.body.review_notes, new Date().toISOString(), cr.id);

  logEvent({
    event_type: 'CR_REVIEWED', actor_id: req.user!.userId, actor_name: req.user!.username,
    actor_role: req.user!.role, target_type: 'CR', target_id: cr.id, target_name: cr.cr_id,
    action: 'Review notes added to Change Request', reason: req.body.review_notes,
  });

  res.json({ success: true, message: 'Review notes updated' });
});

export default router;
