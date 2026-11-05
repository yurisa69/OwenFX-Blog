export default function AboutPage() {
  return (
    <div className="py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">关于 OwenFX</h1>
      <div className="rounded-2xl border border-[var(--border-color)] p-6 text-sm leading-relaxed text-[var(--text-secondary)]" style={{ background: 'var(--bg-glass)' }}>
        <p className="mb-3">OwenFX 是一个精选软件资源分享站，致力于推荐优秀的免费、开源、实用软件与技术文章。</p>
        <p>底部导航：首页 · 分类 · 收藏 · 我的</p>
      </div>
    </div>
  )
}
