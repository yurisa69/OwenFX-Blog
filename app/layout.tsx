import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import Navbar from '@/components/Navbar'
import MobileBottomNav from '@/components/MobileBottomNav'

export const metadata: Metadata = {
  title: 'OwenFX — 精选软件与文章',
  description: '精选免费、开源、实用软件与技术文章',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" data-theme="dark" suppressHydrationWarning>
      <body style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', margin: 0 }}>
        <ThemeProvider>
          <Navbar />
          <main style={{ paddingTop: 56, paddingBottom: 88, minHeight: '100vh' }}>
            <div className="mx-auto max-w-6xl px-4 sm:px-6">{children}</div>
          </main>
          <MobileBottomNav />
        </ThemeProvider>
      </body>
    </html>
  )
}
