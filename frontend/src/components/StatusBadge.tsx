import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'lifecycle' | 'approval' | 'classification' | 'priority' | 'cr_status' | 'audit_result';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type }) => {
  let colorStyles = 'bg-slate-100 text-slate-700 border-slate-200';

  const s = status.toLowerCase();

  if (s === 'approved' || s === 'complete' || s === 'pass' || s === 'yes' || s === 'active') {
    colorStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (s === 'in progress' || s === 'under review') {
    colorStyles = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (s === 'pending') {
    colorStyles = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (s === 'rejected' || s === 'fail' || s === 'no' || s === 'critical') {
    colorStyles = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (s === 'major' || s === 'high' || s === 'needs review') {
    colorStyles = 'bg-purple-50 text-purple-700 border-purple-200';
  } else if (s === 'emergency') {
    colorStyles = 'bg-red-50 text-red-700 border-red-300 font-semibold animate-pulse';
  } else if (s === 'minor' || s === 'low') {
    colorStyles = 'bg-slate-100 text-slate-700 border-slate-200';
  } else if (s === 'deferred') {
    colorStyles = 'bg-orange-50 text-orange-700 border-orange-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorStyles}`}
    >
      {status}
    </span>
  );
};
