import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createR2UploadUrl, mediaObjectKey, validateMediaInput, type MediaKind } from '@/lib/r2-media';

export const runtime = 'nodejs';

const KINDS: MediaKind[] = ['image', 'avatar', 'background', 'software_icon', 'video', 'comment_image', 'attachment'];
const EDITOR_KINDS: MediaKind[] = ['image', 'software_icon'];

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const kind = body?.kind as MediaKind;
  const contentType = typeof body?.contentType === 'string' ? body.contentType : '';
  const fileName = typeof body?.fileName === 'string' ? body.fileName.slice(0, 180) : 'upload';
  const size = Number(body?.size);
  if (!KINDS.includes(kind)) return NextResponse.json({ error: '不支持的媒体类型' }, { status: 400 });

  if (EDITOR_KINDS.includes(kind)) {
    const { data: allowed, error } = await supabase.rpc('is_owenfx_content_editor');
    if (error || allowed !== true) return NextResponse.json({ error: '没有媒体管理权限' }, { status: 403 });
  }

  let detected: ReturnType<typeof validateMediaInput>;
  try {
    detected = validateMediaInput(contentType, size);
    if (kind === 'video' && detected.kind !== 'video') throw new Error('视频上传必须选择视频文件');
    if (kind !== 'video' && detected.kind !== 'image') throw new Error('该媒体类型只接受图片文件');
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '文件校验失败' }, { status: 400 });
  }

  try {
    const key = mediaObjectKey(user.id, kind, detected.ext);
    const signed = createR2UploadUrl(key, contentType);
    return NextResponse.json({
      key,
      uploadUrl: signed.uploadUrl,
      publicUrl: signed.publicUrl,
      bucket: signed.bucket,
      expiresIn: signed.expiresIn,
      headers: { 'Content-Type': contentType },
      fileName,
      kind,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '无法创建上传地址';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
