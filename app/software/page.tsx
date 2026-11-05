import Link from 'next/link'

const list = [
  { id: '1', title: 'Cursor', desc: 'AI 驱动的代码编辑器', category: 'AI工具' },
  { id: '2', title: 'Notion', desc: '全能笔记与协作工具', category: '效率办公' },
  { id: '3', title: 'Figma', desc: '浏览器端专业设计工具', category: '设计创意' },
]

export default function SoftwarePage() {
  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-6">软件库</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map(s => (
          <Link key={s.id} href={`/software/${s.id}`} className="rounded-2xl border border-[var(--border-color)] p-5" style={{ background: 'var(--bg-glass)' }}>
            <h2 className="font-semibold">{s.title}</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{s.desc}</p>
            <span className="mt-3 inline-block text-xs text-[var(--accent)]">{s.category}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
