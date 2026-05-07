import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cgsdnvuigolxwzfmnykk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_8--rytxIxWlNNp2T9IUFsw_ems9dlOH";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "ditt-admin-auth",
  },
});