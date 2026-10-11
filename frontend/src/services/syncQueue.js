/**
 * Offline Background Sync Queue Engine
 * High-reliability IndexedDB + LocalStorage dual storage engine.
 * Stores offline mutation requests (POST/PUT/PATCH/DELETE) and flushes them
 * sequentially or on-demand when connectivity is restored.
 */

import api from './api';
import { sendLocalNotification } from '../utils/notifications';
import { invalidateApiCache } from './offlineCache';

const QUEUE_STORAGE_KEY = 'apex_offline_sync_queue';
const IDB_NAME = 'apex_sync_db';
const IDB_STORE = 'sync_queue';
const IDB_VERSION = 1;

let isProcessingQueue = false;
let idbPromise = null;

// Helper to open IndexedDB with graceful fallback
function getIndexedDB() {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve(null);
  if (idbPromise) return idbPromise;

  idbPromise = new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn('[SyncQueue] IndexedDB open error, falling back to localStorage');
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });

  return idbPromise;
}

// Helper to get active tenant scope
function getTenantScope() {
  try {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) return 'default';
    const user = JSON.parse(rawUser);
    return user.organizationId?._id || user.organizationId || user.email || 'default';
  } catch {
    return 'default';
  }
}

/**
 * Get all queued operations for current tenant
 */
export function getSyncQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    const tenant = getTenantScope();
    return queue.filter(item => item.tenant === tenant);
  } catch (e) {
    console.warn('[SyncQueue] Failed to read sync queue:', e);
    return [];
  }
}

/**
 * Save queue to localStorage and persist to IndexedDB
 */
function saveSyncQueue(items) {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(items));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('apex-sync-queue-updated', {
        detail: { count: items.length }
      }));
    }

    // Async sync to IndexedDB for large payload durability
    getIndexedDB().then(db => {
      if (!db) return;
      try {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        store.clear();
        items.forEach(item => store.put(item));
      } catch (err) {
        console.warn('[SyncQueue] IDB persist error:', err);
      }
    });
  } catch (e) {
    console.error('[SyncQueue] Failed to save sync queue:', e);
  }
}

/**
 * Enqueue an operation to be synced when online
 */
export function enqueueSyncOperation({
  endpoint,
  method = 'POST',
  payload = {},
  title = 'Operation',
  platform = 'GENERAL'
}) {
  const tenant = getTenantScope();
  const queueItem = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    endpoint,
    method: method.toUpperCase(),
    payload,
    title,
    platform,
    tenant,
    createdAt: Date.now(),
    attempts: 0,
    status: 'PENDING',
    lastError: null
  };

  const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
  const queue = raw ? JSON.parse(raw) : [];
  queue.push(queueItem);
  saveSyncQueue(queue);

  return queueItem;
}

/**
 * Remove an item from the sync queue
 */
export function removeSyncItem(id) {
  const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
  if (!raw) return;
  const queue = JSON.parse(raw);
  const filtered = queue.filter(item => item.id !== id);
  saveSyncQueue(filtered);
}

/**
 * Clear all queued items for current tenant
 */
export function clearSyncQueue() {
  const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
  if (!raw) return;
  const queue = JSON.parse(raw);
  const tenant = getTenantScope();
  const filtered = queue.filter(item => item.tenant !== tenant);
  saveSyncQueue(filtered);
}

/**
 * Sync a single queued item immediately
 */
export async function syncSingleItem(id) {
  const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
  if (!raw) return { success: false, reason: 'Queue is empty' };

  let queue = JSON.parse(raw);
  const itemIndex = queue.findIndex(item => item.id === id);
  if (itemIndex === -1) return { success: false, reason: 'Item not found in queue' };

  const item = queue[itemIndex];
  item.status = 'SYNCING';
  item.attempts += 1;
  saveSyncQueue(queue);

  try {
    const res = await api.request({
      url: item.endpoint,
      method: item.method,
      data: item.payload
    });

    invalidateApiCache(item.endpoint);

    // Remove item on success
    queue = queue.filter(q => q.id !== id);
    saveSyncQueue(queue);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('apex-sync-completed', {
        detail: { count: 1, item }
      }));
    }

    return { success: true, data: res.data };
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || 'Network sync error';
    item.status = 'FAILED';
    item.lastError = errorMsg;
    saveSyncQueue(queue);

    return { success: false, error: errorMsg };
  }
}

/**
 * Process all queued operations sequentially
 */
export async function processSyncQueue() {
  if (isProcessingQueue) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;

  const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
  if (!raw) return;

  let queue = JSON.parse(raw);
  const tenant = getTenantScope();
  const tenantItems = queue.filter(item => item.tenant === tenant);

  if (tenantItems.length === 0) return;

  isProcessingQueue = true;
  let successfulCount = 0;
  const remainingQueue = [...queue.filter(item => item.tenant !== tenant)];

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('apex-sync-started', {
      detail: { total: tenantItems.length }
    }));
  }

  for (const item of tenantItems) {
    try {
      item.attempts += 1;
      item.status = 'SYNCING';
      await api.request({
        url: item.endpoint,
        method: item.method,
        data: item.payload
      });

      // Invalidate relevant cache on successful sync
      invalidateApiCache(item.endpoint);
      successfulCount += 1;
    } catch (error) {
      console.warn(`[SyncQueue] Sync failed for item ${item.id} (${item.title}):`, error);
      
      const errorMsg = error.response?.data?.message || error.message || 'Sync failed';
      item.status = 'FAILED';
      item.lastError = errorMsg;

      // If error is 4xx client validation (non-retryable poison pill), discard
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        console.error(`[SyncQueue] Discarding invalid queued item ${item.id}:`, error.response.data);
      } else {
        // Network/Server error: keep item in queue for next retry
        remainingQueue.push(item);
        break; // Stop loop, network is still unstable
      }
    }
  }

  saveSyncQueue(remainingQueue);
  isProcessingQueue = false;

  if (successfulCount > 0) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('apex-sync-completed', {
        detail: { count: successfulCount }
      }));
    }

    sendLocalNotification('☁️ Offline Operations Synced', {
      body: `Successfully uploaded ${successfulCount} offline operation(s) to cloud database.`,
      tag: 'sync-completed-alert'
    });
  }
}

// Auto-sync event listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    setTimeout(processSyncQueue, 1500);
  });
  window.addEventListener('apex-network-reconnect', () => {
    setTimeout(processSyncQueue, 500);
  });
}

export default {
  getSyncQueue,
  enqueueSyncOperation,
  removeSyncItem,
  clearSyncQueue,
  syncSingleItem,
  processSyncQueue
};
