import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, Database, RefreshCw, CloudUpload, CheckCircle2, ListFilter } from 'lucide-react';
import { getCacheSummary } from '../../services/offlineCache';
import { getSyncQueue, processSyncQueue } from '../../services/syncQueue';
import SyncQueueModal from './SyncQueueModal';

export const OfflineStatusBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showRestoredNotice, setShowRestoredNotice] = useState(false);
  const [syncNotice, setSyncNotice] = useState(null);
  const [cacheHits, setCacheHits] = useState(0);
  const [lastCacheHitTime, setLastCacheHitTime] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);

  useEffect(() => {
    // Initial queue count
    setQueueCount(getSyncQueue().length);

    const handleOnline = () => {
      setIsOnline(true);
      setShowRestoredNotice(true);
      const timer = setTimeout(() => {
        setShowRestoredNotice(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestoredNotice(false);
    };

    const handleCacheHit = (e) => {
      setCacheHits(prev => prev + 1);
      if (e.detail?.timestamp) {
        setLastCacheHitTime(new Date(e.detail.timestamp));
      }
    };

    const handleQueueUpdated = () => {
      setQueueCount(getSyncQueue().length);
    };

    const handleSyncStarted = () => {
      setIsSyncing(true);
    };

    const handleSyncCompleted = (e) => {
      setIsSyncing(false);
      setQueueCount(getSyncQueue().length);
      const count = e.detail?.count || 1;
      setSyncNotice(`Synced ${count} offline operation(s) to cloud`);
      setTimeout(() => setSyncNotice(null), 4000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('apex-offline-cache-hit', handleCacheHit);
    window.addEventListener('apex-sync-queue-updated', handleQueueUpdated);
    window.addEventListener('apex-sync-started', handleSyncStarted);
    window.addEventListener('apex-sync-completed', handleSyncCompleted);

    // Initial check of cache summary
    const summary = getCacheSummary();
    if (summary.lastSync) {
      setLastCacheHitTime(summary.lastSync);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('apex-offline-cache-hit', handleCacheHit);
      window.removeEventListener('apex-sync-queue-updated', handleQueueUpdated);
      window.removeEventListener('apex-sync-started', handleSyncStarted);
      window.removeEventListener('apex-sync-completed', handleSyncCompleted);
    };
  }, []);

  const handleRetryConnection = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setIsRetrying(false);
      if (navigator.onLine) {
        setIsOnline(true);
        setShowRestoredNotice(true);
        setTimeout(() => setShowRestoredNotice(false), 3000);
        processSyncQueue();
      }
      // Trigger window event to notify components to re-fetch
      window.dispatchEvent(new Event('apex-network-reconnect'));
    }, 600);
  };

  const handleManualSync = () => {
    processSyncQueue();
  };

  if (isOnline && !showRestoredNotice && !syncNotice && queueCount === 0) {
    return null;
  }

  const timeString = lastCacheHitTime
    ? lastCacheHitTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="fixed top-2 sm:top-4 left-1/2 -translate-x-1/2 z-[999] px-3 w-full max-w-md pointer-events-none transition-all duration-300">
      {!isOnline ? (
        <div className="flex items-center justify-between gap-3 px-3.5 py-2 bg-slate-900/95 text-white backdrop-blur-md text-xs font-semibold rounded-2xl shadow-2xl border border-amber-500/40 pointer-events-auto animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1 bg-amber-500/20 text-amber-400 rounded-lg shrink-0">
              <WifiOff className="w-3.5 h-3.5 animate-pulse" />
            </span>
            <div className="truncate">
              <p className="font-bold text-amber-300 text-[11px] leading-tight">Offline Mode</p>
              <p className="text-[10px] text-slate-300 truncate">
                {queueCount > 0 
                  ? `${queueCount} operation(s) queued for sync`
                  : timeString ? `Viewing records saved at ${timeString}` : 'Using locally cached data'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {queueCount > 0 && (
              <button
                type="button"
                onClick={() => setIsQueueModalOpen(true)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl text-[11px] transition-transform active:scale-95"
              >
                Queue ({queueCount})
              </button>
            )}
            <button
              type="button"
              onClick={handleRetryConnection}
              disabled={isRetrying}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-[11px] transition-transform active:scale-95"
            >
              <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      ) : syncNotice ? (
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600/95 text-white backdrop-blur-md text-xs font-bold rounded-2xl shadow-xl border border-emerald-400/40 pointer-events-auto animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{syncNotice}</span>
        </div>
      ) : queueCount > 0 ? (
        <div className="flex items-center justify-between gap-3 px-3.5 py-2 bg-slate-900/95 text-white backdrop-blur-md text-xs font-semibold rounded-2xl shadow-2xl border border-indigo-500/40 pointer-events-auto animate-in fade-in slide-in-from-top-2">
          <div 
            onClick={() => setIsQueueModalOpen(true)} 
            className="flex items-center gap-2 min-w-0 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <span className="p-1 bg-indigo-500/20 text-indigo-400 rounded-lg shrink-0">
              <CloudUpload className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
            </span>
            <div className="truncate">
              <p className="font-bold text-indigo-300 text-[11px] leading-tight">Pending Cloud Sync</p>
              <p className="text-[10px] text-slate-300 truncate">
                {isSyncing ? 'Uploading offline records...' : `${queueCount} offline operation(s) waiting &bull; Click to view`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsQueueModalOpen(true)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold rounded-xl text-[11px] transition-transform active:scale-95"
            >
              View Queue
            </button>
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-[11px] transition-transform active:scale-95 shadow-sm"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>
      ) : showRestoredNotice ? (
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600/95 text-white backdrop-blur-md text-xs font-bold rounded-2xl shadow-xl border border-emerald-400/40 pointer-events-auto animate-in fade-in slide-in-from-top-2">
          <Wifi className="w-3.5 h-3.5" />
          <span>Back online &bull; Cloud sync active</span>
        </div>
      ) : null}

      <SyncQueueModal 
        isOpen={isQueueModalOpen} 
        onClose={() => setIsQueueModalOpen(false)} 
      />
    </div>
  );
};

export default OfflineStatusBanner;
