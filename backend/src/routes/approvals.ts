import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { authenticate, authorize } from '../middleware/auth';
import { logEvent, notifyUser, computeNextVersion, isOverdue } from '../utils/helpers';
import { ChangeRequest, ApprovalStep, ConfigurationItem } from '../models/types';

const router = Router();

// GET /api/approvals/queue  — CRs needing CCB action
router.get('/queue', authenticate, authorize('ccb_member', 'chairperson', 'admin'), (req: Request, res: Response) => {
  const db = getDb();
  const crs = db.prepare(`
    SELECT cr.*,
      ci.name as ci_name, ci.current_version as ci_current_version,
      u1.full_name as requester_name
    FROM change_requests cr
    LEFT JOIN configuration_items ci ON cr.ci_id = ci.id
    LEFT JOIN users u1 ON cr.requester_id = u1.id
    WHERE cr.status IN ('Pending','Under Review')
    ORDER BY CASE cr.classification WHEN 'Emergency' THEN 1 WHEN 'Major' THEN 2 ELSE 3 END,
             cr.created_at ASC
  `).all() as (ChangeRequest & { is_overdue?: boolean })[];

  // Flag overdue
  for (const cr of crs) {
    cr.is_overdue = isOverdue(cr.created_at, cr.classification);
  }

  res.json({ success: true, data: crs });
});

