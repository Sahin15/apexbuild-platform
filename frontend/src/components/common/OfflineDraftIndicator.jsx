import React from 'react';
import { Save, RotateCcw, Trash2 } from 'lucide-react';

export const OfflineDraftIndicator = ({ 
  hasDraft, 
  lastSaved, 
  onRestore, 
  onDiscard, 
  className = '' 
}) => {
  if (!hasDraft) return null;

  const timeString = lastSaved 
    ? new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Earlier';

  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 ${className}`}>
      <div className="flex items-center gap-1.5 font-medium">
        <Save className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>Draft saved locally ({timeString})</span>
      </div>
      <div className="flex items-center gap-2">
        {onRestore && (
          <button
            type="button"
            onClick={onRestore}
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] shadow-2xs touch-manipulation transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Restore Draft
          </button>
        )}
        {onDiscard && (
          <button
            type="button"
            onClick={onDiscard}
            className="flex items-center gap-1 px-2 py-1 text-amber-700 hover:text-red-600 font-medium text-[11px] rounded hover:bg-amber-100 touch-manipulation transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Discard
          </button>
        )}
      </div>
    </div>
  );
};

export default OfflineDraftIndicator;
