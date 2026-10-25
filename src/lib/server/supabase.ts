import { createClient } from "@supabase/supabase-js";

export function getSupabaseConfiguration(env: NodeJS.ProcessEnv = process.env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
  } catch {
    return null;
  }
  return { url, key };
}

export function getSupabaseClient() {
  const configuration = getSupabaseConfiguration();
  if (!configuration) return null;
  return createClient(configuration.url, configuration.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
