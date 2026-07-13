import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI, tenantsAPI } from '../services/api';

const AuthContext = createContext();

// Apply tenant branding to CSS variables immediately
const applyTenantBranding = (tenant) => {
  if (!tenant) return;
  const color = tenant.branding?.primaryColor || tenant.settings?.primaryColor;
  const logo  = tenant.branding?.logo || tenant.settings?.logo || null;
  if (color) {
    // Save so ThemeContext preserves it across light/dark toggles
    localStorage.setItem('tenant_primary_color', color);
    const root = document.documentElement;
    const r = parseInt(color.slice(1,3),16);
    const g = parseInt(color.slice(3,5),16);
    const b = parseInt(color.slice(5,7),16);
    const darker = '#' + [r,g,b].map(v => Math.max(0,v-25).toString(16).padStart(2,'0')).join('');
    const gradient = `linear-gradient(to right, ${color}, ${darker})`;
    root.style.setProperty('--primary-color', color);
    root.style.setProperty('--primary-hover', darker);
    root.style.setProperty('--primary-ring', `rgba(${r},${g},${b},0.25)`);
    root.style.setProperty('--color-accent-surface', `rgba(${r},${g},${b},0.08)`);
    root.style.setProperty('--gradient-from', color);
    root.style.setProperty('--gradient-to', darker);
    root.style.setProperty('--brand-header-bg', gradient);
    root.style.setProperty('--btn-brand-bg', gradient);
    root.style.setProperty('--sidebar-nav-active', `rgba(${r},${g},${b},0.15)`);
    root.style.setProperty('--sidebar-nav-hover', `rgba(${r},${g},${b},0.08)`);
  } else {
    localStorage.removeItem('tenant_primary_color');
  }
  if (logo) {
    localStorage.setItem('tenant_logo', logo);
  } else {
    localStorage.removeItem('tenant_logo');
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Initialize with cached data immediately for instant rendering
  const getInitialUser = () => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  };

  const [user, setUser] = useState(getInitialUser());
  const [loading, setLoading] = useState(false); // Start as false since we 
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Session persistence and refresh mechanism
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          const response = await authAPI.getMe();
          const userData = response.data;
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          applyTenantBranding(userData.tenant);
        } catch (validationError) {
          // Token is expired or invalid - clear session and redirect to login
          const status = validationError.response?.status;
          if (status === 401) {
            console.warn('Session expired, clearing login state');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('tenantId');
            localStorage.removeItem('tenantName');
            setToken(null);
            setUser(null);
          } else if (status === 403) {
            console.warn('Session is valid but access is forbidden:', validationError.response?.data?.message);
          }
        }
      }
    };

    initializeAuth();

    // Set up periodic token refresh (every 30 minutes)
    const refreshInterval = setInterval(async () => {
      if (token && user) {
        try {
          const response = await authAPI.getMe();
          const userData = response.data;
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
        } catch (error) {
          // Don't log out on refresh failures, just log the error
          console.warn('Token refresh failed:', error.message);
        }
      }
    }, 30 * 60 * 1000); // 30 minutes

    // Online/offline detection for session recovery
    const handleOnline = () => {
      setIsOnline(true);
      console.log('Connection restored, validating session...');
      if (token && user) {
        // Revalidate session when coming back online
        authAPI.getMe().then(response => {
          const userData = response.data;
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('Session validated successfully');
        }).catch(error => {
          console.warn('Session validation failed after reconnect:', error.message);
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('Connection lost, preserving session');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
      const response = await authAPI.login({ email: normalizedEmail, password });
      const { token: newToken, user: userData, requiresPasswordChange } = response.data;

      // Store tenant info alongside user
      const userWithTenant = {
        ...userData,
        tenant: userData.tenant || null
      };

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userWithTenant));
      if (userData.tenant) {
        localStorage.setItem('tenantId', userData.tenant.id || userData.tenant._id);
        localStorage.setItem('tenantName', userData.tenant.name);
      }
      setToken(newToken);
      setUser(userWithTenant);
      applyTenantBranding(userWithTenant.tenant);

      return {
        success: true,
        user: userWithTenant,
        requiresPasswordChange: requiresPasswordChange || false
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenantId');
    localStorage.removeItem('tenantName');

    authAPI.logout().finally(() => {
      setToken(null);
      setUser(null);
    });
  };

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    login,
    logout,
    loading,
    token,
    isOnline,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
