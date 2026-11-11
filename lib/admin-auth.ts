import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type SupabaseClientInstance = Awaited<ReturnType<typeof createClient>>;
type AuthenticatedUser = NonNullable<
  Awaited<ReturnType<SupabaseClientInstance['auth']['getUser']>>['data']['user']
>;
type AdminContext = { supabase: SupabaseClientInstance; user: AuthenticatedUser };

export async function requireContentEditor(): Promise<AdminContext> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin');
  const { data, error } = await supabase.rpc('is_owenfx_content_editor');
  if (error || data !== true) redirect('/');
  return { supabase, user };
}

export async function requireAdmin(): Promise<AdminContext> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin');
  const { data, error } = await supabase.rpc('is_owenfx_admin');
  if (error || data !== true) redirect('/');
  return { supabase, user };
}
