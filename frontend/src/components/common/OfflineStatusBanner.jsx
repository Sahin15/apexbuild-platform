import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineStatusBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showRestoredNotice, setShowRestoredNotice] = useState(false);

  useEffect(() => {
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

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showRestoredNotice) {
    return null;
  }

  return (
    <div className="fixed top-2 sm:top-4 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-sm pointer-events-none transition-all duration-300">
      {!isOnline ? (
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-600/95 text-white backdrop-blur-md text-xs font-semibold rounded-full shadow-lg border border-amber-400/40 pointer-events-auto animate-in fade-in slide-in-from-top-2">
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          <span>Offline Mode &bull; Using cached records</span>
        </div>
      ) : showRestoredNotice ? (
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600/95 text-white backdrop-blur-md text-xs font-semibold rounded-full shadow-lg border border-emerald-400/40 pointer-events-auto animate-in fade-in slide-in-from-top-2">
          <Wifi className="w-3.5 h-3.5" />
          <span>Back online &bull; Cloud sync active</span>
        </div>
      ) : null}
    </div>
  );
};

export default OfflineStatusBanner;
