import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cgsdnvuigolxwzfmnykk.supabase.co";
// TODO: substituir pela mesma ANON KEY usada no app cliente
const SUPABASE_ANON_KEY = "REPLACE_WITH_CLIENT_APP_ANON_KEY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "ditt-admin-auth",
  },
});