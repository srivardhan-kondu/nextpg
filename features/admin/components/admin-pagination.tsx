import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface AdminPaginationProps {
  page: number;
  pages: number;
  total: number;
  basePath: string;
  /** Preserved so paging does not drop the active search/filter. */
  params?: Record<string, string | undefined>;
}

export function AdminPagination({ page, pages, total, basePath, params = {} }: AdminPaginationProps) {
  if (pages <= 1) {
    return <p className="text-sm text-muted-foreground">{total} record{total === 1 ? '' : 's'}</p>;
  }

  const build = (target: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value) search.set(key, value);
    search.set('page', String(target));
    return `${basePath}?${search.toString()}`;
  };

  return (
    <nav className="flex items-center justify-between gap-3" aria-label="Pagination">
      <p className="text-sm text-muted-foreground">
        Page {page} of {pages} · {total} records
      </p>
      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm" disabled={page <= 1}>
          <Link href={build(page - 1)} aria-disabled={page <= 1}>
            Previous
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" disabled={page >= pages}>
          <Link href={build(page + 1)} aria-disabled={page >= pages}>
            Next
          </Link>
        </Button>
      </div>
    </nav>
  );
}
