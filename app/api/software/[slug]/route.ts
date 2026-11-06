import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.from('software')
    .select('id,title,slug,description,developer,version,platform,image_url,official_download_url,introduction_markdown,screenshots,updated_at,software_download_links(id,provider,label,share_url,access_code,sort_order)')
    .eq('slug', slug).eq('status', 'published')
    .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`).maybeSingle();
  if (error || !data) return NextResponse.json({ error: '软件不存在' }, { status: 404 });
  return NextResponse.json({ software: data });
}
