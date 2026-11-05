export function IconButton({ children, label, onClick }: { children: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-[var(--text-secondary)] hover:bg-white/10">
      {children}
    </button>
  )
}
