
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Button from "@/components/button";
import { SystemBars } from "react-native-edge-to-edge";
import { useColorScheme, Alert } from "react-native";
import React, { useEffect, useState } from "react";
import { WidgetProvider } from "@/contexts/WidgetContext";
import * as SplashScreen from "expo-splash-screen";
import "react-native-reanimated";
import { useFonts } from "expo-font";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { useNetworkState } from "expo-network";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const { isConnected } = useNetworkState();
  const colorScheme = useColorScheme();
  const [termsAccepted, setTermsAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    checkTermsAcceptance();
  }, []);

  const checkTermsAcceptance = async () => {
    try {
      const accepted = await AsyncStorage.getItem('termsAccepted');
      setTermsAccepted(accepted === 'true');
      console.log('Terms acceptance status:', accepted);
      
      if (accepted !== 'true') {
        router.replace('/terms-acceptance');
      }
    } catch (error) {
      console.error('Error checking terms acceptance:', error);
      setTermsAccepted(false);
      router.replace('/terms-acceptance');
    }
  };

  if (!loaded || termsAccepted === null) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <WidgetProvider>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <SystemBars style="auto" />
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="terms-acceptance" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal"
              options={{
                presentation: "modal",
                headerShown: true,
                title: "Modal",
                headerRight: () => (
                  <Button onPress={() => router.back()}>Close</Button>
                ),
              }}
            />
            <Stack.Screen
              name="formsheet"
              options={{
                presentation: "formSheet",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="transparent-modal"
              options={{
                presentation: "transparentModal",
                animation: "fade",
                headerShown: false,
              }}
            />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </WidgetProvider>
    </GestureHandlerRootView>
  );
}
