import { useState, useCallback } from 'react';
import { getCurrentCoordinates, isWithinGeofence } from '../utils/geolocation';
import haptics from '../utils/haptics';

/**
 * Custom React hook for mobile geolocation and geofence verification
 */
export default function useGeolocation() {
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const acquireLocation = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const position = await getCurrentCoordinates(options);
      setCoords(position);
      haptics.impact('light');
      return position;
    } catch (err) {
      setError(err.message);
      haptics.warning();
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkGeofence = useCallback((siteCoords, radiusMeters = 300) => {
    if (!coords) return { inGeofence: false, distanceMeters: Infinity, allowedRadius: radiusMeters };
    return isWithinGeofence(coords, siteCoords, radiusMeters);
  }, [coords]);

  const clearLocation = useCallback(() => {
    setCoords(null);
    setError(null);
  }, []);

  return {
    coords,
    loading,
    error,
    acquireLocation,
    checkGeofence,
    clearLocation
  };
}
