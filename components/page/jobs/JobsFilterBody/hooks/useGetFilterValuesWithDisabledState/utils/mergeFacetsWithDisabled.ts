import type { IJobsFacetItem, IJobsFacetTreeItem } from '@/types/jobs.types';

export function mergeFacetsWithDisabled(
  base: IJobsFacetItem[] | undefined,
  filtered: IJobsFacetItem[] | undefined,
): IJobsFacetItem[] | undefined {
  if (!base) return filtered;

  const filteredMap = new Map((filtered ?? []).map((item) => [item.value, item.count]));

  return base.map((item) => ({
    value: item.value,
    count: filteredMap.get(item.value) ?? 0,
  }));
}

export function mergeFocusTreeWithDisabled(
  base: IJobsFacetTreeItem[] | undefined,
  filtered: IJobsFacetTreeItem[] | undefined,
): IJobsFacetTreeItem[] | undefined {
  if (!base) {
    return filtered;
  }

  const filteredMap = new Map<string, IJobsFacetTreeItem>();
  for (const item of filtered ?? []) {
    filteredMap.set(item.value, item);
  }

  return base.map((item) => {
    const match = filteredMap.get(item.value);
    const childMap = new Map((match?.children ?? []).map((c) => [c.value, c.count]));

    return {
      value: item.value,
      count: match?.count ?? 0,
      children: item.children.map((child) => ({
        value: child.value,
        count: childMap.get(child.value) ?? 0,
      })),
    };
  });
}
