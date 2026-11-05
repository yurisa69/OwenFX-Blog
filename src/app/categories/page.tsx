import Link from 'next/link';
import { mockSoftware, categoryOrder } from '@/lib/mock';
export const metadata = { title: '分类 — OwenFX' };
export default function CategoriesPage() {
  const orderedCats = categoryOrder.filter(c => mockSoftware.some(s => s.category === c));
  return (
    <div className="animate-fade-in py-8">
      <h1 className="text-2xl font-bold mb-6">分类</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {orderedCats.map((c, i) => (
          <Link key={c} href={'/software'} className="rounded-2xl border border-[var(--border-color)] p-6 text-center transition hover:border-[var(--accent)]" style={{background:'var(--bg-glass)', animationDelay: i*80+'ms'}}>
            <h2 className="text-lg font-semibold mb-1">{c}</h2>
            <p className="text-sm" style={{color:'var(--text-tertiary)'}}>{mockSoftware.filter(s => s.category === c).length} 个软件</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
