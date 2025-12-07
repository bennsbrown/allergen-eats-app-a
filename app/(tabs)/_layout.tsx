
import React from 'react';
import { Platform } from 'react-native';
import { NativeTabs, Label } from 'expo-router/unstable-native-tabs';
import { Stack, useRouter } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { colors } from '@/styles/commonStyles';
import { useBusiness } from '@/hooks/useBusiness';

export default function TabLayout() {
  const router = useRouter();
  const { business } = useBusiness();
  
  // Get business code for navigation
  const businessCode = business?.unique_identifier || "";

  // Define the tabs configuration without icons
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'house.fill',
      label: 'Customer',
    },
    {
      name: 'profile',
      route: '/(tabs)/profile',
      icon: 'briefcase.fill',
      label: 'Business',
    },
  ];

  // Handle Customer tab press - navigate to customer menu with business code if logged in
  const handleCustomerTabPress = () => {
    if (business && businessCode) {
      console.log('Business user tapping Customer tab, navigating with code:', businessCode);
      router.push({
        pathname: '/(tabs)/(home)/',
        params: { code: businessCode },
      });
    } else {
      console.log('Regular customer view, navigating normally');
      router.push('/(tabs)/(home)/');
    }
  };

  // Handle Business tab press - normal navigation
  const handleBusinessTabPress = () => {
    console.log('Navigating to Business tab');
    router.push('/(tabs)/profile');
  };

  // Use NativeTabs for iOS, custom FloatingTabBar for Android and Web
  if (Platform.OS === 'ios') {
    return (
      <NativeTabs>
        <NativeTabs.Trigger 
          name="(home)"
          onPress={handleCustomerTabPress}
        >
          <Label>Customer</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger 
          name="profile"
          onPress={handleBusinessTabPress}
        >
          <Label>Business</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  // For Android and Web, use Stack navigation with custom floating tab bar
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen name="(home)" />
        <Stack.Screen name="profile" />
      </Stack>
      <FloatingTabBar 
        tabs={tabs} 
        onCustomerPress={handleCustomerTabPress}
        onBusinessPress={handleBusinessTabPress}
      />
    </>
  );
}
