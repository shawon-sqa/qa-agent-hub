import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("your_supabase_project_url")) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "⚠️ [QA Agent Hub] Supabase environment variables are missing or default placeholders. Update NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to connect to your live database."
    );
  }
}

/**
 * Client-safe Supabase instance for browser and client components.
 * Strongly typed with QA Agent Hub Database schema.
 */
export const supabase = createClient<Database>(
  supabaseUrl || "https://placeholder-domain.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Factory helper for creating new client-side Supabase instances.
 */
export function getSupabaseClient() {
  return supabase;
}
