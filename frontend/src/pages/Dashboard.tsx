import React, { useEffect, useState } from 'react';
import {
  Layers,
  GitPullRequest,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { api } from '../api/client';
import { DashboardStats } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Link, useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await api.getDashboard();
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(res.error || 'Failed to load dashboard data');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
        Error loading dashboard: {error}
      </div>
    );
  }

  const { ciStats, crStats, overdueCRs, recentActivity } = data;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Configuration Management Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time status accounting, change control pipeline, and configuration item baseline tracking.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/change-requests"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-600/30 transition-colors"
          >
            + New Change Request
          </Link>
          <Link
            to="/status-accounting"
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-slate-500" />
            Status Accounting
          </Link>
        </div>
      </div>

      {/* Overdue Escalation Banner */}
      {overdueCRs && overdueCRs.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wide">
              Escalation Alert: {overdueCRs.length} Change Request(s) Overdue CCB Turnaround SLA
            </h4>
            <p className="text-xs text-amber-700 mt-0.5">
              IEEE 828 standard recommends CCB reviews meet turnaround deadlines (Emergency: 4h, Minor: 24h, Major: 48h).
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {overdueCRs.map((cr) => (
                <Link
                  key={cr.id}
                  to={`/approvals`}
                  className="inline-flex items-center px-2 py-1 bg-white border border-amber-300 text-amber-800 rounded text-xs hover:bg-amber-100/50"
                >
                  <span className="font-semibold font-mono mr-1">{cr.cr_id}</span>
                  <span className="truncate max-w-[150px] mr-1">{cr.title}</span>
                  <StatusBadge status={cr.classification} type="classification" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Row 1: CI Registry KPIs */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Configuration Item Metrics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => navigate('/ci-registry')}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Registered CIs</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900">{ciStats?.total || 0}</span>
              <span className="text-xs font-medium text-indigo-600 flex items-center">
                Registry <ArrowRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-400">Target baseline: 10 core CIs</div>
          </div>

          <div
            onClick={() => navigate('/ci-registry?status=Approved')}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-300 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Approved CIs</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-emerald-600">{ciStats?.approved || 0}</span>
              <span className="text-xs font-medium text-slate-500">
                {ciStats?.total ? Math.round(((ciStats.approved || 0) / ciStats.total) * 100) : 0}% of registry
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-400">Baselined & verified</div>
          </div>

          <div
            onClick={() => navigate('/ci-registry?status=In Progress')}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">In Progress Development</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-blue-600">{ciStats?.in_progress || 0}</span>
              <span className="text-xs font-medium text-slate-500">Active iteration</span>
            </div>
            <div className="mt-2 text-xs text-slate-400">Pending Review 3 completion</div>
          </div>

          <div
            onClick={() => navigate('/baselines')}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-purple-300 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Active Baselines</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-purple-600">{ciStats?.baselined || 0}</span>
              <span className="text-xs font-medium text-purple-600 flex items-center">
                BL-001 Frozen <ArrowRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-400">Snapshot of approved items</div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row 2: Change Request Pipeline */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Change Control Board Pipeline
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => navigate('/approvals')}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Pending Approvals</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <GitPullRequest className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-amber-600">
                {(crStats?.pending || 0) + (crStats?.under_review || 0)}
              </span>
              <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                Queue
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-400">
              {crStats?.under_review || 0} under multi-step review
            </div>
          </div>

          <div
            onClick={() => navigate('/change-requests?status=Approved')}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-300 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Approved CRs</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-emerald-600">{crStats?.approved || 0}</span>
              <span className="text-xs font-medium text-emerald-700">Atomic bumped</span>
            </div>
            <div className="mt-2 text-xs text-slate-400">CI versions incremented</div>
          </div>

          <div
            onClick={() => navigate('/change-requests?status=Rejected')}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-rose-300 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Rejected CRs</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-rose-600">{crStats?.rejected || 0}</span>
              <span className="text-xs font-medium text-rose-700">No version bump</span>
            </div>
            <div className="mt-2 text-xs text-slate-400">Documented justification</div>
          </div>

          <div
            onClick={() => navigate('/history-log')}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Lifecycle Changes</span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900">{crStats?.total || 0}</span>
              <span className="text-xs font-medium text-slate-500">Submissions</span>
            </div>
            <div className="mt-2 text-xs text-slate-400">Audit trail active</div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Activity Audit Stream */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Configuration Audit Stream</h3>
            <p className="text-xs text-slate-500">Append-only chronological record of all CCB actions</p>
          </div>
          <Link
            to="/history-log"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            View Full Audit Log <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {recentActivity && recentActivity.length > 0 ? (
            recentActivity.slice(0, 7).map((log) => (
              <div key={log.id} className="px-6 py-3.5 flex items-center justify-between text-xs hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center space-x-3 truncate">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                    {log.event_type}
                  </span>
                  <span className="font-semibold text-slate-800 truncate">{log.action}</span>
                  {log.reason && (
                    <span className="text-slate-400 italic truncate max-w-[200px]">
                      — "{log.reason}"
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4 flex-shrink-0 text-slate-400">
                  <span className="text-[11px] font-medium text-slate-600">{log.actor_name}</span>
                  <span className="text-[11px]">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">No activity logged yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};
