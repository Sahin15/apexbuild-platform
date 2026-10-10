import React from 'react';
import { RefreshCw, ArrowDown, Check } from 'lucide-react';
import usePullToRefresh from '../../hooks/usePullToRefresh';

/**
 * PullToRefreshContainer
 * Wraps page content with native-feeling elastic pull-to-refresh interactions.
 */
export default function PullToRefreshContainer({
  children,
  onRefresh,
  disabled = false,
  className = ''
}) {
  const {
    pullDistance,
    isRefreshing,
    isThresholdReached,
    touchHandlers
  } = usePullToRefresh(onRefresh, { disabled });

  const rotation = Math.min(360, (pullDistance / 70) * 360);
  const opacity = Math.min(1, pullDistance / 40);

  return (
    <div
      {...touchHandlers}
      className={`relative min-h-full ${className}`}
      style={{
        transform: pullDistance > 0 ? `translateY(${pullDistance * 0.4}px)` : 'none',
        transition: isRefreshing ? 'transform 0.2s cubic-bezier(0.2, 0.9, 0.3, 1)' : pullDistance === 0 ? 'transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1)' : 'none'
      }}
    >
      {/* Pull Indicator Badge */}
      {(pullDistance > 5 || isRefreshing) && (
        <div
          className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex items-center justify-center transition-opacity duration-200"
          style={{
            top: `${Math.min(55, pullDistance * 0.7 - 20)}px`,
            opacity
          }}
        >
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 text-white rounded-full shadow-lg border border-slate-700/60 backdrop-blur-md text-xs font-semibold">
            {isRefreshing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                <span className="text-[11px] text-slate-200">Updating...</span>
              </>
            ) : isThresholdReached ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span className="text-[11px] text-emerald-300 font-bold">Release to refresh</span>
              </>
            ) : (
              <>
                <ArrowDown
                  className="w-3.5 h-3.5 text-slate-400 transition-transform"
                  style={{ transform: `rotate(${rotation}deg)` }}
                />
                <span className="text-[11px] text-slate-300">Pull to refresh</span>
              </>
            )}
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
