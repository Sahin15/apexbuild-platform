import { useState, useEffect, useRef, useCallback } from 'react';
import haptics from '../utils/haptics';

/**
 * Custom hook for smooth native-feeling mobile Pull-to-Refresh
 * @param {Function} onRefresh Async callback to reload data
 * @param {Object} options Configuration options
 */
export function usePullToRefresh(onRefresh, options = {}) {
  const {
    threshold = 70,
    maxPull = 120,
    resistance = 0.45,
    disabled = false
  } = options;

  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isThresholdReached, setIsThresholdReached] = useState(false);

  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const hasTriggeredHapticRef = useRef(false);

  const handleTouchStart = useCallback((e) => {
    if (disabled || isRefreshing) return;
    
    // Only allow pull-to-refresh if page/container is scrolled to the absolute top
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    if (scrollTop <= 1) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
      hasTriggeredHapticRef.current = false;
    }
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e) => {
    if (!isPullingRef.current || isRefreshing || disabled) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    if (diff > 0) {
      // Calculate pull distance with exponential/logarithmic damping
      const dampedDistance = Math.min(maxPull, diff * resistance);
      setPullDistance(dampedDistance);

      if (dampedDistance >= threshold) {
        if (!hasTriggeredHapticRef.current) {
          haptics.selection();
          hasTriggeredHapticRef.current = true;
        }
        setIsThresholdReached(true);
      } else {
        hasTriggeredHapticRef.current = false;
        setIsThresholdReached(false);
      }

      // Prevent native overscroll browser bounce if pulling down
      if (e.cancelable && diff > 10) {
        e.preventDefault();
      }
    } else {
      setPullDistance(0);
      setIsThresholdReached(false);
    }
  }, [disabled, isRefreshing, maxPull, resistance, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current || disabled) return;
    isPullingRef.current = false;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold); // Hold at threshold while refreshing
      haptics.medium();

      try {
        if (onRefresh) {
          await onRefresh();
        }
        haptics.success();
      } catch (err) {
        console.warn('Pull-to-refresh failed:', err);
        haptics.error();
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
          setIsThresholdReached(false);
        }, 400);
      }
    } else {
      // Reset smoothly
      setPullDistance(0);
      setIsThresholdReached(false);
    }
  }, [disabled, isRefreshing, onRefresh, pullDistance, threshold]);

  return {
    pullDistance,
    isRefreshing,
    isThresholdReached,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  };
}

export default usePullToRefresh;
