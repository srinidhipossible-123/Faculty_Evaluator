const BASE_URL = 'https://faculty-evaluator.onrender.com';

export function getToken() {
  return localStorage.getItem('token');
}

export async function request(endpoint, options = {}) {
  const url = BASE_URL ? `${BASE_URL}${endpoint}` : endpoint;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (err) {
    throw new Error(err.message || 'Network error. Is the backend running at ' + BASE_URL + '?');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || res.statusText || 'Request failed');
  return data;
}

export const api = {
  auth: {
    login: (email, password) => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (body) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    me: () => request('/api/auth/me'),
  },
  config: {
    get: () => request('/api/config'),
    update: (body) => request('/api/config', { method: 'PUT', body: JSON.stringify(body) }),
  },
  users: {
    list: () => request('/api/users'),
    participants: () => request('/api/users/participants'),
    create: (body) => request('/api/users', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    resetAttempt: (id) => request(`/api/users/${id}/reset-attempt`, { method: 'PATCH' }),
  },
  quiz: {
    list: () => request('/api/quiz'),
    create: (body) => request('/api/quiz', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/api/quiz/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => request(`/api/quiz/${id}`, { method: 'DELETE' }),
  },
  evaluations: {
    list: (batch) => request(batch ? `/api/evaluations?batch=${encodeURIComponent(batch)}` : '/api/evaluations'),
    leaderboard: (limit = 10) => request(`/api/evaluations/leaderboard?limit=${limit}`),
    faculty: (batch) => request(batch && batch !== 'All' ? `/api/evaluations/faculty?batch=${encodeURIComponent(batch)}` : '/api/evaluations/faculty'),
    analysis: (batch) => request(batch && batch !== 'All' ? `/api/evaluations/analysis?batch=${encodeURIComponent(batch)}` : '/api/evaluations/analysis'),
    me: () => request('/api/evaluations/me'),
    submit: (body) => request('/api/evaluations', { method: 'POST', body: JSON.stringify(body) }),
    updateDemo: (employeeId, body) => request(`/api/evaluations/${encodeURIComponent(employeeId)}`, { method: 'PUT', body: JSON.stringify(body) }),
  },
};

export function getSocketUrl() {
  return 'wss://faculty-evaluator.onrender.com';
}
