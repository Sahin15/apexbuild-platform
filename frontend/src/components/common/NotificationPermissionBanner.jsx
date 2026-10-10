import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import useNotifications from '../../hooks/useNotifications';

const STORAGE_KEY = 'apex_notification_prompt_dismissed';

export const NotificationPermissionBanner = () => {
  const { supported, permission, requestPermission, sendNotification } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!supported) return;

    const dismissed = localStorage.getItem(STORAGE_KEY);
    // Show only if permission is default and user hasn't dismissed recently
    if (permission === 'default' && !dismissed) {
      // Delay slightly for smooth page entry
      const timer = setTimeout(() => setIsVisible(true), 2500);
      return () => clearTimeout(timer);
    }
  }, [supported, permission]);

  const handleEnable = async () => {
    const res = await requestPermission();
    setIsVisible(false);
    if (res === 'granted') {
      toast.success('Mobile push alerts enabled!');
      sendNotification('🔔 ApexBuild Notifications Active', {
        body: 'You will receive real-time operational alerts for orders, deliveries, and stock updates.',
        tag: 'welcome-notification'
      });
    } else if (res === 'denied') {
      toast('Notification permission was blocked in browser settings', { icon: 'ℹ️' });
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in slide-in-from-bottom duration-300 pointer-events-none">
      <div className="bg-slate-900/95 text-white backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-slate-700 pointer-events-auto flex items-start gap-3.5">
        <div className="p-2.5 bg-indigo-600/30 text-indigo-400 rounded-xl shrink-0 mt-0.5 border border-indigo-500/30">
          <Bell className="w-5 h-5 animate-bounce" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Enable Mobile Alerts</h4>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
            Get instant push notifications for low inventory stock, engineer DPR approvals, and delivery updates.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={handleEnable}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-md touch-manipulation"
            >
              Enable Alerts
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="px-3 py-1.5 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default NotificationPermissionBanner;
