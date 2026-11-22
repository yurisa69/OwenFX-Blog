import { GetObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin-server';
import { createClient } from '@/lib/supabase/server';
import { createR2UploadUrl, getR2ServerConfig, mediaObjectKey, validateMediaInput, R2_MEDIA_CACHE_CONTROL, type MediaKind } from '@/lib/r2-media';
import { validateFileSignature } from '@/lib/media-file-validation';

type SessionScope = 'site' | 'admin';
const ADMIN_KINDS: MediaKind[] = ['image', 'software_icon'];
const SITE_KINDS: MediaKind[] = ['avatar', 'background', 'video', 'comment_image', 'attachment'];
const PREFIX: Record<MediaKind, string> = {
  image: 'articles', avatar: 'avatars', background: 'backgrounds',
  software_icon: 'software', video: 'videos', comment_image: 'comments', attachment: 'attachments',
};

async function authorizeScope(scope: SessionScope) {
  const supabase = scope === 'admin' ? await createAdminClient() : await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { response: NextResponse.json({ error: '请先登录' }, { status: 401 }) };
  if (scope === 'admin') {
    const { data: allowed, error } = await supabase.rpc('is_owenfx_content_editor');
    if (error || allowed !== true) return { response: NextResponse.json({ error: '没有媒体管理权限' }, { status: 403 }) };
  }
  return { supabase, user };
}

export async function handleR2Presign(request: Request, scope: SessionScope) {
  const auth = await authorizeScope(scope);
  if ('response' in auth) return auth.response;
  const body = await request.json().catch(() => null);
  const kind = body?.kind as MediaKind;
  const allowedKinds = scope === 'admin' ? ADMIN_KINDS : SITE_KINDS;
  if (!allowedKinds.includes(kind)) return NextResponse.json({ error: '不支持的媒体类型' }, { status: 400 });

  const contentType = typeof body?.contentType === 'string' ? body.contentType : '';
  const fileName = typeof body?.fileName === 'string' ? body.fileName.slice(0, 180) : 'upload';
  const size = Number(body?.size);
  let detected: ReturnType<typeof validateMediaInput>;
  try {
    detected = validateMediaInput(contentType, size);
    if (kind === 'video' && detected.kind !== 'video') throw new Error('视频上传必须选择视频文件');
    if (kind !== 'video' && detected.kind !== 'image') throw new Error('该媒体类型只接受图片文件');
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '文件校验失败' }, { status: 400 });
  }

  try {
    const key = mediaObjectKey(auth.user.id, kind, detected.ext);
    const signed = createR2UploadUrl(key, contentType);
    return NextResponse.json({
      key, uploadUrl: signed.uploadUrl, publicUrl: signed.publicUrl, bucket: signed.bucket,
      expiresIn: signed.expiresIn,
      headers: { 'Content-Type': contentType, 'Cache-Control': R2_MEDIA_CACHE_CONTROL },
      fileName, kind,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '无法创建上传地址' }, { status: 503 });
  }
}

export async function handleR2Complete(request: Request, scope: SessionScope) {
  const auth = await authorizeScope(scope);
  if ('response' in auth) return auth.response;
  const body = await request.json().catch(() => null);
  const kind = body?.kind as MediaKind;
  const allowedKinds = scope === 'admin' ? ADMIN_KINDS : SITE_KINDS;
  if (!allowedKinds.includes(kind)) return NextResponse.json({ error: '媒体类型无效' }, { status: 400 });

  const key = typeof body?.key === 'string' ? body.key : '';
  const fileName = typeof body?.fileName === 'string' ? body.fileName.slice(0, 180) : null;
  const alt = typeof body?.alt === 'string' ? body.alt.trim().slice(0, 250) : null;
  const entityType = typeof body?.entityType === 'string' ? body.entityType.slice(0, 40) : null;
  const entityId = typeof body?.entityId === 'string' && /^[0-9a-f-]{36}$/i.test(body.entityId) ? body.entityId : null;
  const expectedPrefix = PREFIX[kind] + '/' + auth.user.id + '/';
  if (!key.startsWith(expectedPrefix) || key.includes('..')) {
    return NextResponse.json({ error: '媒体对象路径与当前用户不匹配' }, { status: 403 });
  }

  try {
    const cfg = getR2ServerConfig();
    const s3 = new S3Client({
      region: 'auto', endpoint: cfg.endpoint, forcePathStyle: true,
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
      return NextResponse.json({ error: validationError instanceof Error ? validationError.message : 'R2 文件格式或大小无效' }, { status: 400 });
    }
    if ((kind === 'video') !== (detected.kind === 'video')) {
      return NextResponse.json({ error: kind === 'video' ? '视频上传必须使用视频文件格式' : '该媒体类型只接受图片文件' }, { status: 400 });
    }

    const sampleObject = await s3.send(new GetObjectCommand({ Bucket: cfg.bucket, Key: key, Range: 'bytes=0-4100' }));
    if (!sampleObject.ContentRange || Number(sampleObject.ContentLength || 0) > 4101 || !sampleObject.Body) {
      return NextResponse.json({ error: '无法安全读取文件头，请重新上传文件' }, { status: 400 });
    }
    const fileHeader = await sampleObject.Body.transformToByteArray();
    try {
      await validateFileSignature(fileHeader, contentType);
    } catch (signatureError) {
      return NextResponse.json({ error: signatureError instanceof Error ? signatureError.message : '文件签名校验失败' }, { status: 400 });
    }

    const publicUrl = cfg.publicBaseUrl + '/' + key.split('/').map(encodeURIComponent).join('/');
    const { data: asset, error } = await auth.supabase.from('media_assets').insert({
      owner_id: auth.user.id, bucket: cfg.bucket, object_key: key, public_url: publicUrl,
      mime_type: contentType, byte_size: byteSize, alt_text: alt,
      media_kind: kind === 'video' ? 'video' : kind, original_filename: fileName,
      entity_type: entityType, entity_id: entityId, upload_status: 'ready', etag: head.ETag || null,
    }).select('id,public_url,object_key,media_kind,mime_type,byte_size').single();

    if (error || !asset) {
      console.error('[r2-upload/complete] media_assets insert failed:', error);
      return NextResponse.json({ error: '文件已上传到 R2，但媒体库记录保存失败' }, { status: 500 });
    }

    if (kind === 'avatar') {
      const { error: profileError } = await auth.supabase.from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() }).eq('id', auth.user.id);
      if (profileError) {
        console.error('[r2-upload/complete] profile avatar update failed:', profileError);
        return NextResponse.json({ error: '头像已上传，但个人资料更新失败', asset }, { status: 500 });
      }
    }

    await auth.supabase.from('audit_logs').insert({
      actor_id: auth.user.id, action: 'media.upload', entity_type: 'media_asset', entity_id: asset.id,
      details: { media_kind: kind, object_key: key, byte_size: byteSize },
    });
    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    console.error('[r2-upload/complete]', error);
    return NextResponse.json({ error: '无法验证 R2 文件，请确认文件上传成功后重试' }, { status: 502 });
  }
}
