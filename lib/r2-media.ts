import { createHash, createHmac, randomUUID } from 'node:crypto';

export const R2_MEDIA_CACHE_CONTROL = 'public, max-age=31536000, immutable';

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_BYTES = 250 * 1024 * 1024;
const TYPES: Record<string, { ext: string; kind: 'image' | 'video' }> = {
  'image/jpeg': { ext: 'jpg', kind: 'image' },
  'image/png': { ext: 'png', kind: 'image' },
  'image/webp': { ext: 'webp', kind: 'image' },
  'image/gif': { ext: 'gif', kind: 'image' },
  'image/avif': { ext: 'avif', kind: 'image' },
  'video/mp4': { ext: 'mp4', kind: 'video' },
  'video/webm': { ext: 'webm', kind: 'video' },
  'video/quicktime': { ext: 'mov', kind: 'video' },
};

export type MediaKind = 'image' | 'avatar' | 'background' | 'software_icon' | 'video' | 'comment_image' | 'attachment';

function config() {
  const endpoint = process.env.R2_ENDPOINT;
  const bucket = process.env.R2_BUCKET_NAME;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.replace(/\/+$/, '');
  const missing = [
    !endpoint && 'R2_ENDPOINT',
    !bucket && 'R2_BUCKET_NAME',
    !accessKeyId && 'R2_ACCESS_KEY_ID',
    !secretAccessKey && 'R2_SECRET_ACCESS_KEY',
    !publicBaseUrl && 'R2_PUBLIC_BASE_URL',
  ].filter(Boolean);
  if (missing.length) throw new Error(`R2 配置不完整：${missing.join(', ')}`);
  return { endpoint: endpoint!, bucket: bucket!, accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey!, publicBaseUrl: publicBaseUrl! };
}

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}
function hmac(key: Buffer | string, value: string) {
  return createHmac('sha256', key).update(value).digest();
}
function encode(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

export function validateMediaInput(contentType: string, size: number) {
  const type = TYPES[contentType];
  if (!type) throw new Error('仅支持 JPG、PNG、WebP、GIF、AVIF、MP4、WebM 和 MOV');
  const max = type.kind === 'video' ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (!Number.isSafeInteger(size) || size <= 0 || size > max) {
    throw new Error(type.kind === 'video' ? '视频大小必须在 1B 至 250MB 之间' : '图片大小必须在 1B 至 20MB 之间');
  }
  return type;
}

export function mediaObjectKey(userId: string, kind: MediaKind, extension: string) {
  const folders: Record<MediaKind, string> = {
    image: 'articles',
    avatar: 'avatars',
    background: 'backgrounds',
    software_icon: 'software',
    video: 'videos',
    comment_image: 'comments',
    attachment: 'attachments',
  };
  return `${folders[kind]}/${userId}/${randomUUID()}.${extension}`;
}

export function createR2UploadUrl(key: string, contentType: string, expiresIn = 600) {
  const cfg = config();
  const endpoint = new URL(cfg.endpoint);
  const host = endpoint.host;
  const canonicalUri = `/${encode(cfg.bucket)}/${key.split('/').map(encode).join('/')}`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const region = 'auto';
  const service = 's3';
  const scope = `${dateStamp}/${region}/${service}/aws4_request`;
  const params: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${cfg.accessKeyId}/${scope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresIn),
    'X-Amz-SignedHeaders': 'cache-control;content-type;host',
  };
  const canonicalQuery = Object.entries(params)
    .map(([keyName, value]) => [encode(keyName), encode(value)] as const)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([keyName, value]) => `${keyName}=${value}`).join('&');
  const canonicalHeaders = `cache-control:${R2_MEDIA_CACHE_CONTROL}\ncontent-type:${contentType.trim()}\nhost:${host}\n`;
  const canonicalRequest = ['PUT', canonicalUri, canonicalQuery, canonicalHeaders, 'cache-control;content-type;host', 'UNSIGNED-PAYLOAD'].join('\n');
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256(canonicalRequest)].join('\n');
  const dateKey = hmac(`AWS4${cfg.secretAccessKey}`, dateStamp);
  const regionKey = hmac(dateKey, region);
  const serviceKey = hmac(regionKey, service);
  const signingKey = hmac(serviceKey, 'aws4_request');
  const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');
  const query = `${canonicalQuery}&X-Amz-Signature=${signature}`;
  return {
    uploadUrl: `${cfg.endpoint.replace(/\/+$/, '')}${canonicalUri}?${query}`,
    publicUrl: `${cfg.publicBaseUrl}/${key.split('/').map(encode).join('/')}`,
    bucket: cfg.bucket,
    expiresIn,
  };
}

export function getR2ServerConfig() {
  return config();
}
