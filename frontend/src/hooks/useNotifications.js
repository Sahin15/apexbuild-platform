import { useState, useEffect, useCallback } from 'react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendLocalNotification
} from '../utils/notifications';

export function useNotifications() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    setSupported(isNotificationSupported());
    setPermission(getNotificationPermission());
  }, []);

  const request = useCallback(async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    return res;
  }, []);

  const notify = useCallback(async (title, options) => {
    return sendLocalNotification(title, options);
  }, []);

  return {
    supported,
    permission,
    isGranted: permission === 'granted',
    requestPermission: request,
    sendNotification: notify
  };
}

export default useNotifications;
