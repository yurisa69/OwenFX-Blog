import { NextResponse } from 'next/server'
export async function POST() {
  return NextResponse.json({ error: 'R2 未配置' }, { status: 501 })
}
