export type PaginationItemType = 'page' | 'ellipsis';

export interface PaginationItem {
  type: PaginationItemType;
  page?: number;
  selected?: boolean;
}
