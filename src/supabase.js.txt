import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = "https://pznybrvxrvfdujticemn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6bnlicnZ4cnZmZHVqdGljZW1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDI1NTUsImV4cCI6MjA2NjI3ODU1NX0.eyJpc3MiOiJzdXBhYmFzZSJ9";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);