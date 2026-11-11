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
  let initialUser: { id: string; name: string; email?: string | null���q�^