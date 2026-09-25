import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, ConfigStatusResponse } from '../types';
import { apiFetch, setStoredToken } from '../utils/api';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  firebaseConfigured: boolean;
  missingKeys: string[];
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (fullName: string, email: string, password: string, confirmPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [firebaseConfigured, setFirebaseConfigured] = useState<boolean>(true);
  const [missingKeys, setMissingKeys] = useState<string[]>([]);

  // Check backend Firebase configuration state
  const checkConfigStatus = async () => {
    try {
      const res = await apiFetch('/api/auth/config-status');
      if (res.ok) {
        const data: ConfigStatusResponse = await res.json();
        setFirebaseConfigured(data.firebaseConfigured);
        setMissingKeys(data.missingKeys || []);
      }
    } catch {
      // Backend may be starting or offline
    }
  };

  // Check active session on app load
  const checkSession = async () => {
    try {
      const res = await apiFetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          if (data.token) {
            setStoredToken(data.token);
          }
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConfigStatus();
    checkSession();
  }, []);

  const signup = async (fullName: string, email: string, password: string, confirmPassword: string) => {
    try {
      const res = await apiFetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, confirmPassword }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Failed to create account.',
        };
      }

      if (data.token) {
        setStoredToken(data.token);
      }

      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network error while attempting to sign up.',
      };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Invalid credentials or login failed.',
        };
      }

      if (data.token) {
        setStoredToken(data.token);
      }

      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network error while attempting to log in.',
      };
    }
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      setStoredToken(null);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    await checkSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        firebaseConfigured,
        missingKeys,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
