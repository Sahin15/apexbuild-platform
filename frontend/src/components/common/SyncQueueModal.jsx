import React, { useState, useEffect } from 'react';
import { 
  X, CloudUpload, RefreshCw, Trash2, CheckCircle2, 
  AlertCircle, ChevronDown, ChevronUp, Clock, Layers,
  HardDrive, ArrowRight, ShieldCheck, Database
} from 'lucide-react';
import { 
  getSyncQueue, 
  removeSyncItem, 
  clearSyncQueue, 
  syncSingleItem, 
  processSyncQueue 
} from '../../services/syncQueue';
import toast from 'react-hot-toast';

export const SyncQueueModal = ({ isOpen, onClose }) => {
  const [queue, setQueue] = useState([]);
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [syncingItemId, setSyncingItemId] = useState(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const refreshQueue = () => {
    setQueue(getSyncQueue());
  };

  useEffect(() => {
    if (isOpen) {
      refreshQueue();
    }

    const handleQueueUpdated = () => {
      refreshQueue();
    };

    const handleSyncCompleted = () => {
      refreshQueue();
    };

    window.addEventListener('apex-sync-queue-updated', handleQueueUpdated);
    window.addEventListener('apex-sync-completed', handleSyncCompleted);

    return () => {
      window.removeEventListener('apex-sync-queue-updated', handleQueueUpdated);
      window.removeEventListener('apex-sync-completed', handleSyncCompleted);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSyncAll = async () => {
    if (!navigator.onLine) {
      toast.error('Cannot sync while offline. Please connect to internet.');
      return;
    }

    setIsSyncingAll(true);
    try {
      await processSyncQueue();
      refreshQueue();
      toast.success('Sync batch completed');
    } catch (err) {
      toast.error('Sync batch encountered an error');
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleSyncSingle = async (id) => {
    if (!navigator.onLine) {
      toast.error('Cannot sync while offline. Please connect to internet.');
      return;
    }

    setSyncingItemId(id);
    try {
      const res = await syncSingleItem(id);
      if (res.success) {
        toast.success('Operation synced to cloud!');
        refreshQueue();
      } else {
        toast.error(res.error || 'Failed to sync item');
        refreshQueue();
      }
    } finally {
      setSyncingItemId(null);
    }
  };

  const handleDeleteItem = (id) => {
    removeSyncItem(id);
    refreshQueue();
    toast('Queued operation removed', { icon: '🗑️' });
  };

  const handleClearAll = () => {
    if (!window.confirm('Are you sure you want to discard all pending offline operations? This cannot be undone.')) {
      return;
    }
    clearSyncQueue();
    refreshQueue();
    toast.success('Offline sync queue cleared');
  };

  const formatRelativeTime = (timestamp) => {
    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getPlatformBadgeColor = (platform) => {
    switch (platform) {
      case 'CHICKEN_DISTRIBUTOR':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'MATERIAL_SUPPLIER':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'DIAGNOSTICS':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CONTRACTOR':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <CloudUpload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  Offline Background Sync Queue
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {queue.length} pending
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Records captured offline stored in IndexedDB and waiting for cloud database upload.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {queue.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-500">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 border border-emerald-100 shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="font-bold text-slate-900 text-sm">All Records Fully Synchronized</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                There are no pending offline mutations. When you create orders or mark attendance without internet, they will queue here.
              </p>
            </div>
          ) : (
            queue.map((item) => {
              const isExpanded = expandedItemId === item.id;
              const isItemSyncing = syncingItemId === item.id;

              return (
                <div 
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${getPlatformBadgeColor(item.platform)}`}>
                          {item.platform || 'GENERAL'}
                        </span>
                        <span className="text-[11px] font-bold text-slate-800 truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.method} {item.endpoint}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {formatRelativeTime(item.createdAt)}
                        </span>
                        {item.attempts > 0 && (
                          <span className="text-amber-600 font-medium">
                            Attempts: {item.attempts}
                          </span>
                        )}
                        {item.status === 'FAILED' && (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-semibold text-[10px]">
                            <AlertCircle className="w-3 h-3" />
                            {item.lastError || 'Failed to upload'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSyncSingle(item.id)}
                        disabled={isItemSyncing || isSyncingAll}
                        title="Upload this record now"
                        className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-slate-600 text-xs transition-all disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isItemSyncing ? 'animate-spin text-indigo-600' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        title="Discard this offline record"
                        className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-400 text-xs transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                        className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 text-xs transition-all"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Payload Viewer */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-slate-100 animate-in fade-in duration-200">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Captured Form Payload (IndexedDB)
                      </p>
                      <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 leading-relaxed">
                        {JSON.stringify(item.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {queue.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors"
            >
              Discard All
            </button>

            <button
              type="button"
              onClick={handleSyncAll}
              disabled={isSyncingAll}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-md touch-manipulation disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
              <span>{isSyncingAll ? 'Synchronizing All...' : 'Sync All Records Now'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyncQueueModal;
