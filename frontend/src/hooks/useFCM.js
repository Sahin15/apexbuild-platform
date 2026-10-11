import { useState, useEffect, useCallback } from 'react';
import { initFirebase, requestFcmToken, unregisterFcmToken, onForegroundMessage } from '../services/firebase';
import api from '../services/api';
import toast from 'react-hot-toast';

export function useFCM() {
  const [fcmToken, setFcmToken] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('apex_fcm_token') || '' : '';
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      initFirebase().catch(() => {});
    }
  }, []);

  const register = useCallback(async (platform = 'ALL') => {
    setIsRegistering(true);
    try {
      const res = await requestFcmToken(platform);
      if (res.success && res.token) {
        setFcmToken(res.token);
        return res;
      }
      return res;
    } finally {
      setIsRegistering(false);
    }
  }, []);

  const unregister = useCallback(async () => {
    const res = await unregisterFcmToken();
    setFcmToken('');
    return res;
  }, []);

  const sendTest = useCallback(async () => {
    const res = await api.post('/fcm/test');
    return res.data;
  }, []);

  return {
    fcmToken,
    hasToken: !!fcmToken,
    isSupported,
    isRegistering,
    registerFCM: register,
    unregisterFCM: unregister,
    sendTestFCM: sendTest
  };
}

export default useFCM;
