/**
 * Mobile-First Geolocation & Geofencing Engine
 * Handles GPS coordinate acquisition, accuracy filtering, Haversine distance calculations,
 * and geofenced site validation for mobile field operations.
 */

/**
 * Get current device coordinates via native browser Geolocation API
 * @param {Object} [options]
 * @param {boolean} [options.enableHighAccuracy=true]
 * @param {number} [options.timeout=10000] - Timeout in milliseconds
 * @param {number} [options.maximumAge=30000] - Cache age in milliseconds
 * @returns {Promise<{ latitude: number, longitude: number, accuracy: number, timestamp: number }>}
 */
export function getCurrentCoordinates(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Geolocation is not supported by your browser or device.'));
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
      ...options
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
          altitude: position.coords.altitude,
          timestamp: position.timestamp || Date.now()
        });
      },
      (error) => {
        let msg = 'Unable to retrieve your current location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = 'Location access was denied. Please allow location permissions in your browser or device settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            msg = 'Location information is currently unavailable. Ensure GPS is enabled.';
            break;
          case error.TIMEOUT:
            msg = 'Location request timed out. Please try again in an area with clear GPS or cellular reception.';
            break;
        }
        const err = new Error(msg);
        err.code = error.code;
        reject(err);
      },
      defaultOptions
    );
  });
}

/**
 * Calculate distance between two GPS coordinates in meters using the Haversine formula
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in meters
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return Infinity;
  }

  const R = 6371e3; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Validate whether current coordinates fall within an allowed geofence radius
 * @param {{ latitude: number, longitude: number }} currentCoords
 * @param {{ latitude: number, longitude: number }} targetCoords
 * @param {number} [radiusMeters=300] - Allowed radius (default 300 meters)
 * @returns {{ inGeofence: boolean, distanceMeters: number, allowedRadius: number }}
 */
export function isWithinGeofence(currentCoords, targetCoords, radiusMeters = 300) {
  if (!currentCoords?.latitude || !targetCoords?.latitude) {
    return { inGeofence: false, distanceMeters: Infinity, allowedRadius: radiusMeters };
  }

  const dist = calculateDistanceMeters(
    currentCoords.latitude,
    currentCoords.longitude,
    targetCoords.latitude,
    targetCoords.longitude
  );

  return {
    inGeofence: dist <= radiusMeters,
    distanceMeters: dist,
    allowedRadius: radiusMeters
  };
}

/**
 * Format coordinates to human-readable string (e.g. "28.6139° N, 77.2090° E")
 */
export function formatCoordinates(lat, lng) {
  if (lat === undefined || lng === undefined) return 'N/A';
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

/**
 * Get Google Maps navigation URL for a given coordinate pair
 */
export function getGoogleMapsUrl(lat, lng) {
  if (!lat || !lng) return '#';
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
