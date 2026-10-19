import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

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