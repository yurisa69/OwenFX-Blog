import { NextResponse } from 'next/server';
import { authorizeContentEditor } from '@/lib/admin-api';
import { uploadToR2 } from '@/lib/r2';
import { getR2ServerConfig } from '@/lib/r2-media';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const auth = await authorizeContentEditor();
  if ('response' in auth) return auth.response;

  const formData = await request.formData().catch(() => null);
  const file = formData?.get('file');
  const alt = String(formData?.get('alt') || '').trim().slice(0, 250);

  if (!(file instanceof File)) {
    return NextResponse.json({ error: '请通过 file 字段选择图片' }, { status: 400 });
  }

  try {
    const uploaded = await uploadToR2(file);
    const { error } = await auth.supabase.from('media_assets').insert({
      owner_id: auth.user.id,
      bucket: getR2ServerConfig().bucket,
      object_key: uploaded.key,
      public_url: uploaded.url,
      mime_type: uploaded.contentType,
      byte_size: uploaded.size,
      alt_text: alt,
    });

    if (error) {
      console.error('[r2-upload] media_assets insert failed:', error);
      return NextResponse.json({ error: '图片已上传到 R2，但媒体库记录保存失败' }, { status: 500 });
    }

    await auth.supabase.from('audit_logs').insert({
      actor_id: auth.user.id,
      action: 'media.upload',
      entity_type: 'media_asset',
      entity_id: uploaded.key,
    });

    return NextResponse.json({ ...uploaded, alt }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '图片上传失败';
    const status = message.startsWith('R2 配置不完整') ? 503 : 400;
    console.error('[r2-upload]', message);
    return NextResponse.json({ error: status === 503 ? message : '图片上传失败，请检查图片格式、大小及 R2 配置' }, { status });
  }
}
