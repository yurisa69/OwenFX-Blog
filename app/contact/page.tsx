import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '联系我们 — OwenFX',
  description: '通过邮件、Telegram 或 X 与 OwenFX 联系。',
};

const contacts = [
  {
    label: '邮件',
    value: '联系邮件暂未配置',
    color: '#818cf8',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a2 2 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
  {
    label: 'Telegram',
    value: '账号暂未配置',
    color: '#26A5E4',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M21.8 4.3 18.5 20c-.2 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.3-8.4c.4-.4-.1-.6-.6-.2L5.9 13.5.9 11.9c-1.1-.3-1.1-1.1.2-1.6L20.4 2.9c.9-.3 1.7.2 1.4 1.4Z" />
      </svg>
    ),
  },
  {
    label: 'X · Twitter',
    value: '账号暂未配置',
    color: 'var(--text-primary)',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M18.9 2h3.3l-7.3 8.3L23.5 22h-6.7l-5.3-6.9L5.5 22H2.2l7.8-8.9L1.8 2h6.9l4.8 6.3L18.9 2Zm-1.2 18h1.8L7.7 3.9h-2L17.7 20Z" />
      </svg>
    ),
  },
];

export default function ContactPage() {
  return (
    <section className="animate-fade-in mx-auto max-w-3xl py-8 md:py-10">
      <h1 className="mb-4 text-center text-2xl font-bold">联系我们</h1>
      <div className="uiverse-card p-5 md:p-6">
        <p className="mb-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          有任何建议或软件推荐？欢迎通过以下渠道联系 OwenFX。
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {contacts.map((contact) => (
            <div
              key={contact.label}
              aria-label={contact.label + '，联系方式暂未配置'}
              className="flex min-h-28 flex-col items-center justify-center gap-3 rounded-lg p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                style={{ color: contact.color, background: 'var(--accent-bg)' }}
              >
                {contact.icon}
              </span>
              <span className="block max-w-full">
                <span className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {contact.label}
                </span>
                <span className="mt-1 block break-all text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {contact.value}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
