import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

let client: S3Client | null = null;

function getR2Config() {
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

  if (missing.length) {
    throw new Error(`R2 配置不完整：${missing.join(', ')}`);
  }

  return { endpoint: endpoint!, bucket: bucket!, accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey!, publicBaseUrl: publicBaseUrl! };
}

function getClient(endpoint: string, accessKeyId: string, secretAccessKey: string) {
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return client;
}

export async function uploadToR2(file: File) {
  if (!file || typeof file.arrayBuffer !== 'function') {
    throw new Error('请选择要上传的图片');
  }
  if (file.size <= 0 || file.size > MAX_UPLOAD_SIZE) {
    throw new Error('图片大小必须大于 0 且不能超过 10 MB');
  }

  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    throw new Error('仅支持 JPG、PNG、WebP、GIF 和 AVIF 图片');
  }

  const config = getR2Config();
  const now = new Date();
  const key = `uploads/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}.${extension}`;
  const body = new Uint8Array(await file.arrayBuffer());

  await getClient(config.endpoint, config.accessKeyId, config.secretAccessKey).send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: body,
      ContentType: file.type,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );

  return {
    key,
    url: `${config.publicBaseUrl}/${key}`,
    contentType: file.type,
    size: file.size,
  };
}
