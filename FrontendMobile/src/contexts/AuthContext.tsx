// Auth Context
// Manages authentication state throughout the app

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { subscribeToAuthChanges, getCurrentUserToken } from '../services/firebaseAuthService';
import { apiRequest } from '../services/apiClient';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: (firebaseToken: string, userData?: any) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
          
          // Send token to your backend to verify and get user data
          // Uncomment if you need to sync with backend
          /*
          const response = await apiRequest('/api/auth/firebase-verify', {
            method: 'POST',
            body: JSON.stringify({ token: idToken }),
          });
          
          if (response?.token) {
            // Store backend token if different from Firebase token
            setToken(response.token);
          }
          */
        } catch (error) {
          console.error('Error getting token:', error);
        }
      } else {
        setToken(null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (firebaseToken: string, userData?: any) => {
    setToken(firebaseToken);
    // Additional login logic if needed
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  const refreshToken = async (): Promise<string | null> => {
    if (!user) return null;
    
    try {
      const newToken = await user.getIdToken(true); // Force refresh
      setToken(newToken);
      return newToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    token,
    login,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
