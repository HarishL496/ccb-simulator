import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { getDb } from '../db/database';
import { authenticate, generateToken } from '../middleware/auth';
import { logEvent } from '../utils/helpers';
import { User } from '../models/types';

const router = Router();

// POST /api/auth/login
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
    return;
  }

  const { username, password } = req.body;
  const db = getDb();

  const user = db.prepare('SELECT * FROM users WHERE (username = ? OR email = ?) AND is_active = 1')
    .get(username, username) as User | undefined;

  if (!user) {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
    return;
  }

  const token = generateToken({ userId: user.id, username: user.username, role: user.role });

  logEvent({
    event_type: 'USER_LOGIN', actor_id: user.id, actor_name: user.full_name,
    actor_role: user.role, target_type: 'User', target_id: user.id,
    target_name: user.username, action: 'User logged in',
  });

  res.json({
    success: true,
    data: {
      token,
      user: { id: user.id, username: user.username, email: user.email, full_name: user.full_name, role: user.role },
    },
  });
});

// GET /api/auth/me
router.get('/me', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const user = db.prepare('SELECT id, username, email, full_name, role, is_active, created_at FROM users WHERE id = ?')
    .get(req.user!.userId) as User | undefined;

  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }
  res.json({ success: true, data: user });
});

// POST /api/auth/logout
router.post('/logout', authenticate, (req: Request, res: Response) => {
  logEvent({
    event_type: 'USER_LOGOUT', actor_id: req.user!.userId, actor_name: req.user!.username,
    actor_role: req.user!.role, target_type: 'User', target_id: req.user!.userId,
    target_name: req.user!.username, action: 'User logged out',
  });
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
