import Link from 'next/link'

const cats = ['AI工具', '效率办公', '开发工具', '设计创意', '系统工具', '多媒体']

export default function CategoriesPage() {
  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-6">分类</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cats.map(c => (
          <Link key={c} href="/software" className="rounded-2xl border border-[var(--border-color)] p-5 text-center" style={{ background: 'var(--bg-glass)' }}>
            <h2 className="font-semibold">{c}</h2>
          </Link>
        ))}
      </div>
    </div>
  )
}
