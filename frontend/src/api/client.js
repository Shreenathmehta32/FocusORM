const API_BASE = '/api';

async function fetchAPI(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`FocusORM API error [${endpoint}]:`, err);
    return null;
  }
}

export const api = {
  getStatus: () => fetchAPI('/status'),
  getToday: () => fetchAPI('/today'),
  getSessions: (date) => fetchAPI(`/sessions?target_date=${date || new Date().toISOString().split('T')[0]}`),
  getApplications: (date) => fetchAPI(`/applications?target_date=${date || new Date().toISOString().split('T')[0]}`),
  getWebsites: (date) => fetchAPI(`/websites?target_date=${date || new Date().toISOString().split('T')[0]}`),
  getDailyAnalytics: (date) => fetchAPI(`/analytics/daily?target_date=${date || new Date().toISOString().split('T')[0]}`),
  getWeeklyAnalytics: () => fetchAPI('/analytics/weekly'),
  getHourly: (date) => fetchAPI(`/analytics/hourly?target_date=${date || new Date().toISOString().split('T')[0]}`),
  getFocus: (date) => fetchAPI(`/focus?target_date=${date || new Date().toISOString().split('T')[0]}`),
  getSettings: () => fetchAPI('/settings'),
  updateSettings: (data) => fetchAPI('/settings', { method: 'POST', body: JSON.stringify(data) }),
  getRules: () => fetchAPI('/rules'),
  createRule: (rule) => fetchAPI('/rules', { method: 'POST', body: JSON.stringify(rule) }),
  getPrivacy: () => fetchAPI('/privacy'),
  pauseTracking: () => fetchAPI('/privacy/pause', { method: 'POST' }),
  resumeTracking: () => fetchAPI('/privacy/resume', { method: 'POST' }),
  deleteData: (date) => fetchAPI(`/privacy/data${date ? `?target_date=${date}` : ''}`, { method: 'DELETE' }),
};