// POST /api/approvals/:crId/decide  — Record an approval decision
router.post('/:crId/decide', authenticate, [
  body('decision').isIn(['Approved','Rejected','Deferred']).withMessage('Decision must be Approved, Rejected, or Deferred'),
  body('reason').trim().isLength({ min: 10 }).withMessage('Reason must be at least 10 characters'),
  body('step_type').isIn(['technical_review','quality_review','chair_decision','single_approval','emergency_decision']).withMessage('Invalid step type'),
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
    return;
  }

  const db = getDb();
  const cr = db.prepare(`
    SELECT cr.*, ci.name as ci_name, ci.current_version as ci_current_version, u.full_name as requester_name
    FROM change_requests cr
    LEFT JOIN configuration_items ci ON cr.ci_id = ci.id
    LEFT JOIN users u ON cr.requester_id = u.id
    WHERE cr.id = ? OR cr.cr_id = ?
  `).get(req.params.crId, req.params.crId) as (ChangeRequest & { ci_name: string; ci_current_version: string; requester_name: string }) | undefined;

  if (!cr) { res.status(404).json({ success: false, error: 'Change Request not found' }); return; }
  if (!['Pending','Under Review'].includes(cr.status)) {
    res.status(400).json({ success: false, error: `CR is already ${cr.status} — cannot decide again` });
    return;
  }

  // Prevent self-approval
  if (cr.requester_id === req.user!.userId) {
    res.status(403).json({ success: false, error: 'You cannot approve or reject your own Change Request' });
    return;
  }

  if (!['ccb_member', 'chairperson', 'admin'].includes(req.user!.role)) {
    res.status(403).json({ success: false, error: 'Access denied: insufficient permissions' });
    return;
  }

  const { decision, reason, step_type } = req.body;

  // Validate step type matches classification and role
  const role = req.user!.role;
  if (cr.classification === 'Emergency' && step_type !== 'emergency_decision') {
    if (role !== 'chairperson' && role !== 'admin') {
      res.status(403).json({ success: false, error: 'Emergency CRs must be decided by the Chairperson' });
      return;
    }
  }

  if (cr.classification === 'Major') {
    if (step_type === 'chair_decision' && role !== 'chairperson' && role !== 'admin') {
      res.status(403).json({ success: false, error: 'Chair decision step requires Chairperson role' });
      return;
    }
  }

  const existingStep = db.prepare('SELECT id FROM approval_steps WHERE cr_id = ? AND approver_id = ? AND step_type = ?')
    .get(cr.id, req.user!.userId, step_type);
  if (existingStep) {
    res.status(409).json({ success: false, error: `You have already submitted a ${step_type} for this CR` });
    return;
  }

  // Record the approval step
  const stepId = uuidv4();
  db.prepare(`
    INSERT INTO approval_steps (id, cr_id, approver_id, step_type, decision, reason)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(stepId, cr.id, req.user!.userId, step_type, decision, reason);

  logEvent({
    event_type: 'CR_DECISION_RECORDED', actor_id: req.user!.userId, actor_name: req.user!.username,
    actor_role: req.user!.role, target_type: 'CR', target_id: cr.id, target_name: cr.cr_id,
    action: `${step_type} recorded: ${decision}`, reason,
  });

  // Determine if CR is now final
  const finalResult = computeFinalDecision(db, cr, decision, step_type, req.user!.userId);

  if (finalResult.isFinal) {
    const now = new Date().toISOString();

    if (finalResult.finalDecision === 'Approved') {
      // ATOMIC: update CI version + record history + update CR
      const newVersion = computeNextVersion(cr.ci_current_version, cr.classification);
      const ciId = cr.ci_id;

      const finalizeApproval = db.transaction(() => {
        // Update CI version and approval status
        db.prepare(`
          UPDATE configuration_items SET current_version = ?, approval_status = 'Approved', updated_at = ?
          WHERE id = ?
        `).run(newVersion, now, ciId);

        // Insert version history entry
        db.prepare(`
          INSERT INTO ci_version_history (id, ci_id, version, changed_by, cr_id, change_summary, lifecycle_status, approval_status, snapshot_data)
          SELECT ?, ci.id, ?, ?, ?, ?, ci.lifecycle_status, 'Approved',
            json_object('ci_id', ci.ci_id, 'name', ci.name, 'version', ?, 'cr_id', ?)
          FROM configuration_items ci WHERE ci.id = ?
        `).run(uuidv4(), newVersion, req.user!.userId, cr.id,
          `Approved via ${cr.cr_id}: ${cr.title}`, newVersion, cr.cr_id, ciId);

        // Update CR status
        db.prepare(`
          UPDATE change_requests SET status = 'Approved', final_decision_reason = ?, decided_at = ?,
          decided_by = ?, version_after = ?, updated_at = ?
          WHERE id = ?
        `).run(reason, now, req.user!.userId, newVersion, now, cr.id);
      });
      finalizeApproval();

      // Notify requester
      notifyUser({
        user_id: cr.requester_id,
        title: `CR ${cr.cr_id} Approved ✓`,
        message: `Your Change Request "${cr.title}" has been approved. CI ${cr.ci_name} version updated to ${newVersion}.`,
        type: 'cr_approved', related_cr_id: cr.id, related_ci_id: ciId,
      });

      logEvent({
        event_type: 'CR_APPROVED', actor_id: req.user!.userId, actor_name: req.user!.username,
        actor_role: req.user!.role, target_type: 'CR', target_id: cr.id, target_name: cr.cr_id,
        action: `CR ${cr.cr_id} finally approved. CI ${cr.ci_name} updated from ${cr.ci_current_version} to ${newVersion}.`,
        reason, before_value: { version: cr.ci_current_version }, after_value: { version: newVersion, status: 'Approved' },
      });

      res.json({
        success: true,
        message: `CR ${cr.cr_id} approved. CI version updated from ${cr.ci_current_version} to ${newVersion}.`,
        data: { decision: 'Approved', version_before: cr.ci_current_version, version_after: newVersion },
      });

    } else {
      // Rejected or Deferred — do NOT update CI version
      db.prepare(`
        UPDATE change_requests SET status = ?, final_decision_reason = ?, decided_at = ?, decided_by = ?, updated_at = ?
        WHERE id = ?
      `).run(finalResult.finalDecision, reason, now, req.user!.userId, now, cr.id);

      const notifType = finalResult.finalDecision === 'Rejected' ? 'cr_rejected' : 'cr_deferred';
      notifyUser({
        user_id: cr.requester_id,
        title: `CR ${cr.cr_id} ${finalResult.finalDecision}`,
        message: `Your Change Request "${cr.title}" has been ${finalResult.finalDecision?.toLowerCase()}. Reason: ${reason}`,
        type: notifType, related_cr_id: cr.id,
      });

      logEvent({
        event_type: `CR_${finalResult.finalDecision!.toUpperCase()}`,
        actor_id: req.user!.userId, actor_name: req.user!.username, actor_role: req.user!.role,
        target_type: 'CR', target_id: cr.id, target_name: cr.cr_id,
        action: `CR ${cr.cr_id} ${finalResult.finalDecision?.toLowerCase()}. CI version NOT changed.`,
        reason, before_value: { status: cr.status }, after_value: { status: finalResult.finalDecision },
      });

      res.json({
        success: true,
        message: `CR ${cr.cr_id} ${finalResult.finalDecision?.toLowerCase()}. CI version unchanged.`,
        data: { decision: finalResult.finalDecision },
      });
    }
  } else {
    // Not yet final — waiting for more steps
    db.prepare("UPDATE change_requests SET status = 'Under Review', updated_at = ? WHERE id = ?")
      .run(new Date().toISOString(), cr.id);
    res.json({
      success: true,
      message: `Step recorded. ${finalResult.message}`,
      data: { decision, step_type, remaining: finalResult.remaining },
    });
  }
});

// GET /api/approvals/:crId/steps — get all steps for a CR
router.get('/:crId/steps', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const cr = db.prepare('SELECT id FROM change_requests WHERE id = ? OR cr_id = ?')
    .get(req.params.crId, req.params.crId) as { id: string } | undefined;
  if (!cr) { res.status(404).json({ success: false, error: 'CR not found' }); return; }

  const steps = db.prepare(`
    SELECT as2.*, u.full_name as approver_name, u.role as approver_role
    FROM approval_steps as2
    LEFT JOIN users u ON as2.approver_id = u.id
    WHERE as2.cr_id = ? ORDER BY as2.created_at ASC
  `).all(cr.id) as ApprovalStep[];

  res.json({ success: true, data: steps });
});

/**
 * Determine whether this decision step finalizes the CR.
 * Policies:
 *  Minor: one CCB member (any role) can decide → final immediately
 *  Major: requires technical_review + quality_review + chair_decision all as Approved, OR any Rejected/Deferred finalizes immediately
 *  Emergency: chairperson decides immediately → final
 */
function computeFinalDecision(
  db: ReturnType<typeof getDb>,
  cr: ChangeRequest,
  currentDecision: string,
  currentStepType: string,
  currentUserId: string,
): { isFinal: boolean; finalDecision?: string; message: string; remaining?: string[] } {

  if (currentDecision === 'Rejected' || currentDecision === 'Deferred') {
    return { isFinal: true, finalDecision: currentDecision, message: `CR ${currentDecision}.` };
  }

  if (cr.classification === 'Emergency') {
    return { isFinal: true, finalDecision: 'Approved', message: 'Emergency CR approved immediately by Chairperson.' };
  }

  if (cr.classification === 'Minor') {
    return { isFinal: true, finalDecision: 'Approved', message: 'Minor CR approved by CCB member.' };
  }

  // Major: need technical_review + quality_review + chair_decision all Approved
  const allSteps = db.prepare(`
    SELECT step_type, decision FROM approval_steps WHERE cr_id = ?
  `).all(cr.id) as { step_type: string; decision: string }[];

  // Include current step
  allSteps.push({ step_type: currentStepType, decision: currentDecision });

  const hasTech = allSteps.some(s => s.step_type === 'technical_review' && s.decision === 'Approved');
  const hasQuality = allSteps.some(s => s.step_type === 'quality_review' && s.decision === 'Approved');
  const hasChair = allSteps.some(s => s.step_type === 'chair_decision' && s.decision === 'Approved');

  if (hasTech && hasQuality && hasChair) {
    return { isFinal: true, finalDecision: 'Approved', message: 'All Major CR review steps completed. CR Approved.' };
  }

  const remaining: string[] = [];
  if (!hasTech) remaining.push('technical_review');
  if (!hasQuality) remaining.push('quality_review');
  if (!hasChair) remaining.push('chair_decision');

  return {
    isFinal: false,
    message: `Major CR requires all three review steps. Pending: ${remaining.join(', ')}`,
    remaining,
  };
}

export default router;
