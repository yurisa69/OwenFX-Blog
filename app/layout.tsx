import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import Navbar from '@/components/Navbar';
import BackToTop from '@/components/BackToTop';
import ScrollToTop from '@/components/ScrollToTop';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
export const metadata: Metadata = {
  title: 'OwenFX — 精选软件与文章',
  description: 'OwenFX 是一个精选软件资源分享站，汇集免费、开源、实用软件与技术文章。',
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

const criticalLayoutStyle = `html{overflow-y:scroll;overflow-x:hidden;scrollbar-gutter:stable}body{margin:0;background:var(--bg-primary,#0b0f1a);color:var(--text-primary,#f1f5f9)}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let initialUser: { id: string; name: string; email?: string | null; avatar_url: string | null } | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const metadata = session.user.user_metadata as Record<string, unknown>;
      const metadataAvatar = typeof metadata.avatar_url === 'string' ? metadata.avatar_url : typeof metadata.picture === 'string' ? metadata.picture : null;
      const metadataName = typeof metadata.display_name === 'string' ? metadata.display_name : typeof metadata.name === 'string' ? metadata.name : null;

      // Read only the fields needed by the global account identity so the
      // database avatar is already available in the first server-rendered HTML.
      let profile: { display_name?: string | null; avatar_url?: string | null } | null = null;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('display_name,avatar_url')
          .eq('id', session.user.id)
          .maybeSingle();
        profile = data;
      } catch {
        // Keep the authenticated Session metadata as a safe fallback.
      }

      initialUser = {
        id: session.user.id,
        name: profile?.display_name || metadataName || session.user.email?.split('@')[0] || '用户',
        email: session.user.email,
        avatar_url: profile?.avatar_url || metadataAvatar,
      };
    }
  } catch {}

  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} style={{ overflowY: 'scroll', overflowX: 'hidden', scrollbarGutter: 'stable' }} data-theme="dark" suppressHydrationWarning>
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
