import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getR2ServerConfig, validateMediaInput, R2_MEDIA_CACHE_CONTROL, type MediaKind } from '@/lib/r2-media';

export const runtime = 'nodejs';

const PREFIX: Record<MediaKind, string> = {
  image: 'articles',
  avatar: 'avatars',
  background: 'backgrounds',
  software_icon: 'software',
  video: 'videos',
  comment_image: 'comments',
  attachment: 'attachments',
};
const EDITOR_KINDS: MediaKind[] = ['image', 'software_icon'];

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const kind = body?.kind as MediaKind;
  const key = typeof body?.key === 'string' ? body.key : '';
  const fileName = typeof body?.fileName === 'string' ? body.fileName.slice(0, 180) : null;
  const alt = typeof body?.alt === 'string' ? body.alt.trim().slice(0, 250) : null;
  const entityType = typeof body?.entityType === 'string' ? body.entityType.slice(0, 40) : null;
  const entityId = typeof body?.entityId === 'string' && /^[0-9a-f-]{36}$/i.test(body.entityId) ? body.entityId : null;

  if (!kind || !Object.prototype.hasOwnProperty.call(PREFIX, kind)) return NextResponse.json({ error: '媒体类型无效' }, { status: 400 });
  if (EDITOR_KINDS.includes(kind)) {
    const { data: allowed, error } = await supabase.rpc('is_owenfx_content_editor');
    if (error || allowed !== true) return NextResponse.json({ error: '没有媒体管理权限' }, { status: 403 });
  }
  const expectedPrefix = `${PREFIX[kind]}/${user.id}/`;
  if (!key.startsWith(expectedPrefix) || key.includes('..')) {
    return NextResponse.json({ error: '媒体对象路径与当前用户不匹配' }, { status: 403 });
  }

  try {
    const cfg = getR2ServerConfig();
    const s3 = new S3Client({
      region: 'auto',
      endpoint: cfg.endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
    });
    const head = await s3.send(new HeadObjectCommand({ Bucket: cfg.bucket, Key: key }));
    const contentType = head.ContentType || '';
    const byteSize = Number(head.ContentLength || 0);
    if (head.CacheControl !== R2_MEDIA_CACHE_CONTROL) {
      return NextResponse.json({ error: 'R2 对象缓存策略校验失败，请重新上传文件' }, { status: 400 });
    }
    let detected: ReturnType<typeof validateMediaInput>;
    try {
      detected = validateMediaInput(contentType, byteSize);
    } catch (validationError) {
      const message = validationError instanceof Error ? validationError.message : 'R2 文件格式或大小无效';
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if ((kind === 'video') !== (detected.kind === 'video')) {
      return NextResponse.json({ error: kind === 'video' ? '视频上传必须使用视频文件格式' : '该媒体类型只接受图片文件' }, { status: 400 });
    }

    const mediaKind = kind === 'video' ? 'video' : kind;
    const publicUrl = `${cfg.publicBaseUrl}/${key.split('/').map(encodeURIComponent).join('/')}`;
    const { data: asset, error } = await supabase.from('media_assets').insert({
      owner_id: user.id,
      bucket: cfg.bucket,
      object_key: key,
      public_url: publicUrl,
      mime_type: contentType,
      byte_size: byteSize,
      alt_text: alt,
      media_kind: mediaKind,
      original_filename: fileName,
      entity_type: entityType,
      entity_id: entityId,
      upload_status: 'ready',
      etag: head.ETag || null,
    }).select('id,public_url,object_key,media_kind,mime_type,byte_size').single();

    if (error || !asset) {
      console.error('[r2-upload/complete] media_assets insert failed:', error);
      return NextResponse.json({ error: '文件已上传到 R2，但媒体库记录保存失败' }, { status: 500 });
    }

    if (kind === 'avatar') {
      const { error: profileError } = await supabase.from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (profileError) {
        console.error('[r2-upload/complete] profile avatar update failed:', profileError);
        return NextResponse.json({ error: '头像已上传，但个人资料更新失败', asset }, { status: 500 });
      }
    }

    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      action: 'media.upload',
      entity_type: 'media_asset',
      entity_id: asset.id,
      details: { media_kind: kind, object_key: key, byte_size: byteSize },
    });
    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    console.error('[r2-upload/complete]', error);
    return NextResponse.json({ error: '无法验证 R2 文件，请确认文件上传成功后重试' }, { status: 502 });
  }
}
