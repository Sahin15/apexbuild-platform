/**
 * Offline API Cache Manager
 * Provides tenant-isolated, LRU-bounded localStorage caching for GET API responses.
 * Enables zero-downtime offline browsing of past records, customer lists, inventory, and reports.
 */

const CACHE_PREFIX = 'apex_apicache_';
const MAX_CACHE_ENTRIES = 120;
const CACHE_INDEX_KEY = 'apex_apicache_index';

// Helper to get active tenant/user scope
function getTenantScope() {
  try {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) return 'anonymous';
    const user = JSON.parse(rawUser);
    return user.organizationId?._id || user.organizationId || user.email || 'default';
  } catch {
    return 'default';
  }
}

// Generate normalized cache key
export function getCacheKey(url, params) {
  const tenant = getTenantScope();
  let normalizedUrl = url || '';
  if (normalizedUrl.startsWith('/')) normalizedUrl = normalizedUrl.slice(1);
  
  let queryString = '';
  if (params && typeof params === 'object') {
    const sortedKeys = Object.keys(params).sort();
    const searchParams = new URLSearchParams();
    sortedKeys.forEach(k => {
      if (params[k] !== undefined && params[k] !== null) {
        searchParams.append(k, String(params[k]));
      }
    });
    queryString = searchParams.toString();
  }
  
  const fullPath = queryString ? `${normalizedUrl}?${queryString}` : normalizedUrl;
  return `${CACHE_PREFIX}${tenant}::${fullPath}`;
}

// Read index of cached entries for LRU eviction
function getCacheIndex() {
  try {
    const raw = localStorage.getItem(CACHE_INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCacheIndex(index) {
  try {
    localStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));
  } catch (e) {
    console.warn('Failed to save cache index', e);
  }
}

/**
 * Save an API response into the offline cache.
 */
export function saveApiCache(url, params, data) {
  if (!url || !data) return;

  // Do not cache sensitive auth endpoints
  if (url.includes('/auth') || url.includes('/login') || url.includes('/register')) return;

  try {
    const key = getCacheKey(url, params);
    const entry = {
      data,
      timestamp: Date.now(),
      url,
      tenant: getTenantScope()
    };

    localStorage.setItem(key, JSON.stringify(entry));

    // Update LRU index
    let index = getCacheIndex();
    index = index.filter(item => item.key !== key);
    index.unshift({ key, url, timestamp: entry.timestamp });

    // Evict oldest if exceeding capacity
    if (index.length > MAX_CACHE_ENTRIES) {
      const evicted = index.slice(MAX_CACHE_ENTRIES);
      evicted.forEach(item => {
        try { localStorage.removeItem(item.key); } catch {}
      });
      index = index.slice(0, MAX_CACHE_ENTRIES);
    }

    saveCacheIndex(index);

    window.dispatchEvent(new CustomEvent('apex-cache-updated', {
      detail: { url, timestamp: entry.timestamp }
    }));
  } catch (e) {
    console.warn('Failed to save offline API cache:', e);
  }
}

/**
 * Retrieve cached API data if present.
 */
export function getApiCache(url, params) {
  try {
    const key = getCacheKey(url, params);
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.data) return null;

    return parsed;
  } catch (e) {
    console.warn('Failed to read offline API cache:', e);
    return null;
  }
}

/**
 * Invalidate cache entries matching a resource prefix (e.g., when a mutation happens).
 * Example: invalidateApiCache('/supplier/orders') will clear all orders and related cache keys.
 */
export function invalidateApiCache(urlPattern) {
  if (!urlPattern) return;
  try {
    const tenant = getTenantScope();
    let cleanPattern = urlPattern.startsWith('/') ? urlPattern.slice(1) : urlPattern;
    cleanPattern = cleanPattern.split('?')[0]; // Strip query params

    const index = getCacheIndex();
    const remainingIndex = [];

    index.forEach(item => {
      if (item.key.includes(`${CACHE_PREFIX}${tenant}::${cleanPattern}`)) {
        try { localStorage.removeItem(item.key); } catch {}
      } else {
        remainingIndex.push(item);
      }
    });

    saveCacheIndex(remainingIndex);
  } catch (e) {
    console.warn('Failed to invalidate API cache:', e);
  }
}

/**
 * Clear all cached API responses for the current tenant or entire app.
 */
export function clearAllApiCache() {
  try {
    const index = getCacheIndex();
    index.forEach(item => {
      try { localStorage.removeItem(item.key); } catch {}
    });
    localStorage.removeItem(CACHE_INDEX_KEY);
  } catch (e) {
    console.error('Failed to clear API cache:', e);
  }
}

/**
 * Get summary of cached resources.
 */
export function getCacheSummary() {
  try {
    const index = getCacheIndex();
    const tenant = getTenantScope();
    const tenantEntries = index.filter(i => i.key.includes(`${CACHE_PREFIX}${tenant}::`));
    return {
      count: tenantEntries.length,
      lastSync: tenantEntries.length > 0 ? new Date(tenantEntries[0].timestamp) : null,
      entries: tenantEntries
    };
  } catch {
    return { count: 0, lastSync: null, entries: [] };
  }
}

export default {
  saveApiCache,
  getApiCache,
  invalidateApiCache,
  clearAllApiCache,
  getCacheSummary,
  getCacheKey
};
