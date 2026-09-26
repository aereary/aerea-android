import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wislppgaikbxgibrjizz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_tONK58MPqu6CkvnAWqgoww_k8D_dcu_";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  },
);
