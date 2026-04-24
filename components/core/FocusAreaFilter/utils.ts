import { TreeFilterItem } from './types';

export function sortByLabel<T extends TreeFilterItem>(items: T[]): T[] {
  return [...items].sort((a, b) => a.label.localeCompare(b.label));
}

export function findAllParents<T extends TreeFilterItem>(roots: T[], targetId: string): T[] {
  const parents: T[] = [];

  function walk(node: T, ancestors: T[]) {
    if (node.id === targetId) {
      parents.push(...ancestors);
      return;
    }
    for (const child of node.children as T[]) {
      walk(child, [...ancestors, node]);
    }
  }

  for (const root of roots) {
    walk(root, []);
  }
  return parents;
}

export function findChildren<T extends TreeFilterItem>(node: T): T[] {
  const result: T[] = [];

  function walk(current: T) {
    for (const child of current.children as T[]) {
      result.push(child);
      walk(child);
    }
  }

  walk(node);
  return result;
}
