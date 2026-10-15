import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.auth.getMe();
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
      setError(null);
    } catch (err) {
      setUser(null);
      // Don't treat unauthenticated as fatal error on initial load
      if (err.status !== 401) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (credentials) => {
    try {
      setError(null);
      const res = await api.auth.login(credentials);
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        if (res.data.token) {
          localStorage.setItem('eduaccess_token', res.data.token);
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
        if (res.data.token) {
          localStorage.setItem('eduaccess_token', res.data.token);
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
      localStorage.removeItem('eduaccess_token');
      setUser(null);
      setError(null);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const res = await api.auth.updateProfile(profileData);
      if (res.success && res.data?.user) {
        setUser(res.data.user);
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
      localStorage.removeItem('eduaccess_token');
      setUser(null);
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
    refreshUser: fetchCurrentUser
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
