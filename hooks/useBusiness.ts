
import { useState, useEffect } from 'react';
import { supabase, Business, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from './useAuth';

export function useBusiness() {
  const { user, isConfigured } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured || !user) {
      setLoading(false);
      return;
    }

    fetchBusiness();
  }, [user, isConfigured]);

  const fetchBusiness = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching business:', error);
        throw error;
      }

      console.log('Fetched business:', data);
      setBusiness(data);
    } catch (error) {
      console.error('Error in fetchBusiness:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateGoogleSheetUrl = async (url: string) => {
    if (!user || !business) return;

    try {
      const { data, error } = await supabase
        .from('businesses')
        .update({ google_sheet_url: url })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      console.log('Updated Google Sheet URL:', url);
      setBusiness(data);
      return data;
    } catch (error) {
      console.error('Error updating Google Sheet URL:', error);
      throw error;
    }
  };

  const updateBusinessName = async (name: string) => {
    if (!user || !business) return;

    try {
      const { data, error } = await supabase
        .from('businesses')
        .update({ business_name: name })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      console.log('Updated business name:', name);
      setBusiness(data);
      return data;
    } catch (error) {
      console.error('Error updating business name:', error);
      throw error;
    }
  };

  return {
    business,
    loading,
    updateGoogleSheetUrl,
    updateBusinessName,
    refreshBusiness: fetchBusiness,
  };
}
