'use client';

import type { FocusEvent, RefObject } from 'react';

import { SearchIcon } from '@/components/icons';
import { SearchInput } from '@/components/common/filters/SearchInput';

import s from './NewsSearch.module.scss';

interface NewsSearchProps {
  open: boolean;
  value: string;
  onOpen: () => void;
  onChange: (value: string) => void;
  onBlur: (e: FocusEvent<HTMLDivElement>) => void;
  fieldRef: RefObject<HTMLDivElement | null>;
}

/**
 * Desktop (≥640px) header search: the icon expands inline into the production
 * SearchInput. Hidden on mobile, where the field lives in a permanent
 * full-width row below the header instead (rendered by TeamNews.tsx).
 */
export function NewsSearch({ open, value, onOpen, onChange, onBlur, fieldRef }: NewsSearchProps) {
  if (!open) {
    return (
      <button type="button" className={s.searchBtn} aria-label="Search news" onClick={onOpen}>
        <SearchIcon />
      </button>
    );
  }

  return (
    <div className={s.searchField} ref={fieldRef} onBlur={onBlur}>
      <SearchInput value={value} onChange={onChange} placeholder="Search by news, teams…" />
    </div>
  );
}
