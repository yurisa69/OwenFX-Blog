import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Caramel, Geist, Geist_Mono, Splash } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import Navbar from '@/components/Navbar';
import BackToTop from '@/components/BackToTop';
import ScrollToTop from '@/components/ScrollToTop';
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
  alternates: { types: { 'application/rss+xml': '/rss.xml���q�^