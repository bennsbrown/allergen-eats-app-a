
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Business {
  id: number;
  created_at?: string;
  unique_identifier: string;
  name: string;
  sheet_url: string | null;
  qr_slug?: string | null;
}

const BUSINESS_STORAGE_KEY = '@business_data';

export function useBusiness() {
  const [userBusinesses , setUserBusinesses] = useState<Business[]|null>(null)
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBusiness();
  }, []);

  const loadBusiness = async () => {
    try {
      const businessJson = await AsyncStorage.getItem(BUSINESS_STORAGE_KEY);
      if (businessJson) {
        const businessData = JSON.parse(businessJson);
        console.log('Loaded business from storage:', businessData);
        setUserBusinesses(businessData)
        setBusiness(businessData[0]);
      }
    } catch (error) {
      console.error('Error loading business:', error);
    } finally {
      setLoading(false);
    }
  };

  const loginWithUserId = async (businessData: Business[]) => {
    if(!businessData){
      console.log("HERE")
      throw new Error("Cannot login with empty user business data")
    }
    try {
      // Store business data in AsyncStorage
      await AsyncStorage.setItem(BUSINESS_STORAGE_KEY, JSON.stringify(businessData));
      
      console.log('Business data stored:', businessData);
      setUserBusinesses(businessData)
      setBusiness(businessData[0]);
      return businessData;
    } catch (error) {
      console.error('Error storing business data:', error);
      throw error;
    }
  };


  const logout = async () => {
    try {
      await AsyncStorage.removeItem(BUSINESS_STORAGE_KEY);
      setBusiness(null);
      setUserBusinesses(null);
      console.log('User logged out');
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  const updateGoogleSheetUrl = async (url: string) => {
    if (!business) return;

    try {
      const updatedBusiness = {
        ...business,
        sheet_url: url,
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
    if (!business) return;

    try {
      const updatedBusiness = {
        ...business,
        name: name,
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
    userBusinesses,
    business,
    loading,
    setBusiness,
    loginWithUserId,
    logout,
    updateGoogleSheetUrl,
    updateBusinessName,
    refreshBusiness: loadBusiness,
  };
}
