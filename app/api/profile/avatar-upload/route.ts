import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadToR2 } from '@/lib/r2';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  const file = formData?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: '请选择头像图片' }, { status: 400 });

  try {
    const uploaded = await uploadToR2(file);
    return NextResponse.json({ url: uploaded.url, key: uploaded.key }, { status: 201 });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : '头像上传失败';
    const status = message.startsWith('R2 配置不完整') ? 503 : 400;
    console.error('[profile-avatar-upload]', message);
    return NextResponse.json({ error: status === 503 ? message : '头像上传失败，请检查图片格式、大小及 R2 配置' }, { status });
  }
}
