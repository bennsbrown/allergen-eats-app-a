
import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isConfigured: isSupabaseConfigured(),
  });

  useEffect(() => {
    if (!authState.isConfigured) {
      setAuthState(prev => ({ ...prev, loading: false }));
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email);
      setAuthState({
        user: session?.user ?? null,
        session: session,
        loading: false,
        isConfigured: true,
      });
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.email);
      setAuthState({
        user: session?.user ?? null,
        session: session,
        loading: false,
        isConfigured: true,
      });
    });

    return () => subscription.unsubscribe();
  }, [authState.isConfigured]);

  const signUp = async (email: string, password: string, businessName: string) => {
    if (!authState.isConfigured) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          business_name: businessName,
        },
      },
    });

    if (error) throw error;

    // Create business record
    if (data.user) {
      const businessId = data.user.id;
      const qrCodeData = `https://yourapp.com/menu/${businessId}`;
      
      const { error: insertError } = await supabase
        .from('businesses')
        .insert({
          user_id: data.user.id,
          email: email,
          business_name: businessName,
          qr_code_data: qrCodeData,
        });

      if (insertError) {
        console.error('Error creating business record:', insertError);
        throw insertError;
      }
    }

    return data;
  };

  const signIn = async (email: string, password: string) => {
    if (!authState.isConfigured) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    if (!authState.isConfigured) {
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    if (!authState.isConfigured) {
      throw new Error('Supabase is not configured');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };
}
