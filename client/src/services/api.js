/**
 * AccessGuard AI API Service Client
 * 
 * Configurable API endpoint supporting both HttpOnly cookies and Bearer tokens.
 * Communicates with the backend without exposing secrets.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Low-level request wrapper ensuring credentials: 'include' for HttpOnly cookies.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Provide Authorization header if token is stored in memory / local storage
  const token = localStorage.getItem('accessguard_token');
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
    credentials: 'include', // Crucial for HttpOnly cookies
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    throw new ApiError(
      `Network error: Unable to connect to AccessGuard API server (${err.message})`,
      0,
      null
    );
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMessage = data?.error || data?.message || `HTTP ${response.status}: Request failed`;
    throw new ApiError(errorMessage, response.status, data);
  }

  return data;
}

export const api = {
  // Health
  getHealth: () => request('/health'),

  // Auth
  register: async (email, password, name) => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    if (res.token) {
      localStorage.setItem('accessguard_token', res.token);
    }
    return res;
  },

  login: async (email, password) => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token) {
      localStorage.setItem('accessguard_token', res.token);
    }
    return res;
  },

  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('accessguard_token');
    }
  },

  getMe: () => request('/auth/me'),

  // Scans
  launchScan: (url, options = {}) =>
    request('/scans', {
      method: 'POST',
      body: JSON.stringify({ url, ...options }),
    }),

  getScans: () => request('/scans'),

  getScanById: (id) => request(`/scans/${id}`),

  compareScans: (baseId, targetId) =>
    request(`/scans/compare?baseId=${encodeURIComponent(baseId)}&targetId=${encodeURIComponent(targetId)}`),

  exportScanJson: (id) => request(`/scans/${id}/export?format=json`),

  getExportUrl: (id, format = 'json') =>
    `${API_BASE}/scans/${id}/export?format=${format}`,

  // Senior Safety Shield
  checkShieldMessage: (message) =>
    request('/shield/check-message', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  checkShieldUrl: (url) =>
    request('/shield/check-url', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),
};

