import {
  Inter_100Thin,
  Inter_200ExtraLight,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import {
  NotoSansThai_100Thin,
  NotoSansThai_200ExtraLight,
  NotoSansThai_300Light,
  NotoSansThai_400Regular,
  NotoSansThai_500Medium,
  NotoSansThai_600SemiBold,
  NotoSansThai_700Bold,
  NotoSansThai_800ExtraBold,
  NotoSansThai_900Black,
  useFonts,
} from '@expo-google-fonts/noto-sans-thai';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import SplashArtwork from '../components/SplashArtwork';
import 'react-native-reanimated';
import * as Notifications from 'expo-notifications'; // ✅ เพิ่ม

import { useColorScheme } from '@/hooks/use-color-scheme';
import { UserProvider } from '../components/UserContext';
import { useNotificationListener } from '../hooks/useNotifications'; // ✅ เพิ่ม

export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [showStartupSplash, setShowStartupSplash] = useState(true);
  
  useNotificationListener(); // ✅ เพิ่ม
  
  useEffect(() => {
    if (showStartupSplash) return;
    Notifications.requestPermissionsAsync(); // ✅ เพิ่ม
  }, [showStartupSplash]);

  const [fontsLoaded] = useFonts({
    NotoSansThai_100Thin,
    NotoSansThai_200ExtraLight,
    NotoSansThai_300Light,
    NotoSansThai_400Regular,
    NotoSansThai_500Medium,
    NotoSansThai_600SemiBold,
    NotoSansThai_700Bold,
    NotoSansThai_800ExtraBold,
    NotoSansThai_900Black,
    Inter_100Thin,
    Inter_200ExtraLight,
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  useEffect(() => {
    if (!fontsLoaded) return;
    const timer = setTimeout(() => setShowStartupSplash(false), 1500);
    return () => clearTimeout(timer);
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <UserProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="splash" options={{ animation: 'none' }} />
          <Stack.Screen name="login" options={{ animation: 'none' }} />
          <Stack.Screen name="regis" options={{ animation: 'none' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
        {showStartupSplash && (
          <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]} accessibilityViewIsModal>
            <SplashArtwork />
          </View>
        )}
        </View>
      </ThemeProvider>
    </UserProvider>
  );
}
