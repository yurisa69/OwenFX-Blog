export default function BookmarksPage() {
  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-6">我的收藏</h1>
      <div className="rounded-2xl border border-[var(--border-color)] p-10 text-center" style={{ background: 'var(--bg-glass)' }}>
        <p className="text-[var(--text-secondary)]">还没有收藏</p>
        <p className="mt-2 text-sm text-[var(--text-tertiary)]">登录后可收藏文章和软件</p>
      </div>
    </div>
  )
}
