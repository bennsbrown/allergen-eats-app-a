
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// These will be automatically populated when you connect Supabase in Natively
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types
export interface Business {
  id: string;
  created_at: string;
  email: string;
  business_name: string;
  google_sheet_url: string | null;
  qr_code_data: string;
  user_id: string;
}

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '';
};
