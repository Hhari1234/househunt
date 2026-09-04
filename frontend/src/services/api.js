const getApiBaseUrlForHost = (hostname = '') => {
  const host = String(hostname || '').toLowerCase();

  if (!host) return '/api/v1';
  if (host.includes('localhost')) return 'http://localhost:3001/api/v1';

  // No hardcoded host-specific fallbacks.
  // Production must set REACT_APP_API_URL; local dev uses localhost above.
  return '/api/v1';
};

const API_BASE_URL = (() => {
  // 1. Explicit production override (set REACT_APP_API_URL at build time,
  //    e.g. https://househunt-api.onrender.com/api/v1 on Render).
  const configured = typeof process !== 'undefined' ? process.env.REACT_APP_API_URL : '';
  if (configured) return configured.replace(/\/+$/, '');

  // 2. Local development → the locally running API.
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const apiBaseUrl = getApiBaseUrlForHost(host);

    if (process.env.NODE_ENV === 'production' && apiBaseUrl === `${window.location.origin}/api/v1`) {
      console.error(
        'REACT_APP_API_URL is not set. In production set REACT_APP_API_URL to your backend API base (e.g. https://<backend-render-url>/api/v1). Falling back to same-origin /api/v1.'
      );
    }

    return apiBaseUrl;
  }

  // Server-side/default fallback: warn and fall back to same-origin.
  console.error('REACT_APP_API_URL not provided; defaulting to /api/v1. Set REACT_APP_API_URL during build.');
  return '/api/v1';
})();

export { API_BASE_URL, getApiBaseUrlForHost };

const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

const getAuthHeaders = () => {
  const token = localStorage.getItem('househunt_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const parseErrorMessage = (payload, fallback) => {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;
  if (payload.error?.message) return payload.error.message;
  if (typeof payload.error === 'string') return payload.error;
  if (payload.message) return payload.message;
  return fallback;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`;
    try {
      const errorData = await response.json();
      errorMessage = parseErrorMessage(errorData, errorMessage);
    } catch {
      // keep default error message
    }
    if (response.status === 401) {
      // Stale/invalid token — clear it so protected pages redirect cleanly
      if (localStorage.getItem('househunt_token')) {
        localStorage.removeItem('househunt_token');
      }
    }
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) return null;
  return response.json();
};

const apiClient = {
  get: async (endpoint, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });
    return handleResponse(response);
  },

  post: async (endpoint, data = {}, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  put: async (endpoint, data = {}, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  patch: async (endpoint, data = {}, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (endpoint, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });
    return handleResponse(response);
  },

  /** Multipart upload for image files (e.g. property photos) */
  /** Origin of the API server (for resolving /uploads/... URLs) */
  getApiOrigin: () => API_ORIGIN,

  postForm: async (endpoint, formData, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
      body: formData,
    });
    return handleResponse(response);
  },

  getWithQuery: async (endpoint, queryParams = {}, options = {}) => {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => url.searchParams.append(key, v));
        } else {
          url.searchParams.append(key, value);
        }
      }
    });

    const response = await fetch(url.toString(), {
      ...options,
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });
    return handleResponse(response);
  },
};

export default apiClient;