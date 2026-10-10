/**
 * Offline Background Sync Queue Engine
 * Stores offline mutation requests (POST/PUT/PATCH/DELETE) and flushes them
 * sequentially when connectivity is restored.
 */

import api from './api';
import { sendLocalNotification } from '../utils/notifications';
import { invalidateApiCache } from './offlineCache';

const QUEUE_STORAGE_KEY = 'apex_offline_sync_queue';
let isProcessingQueue = false;

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
    console.warn('Failed to read sync queue:', e);
    return [];
  }
}

/**
 * Save queue to localStorage
 */
function saveSyncQueue(items) {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(items));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('apex-sync-queue-updated', {
        detail: { count: items.length }
      }));
    }
  } catch (e) {
    console.error('Failed to save sync queue:', e);
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
    attempts: 0
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
      await api.request({
        url: item.endpoint,
        method: item.method,
        data: item.payload
      });

      // Invalidate relevant cache on successful sync
      invalidateApiCache(item.endpoint);
      successfulCount += 1;
    } catch (error) {
      console.warn(`Sync failed for item ${item.id} (${item.title}):`, error);
      
      // If error is 4xx client validation, do not retry forever (poison pill)
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        console.error(`Discarding invalid queued item ${item.id}:`, error.response.data);
      } else {
        // Network error: keep item in queue for next retry
        remainingQueue.push(item);
        break; // Stop loop, network is still unstable
      }
    }
  }

  saveSyncQueue(remainingQueue);
  isProcessingQueue = false;

  if (successfulCount > 0) {
    // Notify app of completed sync
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

// Auto-sync listeners
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
  processSyncQueue
};
