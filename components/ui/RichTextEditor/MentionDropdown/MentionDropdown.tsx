'use client';

import { clsx } from 'clsx';
import Image from 'next/image';
import isEmpty from 'lodash/isEmpty';
import { forwardRef, useImperativeHandle, useState, useEffect, useCallback } from 'react';

import s from './MentionDropdown.module.scss';

export interface MentionMemberItem {
  uid: string;
  name: string;
  image?: string;
  teamName?: string;
}

interface Props {
  items: MentionMemberItem[];
  isLoading: boolean;
  onSelect: (item: MentionMemberItem) => void;
  onClose: () => void;
  position: { top: number; left: number } | null;
  searchQuery: string;
}

export interface MentionDropdownRef {
  moveUp: () => void;
  moveDown: () => void;
  selectCurrent: () => boolean;
  getSelectedIndex: () => number;
}

export const MentionDropdown = forwardRef<MentionDropdownRef, Props>((props, ref) => {
  const { items, isLoading, onSelect, onClose, position, searchQuery } = props;

  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${s.dropdown}`)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const moveUp = useCallback(() => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  }, [items.length]);

  const moveDown = useCallback(() => {
    setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  }, [items.length]);

  const selectCurrent = useCallback(() => {
    if (items[selectedIndex]) {
      onSelect(items[selectedIndex]);
      return true;
    }

    return false;
  }, [items, selectedIndex, onSelect]);

  const getSelectedIndex = useCallback(() => selectedIndex, [selectedIndex]);

  useImperativeHandle(
    ref,
    () => ({
      moveUp,
      moveDown,
      selectCurrent,
      getSelectedIndex,
    }),
    [moveUp, moveDown, selectCurrent, getSelectedIndex],
  );

  if (!position) {
    return null;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={s.dropdown} style={{ top: position.top, left: position.left }}>
      {isLoading ? (
        <div className={s.loading}>
          <span className={s.loadingSpinner} />
          Searching...
        </div>
      ) : isEmpty(items) ? (
        <div className={s.empty}>
          {isEmpty(searchQuery) ? 'Type to search members' : `No members found for "${searchQuery}"`}
        </div>
      ) : (
        <div className={s.list}>
          {items.map((item, index) => (
            <button
              key={item.uid}
              type="button"
              className={clsx(s.item, {
                [s.selected]: index === selectedIndex,
              })}
              onClick={() => onSelect(item)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className={s.avatar}>
                {item.image ? (
                  <Image src={item.image} alt={item.name} width={32} height={32} unoptimized />
                ) : (
                  <div className={s.avatarPlaceholder}>{getInitials(item.name)}</div>
                )}
              </div>
              <div className={s.info}>
                <span className={s.name}>{item.name}</span>
                {item.teamName && <span className={s.team}>{item.teamName}</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

MentionDropdown.displayName = 'MentionDropdown';
