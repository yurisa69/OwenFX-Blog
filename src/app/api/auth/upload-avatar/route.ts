import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: '请先配置 R2 与 Supabase 环境变量' }, { status: 501 });
}
