export function useGetAddRemoveHandlers<T>(tags: T[], uniqueKey: keyof T) {
  function addItem(itemToAdd: T) {
    return [...tags, itemToAdd];
  }

  function removeItem(itemToRemove: T) {
    const newItems = tags.filter((item) => item[uniqueKey] !== itemToRemove[uniqueKey]);
    return newItems;
  }

  return {
    addItem,
    removeItem,
  };
}
