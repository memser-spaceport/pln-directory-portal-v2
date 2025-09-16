import { ForumFoundItem, FoundItem } from '@/services/search/types';

// Helper function to group items by their index field
export const groupItemsByIndex = (items: (FoundItem | ForumFoundItem)[]) => {
  const grouped = items.reduce(
    (acc, item) => {
      const index = item.index;
      if (!acc[index]) {
        acc[index] = [];
      }
      acc[index].push(item);
      return acc;
    },
    {} as Record<string, (FoundItem | ForumFoundItem)[]>,
  );

  return grouped;
};
