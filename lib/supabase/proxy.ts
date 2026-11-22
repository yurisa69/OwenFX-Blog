import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_AUTH_COOKIE_NAME } from './admin-cookie';

type CookieWrite = { name: string; value: string; options?: any };

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminPageOrApi =
    pathname === '/admin'
    || pathname.startsWith('/admin/')
    || pathname === '/api/admin'
    || pathname.startsWith('/api/admin/')
    // Legacy single-file editor upload endpoint remains admin-only.
    || pathname === '/api/r2-upload';

  const cookieWrites = new Map<string, CookieWrite>();
  const responseHeaders = new Map<string, string>();
  const cookieName = isAdminPageOrApi ? ADMIN_AUTH_COOKIE_NAME : null;
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: cookieName ? { name: cookieName } : undefined,
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            cookieWrites.set(name, { name, value, options });
          });
          Object.entries(headers || {}).forEach(([name, value]) => responseHeaders.set(name, value));
        },
      },
    },
  );

  await supabase.auth.getClaims();
  const response = NextResponse.next({ request });
  cookieWrites.forEach(cookie => response.cookies.set(cookie.name, cookie.value, cookie.options));
  responseHeaders.forEach((value, name) => response.headers.set(name, value));
  return response;
}
