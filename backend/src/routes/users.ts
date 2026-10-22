import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { authenticate, authorize } from '../middleware/auth';
import { logEvent } from '../utils/helpers';
import { User, UserPublic } from '../models/types';

const router = Router();

// GET /api/users  (admin only)
router.get('/', authenticate, authorize('admin'), (req: Request, res: Response) => {
  const db = getDb();
  const users = db.prepare(
    'SELECT id, username, email, full_name, role, is_active, created_at FROM users ORDER BY role, full_name'
  ).all() as UserPublic[];
  res.json({ success: true, data: users });
});

// GET /api/users/:id
router.get('/:id', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  // Non-admins can only view themselves
  if (req.user!.role !== 'admin' && req.user!.userId !== req.params.id) {
    res.status(403).json({ success: false, error: 'Access denied' });
    return;
  }
  const user = db.prepare(
    'SELECT id, username, email, full_name, role, is_active, created_at FROM users WHERE id = ?'
  ).get(req.params.id) as UserPublic | undefined;
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }
  res.json({ success: true, data: user });
});

// POST /api/users  (admin only)
router.post('/', authenticate, authorize('admin'), [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('full_name').trim().notEmpty().withMessage('Full name required'),
  body('role').isIn(['admin', 'developer', 'ccb_member', 'chairperson', 'viewer']).withMessage('Invalid role'),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
    return;
  }

  const { username, email, password, full_name, role } = req.body;
  const db = getDb();

  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existing) {
    res.status(409).json({ success: false, error: 'Username or email already exists' });
    return;
  }

  const password_hash = await bcrypt.hash(password, 12);
  const id = uuidv4();

  db.prepare(`INSERT INTO users (id, username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(id, username, email, password_hash, full_name, role);

  logEvent({
    event_type: 'USER_CREATED', actor_id: req.user!.userId, actor_name: req.user!.username,
    actor_role: req.user!.role, target_type: 'User', target_id: id, target_name: username,
    action: `User account created with role: ${role}`,
  });

  res.status(201).json({ success: true, data: { id, username, email, full_name, role } });
});

// PATCH /api/users/:id  (admin can update any; user can update own password)
router.patch('/:id', authenticate, async (req: Request, res: Response) => {
  const db = getDb();
  const isAdmin = req.user!.role === 'admin';
  const isSelf = req.user!.userId === req.params.id;

  if (!isAdmin && !isSelf) {
    res.status(403).json({ success: false, error: 'Access denied' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as User | undefined;
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  const updates: Record<string, unknown> = {};

  if (req.body.full_name) updates.full_name = req.body.full_name;
  if (req.body.email) updates.email = req.body.email;
  if (isAdmin && req.body.role) updates.role = req.body.role;
  if (isAdmin && req.body.is_active !== undefined) updates.is_active = req.body.is_active ? 1 : 0;
  if (req.body.password) {
    updates.password_hash = await bcrypt.hash(req.body.password, 12);
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ success: false, error: 'No valid fields to update' });
    return;
  }

  updates.updated_at = new Date().toISOString();
  const setClauses = Object.keys(updates).map(k => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE users SET ${setClauses} WHERE id = @id`).run({ ...updates, id: req.params.id });

  logEvent({
    event_type: 'USER_UPDATED', actor_id: req.user!.userId, actor_name: req.user!.username,
    actor_role: req.user!.role, target_type: 'User', target_id: req.params.id, target_name: user.username,
    action: 'User account updated', after_value: { fields: Object.keys(updates).filter(k => k !== 'password_hash') },
  });

  res.json({ success: true, message: 'User updated successfully' });
});

export default router;
