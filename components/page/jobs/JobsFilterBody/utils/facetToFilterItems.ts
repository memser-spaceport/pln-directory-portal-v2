export function facetToFilterItems(items?: { value: string; count: number }[]) {
  return items?.map((item) => ({ value: item.value, count: item.count, disabled: false }));
}
