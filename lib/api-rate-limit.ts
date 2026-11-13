import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';

export function getRequestIp(request: Request): string | null {
  const realIp = request.headers.get('x-real-ip')?.trim() || '';
  if (isIP(realIp) !== 0) return realIp;

  const forwarded = request.headers.get('x-forwarded-for');
  const forwardedIps = forwarded
    ? forwarded.split(',').map(value => value.trim()).filter(value => isIP(value) !== 0)
    : [];
  return forwardedIps[0] || null;
}

export function createRateLimitBucketKey(scope: string, identifier: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('缺少 Supabase 服务端限流密钥配置。');
  return createHmac('sha256', secret).update(scope + ':' + identifier).digest('hex');
}

export async function readLimitedRequestBody(request: Request, maxBytes: number): Promise<string | null> {
  const contentLengthHeader = request.headers.get('content-length');
  const contentLength = contentLengthHeader ? Number(contentLengthHeader) : 0;
  if (Number.isFinite(contentLength) && contentLength > maxBytes) return null;

  const reader = request.body?.getReader();
  if (!reader) return '';

  const buffer = new Uint8Array(maxBytes);
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (totalBytes + value.byteLength > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return null;
      }
      buffer.set(value, totalBytes);
      totalBytes += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }

  return new TextDecoder().decode(buffer.subarray(0, totalBytes));
}
