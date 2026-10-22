import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  GitPullRequest,
  CheckSquare,
  History,
  Bookmark,
  BarChart3,
  ClipboardCheck,
  FileText,
  Users,
  Bell,
  Github,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'CI Registry', href: '/ci-registry', icon: Layers },
    { name: 'Change Requests', href: '/change-requests', icon: GitPullRequest },
    { name: 'CCB Approvals', href: '/approvals', icon: CheckSquare, badge: user?.role !== 'developer' && user?.role !== 'viewer' },
    { name: 'Version History', href: '/version-history', icon: History },
    { name: 'Baselines', href: '/baselines', icon: Bookmark },
    { name: 'Status Accounting', href: '/status-accounting', icon: BarChart3 },
    { name: 'FCA / PCA Audits', href: '/audits', icon: ClipboardCheck },
    { name: 'Change History', href: '/history-log', icon: FileText },
    { name: 'Users & Roles', href: '/users', icon: Users, adminOnly: true },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'SCM Centre', href: '/scm-center', icon: Github },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 min-h-screen text-slate-300">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/30">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-wide">CCB Control Center</div>
            <div className="text-[10px] text-indigo-400 font-medium uppercase tracking-wider">SCM ISWE403L</div>
          </div>
        </div>
      </div>

      {/* Role Pill Banner */}
      <div className="px-4 py-3 mx-4 my-3 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
        <div className="truncate">
          <div className="text-xs font-semibold text-white truncate">{user?.full_name || 'Guest'}</div>
          <div className="text-[11px] text-slate-400 capitalize">{user?.role?.replace('_', ' ') || 'Not logged in'}</div>
        </div>
        <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          {user?.role === 'chairperson' ? 'Chair' : user?.role || 'user'}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {navigation.map((item) => {
          if (item.adminOnly && user?.role !== 'admin') return null;

          return (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <item.icon className="w-4 h-4 mr-3 flex-shrink-0" />
              <span className="flex-1 truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* SCM Standards footer */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 bg-slate-950/30">
        <div className="flex items-center justify-between">
          <span>IEEE 828 / SWEBOK v4</span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
        </div>
        <div className="mt-1 text-slate-400 font-mono text-[10px]">Review 3 Simulation</div>
      </div>
    </aside>
  );
};
