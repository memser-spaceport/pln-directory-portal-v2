'use client';

import { useRef, useState } from 'react';
import { clsx } from 'clsx';
import useClickedOutside from '@/hooks/useClickedOutside';
import { DEAL_SORT_OPTIONS } from '@/services/deals/constants';
import s from './DealsToolbar.module.scss';

interface DealsToolbarProps {
  currentSort: string;
  onSortChange: (sort: string) => void;
}

export function DealsToolbar({ currentSort, onSortChange }: DealsToolbarProps) {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useClickedOutside({ callback: () => setIsSortOpen(false), ref: sortRef });

  const currentSortLabel = DEAL_SORT_OPTIONS.find((o) => o.value === currentSort)?.label || 'Most recent';

  return (
    <div className={s.toolbar}>
      <div className={s.titleRow}>
        <h1 className={s.title}>Deals</h1>
        <div className={s.actions}>
          <div className={s.sortDropdown} ref={sortRef}>
            <button className={s.sortButton} onClick={() => setIsSortOpen(!isSortOpen)}>
              {currentSortLabel}
              <svg
                className={clsx(s.sortCaret, isSortOpen && s.sortCaretOpen)}
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 6L8 10L12 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {isSortOpen && (
              <div className={s.sortMenu}>
                {DEAL_SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    className={clsx(s.sortOption, currentSort === option.value && s.sortOptionActive)}
                    onClick={() => {
                      onSortChange(option.value);
                      setIsSortOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className={s.submitButton}>
            <svg className={s.submitIcon} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M9 3.75V14.25"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3.75 9H14.25"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Submit a Deal
            <span className={s.tooltip}>Coming soon</span>
          </div>
        </div>
      </div>
      <p className={s.subtitle}>Exclusive deals for Protocol Labs founders.</p>
    </div>
  );
}
