'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AuthUser,
  RegisterPayload,
  LoginPayload,
  UpdateProfilePayload,
  apiLogin,
  apiRegister,
  apiGetMe,
  apiLogout,
  apiUpdateProfile,
  getStoredAccessToken,
  getStoredUser,
  clearAuthSession,
} from './auth-api';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<AuthUser>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  isMunicipal: boolean;
  isCitizen: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize session from localStorage cache and verify with /me
  const initSession = useCallback(async () => {
    try {
      const cachedUser = getStoredUser();
      const token = getStoredAccessToken();

      if (cachedUser && token) {
        setUser(cachedUser);
      }

      if (token) {
        try {
          const freshUser = await apiGetMe();
          setUser(freshUser);
        } catch (fetchErr) {
          // If token verification failed, check if 401 or network
          console.warn('Session verification notice:', fetchErr);
          // If cachedUser exists, keep it in offline/demo mode, otherwise clear
          if (!cachedUser) {
            clearAuthSession();
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error('Auth initialization error:', e);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initSession();
  }, [initSession]);

  const login = async (payload: LoginPayload): Promise<AuthUser> => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await apiLogin(payload);
      setUser(response.user);
      return response.user;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload): Promise<AuthUser> => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await apiRegister(payload);
      setUser(response.user);
      return response.user;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await apiLogout();
    } finally {
      setUser(null);
      setError(null);
      setIsLoading(false);
    }
  };

  const updateProfile = async (payload: UpdateProfilePayload): Promise<AuthUser> => {
    setError(null);
    try {
      const updated = await apiUpdateProfile(payload);
      setUser(updated);
      return updated;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile.';
      setError(msg);
      throw err;
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const fresh = await apiGetMe();
      setUser(fresh);
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
    }
  };

  const clearError = () => setError(null);

  const isMunicipal = user?.role === 'municipal' || user?.role === 'admin' || user?.role === 'responder';
  const isCitizen = user?.role === 'citizen';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        error,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
        clearError,
        isMunicipal,
        isCitizen,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
