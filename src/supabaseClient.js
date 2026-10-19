import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();

export const isSupabaseConfigured = Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('<project-id>') &&
    !supabaseUrl.includes('VITE_SUPABASE_')
);

export const supabase = createClient(
    isSupabaseConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co',
    isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key'
);