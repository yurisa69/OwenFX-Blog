export const metadata = { title: '关于 — OwenFX' };
export default function AboutPage() {
  return (
    <div className="animate-fade-in py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">关于 OwenFX</h1>
      <div className="uiverse-card p-6 text-sm leading-relaxed" style={{color:'var(--text-secondary)'}}>
        <p className="mb-3">OwenFX 是一个精选软件资源分享站，致力于为中文用户发现和推荐优秀的免费、开源、实用软件。</p>
        <p className="mb-3">我们相信好的工具能够提升效率、改善体验。每一款推荐的软件都经过精心筛选，确保质量可靠。</p>
        <p>如果你有好的软件推荐，欢迎通过联系页面告诉我们。</p>
      </div>
    </div>
  );
}
