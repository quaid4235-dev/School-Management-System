// ============================================================
// api.js — talks to the real backend (server.js) instead of
// localStorage. Set API_BASE to wherever your backend runs.
//
// Vercel deployment note:
// - For static front-end deployment, set the API base to your live backend URL
// - For local dev, leave it as localhost:4000
// - You can override it at runtime via window.API_BASE before calling Api.*
// ============================================================

const API_BASE =
  window.API_BASE ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:4000/api'
    : 'https://your-backend-domain.com/api');

async function apiRequest(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    credentials: 'include',
    headers: options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    ...options
  });

  let data;
  try { data = await res.json(); } catch (e) { data = null; }

  if (!res.ok) {
    throw new Error((data && data.error) || 'Request failed.');
  }

  return data;
}

const Api = {
  // ---- Auth ----
  login: (username, password) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  me: () => apiRequest('/auth/me'),

  // ---- Applications ----
  submitApplication: (formData) =>
    apiRequest('/applications', { method: 'POST', body: formData }),
  getApplications: (params = {}) =>
    apiRequest('/applications?' + new URLSearchParams(params)),
  updateApplicationStatus: (id, status) =>
    apiRequest(`/applications/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  bulkUpdateApplications: (ids, status) =>
    apiRequest('/applications/bulk-status', { method: 'PATCH', body: JSON.stringify({ ids, status }) }),
  convertToStudent: (id, rollNumber, section) =>
    apiRequest(`/applications/${id}/convert-to-student`, { method: 'POST', body: JSON.stringify({ rollNumber, section }) }),
  deleteApplication: (id) =>
    apiRequest(`/applications/${id}`, { method: 'DELETE' }),
  exportApplicationsCsvUrl: () => API_BASE + '/applications/export.csv',

  // ---- Site content ----
  getContent: () => apiRequest('/content'),
  saveContent: (content) => apiRequest('/content', { method: 'PUT', body: JSON.stringify(content) }),

  // ---- Notices (homepage news) ----
  getNotices: (limit = 10) => apiRequest('/notices?limit=' + limit),
  createNotice: (title, body, publishedAt) =>
    apiRequest('/notices', { method: 'POST', body: JSON.stringify({ title, body, publishedAt }) }),
  deleteNotice: (id) => apiRequest(`/notices/${id}`, { method: 'DELETE' }),

  // ---- Faculty ----
  getFaculty: () => apiRequest('/faculty'),

  // ---- Admission cycles ----
  getAdmissionCycles: () => apiRequest('/admission-cycles'),

  // ---- Students / marks / fees (admin & teacher use) ----
  getStudents: (params = {}) => apiRequest('/students?' + new URLSearchParams(params)),
  getStudent: (id) => apiRequest(`/students/${id}`),
  saveMarks: (payload) => apiRequest('/marks', { method: 'POST', body: JSON.stringify(payload) }),
  getFees: (params = {}) => apiRequest('/fees?' + new URLSearchParams(params)),
  createFeeVoucher: (payload) => apiRequest('/fees', { method: 'POST', body: JSON.stringify(payload) }),
  markFeePaid: (id, paymentReference) =>
    apiRequest(`/fees/${id}/mark-paid`, { method: 'PATCH', body: JSON.stringify({ paymentReference }) })
};
