import type { FoundItem } from '@/services/search/types';

export function askAboutItem(item: FoundItem) {
  return `Tell me about ${item.name}`;
}
