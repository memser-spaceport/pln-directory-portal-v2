import { PaginationItem } from '@/components/common/Pagination/types';

export function generatePaginationItems(
  count: number,
  page: number,
  siblingCount: number,
  boundaryCount: number,
): PaginationItem[] {
  const items: PaginationItem[] = [];

  // Helper to add page
  const addPage = (pageNum: number) => {
    items.push({
      type: 'page',
      page: pageNum,
      selected: pageNum === page,
    });
  };

  // Helper to add ellipsis
  const addEllipsis = () => {
    items.push({ type: 'ellipsis' });
  };

  // Calculate ranges
  const startPages = Array.from({ length: Math.min(boundaryCount, count) }, (_, i) => i + 1);
  const endPages = Array.from(
    { length: Math.min(boundaryCount, count) },
    (_, i) => count - Math.min(boundaryCount, count) + 1 + i,
  ).filter((p) => p > boundaryCount);

  const siblingsStart = Math.max(
    Math.min(page - siblingCount, count - boundaryCount - siblingCount * 2 - 1),
    boundaryCount + 2,
  );

  const siblingsEnd = Math.min(
    Math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2),
    endPages.length > 0 ? endPages[0] - 2 : count - 1,
  );

  // Build the items array
  // Start pages
  startPages.forEach(addPage);

  // Start ellipsis
  if (siblingsStart > boundaryCount + 2) {
    addEllipsis();
  } else if (boundaryCount + 1 < count - boundaryCount) {
    addPage(boundaryCount + 1);
  }

  // Sibling pages
  for (let i = siblingsStart; i <= siblingsEnd; i++) {
    if (i > boundaryCount && i < count - boundaryCount + 1) {
      addPage(i);
    }
  }

  // End ellipsis
  if (siblingsEnd < count - boundaryCount - 1) {
    addEllipsis();
  } else if (count - boundaryCount > boundaryCount) {
    addPage(count - boundaryCount);
  }

  // End pages
  endPages.forEach(addPage);

  // Remove duplicates and sort
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.type === 'ellipsis' ? `ellipsis-${items.indexOf(item)}` : `page-${item.page}`;
    if (seen.has(key) || (item.type === 'page' && (item.page! < 1 || item.page! > count))) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
