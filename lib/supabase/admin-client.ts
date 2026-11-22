import { createBrowserClient } from '@supabase/ssr';
import { ADMIN_AUTH_COOKIE_NAME } from './admin-cookie';

export function createAdminClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: ADMIN_AUTH_COOKIE_NAME },
      isSingleton: false,
    }
  );
}
