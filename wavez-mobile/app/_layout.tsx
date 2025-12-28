import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { I18nManager, Platform } from 'react-native';
import { useEffect } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // 1. כפיית RTL
    if (!I18nManager.isRTL) {
        try {
            I18nManager.allowRTL(true);
            I18nManager.forceRTL(true);
        } catch (e) { console.log(e); }
    }

    // 2. הגדרות לווב (מסך טעינה משופר לספארי)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
        
        // === הגדרות מסך טעינה (Splash Screen) ===
        const bodyStyle = document.body.style;

        // צבע רקע לבן
        bodyStyle.backgroundColor = '#ffffff';
        
        // הגדרות תמונה מותאמות לספארי
        bodyStyle.backgroundImage = "url('/splash-logo.png')";
        bodyStyle.backgroundRepeat = 'no-repeat';
        bodyStyle.backgroundPosition = 'center center';
        bodyStyle.backgroundSize = '180px auto'; // גודל נעים לעין
        bodyStyle.backgroundAttachment = 'fixed'; // חשוב לספארי!

        // הבטחת גובה מלא (תיקון באג ידוע באייפון)
        document.documentElement.style.height = '100%';
        bodyStyle.height = '100%';
        bodyStyle.margin = '0';

        // צביעת שורת הסטטוס בלבן בהתחלה
        const metaTheme = document.createElement('meta');
        metaTheme.name = 'theme-color';
        metaTheme.content = '#ffffff';
        document.head.appendChild(metaTheme);
        
        // === אנימציית כניסה חלקה ===
        const style = document.createElement('style');
        style.innerHTML = `
          body, .css-view-175oi2r { direction: rtl !important; text-align: right !important; }
          
          /* האפליקציה מתחילה שקופה לגמרי */
          #root { 
            background-color: #0f172a; 
            min-height: 100vh; /* גובה מלא */
            opacity: 0; /* נסתר */
            transition: opacity 0.8s ease-in-out; /* אנימציית הופעה */
          }
          
          /* מחלקה שנוסיף אחרי שהטעינה תסתיים */
          #root.loaded {
            opacity: 1; /* גלוי */
          }

          .leaflet-container { direction: ltr !important; }
          svg { transform: scaleX(1); }
        `;
        document.head.appendChild(style);

        // טיימר קצר: אחרי 1.5 שניות, מציגים את האפליקציה
        setTimeout(() => {
            const rootElement = document.getElementById('root');
            if (rootElement) {
                rootElement.classList.add('loaded'); // מפעיל את הפייד-אין
                
                // החזרת שורת הסטטוס לצבע כהה (אחרי שהאפליקציה עלתה)
                metaTheme.content = '#0f172a';
            }
        }, 1500); // 1.5 שניות של לוגו

        // CSS למפה
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        // אייקונים
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
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}