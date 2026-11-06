import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const placement = new URL(req.url).searchParams.get('placement');
  if (placement !== 'article' && placement !== 'software') return NextResponse.json({ error: 'invalid placement' }, { status: 400 });
  const supabase = await createClient();
  const { data } = await supabase.from('support_settings').select('enabled,methods').eq('placement', placement).maybeSingle();
  return NextResponse.json(data || { enabled: false, methods: {} });
}
