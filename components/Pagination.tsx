import Link from 'next/link';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  basePath: string;
  query?: Record<string, string | undefined>;
};

function pageHref(basePath: string, query: Record<string, string | undefined>, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set('page', String(page));
  const search = params.toString();
  return search ? basePath + '?' + search : basePath;
}

export default function Pagination({ currentPage, totalPages, basePath, query = {} }: PaginationProps) {
  if (totalPages <= 1) return null;

  const visiblePages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + index,
  );

  return (
    <nav aria-label="分页导航" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {currentPage > 1 ? (
        <Link href={pageHref(basePath, query, currentPage - 1)} rel="prev" className="pagination-link">上一页</Link>
      ) : (
        <span aria-disabled="true" className="pagination-link is-disabled">上一页</span>
      )}
      {visiblePages.map(page => (
        <Link
          key={page}
          href={pageHref(basePath, query, page)}
          aria-current={page === currentPage ? 'page' : undefined}
          className={`pagination-link ${page === currentPage ? 'is-active' : ''}`}
        >
          {page}
        </Link>
      ))}
      {currentPage < totalPages ? (
        <Link href={pageHref(basePath, query, currentPage + 1)} rel="next" className="pagination-link">下一页</Link>
      ) : (
        <span aria-disabled="true" className="pagination-link is-disabled">下一页</span>
      )}
    </nav>
  );
}
