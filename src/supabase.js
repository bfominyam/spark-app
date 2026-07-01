import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = "https://pznybrvxrvfdujticemn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6bnlicnZ4cnZmZHVqdGljZW1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODc0MjksImV4cCI6MjA5ODI2MzQyOX0.lGzOykK5SGnh4vdyv3mPZ9PDGfbQKGiDs0ZCz9SSxU8";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);