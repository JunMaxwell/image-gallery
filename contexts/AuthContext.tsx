import React, { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { message } from 'antd';
import { login as apiLogin, logout as apiLogout } from '../pages/api/api';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const token = await apiLogin(email, password);
      localStorage.setItem('token', token);
      setIsAuthenticated(true);
      message.success('Login successful');
      router.push('/');
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('An unexpected error occurred');
      }
    }
  };

  const logout = () => {
    apiLogout();
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};