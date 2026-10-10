import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const EntitlementContext = createContext(null);

export const EntitlementProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [entitlements, setEntitlements] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEntitlements = useCallback(async () => {
    if (!token || !isAuthenticated) {
      setEntitlements(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get('/auth/entitlements');
      if (res.data?.data) {
        setEntitlements(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load tenant entitlements:', error);
    } finally {
      setLoading(false);
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    fetchEntitlements();
  }, [fetchEntitlements, user?._id]);

  /**
   * Check if a feature is entitled for current tenant.
   * Superadmins always bypass feature locks.
   */
  const hasEntitlement = useCallback((featureKey) => {
    if (user?.platformRole === 'SUPER_ADMIN') {
      return true;
    }
    if (!entitlements || !entitlements.features) {
      return false;
    }
    return Boolean(entitlements.features[featureKey]);
  }, [user, entitlements]);

  /**
   * Retrieve a numeric/string limit (e.g. maxProjects, storageGb)
   */
  const getUsageLimit = useCallback((limitKey, defaultValue = Infinity) => {
    if (user?.platformRole === 'SUPER_ADMIN') {
      return Infinity;
    }
    if (!entitlements || !entitlements.limits) {
      return defaultValue;
    }
    return entitlements.limits[limitKey] !== undefined ? entitlements.limits[limitKey] : defaultValue;
  }, [user, entitlements]);

  const value = {
    entitlements,
    loading,
    tier: entitlements?.tier || 'STARTER',
    planName: entitlements?.planName || 'Starter Plan',
    osType: entitlements?.osType || user?.organizationId?.businessType || 'CONTRACTOR',
    hasEntitlement,
    getUsageLimit,
    refreshEntitlements: fetchEntitlements,
  };

  return (
    <EntitlementContext.Provider value={value}>
      {children}
    </EntitlementContext.Provider>
  );
};

export const useEntitlements = () => {
  const context = useContext(EntitlementContext);
  if (!context) {
    throw new Error('useEntitlements must be used within an EntitlementProvider');
  }
  return context;
};

export default EntitlementContext;
