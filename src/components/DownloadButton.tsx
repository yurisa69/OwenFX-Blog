import ArticleSupport from '@/components/ArticleSupport';

interface DownloadButtonProps {
  downloadUrl: string;
}

export default function DownloadButton({ downloadUrl }: DownloadButtonProps) {
  return (
    <div className="flex flex-wrap gap-3 animate-fade-in">
      <a
        href={downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 text-sm rounded-full transition-all duration-200 flex items-center gap-1.5"
        style={{ background: 'var(--accent-bg)', color: '#FF0080' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        网盘下载
      </a>
      <a
        href={downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 text-sm rounded-full transition-all duration-200 flex items-center gap-1.5"
        style={{ background: 'var(--accent-bg)', color: '#9333EA' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        官方下载
      </a>
      <ArticleSupport />
    </div>
  );
}
