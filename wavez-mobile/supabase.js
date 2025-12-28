import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL = "https://dkczgutwriwdeoxzllru.supabase.co";
const SUPABASE_KEY = "sb_publishable_3n-9eFTLx35UCwSOukmPgA_ztCsNINC";

// Create Supabase client with platform-specific configuration
let supabaseConfig = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  }
};

// Only add storage for native platforms
if (Platform.OS !== 'web') {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  supabaseConfig.auth.storage = AsyncStorage;
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, supabaseConfig);