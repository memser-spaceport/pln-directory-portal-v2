import type { ComponentType } from 'react';

export type PrototypeEntry = {
  key: string;
  title: string;
  description: string;
  category: string;
  load: () => Promise<{ default: ComponentType }>;
};

export type PrototypeGroup = {
  category: string;
  items: PrototypeEntry[];
};

/**
 * The serializable slice of a prototype entry (no `load` function), safe to pass
 * from the server index into the client-side search/browse component.
 */
export type PrototypeListItem = Pick<PrototypeEntry, 'key' | 'title' | 'description' | 'category'>;

export type PrototypeListGroup = {
  category: string;
  items: PrototypeListItem[];
};
