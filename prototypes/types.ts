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
