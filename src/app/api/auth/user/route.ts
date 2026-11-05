import { NextResponse } from 'next/server';

export async function PATCH() {
  return NextResponse.json({ error: '请先配置 Supabase 环境变量' }, { status: 501 });
}
