'use client';

import type { FocusEvent, RefObject } from 'react';

import { SearchIcon } from '@/components/icons';
// Production search field, reused 1:1 for its built-in states (debounced input,
// clear button, focus/hover ring). Here it lives behind an expand-on-click icon.
import { SearchInput } from '@/components/common/filters/SearchInput';

import local from './NewsfeedV0.module.scss';

interface Props {
  open: boolean;
  value: string;
  onOpen: () => void;
  onChange: (value: string) => void;
  onBlur: (e: FocusEvent<HTMLDivElement>) => void;
  fieldRef: RefObject<HTMLDivElement | null>;
}

/**
 * Desktop (≥640px) header search: the icon expands inline into the production
 * SearchInput, which stretches to the news card's right edge. The whole control
 * is hidden on mobile, where the field lives in a permanent full-width row below
 * the header instead (rendered by the page).
 */
export function HeaderSearch({ open, value, onOpen, onChange, onBlur, fieldRef }: Props) {
  if (!open) {
    return (
      <button type="button" className={local.headerSearchBtn} aria-label="Search news" onClick={onOpen}>
        <SearchIcon />
      </button>
    );
  }

  return (
    <div className={local.headerSearchField} ref={fieldRef} onBlur={onBlur}>
      <SearchInput value={value} onChange={onChange} placeholder="Search by team or keyword…" />
    </div>
  );
}
