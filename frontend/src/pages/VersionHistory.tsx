import React, { useState, useEffect } from 'react';
import { History, GitCommit, Layers, ArrowRight, User } from 'lucide-react';
import { api } from '../api/client';
import { CIVersionHistory, ConfigurationItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const VersionHistory: React.FC = () => {
  const [cis, setCis] = useState<ConfigurationItem[]>([]);
  const [selectedCiId, setSelectedCiId] = useState<string>('');
  const [history, setHistory] = useState<CIVersionHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCIs = async () => {
      try {
        setLoading(true);
        const res = await api.getCIs();
        if (res.success && res.data) {
          setCis(res.data);
          if (res.data.length > 0) {
            setSelectedCiId(res.data[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCIs();
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedCiId) return;
      try {
        const res = await api.getCI(selectedCiId);
        if (res.success && res.data) {
          setHistory(res.data.version_history || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchHistory();
  }, [selectedCiId]);

  const selectedCI = cis.find((c) => c.id === selectedCiId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Configuration Item Version Lineage</h2>
        <p className="text-sm text-slate-500 mt-1">
          Atomic version progression audit trail governed strictly by CCB approvals (Minor: v1.0 → v1.1, Major: v1.0 → v2.0).
        </p>
      </div>

      {/* CI Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <label className="font-semibold text-slate-700">Select Configuration Item:</label>
          <select
            value={selectedCiId}
            onChange={(e) => setSelectedCiId(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
          >
            {cis.map((c) => (
              <option key={c.id} value={c.id}>
                {c.ci_id} — {c.name} (Current: {c.current_version})
              </option>
            ))}
          </select>
        </div>

        {selectedCI && (
          <div className="flex items-center space-x-3 text-slate-600">
            <span>Owner: <strong className="text-slate-800">{selectedCI.owner_name}</strong></span>
            <span>•</span>
            <StatusBadge status={selectedCI.lifecycle_status} type="lifecycle" />
            <StatusBadge status={selectedCI.approval_status} type="approval" />
          </div>
        )}
      </div>

      {/* Version Lineage Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center">
          <GitCommit className="w-4 h-4 mr-2 text-indigo-600" />
          Evolution Timeline for {selectedCI?.name} ({selectedCI?.ci_id})
        </h3>

        {history.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No version history recorded yet.
          </div>
        ) : (
          <div className="relative border-l-2 border-indigo-200 ml-4 space-y-6 py-2">
            {history.map((v, idx) => (
              <div key={v.id} className="relative pl-8 text-xs">
                {/* Node icon */}
                <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-indigo-600 shadow" />

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-sm bg-indigo-600 text-white px-2.5 py-0.5 rounded shadow-sm">
                        {v.version}
                      </span>
                      {idx === 0 && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          LATEST ACTIVE
                        </span>
                      )}
                      <StatusBadge status={v.lifecycle_status} type="lifecycle" />
                      <StatusBadge status={v.approval_status} type="approval" />
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(v.created_at).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-slate-800 font-medium text-xs leading-relaxed">
                    {v.change_summary}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
                    <div className="flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Author / Modifier: <strong>{v.changer_name || 'System'}</strong></span>
                    </div>
                    {v.cr_code && (
                      <span className="font-mono text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        Authorized via {v.cr_code}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
