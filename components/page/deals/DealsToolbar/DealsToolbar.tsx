'use client';

import { clsx } from 'clsx';
import { Menu } from '@base-ui-components/react/menu';
import { DEAL_SORT_OPTIONS } from '@/services/deals/constants';
import s from './DealsToolbar.module.scss';

interface DealsToolbarProps {
  currentSort: string;
  onSortChange: (sort: string) => void;
}

export function DealsToolbar({ currentSort, onSortChange }: DealsToolbarProps) {
  const currentSortLabel = DEAL_SORT_OPTIONS.find((o) => o.value === currentSort)?.label || 'Most recent';

  return (
    <div className={s.toolbar}>
      <div className={s.titleRow}>
        <div className={s.titleSection}>
          <h1 className={s.title}>Deals</h1>
          <p className={s.subtitle}>Exclusive deals for Protocol Labs founders.</p>
        </div>
        <div className={s.actions}>
          <Menu.Root modal={false}>
            <Menu.Trigger className={clsx(s.sortDropdown, s.sortButton)}>
              {currentSortLabel}
              <svg className={s.sortCaret} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4 6L8 10L12 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner className={s.sortPositioner} align="end" sideOffset={4}>
                <Menu.Popup className={s.sortMenu}>
                  {DEAL_SORT_OPTIONS.map((option) => (
                    <Menu.Item
                      key={option.value}
                      className={clsx(s.sortOption, currentSort === option.value && s.sortOptionActive)}
                      onClick={() => onSortChange(option.value)}
                    >
                      {option.label}
                    </Menu.Item>
                  ))}
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
          {/*<div className={s.submitButton}>*/}
          {/*  <svg className={s.submitIcon} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">*/}
          {/*    <path*/}
          {/*      d="M9 3.75V14.25"*/}
          {/*      stroke="currentColor"*/}
          {/*      strokeWidth="1.5"*/}
          {/*      strokeLinecap="round"*/}
          {/*      strokeLinejoin="round"*/}
          {/*    />*/}
          {/*    <path*/}
          {/*      d="M3.75 9H14.25"*/}
          {/*      stroke="currentColor"*/}
          {/*      strokeWidth="1.5"*/}
          {/*      strokeLinecap="round"*/}
          {/*      strokeLinejoin="round"*/}
          {/*    />*/}
          {/*  </svg>*/}
          {/*  Submit a Deal*/}
          {/*  <span className={s.tooltip}>Coming soon</span>*/}
          {/*</div>*/}
        </div>
      </div>
      {/*<div className={s.mobileActions}>*/}
      {/*  <div className={s.submitButton}>*/}
      {/*    <svg className={s.submitIcon} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">*/}
      {/*      <path*/}
      {/*        d="M9 3.75V14.25"*/}
      {/*        stroke="currentColor"*/}
      {/*        strokeWidth="1.5"*/}
      {/*        strokeLinecap="round"*/}
      {/*        strokeLinejoin="round"*/}
      {/*      />*/}
      {/*      <path*/}
      {/*        d="M3.75 9H14.25"*/}
      {/*        stroke="currentColor"*/}
      {/*        strokeWidth="1.5"*/}
      {/*        strokeLinecap="round"*/}
      {/*        strokeLinejoin="round"*/}
      {/*      />*/}
      {/*    </svg>*/}
      {/*    Submit Deal*/}
      {/*    <span className={s.tooltip}>Coming soon</span>*/}
      {/*  </div>*/}
      {/*</div>*/}
    </div>
  );
}
