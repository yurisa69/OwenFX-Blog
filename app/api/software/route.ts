import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('software').select('title,slug,image_url,version,description,developer,platform')
    .eq('status', 'published').or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
    .order('title').limit(200);
  if (error) return NextResponse.json({ software: [] });
  return NextResponse.json({ software: data ?? [] });
}
