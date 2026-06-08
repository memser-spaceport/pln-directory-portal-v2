import type { PrototypeEntry, PrototypeGroup } from './types';

export const prototypeRegistry: PrototypeEntry[] = [
  {
    key: 'template',
    title: 'Starter template',
    description: 'Copy this entry as a starting point — mock list, detail panel, and local state.',
    category: 'Getting started',
    load: () => import('./entries/template/TemplatePrototype'),
  },
  {
    key: 'gantry-priority-support',
    title: 'Gantry priority support',
    description: 'Compare current upvote UX with eight prioritization patterns on mocked Gantry need cards.',
    category: 'Gantry',
    load: () => import('./entries/gantry-priority-support/GantryPrioritySupportPrototype'),
  },
];

export function getPrototypeEntry(key: string): PrototypeEntry | undefined {
  return prototypeRegistry.find((entry) => entry.key === key);
}

export function getPrototypeKeys(): string[] {
  return prototypeRegistry.map((entry) => entry.key);
}

export function getPrototypesByCategory(): PrototypeGroup[] {
  const groups = new Map<string, PrototypeEntry[]>();

  for (const entry of prototypeRegistry) {
    const items = groups.get(entry.category) ?? [];
    items.push(entry);
    groups.set(entry.category, items);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, items]) => ({ category, items }));
}
