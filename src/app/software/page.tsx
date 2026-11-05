import { mockSoftware, categoryOrder, categoryColors } from '@/lib/mock';
import { sortTagsByLength } from '@/lib/tag-utils';
import Link from 'next/link';
export const metadata = { title: '软件库 — OwenFX' };
export default async function SoftwarePage() {
  const software = mockSoftware;
  const cats = categoryOrder.filter(c => software.some(s => s.category === c));
  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-2">软件库</h1>
      <p className="text-sm mb-6" style={{color:'var(--text-secondary)'}}>精选免费与开源软件</p>
      <div className="flex flex-wrap gap-2 mb-6">
        <button className="rounded-full px-4 py-1.5 text-xs font-medium text-white" style={{background:'var(--accent)'}}>全部</button>
        {cats.map(c => (<button key={c} className="rounded-full px-4 py-1.5 text-xs border border-[var(--border-color)]" style={{background:'var(--bg-glass)'}}><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{backgroundColor: categoryColors[c]}}></span>{c}</button>))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {software.map((s) => (
          <Link key={s.id} href={'/software/' + s.id} className="rounded-2xl border border-[var(--border-color)] p-5 transition hover:border-[var(--accent)]" style={{background:'var(--bg-glass)'}}>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-base truncate">{s.title}</h3>
              <span className="shrink-0 ml-2 px-2 py-0.5 text-[10px] font-semibold rounded-full inline-flex items-center gap-1" style={{background:'var(--accent-bg)', color:'var(--accent)'}}><span className="inline-block w-1.5 h-1.5 rounded-full" style={{backgroundColor: categoryColors[s.category]}}></span>{s.category}</span>
            </div>
            <p className="text-sm mb-3 line-clamp-2" style={{color:'var(--text-secondary)'}}>{s.description}</p>
             <div className="flex flex-wrap gap-1 mb-3">{sortTagsByLength(s.tags).slice(0,3).map(t => (<span key={t} className="px-1.5 py-[2px] text-[11px] rounded-full inline-flex items-center" style={{background:'var(--bg-tertiary)', color:'var(--text-secondary)'}}>{t}</span>))}</div>
            <span className="px-2 py-0.5 text-xs rounded-full" style={{background:'var(--accent-bg)',color:'var(--success)'}}>免费下载</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
