import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin-server';

export async function requireContentEditor() {
  const supabase = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login?next=/admin');
  const { data, error } = await supabase.rpc('is_owenfx_content_editor');
  if (error || data !== true) redirect('/');
  return { supabase, user };
}

export async function requireAdmin() {
  const supabase = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login?next=/admin');
  const { data, error } = await supabase.rpc('is_owenfx_admin');
  if (error || data !== true) redirect('/');
  return { supabase, user };
}
