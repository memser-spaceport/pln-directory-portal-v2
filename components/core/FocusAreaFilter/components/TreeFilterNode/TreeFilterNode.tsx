import { clsx } from 'clsx';
import { useEffect, useState } from 'react';

import { CaretRightIcon } from '@/components/icons';
import { CheckboxListItemRepresentation } from '@/components/common/filters/GenericCheckboxList/components/CheckboxListItemRepresentation';

import { TreeFilterItem } from '../../types';

import s from '../FocusAreaItem/FocusAreaItem.module.scss';

interface TreeFilterNodeProps<T extends TreeFilterItem> {
  item: T;
  selectedIds: Set<string>;
  parentIds: Set<string>;
  onToggle: (item: T) => void;
  getCount?: (item: T) => number;
  showDescription?: boolean;
  isRoot?: boolean;
}

export function TreeFilterNode<T extends TreeFilterItem>(props: TreeFilterNodeProps<T>) {
  const { item, selectedIds, parentIds, onToggle, getCount, showDescription, isRoot } = props;

  const isSelected = selectedIds.has(item.id);
  const isParentOfSelected = parentIds.has(item.id);
  const count = getCount?.(item);
  const hasVisibleChildren = item.children.some(
    (child) => (getCount ? (getCount(child as T) ?? 0) > 0 : true) || selectedIds.has(child.id),
  );

  const [expanded, setExpanded] = useState(isSelected || isParentOfSelected);

  useEffect(() => {
    if (isParentOfSelected) setExpanded(true);
  }, [isParentOfSelected]);

  const onCheckboxClick = () => {
    if (hasVisibleChildren) setExpanded(true);
    onToggle(item);
  };

  const expandControl = (hasVisibleChildren || isRoot) && (
    <button
      disabled={!hasVisibleChildren}
      className={clsx(s.expandButton, { [s.disabled]: !hasVisibleChildren })}
      onClick={(e) => {
        e.stopPropagation();
        if (hasVisibleChildren) setExpanded((v) => !v);
      }}
      title={expanded ? 'Collapse' : 'Expand'}
    >
      <CaretRightIcon className={clsx(s.expandIcon, { [s.expanded]: expanded })} />
    </button>
  );

  const disabled = getCount ? count === 0 : false;

  return (
    <div className={s.root}>
      <CheckboxListItemRepresentation
        label={item.label}
        count={count}
        checked={isSelected}
        indeterminate={isParentOfSelected}
        disabled={disabled}
        ctrlEl={expandControl}
        onClick={onCheckboxClick}
      />

      {showDescription && isRoot && item.description && (
        <div className={s.descriptionContainer}>
          <p className={s.description}>{item.description}</p>
        </div>
      )}

      {expanded && (
        <div className={s.childrenContainer}>
          {(item.children as T[]).map((child) => {
            const childCount = getCount?.(child);
            const childVisible = getCount ? (childCount ?? 0) > 0 : true;
            if (!childVisible && !selectedIds.has(child.id)) return null;

            return (
              <TreeFilterNode
                key={child.id}
                item={child}
                selectedIds={selectedIds}
                parentIds={parentIds}
                onToggle={onToggle}
                getCount={getCount}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
