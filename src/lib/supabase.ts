// ==============================================================================
// STARE STAWY — SĄSIEDZI: SUPABASE CLIENT INTEGRATION
// Obsługa konfiguracji z .env (Vercel) oraz dynamicznej konfiguracji w aplikacji
// ==============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_CUSTOM_URL = 'stare_stawy_custom_supabase_url';
const STORAGE_CUSTOM_KEY = 'stare_stawy_custom_supabase_key';

// Domyślne dane projektu Supabase osiedla Stare Stawy
const DEFAULT_SUPABASE_URL = 'https://uuzroenvfwhbclaendft.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1enJvZW52ZndoYmNsYWVuZGZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNzY3NDksImV4cCI6MjEwNDY1Mjc0OX0.uJsNy2z6kRXGuCTooUw_4ICXKv-99BffKZj0HUrupyo';

// Pobierz URL ze zmiennych środowiskowych, localStorage lub domyślnej konfiguracji projektu
export const getSupabaseConfig = () => {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  let customUrl = '';
  let customKey = '';
  try {
    customUrl = (localStorage.getItem(STORAGE_CUSTOM_URL) || '').trim();
    customKey = (localStorage.getItem(STORAGE_CUSTOM_KEY) || '').trim();
  } catch {
    // Ignore localStorage errors
  }

  const url = customUrl || envUrl || DEFAULT_SUPABASE_URL;
  const anonKey = customKey || envKey || DEFAULT_SUPABASE_ANON_KEY;

  const isConfigured =
    Boolean(url) &&
    Boolean(anonKey) &&
    url.startsWith('https://') &&
    !url.includes('twój-projekt') &&
    !anonKey.includes('twój-publiczny');

  return {
    url,
    anonKey,
    isConfigured,
    isCustom: Boolean(customUrl && customKey),
  };
};

export const isSupabaseConfigured = (): boolean => {
  return getSupabaseConfig().isConfigured;
};

// Singleton klienta Supabase
let supabaseInstance: SupabaseClient | null = null;
let currentConfigKey = '';

export const getSupabase = (): SupabaseClient | null => {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  const key = `${url}___${anonKey}`;
  if (!supabaseInstance || currentConfigKey !== key) {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    currentConfigKey = key;
  }
  return supabaseInstance;
};

export const supabase = getSupabase();

// Zapisanie własnych kluczy z poziomu interfejsu (bez konieczności redeployu)
export const saveCustomSupabaseConfig = (url: string, anonKey: string): boolean => {
  try {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();
    if (!cleanUrl || !cleanKey) return false;
    localStorage.setItem(STORAGE_CUSTOM_URL, cleanUrl);
    localStorage.setItem(STORAGE_CUSTOM_KEY, cleanKey);
    supabaseInstance = null; // zresetuj instancję
    return true;
  } catch {
    return false;
  }
};

// Usunięcie własnych kluczy
export const clearCustomSupabaseConfig = (): void => {
  try {
    localStorage.removeItem(STORAGE_CUSTOM_URL);
    localStorage.removeItem(STORAGE_CUSTOM_KEY);
    supabaseInstance = null;
  } catch {
    // Ignore
  }
};

// Test połączenia z bazą
export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  const client = getSupabase();
  if (!client) {
    return { success: false, message: 'Brak skonfigurowanego adresu URL lub klucza API Supabase.' };
  }
  try {
    const { error } = await client.from('posts').select('id').limit(1);
    if (error) {
      // Jeśli tabela nie istnieje jeszcze lub błąd RLS
      if (error.code === '42P01') {
        return {
          success: false,
          message: `Połączono z projektem Supabase, lecz tabele nie zostały jeszcze utworzone. Uruchom skrypt 'supabase/schema.sql' w SQL Editor.`,
        };
      }
      return { success: true, message: `Połączono z Supabase! (Status API: ${error.message || 'OK'})` };
    }
    return { success: true, message: 'Połączono pomyślnie z bazą danych Supabase osiedla Stare Stawy!' };
  } catch (err: any) {
    return { success: false, message: `Błąd sieci lub nieprawidłowy adres URL: ${err?.message || err}` };
  }
};
