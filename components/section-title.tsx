export function SectionTitle({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="mb-4">
      {eyebrow && <div className="mb-1 text-xs uppercase tracking-widest text-[var(--accent)]">{eyebrow}</div>}
      <h1 className="text-2xl font-semibold">{title}</h1>
    </div>
  )
}
