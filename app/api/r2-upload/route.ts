import { NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/admin-api';
import { uploadToR2 } from '@/lib/r2';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const auth = await authorizeAdmin();
  if ('response' in auth) return auth.response;

  const formData = await request.formData().catch(() => null);
  const file = formData?.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: '请通过 file 字段选择图片' }, { status: 400 });
  }

  try {
    const uploaded = await uploadToR2(file);
    return NextResponse.json(uploaded, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '图片上传失败';
    const status = message.startsWith('R2 配置不完整') ? 503 : 400;
    console.error('[r2-upload]', message);
    return NextResponse.json({ error: status === 503 ? message : '图片上传失败，请检查图片格式、大小及 R2 配置' }, { status });
  }
}
