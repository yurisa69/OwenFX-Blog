import type { Metadata } from 'next'
import './globals.css'
import { SiteShell } from '@/components/site-shell'

export const metadata: Metadata = {
  title: 'OwenFX · Blog',
  description: '探索设计、技术与产品的无限可能。',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  )
}
