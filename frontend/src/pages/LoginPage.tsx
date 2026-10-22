import React, { useState } from 'react';
import { Layers, Shield, Key, ArrowRight, UserCheck, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const DEMO_PRESETS = [
  { label: 'Admin (Harish L)', username: 'admin', password: 'Admin@123', role: 'admin', badge: 'bg-indigo-500/20 text-indigo-300' },
  { label: 'CCB Chairperson', username: 'chairperson', password: 'Chair@123', role: 'chairperson', badge: 'bg-purple-500/20 text-purple-300' },
  { label: 'CCB Tech Reviewer', username: 'ccb_tech', password: 'CCB1@123', role: 'ccb_member', badge: 'bg-blue-500/20 text-blue-300' },
  { label: 'CCB Quality Reviewer', username: 'ccb_quality', password: 'CCB2@123', role: 'ccb_member', badge: 'bg-cyan-500/20 text-cyan-300' },
  { label: 'Developer (Member A)', username: 'member_a', password: 'DevA@123', role: 'developer', badge: 'bg-emerald-500/20 text-emerald-300' },
  { label: 'Developer (Member B)', username: 'member_b', password: 'DevB@123', role: 'developer', badge: 'bg-teal-500/20 text-teal-300' },
  { label: 'Developer (Member C)', username: 'member_c', password: 'DevC@123', role: 'developer', badge: 'bg-green-500/20 text-green-300' },
  { label: 'Auditor / Viewer', username: 'viewer', password: 'Viewer@123', role: 'viewer', badge: 'bg-slate-500/20 text-slate-300' },
];

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (u: string, p: string) => {
    setLoading(true);
    setError(null);
    try {
      await login(u, p);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Left Side: Brand & Quick Demo Logins */}
        <div className="p-8 bg-slate-950/70 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-600/40">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-wide">CCB Control Center</h2>
                <span className="text-[11px] font-medium text-indigo-400">ISWE403L — SCM Review 3</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Change Request Approval Board (CCB) Simulator with Configuration Item Registry and SWEBOK SCM verification.
            </p>

            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                <Key className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                1-Click Demo Evaluation Sign-in
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {DEMO_PRESETS.map((p) => (
                  <button
                    key={p.username}
                    type="button"
                    onClick={() => handleQuickLogin(p.username, p.password)}
                    className="p-2 text-left rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/60 transition-all text-slate-200"
                  >
                    <div className="font-semibold text-[11px] truncate">{p.label}</div>
                    <span className={`inline-block text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded mt-1 ${p.badge}`}>
                      {p.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500">
            Compliant with IEEE 828 SCM Standard & SWEBOK Knowledge Area
          </div>
        </div>

        {/* Right Side: Manual Credentials Form */}
        <div className="p-8 flex flex-col justify-center">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white tracking-tight">Enterprise Sign-In</h3>
            <p className="text-xs text-slate-400 mt-1">Authenticate into your authorized configuration session</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md shadow-indigo-600/30 transition-colors flex items-center justify-center disabled:opacity-50 mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
