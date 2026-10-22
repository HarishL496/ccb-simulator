import React, { useState, useEffect } from 'react';
import { Bookmark, Plus, CheckCircle2, AlertTriangle, Layers, Clock, ShieldCheck, Eye } from 'lucide-react';
import { api } from '../api/client';
import { Baseline, BaselineItem } from '../types';
import { Modal } from '../components/Modal';
import { useAuth } from '../hooks/useAuth';

export const Baselines: React.FC = () => {
  const { user } = useAuth();
  const [baselines, setBaselines] = useState<Baseline[]>([]);
  const [selectedBaseline, setSelectedBaseline] = useState<Baseline | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchBaselines = async () => {
    try {
      setLoading(true);
      const res = await api.getBaselines();
      if (res.success && res.data) {
        setBaselines(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBaselines();
  }, []);

  const handleOpenDetail = async (bl: Baseline) => {
    try {
      const res = await api.getBaseline(bl.id);
      if (res.success && res.data) {
        setSelectedBaseline(res.data);
        setDetailModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateBaseline = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await api.createBaseline({
        name: formName,
        description: formDesc,
      });
      if (res.success) {
        setCreateModalOpen(false);
        setFormName('');
        setFormDesc('');
        fetchBaselines();
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
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Configuration Baselines & Releases</h2>
          <p className="text-sm text-slate-500 mt-1">
            Formal, immutable snapshots of approved configuration items for milestone verification and audit release.
          </p>
        </div>
        {user?.role !== 'viewer' && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Freeze New Baseline
          </button>
        )}
      </div>

      {/* Baseline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">
            Loading baseline snapshots...
          </div>
        ) : baselines.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">
            No baselines established yet.
          </div>
        ) : (
          baselines.map((bl) => (
            <div
              key={bl.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-100">
                    {bl.baseline_id}
                  </span>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {bl.status}
                  </span>
                </div>

                <h3 className="mt-3 text-sm font-bold text-slate-900">{bl.name}</h3>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                  {bl.description || 'Formal configuration milestone baseline.'}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Established by:</span>
                    <span className="font-medium text-slate-800">{bl.creator_name || 'Admin'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Included CIs:</span>
                    <span className="font-bold text-indigo-700">{bl.ci_count || 5} Approved CIs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date Frozen:</span>
                    <span>{new Date(bl.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleOpenDetail(bl)}
                className="mt-4 w-full py-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-indigo-600 font-semibold rounded-lg text-xs transition-colors flex items-center justify-center"
              >
                <Eye className="w-4 h-4 mr-1.5" />
                Compare Current vs Baseline
              </button>
            </div>
          ))
        )}
      </div>

      {/* Baseline Comparison Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Baseline Audit Comparison — ${selectedBaseline?.baseline_id}: ${selectedBaseline?.name}`}
        maxWidth="3xl"
      >
        {selectedBaseline && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg text-slate-700">
              <strong className="text-indigo-900">SCM Verification:</strong> This view verifies the frozen baseline items against current CI versions in the registry. Discrepancies indicate approved evolutionary upgrades made via the CCB process.
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">CI ID</th>
                    <th className="px-4 py-2.5">Configuration Item</th>
                    <th className="px-4 py-2.5">Baseline Version</th>
                    <th className="px-4 py-2.5">Current Version</th>
                    <th className="px-4 py-2.5">Drift Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedBaseline.items?.map((item) => {
                    const match = item.version_match;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-2.5 font-mono font-bold text-indigo-600">
                          {item.ci_code}
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-slate-800">
                          {item.ci_name}
                        </td>
                        <td className="px-4 py-2.5 font-mono font-bold text-slate-700">
                          {item.version_at_baseline}
                        </td>
                        <td className="px-4 py-2.5 font-mono font-bold text-indigo-700">
                          {item.current_ci_version}
                        </td>
                        <td className="px-4 py-2.5">
                          {match ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Intact
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <ShieldCheck className="w-3 h-3 mr-1" /> Upgraded
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* Freeze Baseline Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Freeze New Configuration Baseline"
      >
        <form onSubmit={handleCreateBaseline} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {formError}
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
            A new baseline will capture and snapshot all currently <strong>Approved</strong> Configuration Items at their present version numbers into an immutable record.
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Baseline Name / Milestone *</label>
            <input
              type="text"
              required
              placeholder="e.g. Release 1.0 Candidate Baseline"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Rationale, target milestone, and verification criteria..."
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
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
              {submitting ? 'Freezing...' : 'Freeze Baseline'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
