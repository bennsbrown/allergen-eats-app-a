
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  businessName?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
}

const AUTH_STORAGE_KEY = '@auth_user';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
  });

  useEffect(() => {
    // Load user from storage on mount
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userJson = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (userJson) {
        const user = JSON.parse(userJson);
        console.log('Loaded user from storage:', user.email);
        setAuthState({
          user,
          loading: false,
        });
      } else {
        setAuthState({
          user: null,
          loading: false,
        });
      }
    } catch (error) {
      console.log('Error loading user:', error);
      setAuthState({
        user: null,
        loading: false,
      });
    }
  };

  const signUp = async (email: string, password: string, businessName: string) => {
    try {
      // Simple local authentication - in production, this would call your backend
      const user: User = {
        id: Date.now().toString(),
        email,
        businessName,
      };

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      
      setAuthState({
        user,
        loading: false,
      });

      console.log('User signed up:', email);
      return { user };
    } catch (error) {
      console.log('Error signing up:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Simple local authentication - in production, this would validate against your backend
      const user: User = {
        id: Date.now().toString(),
        email,
      };

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      
      setAuthState({
        user,
        loading: false,
      });

      console.log('User signed in:', email);
      return { user };
    } catch (error) {
      console.log('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setAuthState({
        user: null,
        loading: false,
      });
      console.log('User signed out');
    } catch (error) {
      console.log('Error signing out:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    // Simple placeholder - in production, this would call your backend
    console.log('Password reset requested for:', email);
    return Promise.resolve();
  };

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };
}
