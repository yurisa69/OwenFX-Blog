export const metadata = { title: '联系 — OwenFX' };

export default function ContactPage() {
  return (
    <div className="py-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-4">联系我们</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        有软件推荐、合作意向或问题反馈，欢迎通过以下方式联系。
      </p>
      <div className="rounded-2xl border border-[var(--border-color)] p-6 space-y-4" style={{ background: 'var(--bg-glass)' }}>
        <div>
          <p className="text-xs text-[var(--text-tertiary)] mb-1">邮箱</p>
          <p className="font-medium">hello@owenfx.com</p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-tertiary)] mb-1">Telegram</p>
          <p className="font-medium">@OwenFX</p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-tertiary)] mb-1">GitHub</p>
          <p className="font-medium">github.com/yurisa69</p>
        </div>
      </div>
    </div>
  );
}
