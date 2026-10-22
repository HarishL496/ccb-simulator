import React, { useState, useEffect } from 'react';
import { Layers, Plus, Search, Filter, History, GitPullRequest, Eye, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import { ConfigurationItem, CIVersionHistory } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

const CI_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'requirements_document', label: 'Requirements Document' },
  { value: 'design_document', label: 'Design Document' },
  { value: 'source_code', label: 'Source Code' },
  { value: 'database_schema', label: 'Database Schema' },
  { value: 'test_cases', label: 'Test Cases' },
  { value: 'user_manual', label: 'User Manual' },
  { value: 'project_report', label: 'Project Report' },
  { value: 'version_history', label: 'Version History' },
  { value: 'other', label: 'Other' },
];

export const CIRegistry: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ConfigurationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCI, setSelectedCI] = useState<ConfigurationItem | null>(null);
  const [ciVersions, setCiVersions] = useState<CIVersionHistory[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  // New CI Form
  const [formCiId, setFormCiId] = useState('');
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('source_code');
  const [formDesc, setFormDesc] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCIs = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.lifecycle_status = statusFilter;

      const res = await api.getCIs(params);
      if (res.success && res.data) {
        setItems(res.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCIs();
  }, [search, typeFilter, statusFilter]);

  const handleOpenDetail = async (ci: ConfigurationItem) => {
    setSelectedCI(ci);
    setDetailModalOpen(true);
    setLoadingVersions(true);
    try {
      const res = await api.getCI(ci.id);
      if (res.success && res.data) {
        setSelectedCI(res.data);
        setCiVersions(res.data.version_history || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleCreateCI = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    try {
      const res = await api.createCI({
        ci_id: formCiId,
        name: formName,
        type: formType,
        description: formDesc,
        owner_id: user?.id,
      });
      if (res.success) {
        setCreateModalOpen(false);
        setFormCiId('');
        setFormName('');
        setFormDesc('');
        fetchCIs();
      }
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Configuration Item Registry</h2>
          <p className="text-sm text-slate-500 mt-1">
            Authoritative master repository of all 10 identified software configuration items under SCM control.
          </p>
        </div>
        {user?.role !== 'viewer' && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Register New CI
          </button>
        )}
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search CI ID, name, owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
          >
            {CI_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
          >
            <option value="">All Lifecycle Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Complete">Complete</option>
          </select>

          {(search || typeFilter || statusFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setTypeFilter('');
                setStatusFilter('');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* CI Registry Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">CI ID</th>
                <th className="px-5 py-3.5">Configuration Item Name</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Owner</th>
                <th className="px-5 py-3.5">Current Version</th>
                <th className="px-5 py-3.5">Lifecycle Status</th>
                <th className="px-5 py-3.5">Approval Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    Loading configuration items...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No configuration items match the selected criteria.
                  </td>
                </tr>
              ) : (
                items.map((ci) => (
                  <tr key={ci.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-indigo-600">
                      {ci.ci_id}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{ci.name}</div>
                      {ci.description && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{ci.description}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 capitalize">
                      {ci.type.replace(/_/g, ' ')}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium">
                      {ci.owner_name || 'Assigned Member'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-semibold text-slate-800">
                        {ci.current_version}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={ci.lifecycle_status} type="lifecycle" />
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={ci.approval_status} type="approval" />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenDetail(ci)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Details & Version History"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {user?.role !== 'viewer' && (
                          <Link
                            to={`/change-requests?new=true&ci_id=${ci.id}`}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Propose Change Request"
                          >
                            <GitPullRequest className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CI Detail & Version History Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`CI Details — ${selectedCI?.ci_id}: ${selectedCI?.name}`}
        maxWidth="2xl"
      >
        {selectedCI && (
          <div className="space-y-6 text-xs">
            {/* Meta summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[11px] text-slate-500 block">Current Version</span>
                <span className="text-base font-bold font-mono text-indigo-600">{selectedCI.current_version}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[11px] text-slate-500 block">Lifecycle Status</span>
                <div className="mt-1"><StatusBadge status={selectedCI.lifecycle_status} type="lifecycle" /></div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[11px] text-slate-500 block">Approval Status</span>
                <div className="mt-1"><StatusBadge status={selectedCI.approval_status} type="approval" /></div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[11px] text-slate-500 block">Responsible Owner</span>
                <span className="font-semibold text-slate-800 block truncate mt-1">{selectedCI.owner_name}</span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 mb-1">Description</h4>
              <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {selectedCI.description || 'No description provided.'}
              </p>
            </div>

            {/* Version History Tab */}
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                <h4 className="font-bold text-slate-900 flex items-center">
                  <History className="w-4 h-4 mr-1.5 text-indigo-600" />
                  Version History & CCB Increment Trail
                </h4>
                <span className="text-[11px] text-slate-500">{ciVersions.length} Recorded Version(s)</span>
              </div>

              {loadingVersions ? (
                <div className="text-center py-6 text-slate-400">Loading version lineage...</div>
              ) : ciVersions.length === 0 ? (
                <div className="text-slate-400 text-center py-4">Initial v1.0 release.</div>
              ) : (
                <div className="relative border-l-2 border-indigo-200 ml-3 space-y-4 py-2">
                  {ciVersions.map((v) => (
                    <div key={v.id} className="relative pl-6">
                      <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-indigo-600 border-2 border-white ring-2 ring-indigo-200" />
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {v.version}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(v.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="font-medium text-slate-800">{v.change_summary}</p>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span>Updated by: <strong className="text-slate-700">{v.changer_name || 'System'}</strong></span>
                          {v.cr_code && <span className="font-mono font-semibold text-indigo-600">Via {v.cr_code}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Register New CI Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Register New Software Configuration Item"
      >
        <form onSubmit={handleCreateCI} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Configuration Item Identifier (CI-ID) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CI-011 or CI-REQ-02"
              value={formCiId}
              onChange={(e) => setFormCiId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <span className="text-[11px] text-slate-400 mt-0.5 block">Format: CI-XXX</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">CI Name / Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. System Security Specification"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">CI Category / Type *</label>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="requirements_document">Requirements Document</option>
              <option value="design_document">Design Document</option>
              <option value="source_code">Source Code</option>
              <option value="database_schema">Database Schema</option>
              <option value="test_cases">Test Cases</option>
              <option value="user_manual">User Manual</option>
              <option value="project_report">Project Report</option>
              <option value="version_history">Version History</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Scope and purpose of this configuration item..."
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
              disabled={formSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-sm disabled:opacity-50"
            >
              {formSubmitting ? 'Registering...' : 'Register CI'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
