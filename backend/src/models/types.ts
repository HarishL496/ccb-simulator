// ── User & Auth types ─────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'developer' | 'ccb_member' | 'chairperson' | 'viewer';

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface UserPublic {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: number;
  created_at: string;
}

export interface AuthPayload {
  userId: string;
  username: string;
  role: UserRole;
}

// ── Configuration Item types ──────────────────────────────────────────────────
export type CIType =
  | 'requirements_document'
  | 'design_document'
  | 'source_code'
  | 'database_schema'
  | 'test_cases'
  | 'user_manual'
  | 'project_report'
  | 'version_history'
  | 'other';

export type LifecycleStatus = 'Pending' | 'In Progress' | 'Complete' | 'Deprecated';
export type ApprovalStatus = 'Approved' | 'Not Approved' | 'Under Review';

export interface ConfigurationItem {
  id: string;
  ci_id: string;
  name: string;
  type: CIType;
  description: string | null;
  owner_id: string;
  current_version: string;
  lifecycle_status: LifecycleStatus;
  approval_status: ApprovalStatus;
  baseline_ref: string | null;
  is_seed_data: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  owner_name?: string;
  owner_username?: string;
}

export interface CIVersionHistory {
  id: string;
  ci_id: string;
  version: string;
  changed_by: string;
  cr_id: string | null;
  change_summary: string;
  lifecycle_status: string;
  approval_status: string;
  snapshot_data: string | null;
  created_at: string;
  // Joined
  changed_by_name?: string;
}

// ── Change Request types ──────────────────────────────────────────────────────
export type CRClassification = 'Minor' | 'Major' | 'Emergency';
export type CRPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type CRStatus = 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Deferred';

export interface ChangeRequest {
  id: string;
  cr_id: string;
  title: string;
  ci_id: string;
  description: string;
  reason: string;
  classification: CRClassification;
  priority: CRPriority;
  impact_analysis: string | null;
  requester_id: string;
  status: CRStatus;
  review_notes: string | null;
  final_decision_reason: string | null;
  decided_at: string | null;
  decided_by: string | null;
  version_before: string | null;
  version_after: string | null;
  overdue_notified: number;
  is_seed_data: number;
  created_at: string;
  updated_at: string;
  // Joined
  ci_name?: string;
  ci_current_version?: string;
  requester_name?: string;
  decided_by_name?: string;
}

export type ApprovalStepType =
  | 'technical_review'
  | 'quality_review'
  | 'chair_decision'
  | 'single_approval'
  | 'emergency_decision';

export type ApprovalDecision = 'Approved' | 'Rejected' | 'Deferred' | 'Pending';

export interface ApprovalStep {
  id: string;
  cr_id: string;
  approver_id: string;
  step_type: ApprovalStepType;
  decision: ApprovalDecision;
  reason: string;
  created_at: string;
  // Joined
  approver_name?: string;
  approver_role?: string;
}

// ── Baseline types ────────────────────────────────────────────────────────────
export type BaselineStatus = 'Active' | 'Superseded' | 'Archived';

export interface Baseline {
  id: string;
  baseline_id: string;
  name: string;
  description: string | null;
  created_by: string;
  status: BaselineStatus;
  is_seed_data: number;
  created_at: string;
  // Joined
  created_by_name?: string;
  item_count?: number;
}

export interface BaselineItem {
  id: string;
  baseline_id: string;
  ci_id: string;
  version_at_baseline: string;
  approval_status_at_baseline: string;
  created_at: string;
  // Joined
  ci_name?: string;
  ci_current_version?: string;
  ci_approval_status?: string;
}

// ── Audit types ───────────────────────────────────────────────────────────────
export type AuditType = 'FCA' | 'PCA';
export type AuditStatus = 'In Progress' | 'Completed' | 'Archived';
export type AuditResult = 'PASS' | 'FAIL' | 'NEEDS REVIEW';
export type CheckItemResult = 'Yes' | 'No' | 'In Progress' | 'Pending';

export interface AuditChecklist {
  id: string;
  audit_type: AuditType;
  title: string;
  description: string | null;
  created_by: string;
  status: AuditStatus;
  overall_result: AuditResult | null;
  created_at: string;
  completed_at: string | null;
  // Joined
  created_by_name?: string;
  item_count?: number;
  passed_count?: number;
}

export interface AuditChecklistItem {
  id: string;
  checklist_id: string;
  item_number: number;
  category: string;
  check_description: string;
  result: CheckItemResult;
  remarks: string | null;
  is_automated: number;
  auditor_id: string | null;
  checked_at: string | null;
  created_at: string;
  // Joined
  auditor_name?: string;
}

// ── Event History types ───────────────────────────────────────────────────────
export interface EventHistory {
  id: string;
  event_type: string;
  actor_id: string | null;
  actor_name: string;
  actor_role: string;
  target_type: string | null;
  target_id: string | null;
  target_name: string | null;
  action: string;
  reason: string | null;
  before_value: string | null;
  after_value: string | null;
  metadata: string | null;
  created_at: string;
}

// ── Notification types ────────────────────────────────────────────────────────
export type NotificationType =
  | 'cr_approved'
  | 'cr_rejected'
  | 'cr_deferred'
  | 'overdue_alert'
  | 'version_updated'
  | 'system';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  related_cr_id: string | null;
  related_ci_id: string | null;
  is_read: number;
  created_at: string;
}

// ── API Response types ────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
