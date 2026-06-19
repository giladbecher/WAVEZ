import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { I18nManager, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LanguageProvider } from '../contexts/LanguageContext';
export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  // 👇 אפקט: הגדרות ווב, RTL ועיצוב
  useEffect(() => {
    // 1. כפיית RTL
    if (!I18nManager.isRTL) {
        try {
            I18nManager.allowRTL(true);
            I18nManager.forceRTL(true);
        } catch (e) { console.log(e); }
    }

    // 2. הגדרות לווב
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const style = document.createElement('style');
        style.innerHTML = `
          html, body { 
            height: 100dvh !important;
            width: 100%;
            margin: 0; 
            padding: 0;
            overflow: hidden;
            background-color: #0f172a;
          }
          /* Direction is now controlled via document.documentElement.dir */
          /* so we do NOT set direction here — allows dynamic RTL/LTR switching */
          #root { 
            background-color: #0f172a; 
            height: 100dvh !important; 
            width: 100%;
            display: flex;
            flex-direction: column;
          }
          .leaflet-container { direction: ltr !important; }
          svg { transform: scaleX(1); }
        `;
        document.head.appendChild(style);

        // Set initial document direction for Hebrew (RTL default)
        document.documentElement.dir  = 'rtl';
        document.documentElement.lang = 'he';

        const metaTheme = document.createElement('meta');
        metaTheme.name = 'theme-color';
        metaTheme.content = '#0f172a';
        document.head.appendChild(metaTheme);

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        const appleIcon = document.createElement('link');
        appleIcon.rel = 'apple-touch-icon';
        appleIcon.href = '/apple-touch-icon.png'; 
        document.head.appendChild(appleIcon);

        const manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = '/manifest.json';
        document.head.appendChild(manifestLink);
    }
  }, []);
  return (
    <>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Head>
          <title>WAVEZ PRO</title>
          <meta name="description" content="WAVEZ PRO - Surf Forecast" />
          <link rel="icon" type="image/png" href="/favicon.png" />
          <script async src="https://www.googletagmanager.com/gtag/js?id=G-J5W1BJ0SBN" />
          <script>
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-J5W1BJ0SBN');
            `}
          </script>
        </Head>

        <LanguageProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
        </LanguageProvider>
        <StatusBar style="auto" />
      </ThemeProvider>
    </>
  );
}