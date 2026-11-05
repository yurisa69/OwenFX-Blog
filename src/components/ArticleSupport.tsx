'use client';

export default function ArticleSupport() {
  return (
    <button
      className="px-4 py-2 text-sm rounded-full transition-all duration-200 flex items-center gap-1.5"
      style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
      onClick={() => alert('感谢支持！')}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      支持作者
    </button>
  );
}
