import React, { useState, useEffect } from 'react';
import { GitPullRequest, Plus, Search, Filter, AlertCircle, Clock, CheckCircle2, ChevronRight, User } from 'lucide-react';
import { api } from '../api/client';
import { ChangeRequest, ConfigurationItem, ApprovalStep } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../hooks/useAuth';
import { useSearchParams } from 'react-router-dom';

export const ChangeRequests: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [crs, setCrs] = useState<ChangeRequest[]>([]);
  const [cis, setCis] = useState<ConfigurationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [classFilter, setClassFilter] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(searchParams.get('new') === 'true');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCR, setSelectedCR] = useState<ChangeRequest | null>(null);
  const [approvalSteps, setApprovalSteps] = useState<ApprovalStep[]>([]);

  // Create CR Form
  const [formCiId, setFormCiId] = useState(searchParams.get('ci_id') || '');
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formReason, setFormReason] = useState('');
  const [formClassification, setFormClassification] = useState<'Minor' | 'Major' | 'Emergency'>('Minor');
  const [formPriority, setFormPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [formImpact, setFormImpact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (classFilter) params.classification = classFilter;

      const [crRes, ciRes] = await Promise.all([api.getCRs(params), api.getCIs()]);
      if (crRes.success && crRes.data) {
        setCrs(crRes.data.items || (Array.isArray(crRes.data) ? crRes.data : []));
      }
      if (ciRes.success && ciRes.data) {
        const ciList = ciRes.data.items || (Array.isArray(ciRes.data) ? ciRes.data : []);
        setCis(ciList);
        if (!formCiId && ciList.length > 0) {
          setFormCiId(ciList[0].id);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter, classFilter]);

  const handleOpenDetail = async (cr: ChangeRequest) => {
    setSelectedCR(cr);
    setDetailModalOpen(true);
    try {
      const res = await api.getCR(cr.id);
      if (res.success && res.data) {
        setSelectedCR(res.data);
        setApprovalSteps(res.data.approval_steps || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCR = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await api.createCR({
        ci_id: formCiId,
        title: formTitle,
        description: formDesc,
        reason: formReason,
        classification: formClassification,
        priority: formPriority,
        impact_analysis: formImpact,
      });

      if (res.success) {
        setCreateModalOpen(false);
        setFormTitle('');
        setFormDesc('');
        setFormReason('');
        setFormImpact('');
        fetchData();
      }
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Change Request (CR) Management</h2>
          <p className="text-sm text-slate-500 mt-1">
            Formal submission, impact evaluation, and CCB approval classification pipeline.
          </p>
        </div>
        {user?.role !== 'viewer' && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Submit Change Request
          </button>
        )}
      </div>

      {/* SCM Distinction Banner: CR vs PR */}
      <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-start space-x-3 text-xs">
        <AlertCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div className="text-slate-600 leading-relaxed">
          <strong className="text-indigo-900">SCM Best Practice (IEEE 828 / SWEBOK):</strong> A <em>Problem Report (PR)</em> documents an identified defect or discrepancy. A <em>Change Request (CR)</em> is the formal vehicle specifying the requested modification to a Configuration Item, required justification, classification (Minor / Major / Emergency), and impact analysis for CCB deliberation.
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search CR ID, title, CI, requester..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
          >
            <option value="">All Classifications</option>
            <option value="Minor">Minor (1-Member CCB)</option>
            <option value="Major">Major (3-Step CCB)</option>
            <option value="Emergency">Emergency (Immediate Chair)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Deferred">Deferred</option>
          </select>

          {(search || statusFilter || classFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setClassFilter('');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* CR Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">CR ID</th>
                <th className="px-5 py-3.5">Title & Summary</th>
                <th className="px-5 py-3.5">Target CI</th>
                <th className="px-5 py-3.5">Classification</th>
                <th className="px-5 py-3.5">Priority</th>
                <th className="px-5 py-3.5">Requester</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    Loading change requests...
                  </td>
                </tr>
              ) : crs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No change requests found.
                  </td>
                </tr>
              ) : (
                crs.map((cr) => (
                  <tr key={cr.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-indigo-600">
                      {cr.cr_id}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{cr.title}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-sm">{cr.reason}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-slate-800 block">{cr.ci_name || 'Referenced CI'}</span>
                      <span className="font-mono text-[10px] text-slate-400">v{cr.version_before || '1.0'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={cr.classification} type="classification" />
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={cr.priority} type="priority" />
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">
                      {cr.requester_name || 'Requester'}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={cr.status} type="cr_status" />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleOpenDetail(cr)}
                        className="px-2.5 py-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 font-semibold rounded transition-colors inline-flex items-center"
                      >
                        Details <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CR Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Change Request Lifecycle — ${selectedCR?.cr_id}: ${selectedCR?.title}`}
        maxWidth="2xl"
      >
        {selectedCR && (
          <div className="space-y-5 text-xs">
            {/* Status overview cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[11px] text-slate-500 block">Status</span>
                <div className="mt-1"><StatusBadge status={selectedCR.status} type="cr_status" /></div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[11px] text-slate-500 block">Classification</span>
                <div className="mt-1"><StatusBadge status={selectedCR.classification} type="classification" /></div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[11px] text-slate-500 block">Priority</span>
                <div className="mt-1"><StatusBadge status={selectedCR.priority} type="priority" /></div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[11px] text-slate-500 block">Version Progression</span>
                <span className="font-mono font-bold text-slate-800 mt-1 block">
                  {selectedCR.version_before || 'v1.0'} →{' '}
                  <span className="text-emerald-600">{selectedCR.version_after || '(upon approval)'}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-slate-800 mb-1">Target Configuration Item</h4>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800">
                  {selectedCR.ci_name}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-1">Submitted By</h4>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                  {selectedCR.requester_name} on {new Date(selectedCR.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 mb-1">Description of Proposed Change</h4>
              <p className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 leading-relaxed">
                {selectedCR.description}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 mb-1">Justification / Business Reason</h4>
              <p className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 leading-relaxed">
                {selectedCR.reason}
              </p>
            </div>

            {selectedCR.impact_analysis && (
              <div>
                <h4 className="font-semibold text-slate-800 mb-1">Impact Analysis & Risk Assessment</h4>
                <p className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 leading-relaxed">
                  {selectedCR.impact_analysis}
                </p>
              </div>
            )}

            {/* Approval Decision Trail */}
            <div>
              <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3">
                CCB Deliberation & Approval Steps
              </h4>
              {approvalSteps.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center text-slate-500">
                  Awaiting review in CCB Approval Queue.
                </div>
              ) : (
                <div className="space-y-3">
                  {approvalSteps.map((step) => (
                    <div key={step.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 capitalize">
                          {step.step_type.replace(/_/g, ' ')}
                        </span>
                        <StatusBadge status={step.decision} />
                      </div>
                      <p className="text-slate-700 italic">"{step.reason}"</p>
                      <div className="text-[11px] text-slate-400 pt-1 flex justify-between">
                        <span>Reviewed by: {step.approver_name || 'CCB Member'}</span>
                        <span>{new Date(step.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Submit CR Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Propose Formal Change Request (CR)"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateCR} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Affected Configuration Item (CI) *
            </label>
            <select
              required
              value={formCiId}
              onChange={(e) => setFormCiId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {cis.map((ci) => (
                <option key={ci.id} value={ci.id}>
                  {ci.ci_id} — {ci.name} ({ci.current_version})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Change Request Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Enhance CI Registry filtering and validation"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">CCB Classification *</label>
              <select
                value={formClassification}
                onChange={(e) => setFormClassification(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Minor">Minor Change (v1.0 → v1.1, 1 Reviewer)</option>
                <option value="Major">Major Change (v1.0 → v2.0, 3-Step Review)</option>
                <option value="Emergency">Emergency Fix (Immediate Chairperson)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority *</label>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description of Proposed Modification *</label>
            <textarea
              required
              rows={3}
              placeholder="Detail what technical or documentation changes are being introduced..."
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Justification / Business Need *</label>
            <textarea
              required
              rows={2}
              placeholder="Explain why this change is needed and what problem it resolves..."
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Impact Analysis & Risk</label>
            <textarea
              rows={2}
              placeholder="System dependencies, regression potential, rollback strategy..."
              value={formImpact}
              onChange={(e) => setFormImpact(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit to CCB'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
