import type { Metadata } from 'next';
import { Geist, Geist_Mono, Splash } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import Navbar from '@/components/Navbar';
import BackToTop from '@/components/BackToTop';
import ScrollToTop from '@/components/ScrollToTop';
import { createClient } from '@/lib/supabase/server';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const splash = Splash({ variable: '--font-splash', subsets: ['latin'], weight: '400', display: 'swap' });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://owenfx-blog.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'OwenFX — 精选软件与文章', template: '%s' },
  description: 'OwenFX 是一个精选软件与技术内容分享站，提供软件介绍、官方下载入口、网盘资源及原创技术文章。',
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
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
  } catch {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.style.colorScheme = 'dark';
  }
})();`;

const criticalLayoutStyle = `html{overflow-y:scroll;overflow-x:hidden;scrollbar-gutter:stable}body{margin:0;background:var(--bg-primary,#0b0f1a);color:var(--text-primary,#f1f5f9)}.glass-nav>div nav a>span:first-child{width:26px!important;min-width:26px!important;font-family:var(--font-splash),cursive!important;font-size:22px!important;font-style:normal!important;font-weight:400!important;line-height:1!important;text-transform:lowercase!important}`;

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
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} ${splash.variable} h-full antialiased`} style={{ overflowY: 'scroll', overflowX: 'hidden', scrollbarGutter: 'stable' }} data-theme="dark" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeInitScript }} /><style dangerouslySetInnerHTML={{ __html: criticalLayoutStyle }} /></head>
      <body style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <ThemeProvider>
          <Navbar initialUser={initialUser} />
          <main style={{ paddingTop: '56px', overflowX: 'hidden' }}>
            <div className="max-w-6xl mx-auto min-h-[calc(100vh-3.5rem)] pb-[5.5rem] md:pb-0" style={{ paddingLeft: '24px', paddingRight: '24px' }}>
              {children}
            </div>
          </main>
          <BackToTop />
          <ScrollToTop />
        </ThemeProvider>
      </body>
    </html>
  );
}
