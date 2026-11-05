import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: '请填写邮箱和密码' }, { status: 400 });
    }
    return NextResponse.json({ error: '请先配置 Supabase 环境变量后再使用注册功能' }, { status: 501 });
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
