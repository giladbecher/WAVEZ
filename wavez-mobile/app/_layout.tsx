import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { I18nManager, Platform } from 'react-native';
import { useEffect, useState } from 'react'; // הוספנו את useState
import { useColorScheme } from '@/hooks/use-color-scheme';

// 👇 ייבוא הרכיבים החדשים (וודא שהנתיבים נכונים לפרויקט שלך)
import { supabase } from '../supabase'; 
import Auth from '../components/Auth'; 

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  // 👇 משתנים לניהול המשתמש
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // 👇 אפקט 1: בדיקת התחברות (Supabase)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  // 👇 אפקט 2: הגדרות ווב, RTL ועיצוב (הקוד המקורי שלך נשמר במלואו)
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
        const bodyStyle = document.body.style;
        bodyStyle.backgroundColor = '#ffffff';
        bodyStyle.backgroundImage = "url('/splash-logo.png')";
        bodyStyle.backgroundRepeat = 'no-repeat';
        bodyStyle.backgroundPosition = 'center center';
        bodyStyle.backgroundSize = '180px auto'; 
        
        const style = document.createElement('style');
        style.innerHTML = `
          html, body { 
            height: 100dvh !important;
            width: 100%;
            margin: 0; 
            padding: 0;
            overflow: hidden;
          }
          body, .css-view-175oi2r { 
            direction: rtl !important; 
            text-align: right !important; 
          }
          #root { 
            background-color: #0f172a; 
            height: 100dvh !important; 
            width: 100%;
            display: flex;
            flex-direction: column;
            opacity: 0;
            transition: opacity 0.8s ease-in-out; 
          }
          #root.loaded {
            opacity: 1;
          }
          .leaflet-container { direction: ltr !important; }
          svg { transform: scaleX(1); }
        `;
        document.head.appendChild(style);

        setTimeout(() => {
            const rootElement = document.getElementById('root');
            if (rootElement) {
                rootElement.classList.add('loaded'); 
                const metaTheme = document.createElement('meta');
                metaTheme.name = 'theme-color';
                metaTheme.content = '#0f172a';
                document.head.appendChild(metaTheme);
            }
        }, 1500); 

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

  // ⏳ בזמן שהמערכת בודקת משתמש - אל תציג כלום (הרקע של ה-HTML יוצג)
  if (loading) return null;

  // 🔒 אם אין משתמש מחובר - תציג את מסך ההתחברות בלבד
  if (!session) {
    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Auth />
        </ThemeProvider>
    );
  }

  // ✅ אם המשתמש מחובר - הצג את האפליקציה הרגילה
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Head>
        <title>WAVEZ PRO</title>
        <meta name="description" content="WAVEZ PRO - Surf Forecast" />
        <link rel="icon" type="image/png" href="/favicon.png" />
      </Head>

      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}