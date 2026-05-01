export function facetToFilterItems(items?: { value: string; count: number }[]) {
  return items?.map((item) => {
    const { value, count } = item;

    return {
      value,
      count,
      disabled: count === 0,
    };
  });
}
