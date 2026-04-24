import type { IJobsFacetTreeItem, IJobsFacetItem } from '@/types/jobs.types';
import { TreeFilterItem } from '../types';

export interface JobsFocusAreaTreeItem extends TreeFilterItem {
  count: number;
  children: JobsFocusAreaTreeItem[];
}

export function toJobsTreeFilterItems(items: IJobsFacetTreeItem[]): JobsFocusAreaTreeItem[] {
  return items.map((item) => ({
    id: item.value,
    label: item.value,
    count: item.count,
    children: item.children.map((child: IJobsFacetItem) => ({
      id: child.value,
      label: child.value,
      parentId: item.value,
      count: child.count,
      children: [],
    })),
  }));
}

export function getJobsFocusAreaCount(item: JobsFocusAreaTreeItem): number {
  return item.count;
}
