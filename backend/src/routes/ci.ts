import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { authenticate, authorize } from '../middleware/auth';
import { logEvent } from '../utils/helpers';
import { ConfigurationItem } from '../models/types';

const router = Router();

const ciQuery = `
  SELECT ci.*, u.full_name as owner_name, u.username as owner_username
  FROM configuration_items ci
  LEFT JOIN users u ON ci.owner_id = u.id
`;

// GET /api/ci  — list with search/filter/pagination
router.get('/', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const { search, type, lifecycle_status, approval_status, page = '1', limit = '20' } = req.query;

  let sql = ciQuery + ' WHERE 1=1';
  const params: unknown[] = [];

  if (search) {
    sql += ' AND (ci.name LIKE ? OR ci.ci_id LIKE ? OR ci.description LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (type) { sql += ' AND ci.type = ?'; params.push(type); }
  if (lifecycle_status) { sql += ' AND ci.lifecycle_status = ?'; params.push(lifecycle_status); }
  if (approval_status) { sql += ' AND ci.approval_status = ?'; params.push(approval_status); }

  const total = (db.prepare(`SELECT COUNT(*) as count FROM configuration_items ci WHERE 1=1${
    search ? ` AND (ci.name LIKE ? OR ci.ci_id LIKE ? OR ci.description LIKE ?)` : ''
  }${type ? ' AND ci.type = ?' : ''}${lifecycle_status ? ' AND ci.lifecycle_status = ?' : ''}${
    approval_status ? ' AND ci.approval_status = ?' : ''}`
  ).get(...params) as { count: number }).count;

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
  sql += ' ORDER BY ci.updated_at DESC LIMIT ? OFFSET ?';
  params.push(limitNum, (pageNum - 1) * limitNum);

  const items = db.prepare(sql).all(...params) as ConfigurationItem[];

  res.json({
    success: true,
    data: { items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  });
});

// GET /api/ci/:id — detail with version history
router.get('/:id', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const ci = db.prepare(ciQuery + ' WHERE ci.id = ? OR ci.ci_id = ?')
    .get(req.params.id, req.params.id) as ConfigurationItem | undefined;

  if (!ci) {
    res.status(404).json({ success: false, error: 'Configuration item not found' });
    return;
  }

  const versions = db.prepare(`
    SELECT vh.*, u.full_name as changed_by_name FROM ci_version_history vh
    LEFT JOIN users u ON vh.changed_by = u.id
    WHERE vh.ci_id = ? ORDER BY vh.created_at DESC
  `).all(ci.id);

  const crs = db.prepare(`
    SELECT cr.cr_id, cr.title, cr.status, cr.classification, cr.created_at, u.full_name as requester_name
    FROM change_requests cr LEFT JOIN users u ON cr.requester_id = u.id
    WHERE cr.ci_id = ? ORDER BY cr.created_at DESC
  `).all(ci.id);

  res.json({ success: true, data: { ...(ci as object), version_history: versions, change_requests: crs } });
});

// POST /api/ci  — create (developer/admin)
router.post('/', authenticate, authorize('developer', 'admin'), [
  body('ci_id').trim().notEmpty().withMessage('CI ID required').matches(/^CI-[A-Za-z0-9_-]+$/).withMessage('CI ID must match pattern CI-NNN or CI-XXX'),
  body('name').trim().notEmpty().withMessage('Name required'),
  body('type').isIn(['requirements_document','design_document','source_code','database_schema','test_cases','user_manual','project_report','version_history','other']).withMessage('Invalid type'),
  body('owner_id').trim().notEmpty().withMessage('Owner required'),
  body('lifecycle_status').optional().isIn(['Pending','In Progress','Complete','Deprecated']),
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
    return;
  }

  const db = getDb();
  const { ci_id, name, type, description, owner_id, lifecycle_status = 'Pending' } = req.body;

  const existing = db.prepare('SELECT id FROM configuration_items WHERE ci_id = ?').get(ci_id);
  if (existing) {
    res.status(409).json({ success: false, error: `CI ID ${ci_id} already exists` });
    return;
  }

  const owner = db.prepare('SELECT id FROM users WHERE id = ?').get(owner_id);
  if (!owner) {
    res.status(400).json({ success: false, error: 'Owner user not found' });
    return;
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  const seedCi = db.transaction(() => {
    db.prepare(`
      INSERT INTO configuration_items
        (id, ci_id, name, type, description, owner_id, current_version, lifecycle_status, approval_status)
      VALUES (?, ?, ?, ?, ?, ?, 'v1.0', ?, 'Not Approved')
    `).run(id, ci_id, name, type, description || null, owner_id, lifecycle_status);

    db.prepare(`
      INSERT INTO ci_version_history (id, ci_id, version, changed_by, change_summary, lifecycle_status, approval_status, snapshot_data)
      VALUES (?, ?, 'v1.0', ?, 'Initial registration', ?, 'Not Approved', ?)
    `).run(uuidv4(), id, req.user!.userId, lifecycle_status,
      JSON.stringify({ ci_id, name, version: 'v1.0', lifecycle_status, approval_status: 'Not Approved' }));
  });
  seedCi();

  logEvent({
    event_type: 'CI_CREATED', actor_id: req.user!.userId, actor_name: req.user!.username,
    actor_role: req.user!.role, target_type: 'CI', target_id: id, target_name: name,
    action: `Configuration Item ${ci_id} registered at v1.0`,
    after_value: { ci_id, name, type, version: 'v1.0', lifecycle_status },
  });

  const created = db.prepare(ciQuery + ' WHERE ci.id = ?').get(id);
  res.status(201).json({ success: true, data: created });
});

// PATCH /api/ci/:id  — update (developer/admin)
router.patch('/:id', authenticate, authorize('developer', 'admin', 'ccb_member', 'chairperson'), [
  body('lifecycle_status').optional().isIn(['Pending','In Progress','Complete','Deprecated']),
  body('approval_status').optional().isIn(['Approved','Not Approved','Under Review']),
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
    return;
  }

  const db = getDb();
  const ci = db.prepare('SELECT * FROM configuration_items WHERE id = ? OR ci_id = ?')
    .get(req.params.id, req.params.id) as ConfigurationItem | undefined;
  if (!ci) {
    res.status(404).json({ success: false, error: 'Configuration item not found' });
    return;
  }

  // Developers can only update CIs they own
  if (req.user!.role === 'developer' && ci.owner_id !== req.user!.userId) {
    res.status(403).json({ success: false, error: 'You can only update CIs you own' });
    return;
  }

  const { name, description, lifecycle_status, owner_id } = req.body;
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (lifecycle_status) updates.lifecycle_status = lifecycle_status;
  if (owner_id && req.user!.role === 'admin') updates.owner_id = owner_id;

  const setClauses = Object.keys(updates).map(k => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE configuration_items SET ${setClauses} WHERE id = @id`).run({ ...updates, id: ci.id });

  logEvent({
    event_type: 'CI_UPDATED', actor_id: req.user!.userId, actor_name: req.user!.username,
    actor_role: req.user!.role, target_type: 'CI', target_id: ci.id, target_name: ci.name,
    action: `CI ${ci.ci_id} metadata updated`,
    before_value: { name: ci.name, lifecycle_status: ci.lifecycle_status, description: ci.description },
    after_value: updates,
  });

  const updated = db.prepare(ciQuery + ' WHERE ci.id = ?').get(ci.id);
  res.json({ success: true, data: updated });
});

export default router;
