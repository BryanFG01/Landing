import type { PaginationItem, RangeSlot } from './types';

const ELLIPSIS = '...';
/** Con hasta este número de páginas se muestran todas, sin puntos suspensivos. */
const MAX_PAGES_WITHOUT_DOTS = 7;

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function rangeSlots(current: number, total: number, sibling: number): RangeSlot[] {
  if (total <= MAX_PAGES_WITHOUT_DOTS) return range(1, total);

  const leftSiblingIndex = Math.max(current - sibling, 1);
  const rightSiblingIndex = Math.min(current + sibling, total);

  const showLeftDots = leftSiblingIndex > 2;
  const showRightDots = rightSiblingIndex < total - 1;

  if (!showLeftDots && showRightDots) {
    return [...range(1, 3 + sibling * 2), ELLIPSIS, total];
  }
  if (showLeftDots && !showRightDots) {
    return [1, ELLIPSIS, ...range(total - (2 + sibling * 2), total)];
  }
  return [1, ELLIPSIS, ...range(leftSiblingIndex, rightSiblingIndex), ELLIPSIS, total];
}

/** Páginas visibles alrededor de la actual, con puntos suspensivos donde se salta un tramo. */
export function paginationItems(current: number, total: number, sibling: number): PaginationItem[] {
  return rangeSlots(current, total, sibling).map((slot, i) =>
    slot === ELLIPSIS
      ? { key: `ellipsis-${i}`, page: 0, isEllipsis: true }
      : { key: slot, page: slot, isEllipsis: false },
  );
}
