import React, { useState, useEffect } from 'react';
import { Users, Plus, Shield, UserCheck, Key } from 'lucide-react';
import { api } from '../api/client';
import { User, UserRole } from '../types';
import { Modal } from '../components/Modal';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('developer');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getUsers();
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.createUser({
        username,
        email,
        full_name: fullName,
        password,
        role,
      });
      if (res.success) {
        setCreateModalOpen(false);
        setUsername('');
        setEmail('');
        setFullName('');
        setPassword('');
        fetchUsers();
      }
    } catch (err: any) {
      alert(`User creation failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Users & Role-Based Access Control (RBAC)</h2>
          <p className="text-sm text-slate-500 mt-1">
            Enterprise identity management enforcing strict separation of duties between Developers and CCB Approvers.
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add User Account
        </button>
      </div>

      {/* Demo Credentials Quick Reference */}
      <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm text-xs">
        <div className="flex items-center space-x-2 text-indigo-400 font-bold mb-3">
          <Key className="w-4 h-4" />
          <span>Demo Authentication Credentials (Review 3 Evaluation)</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
            <span className="text-slate-400 block">Administrator</span>
            <span className="font-mono text-white font-semibold">admin / Admin@123</span>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
            <span className="text-slate-400 block">CCB Chairperson</span>
            <span className="font-mono text-white font-semibold">chairperson / Chair@123</span>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
            <span className="text-slate-400 block">CCB Tech Reviewer</span>
            <span className="font-mono text-white font-semibold">ccb_tech / CCB1@123</span>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
            <span className="text-slate-400 block">CCB Quality Reviewer</span>
            <span className="font-mono text-white font-semibold">ccb_quality / CCB2@123</span>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
            <span className="text-slate-400 block">Developer (Member A)</span>
            <span className="font-mono text-white font-semibold">member_a / DevA@123</span>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
            <span className="text-slate-400 block">Developer (Member B)</span>
            <span className="font-mono text-white font-semibold">member_b / DevB@123</span>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
            <span className="text-slate-400 block">Developer (Member C)</span>
            <span className="font-mono text-white font-semibold">member_c / DevC@123</span>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
            <span className="text-slate-400 block">Auditor / Viewer</span>
            <span className="font-mono text-white font-semibold">viewer / Viewer@123</span>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase">
              <tr>
                <th className="px-5 py-3.5">Full Name</th>
                <th className="px-5 py-3.5">Username</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5">Assigned Role</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-900">{u.full_name}</td>
                  <td className="px-5 py-3.5 font-mono text-indigo-600">{u.username}</td>
                  <td className="px-5 py-3.5 text-slate-600">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {u.role.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Register New User Account"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Username *</label>
            <input
              type="text"
              required
              placeholder="e.g. jdoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email *</label>
            <input
              type="email"
              required
              placeholder="e.g. jdoe@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Password *</label>
            <input
              type="password"
              required
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Role *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 capitalize"
            >
              <option value="developer">Developer (Submits CRs, modifies CIs)</option>
              <option value="ccb_member">CCB Member (Technical / Quality Reviewer)</option>
              <option value="chairperson">Chairperson (Executive CCB Sign-off & Emergencies)</option>
              <option value="admin">Admin (Full System Privilege)</option>
              <option value="viewer">Viewer (Read-only Auditor)</option>
            </select>
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
              {submitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
