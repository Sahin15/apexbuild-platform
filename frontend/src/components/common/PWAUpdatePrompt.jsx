import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, X, CheckCircle2 } from 'lucide-react';
import haptics from '../../utils/haptics';

/**
 * PWAUpdatePrompt
 * Modern, non-blocking floating card that notifies users when a new Service Worker
 * version is waiting to activate, enabling seamless 1-tap updates.
 */
export default function PWAUpdatePrompt() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [reloadHandler, setReloadHandler] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleUpdate = (e) => {
      if (e.detail?.reload) {
        setReloadHandler(() => e.detail.reload);
        setUpdateAvailable(true);
        setIsDismissed(false);
        haptics.selection();
      }
    };

    window.addEventListener('apex-sw-update-available', handleUpdate);

    return () => {
      window.removeEventListener('apex-sw-update-available', handleUpdate);
    };
  }, []);

  const handleUpdateClick = () => {
    setIsUpdating(true);
    haptics.medium();
    if (reloadHandler) {
      reloadHandler();
    } else {
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    haptics.light();
  };

  if (!updateAvailable || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 z-[995] w-[92%] sm:w-96 max-w-sm pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-indigo-500/40 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="truncate">
              <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                New Version Available
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </h4>
              <p className="text-[11px] text-slate-300 truncate mt-0.5">
                Update ApexBuild for latest features & bug fixes.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors shrink-0"
            title="Dismiss update"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
          <button
            type="button"
            onClick={handleDismiss}
            className="flex-1 py-1.5 px-3 rounded-xl text-[11px] font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Later
          </button>
          <button
            type="button"
            onClick={handleUpdateClick}
            disabled={isUpdating}
            className="flex-1 py-1.5 px-3 rounded-xl text-[11px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>{isUpdating ? 'Updating...' : 'Update Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
