import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (userData: {
    name: string;
    email: string;
    phoneNumber: string;
    address: string;
    password: string;
  }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUser: (userData: { name: string; email: string; phoneNumber: string }) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      if (authService.isAuthenticated()) {
        const storedUser = authService.getStoredUser();
        if (storedUser) {
          setUser(storedUser);
          // Optionally refresh user data from server
          const response = await authService.getCurrentUser();
          if (response.success && response.user) {
            setUser(response.user);
            authService.storeAuth(localStorage.getItem('authToken')!, response.user);
          }
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      authService.logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      
      if (response.success && response.token && response.user) {
        authService.storeAuth(response.token, response.user);
        setUser(response.user);
        return { success: true };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: 'Login failed. Please try again.' };
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    phoneNumber: string;
    address: string;
    password: string;
  }) => {
    try {
      const response = await authService.register(userData);
      
      if (response.success && response.token && response.user) {
        authService.storeAuth(response.token, response.user);
        setUser(response.user);
        return { success: true };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateUser = async (userData: { name: string; email: string; phoneNumber: string }) => {
    try {
      const response = await authService.updateProfile(userData);
      
      if (response.success && response.user) {
        setUser(response.user);
        authService.storeAuth(localStorage.getItem('authToken')!, response.user);
        return { success: true };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: 'Profile update failed. Please try again.' };
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
