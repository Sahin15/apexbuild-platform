import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, Database, RefreshCw } from 'lucide-react';
import { getCacheSummary } from '../../services/offlineCache';

export const OfflineStatusBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showRestoredNotice, setShowRestoredNotice] = useState(false);
  const [cacheHits, setCacheHits] = useState(0);
  const [lastCacheHitTime, setLastCacheHitTime] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestoredNotice(true);
      const timer = setTimeout(() => {
        setShowRestoredNotice(false);
      }, 4000);
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

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('apex-offline-cache-hit', handleCacheHit);

    // Initial check of cache summary
    const summary = getCacheSummary();
    if (summary.lastSync) {
      setLastCacheHitTime(summary.lastSync);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('apex-offline-cache-hit', handleCacheHit);
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
      }
      // Trigger window event to notify components to re-fetch
      window.dispatchEvent(new Event('apex-network-reconnect'));
    }, 600);
  };

  if (isOnline && !showRestoredNotice) {
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
                {timeString ? `Viewing records saved at ${timeString}` : 'Using locally cached data'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRetryConnection}
            disabled={isRetrying}
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-[11px] transition-transform active:scale-95 shrink-0"
          >
            <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>Retry</span>
          </button>
        </div>
      ) : showRestoredNotice ? (
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600/95 text-white backdrop-blur-md text-xs font-bold rounded-2xl shadow-xl border border-emerald-400/40 pointer-events-auto animate-in fade-in slide-in-from-top-2">
          <Wifi className="w-3.5 h-3.5" />
          <span>Back online &bull; Cloud sync active</span>
        </div>
      ) : null}
    </div>
  );
};

export default OfflineStatusBanner;
