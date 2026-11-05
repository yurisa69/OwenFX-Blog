'use client'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md py-12">
      <div className="rounded-2xl border border-[var(--border-color)] p-6" style={{ background: 'var(--bg-glass)' }}>
        <h1 className="text-center text-xl font-semibold">登录 OwenFX</h1>
        <p className="mt-2 text-center text-sm text-[var(--text-tertiary)]">请先在环境变量中配置 Supabase</p>
        <Link href="/" className="mt-6 block text-center text-sm text-[var(--accent)]">返回首页</Link>
      </div>
    </div>
  )
}
