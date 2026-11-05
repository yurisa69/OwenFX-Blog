import Link from 'next/link'

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <div className="py-8 max-w-3xl">
      <Link href="/articles" className="text-sm text-[var(--accent)]">← 返回</Link>
      <h1 className="mt-4 text-2xl font-bold">{slug}</h1>
      <p className="mt-4 text-[var(--text-secondary)]">文章内容占位</p>
    </div>
  )
}
