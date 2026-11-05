import Link from 'next/link'
import type { Post } from '@/lib/data'

export function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/posts/${post.slug}`} className="block rounded-2xl border border-[var(--border-color)] p-4" style={{ background: 'var(--bg-glass)' }}>
      <div className="text-xs text-[var(--accent)]">{post.category.label}</div>
      <div className="mt-1 font-medium">{post.title}</div>
      <div className="mt-1 text-sm text-[var(--text-secondary)]">{post.excerpt}</div>
    </Link>
  )
}
