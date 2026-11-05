import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ comments: [] });
}

export async function POST() {
  return NextResponse.json({ error: '请先配置 Supabase' }, { status: 501 });
}
