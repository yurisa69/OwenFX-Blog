import type { Metadata } from 'next';
import { Caramel, Geist, Geist_Mono, Splash } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import Navbar from '@/components/Navbar';
import BackToTop from '@/components/BackToTop';
import ScrollToTop from '@/components/ScrollToTop';
import PageViewTracker from '@/components/PageViewTracker';
import { createClient } from '@/lib/supabase/server';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const splash = Splash({ variable: '--font-splash', subsets: ['latin'], weight: '400', display: 'swap' });
const caramel = Caramel({ variable: '--font-caramel', subsets: ['latin'], weight: '400', display: 'swap' });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://owenfx-blog.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'OwenFX — 软件与文章', template: '%s' },
  description: 'OwenFX 是一个软件与技术内容分享站，提供软件介绍、官方下载入口、网盘资源及原创技术文章。',
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    siteName: 'OwenFX',
    url: siteUrl,
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
  alternates: { types: { 'application/rss+xml': '/rss.xml' } },
};

const themeInitScript = `(() => {
  try {
    const theme = localStorage.getItem('theme') === 'light' ? 'light' : 'dark';
    const root = document.getElementById('site-root');
    if (!root) return;
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
  } catch {
    const root = document.getElementById('site-root');
    if (root) { root.setAttribute('data-theme', 'dark'); root.style.colorScheme = 'dark'; }
  }
})();`;

const criticalLayoutStyle = `#site-root{min-height:100vh;box-sizing:border-box;background:var(--bg-primary,#0b0f1a);color:var(--text-primary,#f1f5f9)}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let initialUser: { id: string; name: string; email?: string | null; avatar_url: string | null } | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const metadata = user.user_metadata as Record<string, unknown>;
      const metadataAvatar = typeof metadata.avatar_url === 'string' ? metadata.avatar_url : typeof metadata.picture === 'string' ? metadata.picture : null;
      const metadataName = typeof metadata.display_name === 'string' ? metadata.display_name : typeof metadata.name === 'string' ? metadata.name : null;

      // Read only the fields needed by the global account identity so the
      // database avatar is already available in the first server-rendered HTML.
      let profile: { display_name?: string | null; avatar_url?: string | null } | null = null;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('display_name,avatar_url')
          .eq('id', user.id)
          .maybeSingle();
        profile = data;
      } catch {
        // Keep the authenticated Session metadata as a safe fallback.
      }

      initialUser = {
        id: user.id,
        name: profile?.display_name || metadataName || user.email?.split('@')[0] || '用户',
        email: user.email,
        avatar_url: profile?.avatar_url || metadataAvatar,
      };
    }
  } catch {}

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head><style dangerouslySetInnerHTML={{ __html: criticalLayoutStyle }} /></head>
      <body style={{ margin: 0 }}>
        <div id="site-root" className={`site-css-scope ${geistSans.variable} ${geistMono.variable} ${splash.variable} ${caramel.variable}`} data-theme="dark" suppressHydrationWarning>
          <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
          <div className="min-h-screen antialiased">
            <ThemeProvider>
              <Navbar initialUser={initialUser} />
              <PageViewTracker />
              <main style={{ paddingTop: '56px', overflowX: 'hidden' }}>
                <div className="max-w-6xl mx-auto min-h-[calc(100vh-3.5rem)] pb-[5.5rem] md:pb-0" style={{ paddingLeft: '24px', paddingRight: '24px' }}>
                  {children}
                </div>
              </main>
              <BackToTop />
              <ScrollToTop />
            </ThemeProvider>
          </div>
        </div>
      </body>
    </html>
  );
}
