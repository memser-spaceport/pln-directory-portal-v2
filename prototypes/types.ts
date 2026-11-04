import type { ComponentType } from 'react';

/**
 * Where the prototype's proposal stands against develop (production):
 * `ideation` — nothing of it is built; `progress` — partly on develop, behind a
 * flag, or on a feature branch; `dev` — what it shows is on develop.
 */
export type PrototypeStatus = 'ideation' | 'progress' | 'dev';

/** Iteration within one feature's line of prototypes: a redo or copy of an earlier entry is the next version. */
export type PrototypeVersion = 1 | 2 | 3;

export type PrototypeEntry = {
  key: string;
  title: string;
  description: string;
  category: string;
  status?: PrototypeStatus;
  version?: PrototypeVersion;
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
export type PrototypeListItem = Pick<
  PrototypeEntry,
  'key' | 'title' | 'description' | 'category' | 'status' | 'version'
>;

export type PrototypeListGroup = {
  category: string;
  items: PrototypeListItem[];
};
