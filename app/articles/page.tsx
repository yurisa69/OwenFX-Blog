import Link from 'next/link'

const list = [
  { id: '1', title: '2026 必备：Windows 效率工具推荐', category: '工具评测', date: '2026-06-25' },
  { id: '2', title: '开源软件指南：从入门到精通', category: '教程', date: '2026-06-22' },
  { id: '3', title: 'Linear 风格界面设计探索', category: '设计', date: '2026-06-18' },
]

export default function ArticlesPage() {
  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-6">文章</h1>
      <div className="space-y-3">
        {list.map(a => (
          <Link key={a.id} href={`/articles/${a.id}`} className="block rounded-2xl border border-[var(--border-color)] p-5" style={{ background: 'var(--bg-glass)' }}>
            <span className="text-xs text-[var(--accent)]">{a.category}</span>
            <h2 className="mt-1 font-semibold">{a.title}</h2>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">{a.date}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
