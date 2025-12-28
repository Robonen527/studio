"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase app (if not already initialized)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  // For this app, any logged-in user is considered an admin.
  // This logic can be expanded later with custom claims if needed.
  const isAdmin = !!user;

  const value = { user, isAdmin, isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
