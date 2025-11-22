import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://puahgsiuubtdagzywwfl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1YWhnc2l1dWJ0ZGFnenl3d2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NzM2NzQsImV4cCI6MjA3ODU0OTY3NH0.Fee6KtNvVa-46kijvxgGi11wdDqLGLh2JlymKW8m9qM";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
