import React, { useState, useEffect } from 'react';
import { Bell, LogOut, ChevronDown, UserCheck, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';

const DEMO_USERS = [
  { label: 'Admin (Harish L)', username: 'admin', password: 'Admin@123', role: 'admin' },
  { label: 'CCB Chairperson', username: 'chairperson', password: 'Chair@123', role: 'chairperson' },
  { label: 'CCB Tech Reviewer', username: 'ccb_tech', password: 'CCB1@123', role: 'ccb_member' },
  { label: 'CCB Quality Reviewer', username: 'ccb_quality', password: 'CCB2@123', role: 'ccb_member' },
  { label: 'Developer (Member A)', username: 'member_a', password: 'DevA@123', role: 'developer' },
  { label: 'Developer (Member B)', username: 'member_b', password: 'DevB@123', role: 'developer' },
  { label: 'Viewer / Auditor', username: 'viewer', password: 'Viewer@123', role: 'viewer' },
];

export const Header: React.FC = () => {
  const { user, logout, switchDemoUser } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.getNotifications();
        if (res.success && res.data) {
          setUnreadCount(res.data.unread_count || 0);
        }
      } catch (err) {}
    };
    if (user) {
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleSelectDemoUser = async (u: typeof DEMO_USERS[0]) => {
    setShowDemoMenu(false);
    try {
      await switchDemoUser(u.username, u.password);
    } catch (err: any) {
      alert(`Switch failed: ${err.message}`);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10">
      <div className="flex items-center space-x-4">
        <h1 className="text-lg font-bold text-slate-800 tracking-tight">
          Software Configuration Management
        </h1>
        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          Course ISWE403L
        </span>
      </div>

      <div className="flex items-center space-x-3">
        {/* Quick Demo Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowDemoMenu(!showDemoMenu)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors shadow-sm"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden md:inline">Switch Role:</span>
            <span className="font-semibold text-slate-900 capitalize">{user?.role?.replace('_', ' ')}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showDemoMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Demo Personas (Review 3)
              </div>
              {DEMO_USERS.map((u) => (
                <button
                  key={u.username}
                  onClick={() => handleSelectDemoUser(u)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    user?.username === u.username ? 'bg-indigo-50 font-semibold text-indigo-700' : 'text-slate-700'
                  }`}
                >
                  <div className="truncate">
                    <div>{u.label}</div>
                    <div className="text-[10px] text-slate-400 capitalize">{u.role}</div>
                  </div>
                  {user?.username === u.username && (
                    <UserCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Icon */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          title="Log out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
