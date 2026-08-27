import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

function client() {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  if (!accountId || !accessKeyId || !secretAccessKey) return null
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })
}

export async function uploadToR2(key: string, body: Uint8Array, contentType: string) {
  const bucket = process.env.R2_BUCKET_NAME
  const c = client()
  if (!bucket || !c) throw new Error('R2 环境变量未配置')
  await c.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }))
  const base = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, '')
  return base ? `${base}/${key}` : key
}
