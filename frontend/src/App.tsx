import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CIRegistry } from './pages/CIRegistry';
import { ChangeRequests } from './pages/ChangeRequests';
import { Approvals } from './pages/Approvals';
import { VersionHistory } from './pages/VersionHistory';
import { Baselines } from './pages/Baselines';
import { StatusAccounting } from './pages/StatusAccounting';
import { AuditCenter } from './pages/AuditCenter';
import { HistoryLog } from './pages/HistoryLog';
import { UsersPage } from './pages/UsersPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SCMCenter } from './pages/SCMCenter';
import { LoginPage } from './pages/LoginPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="ci-registry" element={<CIRegistry />} />
            <Route path="change-requests" element={<ChangeRequests />} />
            <Route path="approvals" element={<Approvals />} />
            <Route path="version-history" element={<VersionHistory />} />
            <Route path="baselines" element={<Baselines />} />
            <Route path="status-accounting" element={<StatusAccounting />} />
            <Route path="audits" element={<AuditCenter />} />
            <Route path="history-log" element={<HistoryLog />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="scm-center" element={<SCMCenter />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
