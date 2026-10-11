import axios from 'axios';
import { saveApiCache, getApiCache, invalidateApiCache, clearAllApiCache } from './offlineCache';

const defaultBaseURL = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
  ? '/api/v1'
  : 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000 // 15 second timeout for mobile network resilience
});

// Request interceptor to add the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle caching, offline fallback, and global errors
api.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toLowerCase();
    
    // Auto-cache successful GET responses
    if (method === 'get' && response.status === 200 && response.data) {
      saveApiCache(response.config.url, response.config.params, response.data);
    }

    // Invalidate related cache on mutations
    if (['post', 'put', 'patch', 'delete'].includes(method) && response.status < 400) {
      invalidateApiCache(response.config.url);
    }

    return response;
  },
  (error) => {
    const config = error.config;
    const method = config?.method?.toLowerCase();

    // Check for network errors, timeouts, or explicit offline status on GET requests
    const isNetworkError = !error.response || 
                           error.code === 'ERR_NETWORK' || 
                           error.code === 'ECONNABORTED' || 
                           (typeof navigator !== 'undefined' && !navigator.onLine);

    if (isNetworkError && method === 'get' && config) {
      const cached = getApiCache(config.url, config.params);
      if (cached && cached.data) {
        // Broadcast cache hit event for UI indicators
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('apex-offline-cache-hit', {
            detail: {
              url: config.url,
              timestamp: cached.timestamp,
              isOffline: !navigator.onLine
            }
          }));
        }

        // Return synthetic Axios response with cached payload
        return Promise.resolve({
          data: cached.data,
          status: 200,
          statusText: 'OK (From Local Offline Cache)',
          headers: {},
          config,
          isOfflineCache: true,
          cachedAt: new Date(cached.timestamp)
        });
      }
    }

    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login on auth failure
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      clearAllApiCache();
      window.dispatchEvent(new Event('auth-error'));
    }

    return Promise.reject(error);
  }
);

export default api;

