import Link from 'next/link';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  basePath: string;
  query?: Record<string, string>;
};

export default function Pagination({ currentPage, totalPages, basePath, query = {} }: PaginationProps) {
  if (totalPages <= 1) return null;

  const hrefFor = (page: number) => {
    const params = new URLSearchParams(query);
    params.set('page', String(page));
    return basePath + '?' + params.toString();
  };

  return (
    <nav className="mt-8 flex items-center justify-center gap-3 text-sm" aria-label="分页">
      {currentPage > 1 ? (
        <Link href={hrefFor(currentPage - 1)} className="uiverse-btn uiverse-btn-ghost !px-4 !py-2">上一页</Link>
      ) : (
        <span className="uiverse-btn uiverse-btn-ghost !px-4 !py-2 opacity-40" aria-disabled="true">上一页</span>
      )}
      <span className="min-w-20 text-center tabular-nums opacity-70">{currentPage} / {totalPages}</span>
      {currentPage < totalPages ? (
        <Link href={hrefFor(currentPage + 1)} className="uiverse-btn uiverse-btn-ghost !px-4 !py-2">下一页</Link>
      ) : (
        <span className="uiverse-btn uiverse-btn-ghost !px-4 !py-2 opacity-40" aria-disabled="true">下一页</span>
      )}
    </nav>
  );
}
