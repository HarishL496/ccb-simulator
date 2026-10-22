const API_BASE = '/api';

export function getToken(): string | null {
  return localStorage.getItem('ccb_token');
}

export function setToken(token: string): void {
  localStorage.setItem('ccb_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('ccb_token');
  localStorage.removeItem('ccb_user');
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; total?: number; [key: string]: any }> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(json.error || json.message || `Request failed with status ${response.status}`);
  }

  return json;
}

export const api = {
  // Auth
  login: (credentials: { username: string; password: string }) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => apiRequest('/auth/me'),

  // Users
  getUsers: () => apiRequest('/users'),
  createUser: (data: any) => apiRequest('/users', { method: 'POST', body: JSON.stringify(data) }),

  // Dashboard
  getDashboard: () => apiRequest('/dashboard'),

  // CI Registry
  getCIs: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/ci${qs ? `?${qs}` : ''}`);
  },
  getCI: (id: string) => apiRequest(`/ci/${id}`),
  createCI: (data: any) => apiRequest('/ci', { method: 'POST', body: JSON.stringify(data) }),
  updateCI: (id: string, data: any) => apiRequest(`/ci/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Change Requests
  getCRs: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/cr${qs ? `?${qs}` : ''}`);
  },
  getCR: (id: string) => apiRequest(`/cr/${id}`),
  createCR: (data: any) => apiRequest('/cr', { method: 'POST', body: JSON.stringify(data) }),

  // CCB Approvals
  getApprovalQueue: () => apiRequest('/approvals/queue'),
  decideCR: (crId: string, data: { decision: string; reason: string; step_type: string }) =>
    apiRequest(`/approvals/${crId}/decide`, { method: 'POST', body: JSON.stringify(data) }),

  // Baselines
  getBaselines: () => apiRequest('/baselines'),
  getBaseline: (id: string) => apiRequest(`/baselines/${id}`),
  createBaseline: (data: { name: string; description?: string }) =>
    apiRequest('/baselines', { method: 'POST', body: JSON.stringify(data) }),

  // Status Accounting
  getStatusReport: () => apiRequest('/status'),

  // FCA / PCA Audits
  getAudits: () => apiRequest('/audit'),
  getAudit: (id: string) => apiRequest(`/audit/${id}`),
  createAudit: (data: { audit_type: 'FCA' | 'PCA'; title: string; description?: string }) =>
    apiRequest('/audit', { method: 'POST', body: JSON.stringify(data) }),
  updateAuditItem: (auditId: string, itemId: string, data: { result: string; remarks?: string }) =>
    apiRequest(`/audit/${auditId}/item/${itemId}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // History & Notifications
  getHistory: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/history${qs ? `?${qs}` : ''}`);
  },
  getNotifications: () => apiRequest('/notifications'),
  markNotificationRead: (id: string) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => apiRequest('/notifications/read-all', { method: 'PATCH' }),
};
