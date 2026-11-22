import type { Metadata } from 'next';
import { Caramel, Geist, Geist_Mono, Splash } from 'next/font/google';
import { cookies } from 'next/headers';
import './admin/admin.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const splash = Splash({ variable: '--font-splash', subsets: ['latin'], weight: '400', display: 'swap' });
const caramel = Caramel({ variable: '--font-caramel', subsets: ['latin'], weight: '400', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'OwenFX Studio — 后台管理', template: '%s · OwenFX Studio' },
  robots: { index: false, follow: false },
};

const adminThemeInitScript = `(() => {
  try {
    const root = document.currentScript && document.currentScript.parentElement;
    const match = document.cookie.match(/(?:^|; )admin-theme=(dark|light)(?:;|$)/);
    const stored = localStorage.getItem('admin-theme');
    const theme = match ? match[1] : stored === 'light' || stored === 'dark' ? stored : 'dark';
    document.documentElement.setAttribute('data-admin-theme', theme);
    document.documentElement.style.colorScheme = theme;
    if (root) {
      root.setAttribute('data-admin-theme', theme);
      root.style.colorScheme = theme;
    }
    if (!match && (stored === 'light' || stored === 'dark')) {
      document.cookie = 'admin-theme=' + stored + '; Path=/; Max-Age=31536000; SameSite=Lax';
    }
  } catch {}
})();`;

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const initialTheme = cookieStore.get('admin-theme')?.value === 'light' ? 'light' : 'dark';

  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} ${splash.variable} ${caramel.variable} h-full antialiased`}
      data-admin-theme={initialTheme}
      style={{ overflowY: 'scroll', overflowX: 'hidden', scrollbarGutter: 'stable' }}
      suppressHydrationWarning
    >
      <body style={{ margin: 0, background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div
          id="admin-root"
          className="admin-theme-root min-h-screen"
          data-admin-theme={initialTheme}
          suppressHydrationWarning
        >
          <script dangerouslySetInnerHTML={{ __html: adminThemeInitScript }} />
          {children}
        </div>
      </body>
    </html>
  );
}
