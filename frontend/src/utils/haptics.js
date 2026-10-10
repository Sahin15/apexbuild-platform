/**
 * Native Device Haptic Feedback Engine
 * Provides tactile vibration feedback for mobile PWA interactions.
 * Safe fallback on desktop browsers or unsupported hardware.
 */

export const isHapticsSupported = () => {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
};

export const haptics = {
  /**
   * Ultra-light click/tap for tab changes and subtle actions
   */
  light: () => {
    if (!isHapticsSupported()) return;
    try {
      navigator.vibrate(12);
    } catch {}
  },

  /**
   * Standard tactile feedback for adding line items, toggles, or secondary buttons
   */
  medium: () => {
    if (!isHapticsSupported()) return;
    try {
      navigator.vibrate(25);
    } catch {}
  },

  /**
   * Firm tap for primary CTAs and deletions
   */
  heavy: () => {
    if (!isHapticsSupported()) return;
    try {
      navigator.vibrate(45);
    } catch {}
  },

  /**
   * Double-pulse pattern for successful transactions (payment collected, order recorded, DPR submitted)
   */
  success: () => {
    if (!isHapticsSupported()) return;
    try {
      navigator.vibrate([25, 40, 30]);
    } catch {}
  },

  /**
   * Pulsing pattern for warnings or inventory stock alert
   */
  warning: () => {
    if (!isHapticsSupported()) return;
    try {
      navigator.vibrate([35, 40, 35]);
    } catch {}
  },

  /**
   * Sharp alert pattern for errors or rejected status
   */
  error: () => {
    if (!isHapticsSupported()) return;
    try {
      navigator.vibrate([50, 60, 50, 60, 50]);
    } catch {}
  },

  /**
   * Micro-tick for picker wheel, slider, or barcode scan detection
   */
  selection: () => {
    if (!isHapticsSupported()) return;
    try {
      navigator.vibrate(8);
    } catch {}
  }
};

export default haptics;
