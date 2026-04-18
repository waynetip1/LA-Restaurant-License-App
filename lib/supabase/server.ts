import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Server-side only — uses the service role key.
// NEVER import this file in client components or client-side code.
// SUPABASE_SERVICE_ROLE_KEY must never be exposed to the browser.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
