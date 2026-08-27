'use client'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [dark, setDark] = useState(true)
  useEffect(() => setDark(document.documentElement.dataset.theme !== 'light'), [])
  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.dataset.theme = next ? 'dark' : 'light'
    localStorage.setItem('owenfx-theme', next ? 'dark' : 'light')
  }
  return <button onClick={toggle} aria-label="切换主题" className="grid h-10 w-10 place-items-center rounded-full text-slate-300 hover:bg-white/[.05]">{dark ? <Sun size={19}/> : <Moon size={19}/>}</button>
}
