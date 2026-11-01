const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `API error: ${res.status}`);
  }
  
  return res.json();
}

export const api = {
  // Health
  health: () => request('/health'),
  
  // Plans
  getPlans: () => request('/plans'),
  getPlansAdmin: () => request('/plans/admin'),
  createPlan: (plan: any) => request('/plans', { method: 'POST', body: JSON.stringify(plan) }),
  updatePlan: (id: string, plan: any) => request(`/plans/${id}`, { method: 'PUT', body: JSON.stringify(plan) }),
  deletePlan: (id: string) => request(`/plans/${id}`, { method: 'DELETE' }),
  
  // Flags
  getFlags: () => request('/flags'),
  getFlagsAdmin: () => request('/flags/admin'),
  upsertFlag: (flag: any) => request('/flags', { method: 'POST', body: JSON.stringify(flag) }),
  deleteFlag: (key: string) => request(`/flags/${key}`, { method: 'DELETE' }),
  
  // Sounds
  getSounds: () => request('/sounds'),
  getSoundsAdmin: () => request('/sounds/admin'),
  upsertSound: (sound: any) => request('/sounds', { method: 'POST', body: JSON.stringify(sound) }),
  deleteSound: (id: string) => request(`/sounds/${id}`, { method: 'DELETE' }),
  
  // Campaigns
  getCampaigns: () => request('/campaigns'),
  getCampaignsAdmin: () => request('/campaigns/admin'),
  upsertCampaign: (campaign: any) => request('/campaigns', { method: 'POST', body: JSON.stringify(campaign) }),
  deleteCampaign: (id: string) => request(`/campaigns/${id}`, { method: 'DELETE' }),
  
  // Admin
  getUsers: () => request('/admin/users'),
  updateUser: (id: string, updates: any) => request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  getAuditLog: () => request('/admin/audit'),
  logAction: (data: any) => request('/admin/audit', { method: 'POST', body: JSON.stringify(data) }),
};
