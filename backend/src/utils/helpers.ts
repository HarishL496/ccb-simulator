import { getDb } from '../db/database';
import { v4 as uuidv4 } from 'uuid';

interface LogEventArgs {
  event_type: string;
  actor_id: string | null;
  actor_name: string;
  actor_role: string;
  target_type?: string | null;
  target_id?: string | null;
  target_name?: string | null;
  action: string;
  reason?: string | null;
  before_value?: unknown;
  after_value?: unknown;
  metadata?: unknown;
}

export function logEvent(args: LogEventArgs): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO event_history
      (id, event_type, actor_id, actor_name, actor_role, target_type, target_id,
       target_name, action, reason, before_value, after_value, metadata)
    VALUES
      (@id, @event_type, @actor_id, @actor_name, @actor_role, @target_type, @target_id,
       @target_name, @action, @reason, @before_value, @after_value, @metadata)
  `).run({
    id: uuidv4(),
    event_type: args.event_type,
    actor_id: args.actor_id ?? null,
    actor_name: args.actor_name,
    actor_role: args.actor_role,
    target_type: args.target_type ?? null,
    target_id: args.target_id ?? null,
    target_name: args.target_name ?? null,
    action: args.action,
    reason: args.reason ?? null,
    before_value: args.before_value != null ? JSON.stringify(args.before_value) : null,
    after_value: args.after_value != null ? JSON.stringify(args.after_value) : null,
    metadata: args.metadata != null ? JSON.stringify(args.metadata) : null,
  });
}

export function createNotification(args: {
  user_id: string;
  title: string;
  message: string;
  type: string;
  related_cr_id?: string | null;
  related_ci_id?: string | null;
}): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, related_cr_id, related_ci_id)
    VALUES (@id, @user_id, @title, @message, @type, @related_cr_id, @related_ci_id)
  `).run({
    id: uuidv4(),
    user_id: args.user_id,
    title: args.title,
    message: args.message,
    type: args.type,
    related_cr_id: args.related_cr_id ?? null,
    related_ci_id: args.related_ci_id ?? null,
  });
}

export function notifyUser(args: {
  user_id: string;
  title: string;
  message: string;
  type: string;
  related_cr_id?: string | null;
  related_ci_id?: string | null;
}): void {
  createNotification(args);
}

/**
 * Compute new version string.
 * Minor: v1.0 → v1.1, v1.9 → v1.10
 * Major: v1.0 → v2.0, v2.5 → v3.0
 * Emergency: treated as Minor increment (v1.0 → v1.1)
 */
export function computeNextVersion(current: string, classification: 'Minor' | 'Major' | 'Emergency'): string {
  const match = current.match(/^v(\d+)\.(\d+)$/);
  if (!match) return current;
  const major = parseInt(match[1], 10);
  const minor = parseInt(match[2], 10);

  if (classification === 'Major') {
    return `v${major + 1}.0`;
  } else {
    // Minor or Emergency
    return `v${major}.${minor + 1}`;
  }
}

/**
 * Check if a CR is overdue based on classification and creation time.
 * Minor: same day (24h), Major: 2 days (48h), Emergency: 4h
 */
export function isOverdue(createdAt: string, classification: 'Minor' | 'Major' | 'Emergency'): boolean {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const hoursElapsed = (now - created) / (1000 * 60 * 60);

  switch (classification) {
    case 'Emergency': return hoursElapsed > 4;
    case 'Minor': return hoursElapsed > 24;
    case 'Major': return hoursElapsed > 48;
    default: return false;
  }
}

export function paginate<T>(items: T[], page: number, limit: number) {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    total,
    page,
    limit,
    totalPages,
  };
}
