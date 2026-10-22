import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'eduaccess_token';
const USER_KEY = 'eduaccess_user';

/**
 * Safely read cached auth credentials from localStorage synchronously.
 * This prevents auth flicker on page refresh by restoring the existing user immediately.
 */
function getInitialAuthState() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    if (token && userStr) {
      const parsedUser = JSON.parse(userStr);
      if (parsedUser && typeof parsedUser === 'object' && (parsedUser._id || parsedUser.email)) {
        return {
          user: parsedUser,
          loading: false,
          hasStoredToken: true
        };
      }
    }
    if (token) {
      // Stored token exists, but user profile is not cached yet (e.g. legacy session)
      return {
        user: null,
        loading: true,
        hasStoredToken: true
      };
    }
  } catch (err) {
    console.warn('Failed to parse cached auth state:', err);
  }

  // No stored session: unauthenticated visitor
  return {
    user: null,
    loading: false,
    hasStoredToken: false
  };
}

export function AuthProvider({ children }) {
  const [initialState] = useState(getInitialAuthState);
  const [user, setUser] = useState(initialState.user);
  const [loading, setLoading] = useState(initialState.loading);
  const [error, setError] = useState(null);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchCurrentUser = useCallback(async (options = {}) => {
    const { forceLoading = false } = options;
    try {
      if (forceLoading && isMountedRef.current) {
        setLoading(true);
      }
      const res = await api.auth.getMe();
      if (!isMountedRef.current) return;

      if (res.success && res.data?.user) {
        setUser(res.data.user);
        try {
          localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
        } catch (e) {
          console.warn('Failed to cache user profile in localStorage:', e);
        }
      } else {
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
      setError(null);
    } catch (err) {
      if (!isMountedRef.current) return;

      // 401 indicates invalid or expired session -> clear credentials
      if (err.status === 401) {
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } else {
        // Non-auth error (e.g. network/server offline): keep cached session if valid
        console.warn('Session verification notice:', err.message);
        if (err.status && err.status !== 401) {
          setError(err.message);
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // Validate session in background on initial mount
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (credentials) => {
    try {
      setError(null);
      const res = await api.auth.login(credentials);
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        try {
          localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
          if (res.data.token) {
            localStorage.setItem(TOKEN_KEY, res.data.token);
          }
        } catch (e) {
          console.warn('Failed to persist session to localStorage:', e);
        }
        return { success: true, user: res.data.user };
      }
      throw new Error(res.error?.message || 'Login failed');
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (credentials) => {
    try {
      setError(null);
      const res = await api.auth.register(credentials);
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        try {
          localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
          if (res.data.token) {
            localStorage.setItem(TOKEN_KEY, res.data.token);
          }
        } catch (e) {
          console.warn('Failed to persist session to localStorage:', e);
        }
        return { success: true, user: res.data.user };
      }
      throw new Error(res.error?.message || 'Registration failed');
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (err) {
      console.warn('Logout request failed, clearing local state anyway', err);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setUser(null);
      setError(null);
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const res = await api.auth.updateProfile(profileData);
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        try {
          localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
        } catch (e) {
          console.warn('Failed to update cached profile in localStorage:', e);
        }
        return { success: true, user: res.data.user };
      }
      throw new Error(res.error?.message || 'Failed to update profile');
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteAccount = async (password) => {
    try {
      setError(null);
      await api.auth.deleteAccount(password);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setUser(null);
      setLoading(false);
      return { success: true };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    deleteAccount,
    refreshUser: () => fetchCurrentUser({ forceLoading: true })
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

