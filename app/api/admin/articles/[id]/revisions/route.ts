import { NextResponse } from 'next/server';
import { authorizeContentEditor } from '@/lib/admin-api';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeContentEditor();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const { data: article } = await auth.supabase.from('articles').select('id').eq('id', id).maybeSingle();
  if (!article) return NextResponse.json({ error: '文章不存在' }, { status: 404 });

  const { data, error } = await auth.supabase.from('article_revisions')
    .select('id,title,excerpt,github_path,github_sha,content_hash,created_at')
    .eq('article_id', id).order('created_at', { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: '读取文章历史版本失败' }, { status: 500 });
  return NextResponse.json({ revisions: data ?? [] });
}
