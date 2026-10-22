import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, ShieldAlert, ArrowRight, User } from 'lucide-react';
import { api } from '../api/client';
import { EventLog } from '../types';

export const HistoryLog: React.FC = () => {
  const [events, setEvents] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (eventTypeFilter) params.event_type = eventTypeFilter;
      if (search) params.search = search;

      const res = await api.getHistory(params);
      if (res.success && res.data) {
        setEvents(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [eventTypeFilter, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Immutable Change History Log</h2>
        <p className="text-sm text-slate-500 mt-1">
          Chronological, append-only audit trail capturing every state change, registration, decision, and baseline freeze.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search action, actor, target ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-700"
          >
            <option value="">All Event Types</option>
            <option value="CI_CREATED">CI Registered</option>
            <option value="CR_SUBMITTED">CR Submitted</option>
            <option value="CR_APPROVED">CR Approved</option>
            <option value="CR_REJECTED">CR Rejected</option>
            <option value="BASELINE_CREATED">Baseline Frozen</option>
            <option value="AUDIT_STARTED">Audit Started</option>
          </select>
        </div>
      </div>

      {/* History Stream */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100 text-xs">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading audit history stream...</div>
          ) : events.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No events found.</div>
          ) : (
            events.map((e) => (
              <div key={e.id} className="p-4 hover:bg-slate-50/70 transition-colors space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {e.event_type}
                    </span>
                    {e.target_type && (
                      <span className="font-semibold text-slate-500 text-[11px]">
                        [{e.target_type}: {e.target_name || e.target_id}]
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 text-[11px] font-mono">
                    {new Date(e.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="font-medium text-slate-900">{e.action}</div>

                {e.reason && (
                  <div className="text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 text-[11px]">
                    <strong className="text-slate-500">Documented Reason:</strong> {e.reason}
                  </div>
                )}

                <div className="flex items-center space-x-2 text-[11px] text-slate-400 pt-1">
                  <User className="w-3.5 h-3.5" />
                  <span>Actor: <strong className="text-slate-700">{e.actor_name}</strong> ({e.actor_role})</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
