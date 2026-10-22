import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, getToken, setToken, clearToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  switchDemoUser: (username: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      if (getToken()) {
        const res = await api.getMe();
        if (res.success && res.data) {
          setUser(res.data);
          localStorage.setItem('ccb_user', JSON.stringify(res.data));
        } else {
          clearToken();
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.login({ username, password });
      if (res.success && res.data) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('ccb_user', JSON.stringify(res.data.user));
      } else {
        throw new Error(res.error || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const switchDemoUser = async (username: string, password: string) => {
    await login(username, password);
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchDemoUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
