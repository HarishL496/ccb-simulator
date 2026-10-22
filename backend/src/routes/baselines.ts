import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { authenticate, authorize } from '../middleware/auth';
import { logEvent } from '../utils/helpers';
import { Baseline, BaselineItem } from '../models/types';

const router = Router();

// GET /api/baselines
router.get('/', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const baselines = db.prepare(`
    SELECT b.*, u.full_name as created_by_name,
      COUNT(bi.id) as item_count
    FROM baselines b
    LEFT JOIN users u ON b.created_by = u.id
    LEFT JOIN baseline_items bi ON b.id = bi.baseline_id
    GROUP BY b.id
    ORDER BY b.created_at DESC
  `).all() as Baseline[];
  res.json({ success: true, data: baselines });
});

// GET /api/baselines/:id  — detail + items + current vs baseline comparison
router.get('/:id', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const baseline = db.prepare(`
    SELECT b.*, u.full_name as created_by_name FROM baselines b
    LEFT JOIN users u ON b.created_by = u.id
    WHERE b.id = ? OR b.baseline_id = ?
  `).get(req.params.id, req.params.id) as Baseline | undefined;

  if (!baseline) {
    res.status(404).json({ success: false, error: 'Baseline not found' });
    return;
  }

  const items = db.prepare(`
    SELECT bi.*, ci.name as ci_name, ci.ci_id, ci.current_version as ci_current_version,
      ci.approval_status as ci_approval_status, ci.lifecycle_status as ci_lifecycle_status
    FROM baseline_items bi
    LEFT JOIN configuration_items ci ON bi.ci_id = ci.id
    WHERE bi.baseline_id = ?
    ORDER BY ci.ci_id
  `).all(baseline.id) as (BaselineItem & {
    ci_id_str: string; ci_lifecycle_status: string; version_mismatch?: boolean;
  })[];

  // Flag version mismatches
  for (const item of items) {
    item.version_mismatch = item.version_at_baseline !== item.ci_current_version;
  }

  res.json({ success: true, data: { ...(baseline as object), items } });
});

// POST /api/baselines — create new baseline (admin/chairperson)
router.post('/', authenticate, authorize('admin', 'chairperson'), [
  body('name').trim().notEmpty().withMessage('Baseline name required'),
  body('description').optional().isString(),
  body('ci_ids').isArray({ min: 1 }).withMessage('At least one CI required'),
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
    return;
  }

  const db = getDb();
  const { name, description, ci_ids } = req.body as { name: string; description?: string; ci_ids: string[] };

  // Validate all CIs are Approved
  const cis = ci_ids.map(ciId =>
    db.prepare('SELECT id, ci_id, name, current_version, approval_status FROM configuration_items WHERE id = ? OR ci_id = ?')
      .get(ciId, ciId) as { id: string; ci_id: string; name: string; current_version: string; approval_status: string } | undefined
  );

  const missing = cis.some(ci => !ci);
  if (missing) {
    res.status(400).json({ success: false, error: 'One or more CI IDs not found' });
    return;
  }

  const unapproved = cis.filter(ci => ci!.approval_status !== 'Approved');
  if (unapproved.length > 0) {
    res.status(400).json({
      success: false,
      error: `Cannot include unapproved CIs in a baseline: ${unapproved.map(c => c!.ci_id).join(', ')}`,
    });
    return;
  }

  // Generate baseline ID
  const lastBL = db.prepare("SELECT baseline_id FROM baselines ORDER BY created_at DESC LIMIT 1").get() as { baseline_id: string } | undefined;
  let blNum = 1;
  if (lastBL) {
    const match = lastBL.baseline_id.match(/BL-(\d+)/);
    if (match) blNum = parseInt(match[1], 10) + 1;
  }
  const baseline_id = `BL-${String(blNum).padStart(3, '0')}`;

  const id = uuidv4();

  const createBaseline = db.transaction(() => {
    db.prepare(`
      INSERT INTO baselines (id, baseline_id, name, description, created_by, status)
      VALUES (?, ?, ?, ?, ?, 'Active')
    `).run(id, baseline_id, name, description || null, req.user!.userId);

    for (const ci of cis) {
      db.prepare(`
        INSERT INTO baseline_items (id, baseline_id, ci_id, version_at_baseline, approval_status_at_baseline)
        VALUES (?, ?, ?, ?, ?)
      `).run(uuidv4(), id, ci!.id, ci!.current_version, ci!.approval_status);
    }
  });
  createBaseline();

  logEvent({
    event_type: 'BASELINE_CREATED', actor_id: req.user!.userId, actor_name: req.user!.username,
    actor_role: req.user!.role, target_type: 'Baseline', target_id: id, target_name: name,
    action: `Baseline ${baseline_id} created with ${cis.length} approved CIs`,
    after_value: { baseline_id, ci_count: cis.length, cis: cis.map(c => ({ id: c!.ci_id, v: c!.current_version })) },
  });

  const created = db.prepare(`
    SELECT b.*, u.full_name as created_by_name FROM baselines b
    LEFT JOIN users u ON b.created_by = u.id WHERE b.id = ?
  `).get(id);

  res.status(201).json({ success: true, data: created });
});

// PATCH /api/baselines/:id/archive (admin only)
router.patch('/:id/archive', authenticate, authorize('admin'), (req: Request, res: Response) => {
  const db = getDb();
  const baseline = db.prepare('SELECT * FROM baselines WHERE id = ? OR baseline_id = ?')
    .get(req.params.id, req.params.id) as Baseline | undefined;
  if (!baseline) { res.status(404).json({ success: false, error: 'Baseline not found' }); return; }

  db.prepare("UPDATE baselines SET status = 'Archived' WHERE id = ?").run(baseline.id);
  logEvent({
    event_type: 'BASELINE_ARCHIVED', actor_id: req.user!.userId, actor_name: req.user!.username,
    actor_role: req.user!.role, target_type: 'Baseline', target_id: baseline.id, target_name: baseline.name,
    action: `Baseline ${baseline.baseline_id} archived`,
  });
  res.json({ success: true, message: 'Baseline archived' });
});

export default router;
