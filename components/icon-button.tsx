'use client'
import type { ReactNode } from 'react'

export function IconButton({ label, onClick, children, className = '' }: { label: string; onClick?: () => void; children: ReactNode; className?: string }) {
  return <button aria-label={label} onClick={onClick} className={`grid h-10 w-10 place-items-center rounded-full border border-white/[.06] bg-white/[.035] text-slate-300 transition hover:bg-white/[.08] hover:text-white ${className}`}>{children}</button>
}
