import { mockSoftware, categoryColors } from '@/lib/mock';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import DownloadButton from '@/components/DownloadButton';

export default async function SoftwareDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const software = mockSoftware.find(s => s.id === id);
  if (!software) notFound();

  return (
    <div className="py-8 max-w-3xl">
      <Link href="/software" className="text-sm text-[var(--accent)] mb-4 inline-block">← 返回软件库</Link>
      <div className="flex items-start justify-between gap-4 mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold">{software.title}</h1>
        <span className="shrink-0 px-2.5 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1" style={{background:'var(--accent-bg)', color:'var(--accent)'}}>
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{backgroundColor: categoryColors[software.category]}}></span>
          {software.category}
        </span>
      </div>
      <p className="text-base mb-6" style={{color:'var(--text-secondary)'}}>{software.description}</p>
      <div className="flex flex-wrap gap-2 mb-6">
        {software.tags.map(t => (
          <span key={t} className="px-2 py-0.5 text-xs rounded-full" style={{background:'var(--bg-tertiary)', color:'var(--text-secondary)'}}>{t}</span>
        ))}
      </div>
      <div className="rounded-2xl border border-[var(--border-color)] p-5 mb-6" style={{background:'var(--bg-glass)'}}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          {software.version && <div><span className="text-[var(--text-tertiary)]">版本</span><p className="font-medium">{software.version}</p></div>}
          {software.size && <div><span className="text-[var(--text-tertiary)]">大小</span><p className="font-medium">{software.size}</p></div>}
          {software.downloads && <div><span className="text-[var(--text-tertiary)]">下载量</span><p className="font-medium">{software.downloads.toLocaleString()}</p></div>}
          {software.platform && <div><span className="text-[var(--text-tertiary)]">平台</span><p className="font-medium">{software.platform.join(' / ')}</p></div>}
        </div>
      </div>
      <DownloadButton downloadUrl={software.downloadUrl || '#'} />
    </div>
  );
}
