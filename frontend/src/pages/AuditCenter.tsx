import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Plus, CheckCircle2, XCircle, AlertCircle, Clock, ShieldCheck, Printer } from 'lucide-react';
import { api } from '../api/client';
import { AuditChecklist, AuditChecklistItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../hooks/useAuth';

export const AuditCenter: React.FC = () => {
  const { user } = useAuth();
  const [audits, setAudits] = useState<AuditChecklist[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<AuditChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form
  const [auditType, setAuditType] = useState<'FCA' | 'PCA'>('FCA');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAudits = async () => {
    try {
      setLoading(true);
      const res = await api.getAudits();
      if (res.success && res.data) {
        setAudits(res.data);
        if (res.data.length > 0) {
          // fetch full items for the first audit
          const first = await api.getAudit(res.data[0].id);
          if (first.success && first.data) {
            setSelectedAudit(first.data);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, []);

  const handleSelectAudit = async (id: string) => {
    try {
      const res = await api.getAudit(id);
      if (res.success && res.data) {
        setSelectedAudit(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateItem = async (itemId: string, newResult: string) => {
    if (!selectedAudit) return;
    try {
      const res = await api.updateAuditItem(selectedAudit.id, itemId, {
        result: newResult,
        remarks: `Updated by ${user?.full_name || 'Auditor'}`,
      });
      if (res.success) {
        // Refresh active audit
        handleSelectAudit(selectedAudit.id);
      }
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const handleCreateAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.createAudit({
        audit_type: auditType,
        title,
        description,
      });
      if (res.success) {
        setCreateModalOpen(false);
        setTitle('');
        setDescription('');
        fetchAudits();
      }
    } catch (err: any) {
      alert(`Creation failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Configuration Audits (FCA / PCA)</h2>
          <p className="text-sm text-slate-500 mt-1">
            Functional Configuration Audit (FCA) & Physical Configuration Audit (PCA) per IEEE 828 and SWEBOK SCM standards.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center shadow-sm"
          >
            <Printer className="w-4 h-4 mr-1.5 text-slate-500" />
            Print Audit Report
          </button>
          {user?.role !== 'viewer' && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Audit Session
            </button>
          )}
        </div>
      </div>

      {/* Audit Theory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <h4 className="font-bold text-indigo-700 flex items-center mb-1">
            <ClipboardCheck className="w-4 h-4 mr-1.5" />
            Functional Configuration Audit (FCA)
          </h4>
          <p className="text-slate-600 leading-relaxed">
            Verifies that the actual performance and functionality of each configuration item complies with its approved requirements specifications, test results, and acceptance criteria.
          </p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <h4 className="font-bold text-purple-700 flex items-center mb-1">
            <ShieldCheck className="w-4 h-4 mr-1.5" />
            Physical Configuration Audit (PCA)
          </h4>
          <p className="text-slate-600 leading-relaxed">
            Verifies that the physical build artifacts, source tree, database schema, and documentation accurately mirror the authorized baseline release and version register.
          </p>
        </div>
      </div>

      {/* Main Audit Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Audit Sessions List (Left) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Audit Checklists</h3>
          {loading ? (
            <div className="text-slate-400 text-xs py-6 text-center">Loading audits...</div>
          ) : audits.length === 0 ? (
            <div className="text-slate-400 text-xs py-6 text-center">No audits found. Click "New Audit Session" to start one.</div>
          ) : (
            audits.map((a) => (
              <div
                key={a.id}
                onClick={() => handleSelectAudit(a.id)}
                className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                  selectedAudit?.id === a.id
                    ? 'border-indigo-500 bg-indigo-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{a.audit_type} Audit</span>
                  <StatusBadge status={a.status} />
                </div>
                <div className="font-semibold text-slate-900 mt-1 truncate">{a.title}</div>
                <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                  <span>{new Date(a.created_at).toLocaleDateString()}</span>
                  <span className="font-semibold text-indigo-600">{a.overall_result || 'In Progress'}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Audit Checklist Table (Right 2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          {selectedAudit ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-indigo-700 text-sm">{selectedAudit.audit_type} Audit Checklist</span>
                    <span className="font-mono text-xs text-slate-400">ID: {selectedAudit.id.slice(0, 8)}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{selectedAudit.title}</h3>
                  <p className="text-xs text-slate-500">{selectedAudit.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-600">Audit Status:</span>
                  <StatusBadge status={selectedAudit.overall_result || selectedAudit.status} />
                </div>
              </div>

              {/* Checklist Items */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Verification Check Items</h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden text-xs">
                  {selectedAudit.items?.map((item) => (
                    <div key={item.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start space-x-3">
                        <span className="font-bold font-mono text-slate-400 text-xs mt-0.5">#{item.item_number}</span>
                        <div>
                          <div className="font-semibold text-slate-800">{item.check_description}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Category: <span className="font-medium text-slate-600">{item.category}</span>
                            {item.remarks && <span className="ml-2 italic">— {item.remarks}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {user?.role !== 'viewer' ? (
                          <select
                            value={item.result}
                            onChange={(e) => handleUpdateItem(item.id, e.target.value)}
                            className={`px-2.5 py-1 text-xs rounded-lg font-bold border transition-colors ${
                              item.result === 'Yes'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : item.result === 'No'
                                ? 'bg-rose-50 text-rose-700 border-rose-300'
                                : 'bg-slate-50 text-slate-700 border-slate-300'
                            }`}
                          >
                            <option value="Yes">PASS (Yes)</option>
                            <option value="No">FAIL (No)</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Pending">Pending</option>
                          </select>
                        ) : (
                          <StatusBadge status={item.result} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Select an audit session to view the checklist verification matrix.
            </div>
          )}
        </div>
      </div>

      {/* New Audit Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Initialize SCM Audit Session"
      >
        <form onSubmit={handleCreateAudit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Audit Type *</label>
            <select
              value={auditType}
              onChange={(e) => setAuditType(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-semibold"
            >
              <option value="FCA">Functional Configuration Audit (FCA)</option>
              <option value="PCA">Physical Configuration Audit (PCA)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Audit Session Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Review 3 Final Baseline Verification Audit"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Scope, verification criteria, and target configuration items..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              {submitting ? 'Generating...' : 'Start Audit'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
