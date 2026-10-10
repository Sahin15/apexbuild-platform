import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useLocation } from 'react-router-dom';
import { getOSConfig } from '../config/osThemes';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  const osConfig = useMemo(() => {
    return getOSConfig(user?.organizationId?.businessType, location.pathname);
  }, [user?.organizationId?.businessType, location.pathname]);

  const [customTheme, setCustomThemeState] = useState(() => {
    const branding = user?.organizationId?.settings?.branding;
    return {
      primaryColor: branding?.primaryColor || null,
      secondaryColor: branding?.secondaryColor || null,
      customAppName: branding?.customAppName || null,
      logoUrl: branding?.logoUrl || null
    };
  });

  // Keep in sync with user updates from AuthContext
  useEffect(() => {
    const branding = user?.organizationId?.settings?.branding;
    if (branding) {
      setCustomThemeState({
        primaryColor: branding.primaryColor || null,
        secondaryColor: branding.secondaryColor || null,
        customAppName: branding.customAppName || null,
        logoUrl: branding.logoUrl || null
      });
    }
  }, [user?.organizationId?.settings?.branding]);

  // Compute active effective theme
  const activePrimary = customTheme.primaryColor || osConfig.defaultPrimary || '#2563EB';
  const activeSecondary = customTheme.secondaryColor || osConfig.defaultSecondary || '#0891B2';

  // Inject CSS custom properties on document.documentElement so the whole app updates in real-time
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', activePrimary);
    root.style.setProperty('--theme-secondary', activeSecondary);
    root.style.setProperty('--theme-primary-soft', `${activePrimary}18`);
    root.style.setProperty('--theme-secondary-soft', `${activeSecondary}18`);
    root.style.setProperty('--theme-primary-border', `${activePrimary}35`);
  }, [activePrimary, activeSecondary]);

  const setCustomTheme = (themeData) => {
    setCustomThemeState(prev => ({ ...prev, ...themeData }));
    if (user?.organizationId) {
      user.organizationId.settings = user.organizationId.settings || {};
      user.organizationId.settings.branding = {
        ...(user.organizationId.settings.branding || {}),
        ...themeData
      };
      localStorage.setItem('user', JSON.stringify(user));
    }
  };

  return (
    <ThemeContext.Provider value={{
      osConfig,
      primaryColor: activePrimary,
      secondaryColor: activeSecondary,
      customAppName: customTheme.customAppName,
      logoUrl: customTheme.logoUrl,
      setCustomTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useBrandTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useBrandTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
