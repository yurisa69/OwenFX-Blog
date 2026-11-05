'use client'
import { useTheme } from './ThemeProvider'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button onClick={toggleTheme} className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-[var(--text-secondary)] hover:bg-white/10" aria-label="切换主题">
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  )
}
