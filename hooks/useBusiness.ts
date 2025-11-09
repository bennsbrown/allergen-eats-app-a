
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './useAuth';

export interface Business {
  id: string;
  created_at: string;
  email: string;
  business_name: string;
  google_sheet_url: string | null;
  qr_code_data: string;
  user_id: string;
}

const BUSINESS_STORAGE_KEY = '@business_data';

export function useBusiness() {
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchBusiness();
  }, [user]);

  const fetchBusiness = async () => {
    if (!user) return;

    try {
      const businessJson = await AsyncStorage.getItem(BUSINESS_STORAGE_KEY);
      if (businessJson) {
        const businessData = JSON.parse(businessJson);
        console.log('Fetched business:', businessData);
        setBusiness(businessData);
      } else {
        // Create default business data if none exists
        const defaultBusiness: Business = {
          id: user.id,
          created_at: new Date().toISOString(),
          email: user.email,
          business_name: user.businessName || 'My Business',
          google_sheet_url: null,
          qr_code_data: `https://yourapp.com/menu/${user.id}`,
          user_id: user.id,
        };
        await AsyncStorage.setItem(BUSINESS_STORAGE_KEY, JSON.stringify(defaultBusiness));
        setBusiness(defaultBusiness);
      }
    } catch (error) {
      console.error('Error in fetchBusiness:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateGoogleSheetUrl = async (url: string) => {
    if (!user || !business) return;

    try {
      const updatedBusiness = {
        ...business,
        google_sheet_url: url,
      };

      await AsyncStorage.setItem(BUSINESS_STORAGE_KEY, JSON.stringify(updatedBusiness));
      
      console.log('Updated Google Sheet URL:', url);
      setBusiness(updatedBusiness);
      return updatedBusiness;
    } catch (error) {
      console.error('Error updating Google Sheet URL:', error);
      throw error;
    }
  };

  const updateBusinessName = async (name: string) => {
    if (!user || !business) return;

    try {
      const updatedBusiness = {
        ...business,
        business_name: name,
      };

      await AsyncStorage.setItem(BUSINESS_STORAGE_KEY, JSON.stringify(updatedBusiness));
      
      console.log('Updated business name:', name);
      setBusiness(updatedBusiness);
      return updatedBusiness;
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
