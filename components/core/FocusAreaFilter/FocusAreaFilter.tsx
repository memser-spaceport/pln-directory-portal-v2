import { useMemo } from 'react';

import { TreeFilterItem } from './types';
import { TreeFilterNode } from './components/TreeFilterNode';
import { findAllParents, findChildren, sortByLabel } from './utils';

import s from './FocusAreaFilter.module.scss';

interface FocusAreaFilterProps<T extends TreeFilterItem> {
  items: T[];
  selectedIds: Set<string>;
  onToggle: (item: T) => void;
  getCount?: (item: T) => number;
  showDescription?: boolean;
}

export function FocusAreaFilter<T extends TreeFilterItem>(props: FocusAreaFilterProps<T>) {
  const { items, selectedIds, onToggle, getCount, showDescription } = props;

  const rootItems = useMemo(() => sortByLabel(items.filter((item) => !item.parentId)), [items]);

  const parentIds = useMemo(() => {
    const ids = new Set<string>();
    selectedIds.forEach((id) => {
      findAllParents(rootItems, id).forEach((p) => ids.add(p.id));
    });
    return ids;
  }, [rootItems, selectedIds]);

  return (
    <div className={s.root}>
      <div className={s.focusAreasList}>
        {rootItems.map((item) => (
          <TreeFilterNode
            key={item.id}
            item={item}
            selectedIds={selectedIds}
            parentIds={parentIds}
            onToggle={onToggle}
            getCount={getCount}
            showDescription={showDescription}
            isRoot
          />
        ))}
      </div>
    </div>
  );
}
