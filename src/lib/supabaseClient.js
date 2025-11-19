import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

// برای دیباگ
console.log("SUPABASE URL:", url);
console.log("SUPABASE ANON:", anon ? "***" : "undefined");

if (!url) throw new Error("supabaseUrl is required");
if (!anon) throw new Error("supabaseAnonKey is required");

export const supabase = createClient(url, anon);
