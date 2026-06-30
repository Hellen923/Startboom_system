import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

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
