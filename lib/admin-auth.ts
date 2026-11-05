import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function requireContentEditor() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin');
  const { data, error } = await supabase.rpc('is_owenfx_content_editor');
  if (error || data !== true) redirect('/');
  return { supabase, user };
}
