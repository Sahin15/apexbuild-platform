import { useState, useEffect, useCallback } from 'react';
import {
  isNotificationSupported,
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToWebPush,
  unsubscribeFromWebPush,
  triggerTestPush,
  sendLocalNotification
} from '../utils/notifications';

export function useNotifications() {
  const [supported, setSupported] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    setSupported(isNotificationSupported());
    setPushSupported(isPushSupported());
    setPermission(getNotificationPermission());
  }, []);

  const request = useCallback(async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    return res;
  }, []);

  const subscribe = useCallback(async (platform) => {
    setIsSubscribing(true);
    try {
      const res = await subscribeToWebPush(platform);
      setPermission(getNotificationPermission());
      return res;
    } finally {
      setIsSubscribing(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    return unsubscribeFromWebPush();
  }, []);

  const testPush = useCallback(async () => {
    return triggerTestPush();
  }, []);

  const notify = useCallback(async (title, options) => {
    return sendLocalNotification(title, options);
  }, []);

  return {
    supported,
    pushSupported,
    permission,
    isGranted: permission === 'granted',
    isSubscribing,
    requestPermission: request,
    subscribeToWebPush: subscribe,
    unsubscribeFromWebPush: unsubscribe,
    triggerTestPush: testPush,
    sendNotification: notify
  };
}

export default useNotifications;
