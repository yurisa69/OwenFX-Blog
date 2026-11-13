import { NextResponse } from 'next/server';
import { authorizeContentEditor } from '@/lib/admin-api';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await authorizeContentEditor();
  if ('response' in auth) return auth.response;

  const service = createServiceClient();
  const { data, error } = await service.rpc('list_article_sync_jobs', {
    p_limit: 100,
    p_state: null,
  });

  if (error) {
    console.error('[article-sync-list]', error.message);
    return NextResponse.json(
      { error: '同步任务列表暂时无法读取' },
      { status: 500, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  const jobs = Array.isArray(data) ? data : [];
  return NextResponse.json(
    { jobs },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
