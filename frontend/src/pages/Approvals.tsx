import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck,
  UserCheck,
  FileCheck2,
} from 'lucide-react';
import { api } from '../api/client';
import { ChangeRequest } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../hooks/useAuth';

export const Approvals: React.FC = () => {
  const { user } = useAuth();
  const [queue, setQueue] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Decision Modal
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [activeCR, setActiveCR] = useState<ChangeRequest | null>(null);
  const [decision, setDecision] = useState<'Approved' | 'Rejected' | 'Deferred'>('Approved');
  const [stepType, setStepType] = useState<string>('single_approval');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await api.getApprovalQueue();
      if (res.success && res.data) {
        setQueue(res.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [user]);

  const handleOpenDecision = (cr: ChangeRequest) => {
    setActiveCR(cr);
    setReason('');
    setDecisionError(null);

    // Default step type according to classification and role
    if (cr.classification === 'Major') {
      if (user?.username === 'ccb_tech') setStepType('technical_review');
      else if (user?.username === 'ccb_quality') setStepType('quality_review');
      else setStepType('chair_decision');
    } else if (cr.classification === 'Emergency') {
      setStepType('emergency_decision');
    } else {
      setStepType('single_approval');
    }

    setDecisionModalOpen(true);
  };

  const handleRecordDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCR) return;

    setSubmitting(true);
    setDecisionError(null);
    try {
      const res = await api.decideCR(activeCR.id, {
        decision,
        reason,
        step_type: stepType,
      });

      if (res.success) {
        setDecisionModalOpen(false);
        setSuccessToast(`Decision recorded for ${activeCR.cr_id}: ${decision}`);
        setTimeout(() => setSuccessToast(null), 4000);
        fetchQueue();
      }
    } catch (err: any) {
      setDecisionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isSelf = (cr: ChangeRequest) => cr.requester_id === user?.id;
  const isApprover = user?.role === 'ccb_member' || user?.role === 'chairperson' || user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">CCB Approval Workspace</h2>
          <p className="text-sm text-slate-500 mt-1">
            Configuration Control Board decision queue with rigorous policy enforcement and multi-party sign-off.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg border border-amber-200">
            {queue.length} Change Request(s) Awaiting Review
          </span>
        </div>
      </div>

      {/* Success Banner */}
      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2" />
          {successToast}
        </div>
      )}

      {/* Policy Rules Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center space-x-2 text-indigo-700 font-bold mb-1">
            <CheckSquare className="w-4 h-4" />
            <span>Minor Change Policy</span>
          </div>
          <p className="text-slate-600">
            Requires <strong>one CCB member</strong> decision. Same-day turnaround (&lt;24h). Increments minor version (v1.0 → v1.1).
          </p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center space-x-2 text-purple-700 font-bold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Major Change Policy</span>
          </div>
          <p className="text-slate-600">
            Requires <strong>3-step review</strong>: 1. Technical Review + 2. Quality Review + 3. Chairperson final approval (v1.0 → v2.0).
          </p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center space-x-2 text-rose-700 font-bold mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>Emergency Fix Policy</span>
          </div>
          <p className="text-slate-600">
            Directly decided by the <strong>Chairperson</strong> within 4 hours. Flags for post-incident review at next board meeting.
          </p>
        </div>
      </div>

      {/* Access Warning if not approver */}
      {!isApprover && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <strong>Read-Only Notice:</strong> You are currently logged in as a <em>{user?.role}</em>. To review and approve changes, switch to a CCB persona using the top-right header role switcher (e.g. <strong>CCB Chairperson</strong> or <strong>CCB Tech Reviewer</strong>).
          </div>
        </div>
      )}

      {/* Queue List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400 text-xs">
            Loading approval queue...
          </div>
        ) : queue.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500 text-xs space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <div className="font-semibold text-slate-700 text-sm">Approval Queue Clear</div>
            <p className="text-slate-400">All submitted change requests have been processed.</p>
          </div>
        ) : (
          queue.map((cr) => {
            const selfApproval = isSelf(cr);
            return (
              <div
                key={cr.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-sm text-indigo-600">{cr.cr_id}</span>
                    <StatusBadge status={cr.classification} type="classification" />
                    <StatusBadge status={cr.priority} type="priority" />
                    <StatusBadge status={cr.status} type="cr_status" />
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Submitted {new Date(cr.created_at).toLocaleDateString()} by {cr.requester_name}</span>
                  </div>
                </div>

                <div className="py-3">
                  <h4 className="font-bold text-slate-900 text-sm">{cr.title}</h4>
                  <div className="mt-1 text-slate-600 leading-relaxed">{cr.description}</div>
                  <div className="mt-2 text-slate-500">
                    <strong className="text-slate-700">Justification:</strong> {cr.reason}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-slate-100 gap-3">
                  <div className="flex items-center space-x-4 text-slate-500 text-[11px]">
                    <span>
                      Target CI: <strong className="text-slate-800">{cr.ci_name}</strong>
                    </span>
                    <span>
                      Version Impact:{' '}
                      <strong className="font-mono text-indigo-700">
                        {cr.version_before} → {cr.classification === 'Major' ? 'v2.0' : 'v1.1'}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {selfApproval ? (
                      <span className="text-xs text-rose-600 font-semibold bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 flex items-center">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Self-approval prohibited
                      </span>
                    ) : isApprover ? (
                      <button
                        onClick={() => handleOpenDecision(cr)}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center"
                      >
                        <FileCheck2 className="w-4 h-4 mr-1.5" />
                        Deliberate & Decide
                      </button>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Approver permissions required</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Decision Modal */}
      <Modal
        isOpen={decisionModalOpen}
        onClose={() => setDecisionModalOpen(false)}
        title={`CCB Deliberation — ${activeCR?.cr_id}: ${activeCR?.title}`}
        maxWidth="xl"
      >
        <form onSubmit={handleRecordDecision} className="space-y-4 text-xs">
          {decisionError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {decisionError}
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Classification:</span>
              <StatusBadge status={activeCR?.classification || 'Minor'} type="classification" />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Target CI:</span>
              <span className="font-semibold text-slate-800">{activeCR?.ci_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Atomic Version Progression:</span>
              <span className="font-mono font-bold text-indigo-700">
                {activeCR?.version_before} → {activeCR?.classification === 'Major' ? 'v2.0' : 'v1.1'}
              </span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Approval Step Type *</label>
            <select
              value={stepType}
              onChange={(e) => setStepType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 capitalize"
            >
              {activeCR?.classification === 'Major' ? (
                <>
                  <option value="technical_review">1. Technical Review (CCB Tech)</option>
                  <option value="quality_review">2. Quality Review (CCB Quality)</option>
                  <option value="chair_decision">3. Chairperson Final Decision (Chairperson)</option>
                </>
              ) : activeCR?.classification === 'Emergency' ? (
                <option value="emergency_decision">Emergency Decision (Chairperson)</option>
              ) : (
                <option value="single_approval">Single Approver Decision (CCB Member)</option>
              )}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Board Decision *</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDecision('Approved')}
                className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center transition-all ${
                  decision === 'Approved'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Approve
              </button>

              <button
                type="button"
                onClick={() => setDecision('Rejected')}
                className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center transition-all ${
                  decision === 'Rejected'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                Reject
              </button>

              <button
                type="button"
                onClick={() => setDecision('Deferred')}
                className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center transition-all ${
                  decision === 'Deferred'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <HelpCircle className="w-4 h-4 mr-1.5" />
                Defer
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Mandatory Justification / Review Explanation * (Minimum 10 characters)
            </label>
            <textarea
              required
              rows={3}
              placeholder="State the technical, architectural, or schedule reasoning behind this decision..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Recorded into immutable event audit trail and transmitted to requester.
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => setDecisionModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || reason.trim().length < 10}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Recording...' : `Record ${decision}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
