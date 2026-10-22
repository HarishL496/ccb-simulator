export type UserRole = 'admin' | 'developer' | 'ccb_member' | 'chairperson' | 'viewer';

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: number;
  created_at: string;
}

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
  description?: string;
  owner_id: string;
  owner_name?: string;
  owner_role?: string;
  current_version: string;
  lifecycle_status: LifecycleStatus;
  approval_status: ApprovalStatus;
  baseline_ref?: string;
  is_seed_data: number;
  created_at: string;
  updated_at: string;
}

export interface CIVersionHistory {
  id: string;
  ci_id: string;
  version: string;
  changed_by: string;
  changer_name?: string;
  cr_id?: string;
  cr_code?: string;
  change_summary: string;
  lifecycle_status: LifecycleStatus;
  approval_status: ApprovalStatus;
  snapshot_data?: string;
  created_at: string;
}

export type CRClassification = 'Minor' | 'Major' | 'Emergency';
export type CRPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type CRStatus = 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Deferred';

export interface ChangeRequest {
  id: string;
  cr_id: string;
  title: string;
  ci_id: string;
  ci_name?: string;
  ci_current_version?: string;
  description: string;
  reason: string;
  classification: CRClassification;
  priority: CRPriority;
  impact_analysis?: string;
  requester_id: string;
  requester_name?: string;
  status: CRStatus;
  review_notes?: string;
  final_decision_reason?: string;
  decided_at?: string;
  decided_by?: string;
  decider_name?: string;
  version_before?: string;
  version_after?: string;
  overdue_notified: number;
  created_at: string;
  updated_at: string;
}

export interface ApprovalStep {
  id: string;
  cr_id: string;
  approver_id: string;
  approver_name?: string;
  approver_role?: string;
  step_type: 'technical_review' | 'quality_review' | 'chair_decision' | 'single_approval' | 'emergency_decision';
  decision: 'Approved' | 'Rejected' | 'Deferred' | 'Pending';
  reason: string;
  created_at: string;
}

export interface Baseline {
  id: string;
  baseline_id: string;
  name: string;
  description?: string;
  created_by: string;
  creator_name?: string;
  status: 'Active' | 'Superseded' | 'Archived';
  ci_count?: number;
  created_at: string;
  items?: BaselineItem[];
}

export interface BaselineItem {
  id: string;
  baseline_id: string;
  ci_id: string;
  ci_name?: string;
  ci_code?: string;
  version_at_baseline: string;
  approval_status_at_baseline: string;
  current_ci_version?: string;
  version_match?: boolean;
}

export interface AuditChecklist {
  id: string;
  audit_type: 'FCA' | 'PCA';
  title: string;
  description?: string;
  created_by: string;
  creator_name?: string;
  status: 'In Progress' | 'Completed' | 'Archived';
  overall_result?: 'PASS' | 'FAIL' | 'NEEDS REVIEW';
  created_at: string;
  completed_at?: string;
  items?: AuditChecklistItem[];
}

export interface AuditChecklistItem {
  id: string;
  checklist_id: string;
  item_number: number;
  category: string;
  check_description: string;
  result: 'Yes' | 'No' | 'In Progress' | 'Pending';
  remarks?: string;
  is_automated: number;
  auditor_id?: string;
  auditor_name?: string;
  checked_at?: string;
}

export interface EventLog {
  id: string;
  event_type: string;
  actor_id?: string;
  actor_name: string;
  actor_role: string;
  target_type?: string;
  target_id?: string;
  target_name?: string;
  action: string;
  reason?: string;
  before_value?: string;
  after_value?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  related_cr_id?: string;
  related_ci_id?: string;
  is_read: number;
  created_at: string;
}

export interface DashboardStats {
  ciStats: {
    total: number;
    approved: number;
    not_approved: number;
    in_progress: number;
    pending: number;
    baselined: number;
  };
  crStats: {
    total: number;
    pending: number;
    under_review: number;
    approved: number;
    rejected: number;
    deferred: number;
  };
  overdueCRs: ChangeRequest[];
  recentActivity: EventLog[];
  recentApprovals: any[];
}
