"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface AuthContextType {
  isAdmin: boolean;
  toggleAdmin: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedIsAdmin = localStorage.getItem('isAdmin') === 'true';
      setIsAdmin(storedIsAdmin);
    } catch (error) {
      console.error("Could not access localStorage.", error);
    } finally {
        setIsLoading(false);
    }
  }, []);

  const toggleAdmin = useCallback(() => {
    setIsAdmin(prev => {
      const newState = !prev;
      try {
        localStorage.setItem('isAdmin', String(newState));
      } catch (error) {
        console.error("Could not access localStorage.", error);
      }
      return newState;
    });
  }, []);

  const value = { isAdmin, toggleAdmin, isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
