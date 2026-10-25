// Supabase public configuration. Publishable keys are intended for browser use.
const SUPABASE_URL = "https://kxvsgnovrrlrxkbmaoln.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_GNvAskOfdZbdb_DKXCBygQ_U6LuwCqX";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Expose the client for catalog.js and admin.js.
window.supabaseClient = supabaseClient;
