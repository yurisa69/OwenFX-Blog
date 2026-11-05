import Link from 'next/link'

const articles = [
  { id: '1', title: '2026 必备：Windows 效率工具推荐', excerpt: '十大开源利器，提升你的 Windows 工作效率。', category: '工具评测', date: '2026-06-25' },
  { id: '2', title: '开源软件指南：从入门到精通', excerpt: '教你正确选择和使用开源软件。', category: '教程', date: '2026-06-22' },
  { id: '3', title: 'Linear 风格界面设计探索', excerpt: '从色彩、间距到微交互的设计拆解。', category: '设计', date: '2026-06-18' },
]

const software = [
  { id: '1', title: 'Cursor', desc: 'AI 驱动的代码编辑器', category: 'AI工具' },
  { id: '2', title: 'Notion', desc: '全能笔记与协作工具', category: '效率办公' },
  { id: '3', title: 'Figma', desc: '浏览器端专业设计工具', category: '设计创意' },
]

export default function HomePage() {
  return (
    <div className="py-6 space-y-10">
      <section className="rounded-2xl border border-[var(--border-color)] p-6 sm:p-8" style={{ background: 'var(--bg-glass)' }}>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">精选软件</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-4">发现高效实用的开源免费工具</p>
        <div className="flex flex-wrap gap-2">
          {['免费开源', '精选推荐', '每日更新'].map(t => (
            <span key={t} className="rounded-full px-3 py-1 text-xs" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>{t}</span>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">最新文章</h2>
          <Link href="/articles" className="text-sm text-[var(--accent)]">查看全部</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map(a => (
            <Link key={a.id} href={`/articles/${a.id}`} className="rounded-2xl border border-[var(--border-color)] p-5 transition hover:border-[var(--accent)]" style={{ background: 'var(--bg-glass)' }}>
              <span className="text-xs rounded-full px-2 py-0.5" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>{a.category}</span>
              <h3 className="mt-2 font-semibold line-clamp-2">{a.title}</h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)] line-clamp-2">{a.excerpt}</p>
              <p className="mt-3 text-xs text-[var(--text-tertiary)]">{a.date}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">精选推荐</h2>
          <Link href="/software" className="text-sm text-[var(--accent)]">查看全部</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {software.map(s => (
            <Link key={s.id} href={`/software/${s.id}`} className="rounded-2xl border border-[var(--border-color)] p-5" style={{ background: 'var(--bg-glass)' }}>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{s.desc}</p>
              <span className="mt-3 inline-block text-xs text-[var(--accent)]">{s.category}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
